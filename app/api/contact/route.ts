import { NextResponse } from "next/server";
import { validateContact, type ContactInput } from "@/lib/validation";

/**
 * Contact form endpoint. Secrets stay on the server.
 *
 * To deliver messages by email, set:
 *   RESEND_API_KEY     — API key from https://resend.com
 *   CONTACT_TO_EMAIL   — where messages should arrive
 *   CONTACT_FROM_EMAIL — optional verified sender (defaults to Resend's test sender)
 *
 * Without these, messages are logged to the server console in development and the
 * endpoint returns a clear error in production.
 */

// Best-effort, per-instance rate limit (use a shared store such as Upstash for multi-instance deploys).
const hits = new Map<string, { count: number; reset: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip: string) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.reset < now) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

export async function POST(request: Request) {
  let body: Partial<ContactInput> & { company?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: real users never fill this hidden field.
  if (body.company) return NextResponse.json({ ok: true });

  const input: ContactInput = {
    name: String(body.name ?? "").trim(),
    email: String(body.email ?? "").trim(),
    message: String(body.message ?? "").trim(),
  };
  const errors = validateContact(input);
  if (Object.keys(errors).length) {
    return NextResponse.json({ ok: false, error: "Please fix the highlighted fields.", errors }, { status: 422 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "Too many messages — please try again later." }, { status: 429 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;

  if (!apiKey || !to) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[contact] Email delivery not configured — message received:", input);
      return NextResponse.json({ ok: true, simulated: true });
    }
    return NextResponse.json(
      { ok: false, error: "The contact form isn't connected yet. Please reach out by email or LinkedIn instead." },
      { status: 503 },
    );
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL ?? "Portfolio <onboarding@resend.dev>",
        to: [to],
        reply_to: input.email,
        subject: `New message from ${input.name}`,
        text: `${input.message}\n\n— ${input.name} <${input.email}>`,
        html: `<p>${escapeHtml(input.message).replace(/\n/g, "<br/>")}</p><p>— ${escapeHtml(input.name)} &lt;${escapeHtml(input.email)}&gt;</p>`,
      }),
    });
    if (!res.ok) throw new Error(`Resend responded ${res.status}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[contact] Failed to send:", error);
    return NextResponse.json({ ok: false, error: "Something went wrong sending your message. Please try again." }, { status: 502 });
  }
}
