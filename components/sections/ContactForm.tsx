"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { useId, useState, type ChangeEvent, type FocusEvent, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { TypingSparks } from "@/components/ui/TypingSparks";
import { LIMITS, validateContact, validateField, type ContactErrors, type ContactInput } from "@/lib/validation";
import { cn } from "@/lib/utils";

type Status = { kind: "idle" } | { kind: "submitting" } | { kind: "success"; simulated?: boolean } | { kind: "error"; message: string };

const EMPTY: ContactInput = { name: "", email: "", message: "" };

function Field({
  id,
  label,
  error,
  children,
  hint,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="eyebrow !text-[11px]">
          {label}
        </label>
        {hint && <span className="font-mono text-[10px] text-subtle">{hint}</span>}
      </div>
      {children}
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            id={`${id}-error`}
            className="mt-2 flex items-center gap-1.5 text-sm text-rose-300"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CircleAlert size={14} aria-hidden="true" /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputClass = (invalid: boolean) =>
  cn(
    "mt-2 w-full rounded-xl border bg-white/[0.02] px-4 py-3.5 text-base text-fg placeholder:text-subtle transition-[border-color,background-color,box-shadow] duration-300 outline-none",
    "focus:bg-white/[0.04] focus:shadow-[0_0_0_4px_rgb(142_162_255/0.15)]",
    invalid ? "border-rose-400/60 focus:border-rose-400" : "border-line hover:border-line-strong focus:border-accent/60",
  );

/** Inbox for the keyless fallback. FormSubmit asks the owner to confirm this address once. */
const FALLBACK_INBOX = "alokekissac@gmail.com";

async function sendViaFormSubmit(values: ContactInput): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${FALLBACK_INBOX}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name: values.name,
        email: values.email,
        message: values.message,
        _replyto: values.email,
        _subject: `Portfolio message from ${values.name}`,
        _template: "table",
        _captcha: "false",
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { success?: string | boolean; message?: string };
    if (res.ok && String(data.success) === "true") return { ok: true };
    return { ok: false, error: "Couldn't send right now. Please email me directly at " + FALLBACK_INBOX + "." };
  } catch {
    return { ok: false, error: "Network error — check your connection and try again." };
  }
}

export function ContactForm() {
  const uid = useId();
  const [values, setValues] = useState<ContactInput>(EMPTY);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ContactInput, boolean>>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [honeypot, setHoneypot] = useState("");

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const field = e.target.name as keyof ContactInput;
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (touched[field]) setErrors((err) => ({ ...err, [field]: validateField(field, e.target.value) }));
    if (status.kind === "error") setStatus({ kind: "idle" });
  };

  const onBlur = (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const field = e.target.name as keyof ContactInput;
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((err) => ({ ...err, [field]: validateField(field, e.target.value) }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = validateContact(values);
    setErrors(found);
    setTouched({ name: true, email: true, message: true });
    const firstInvalid = (["name", "email", "message"] as const).find((f) => found[f]);
    if (firstInvalid) {
      document.getElementById(`${uid}-${firstInvalid}`)?.focus();
      return;
    }

    setStatus({ kind: "submitting" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, company: honeypot }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; errors?: ContactErrors; simulated?: boolean };
      // No email key on the server: deliver through FormSubmit straight from the browser instead.
      if (res.status === 503) {
        const fallback = await sendViaFormSubmit(values);
        if (fallback.ok) {
          setStatus({ kind: "success" });
          setValues(EMPTY);
          setTouched({});
          setErrors({});
        } else {
          setStatus({ kind: "error", message: fallback.error });
        }
        return;
      }
      if (!res.ok || !data.ok) {
        if (data.errors) setErrors(data.errors);
        setStatus({ kind: "error", message: data.error ?? "Something went wrong. Please try again." });
        return;
      }
      setStatus({ kind: "success", simulated: data.simulated });
      setValues(EMPTY);
      setTouched({});
      setErrors({});
    } catch {
      setStatus({ kind: "error", message: "Network error — check your connection and try again." });
    }
  };

  const describedBy = (field: keyof ContactInput) => (errors[field] ? `${uid}-${field}-error` : undefined);

  return (
    <TypingSparks>
      <AnimatePresence mode="wait">
        {status.kind === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-signal/25 bg-signal/[0.04] p-8 text-center"
            role="status"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-signal/15 text-signal"
            >
              <CircleCheck size={28} aria-hidden="true" />
            </motion.span>
            <p className="mt-6 text-2xl font-medium tracking-tight">Message sent.</p>
            <p className="mt-2 max-w-xs text-muted">
              Thanks for reaching out — I&apos;ll get back to you as soon as I can.
            </p>
            {status.simulated && (
              <p className="mt-4 max-w-xs text-xs text-amber-200/80">
                Dev mode: email delivery isn&apos;t configured, so the message was logged to the server console.
              </p>
            )}
            <button
              type="button"
              onClick={() => setStatus({ kind: "idle" })}
              className="mt-8 text-sm text-muted underline decoration-line-strong underline-offset-4 hover:text-fg"
            >
              Send another message
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            noValidate
            onSubmit={onSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass space-y-6 rounded-3xl p-6 md:p-8"
            aria-describedby={`${uid}-status`}
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <Field id={`${uid}-name`} label="Name" error={errors.name}>
                <input
                  id={`${uid}-name`}
                  name="name"
                  type="text"
                  autoComplete="name"
                  maxLength={LIMITS.name}
                  value={values.name}
                  onChange={onChange}
                  onBlur={onBlur}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={describedBy("name")}
                  aria-required="true"
                  className={inputClass(Boolean(errors.name))}
                  placeholder="Your name"
                />
              </Field>
              <Field id={`${uid}-email`} label="Email" error={errors.email}>
                <input
                  id={`${uid}-email`}
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  maxLength={LIMITS.email}
                  value={values.email}
                  onChange={onChange}
                  onBlur={onBlur}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={describedBy("email")}
                  aria-required="true"
                  className={inputClass(Boolean(errors.email))}
                  placeholder="you@company.com"
                />
              </Field>
            </div>
            <Field
              id={`${uid}-message`}
              label="Message"
              error={errors.message}
              hint={`${values.message.length} / ${LIMITS.message}`}
            >
              <textarea
                id={`${uid}-message`}
                name="message"
                rows={6}
                maxLength={LIMITS.message}
                value={values.message}
                onChange={onChange}
                onBlur={onBlur}
                aria-invalid={Boolean(errors.message)}
                aria-describedby={describedBy("message")}
                aria-required="true"
                className={cn(inputClass(Boolean(errors.message)), "resize-y")}
                placeholder="Tell me about the idea, the problem or the role…"
              />
            </Field>

            {/* Honeypot — hidden from people, visible to naive bots */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label>
                Company
                <input tabIndex={-1} autoComplete="off" name="company" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
              </label>
            </div>

            <div className="flex flex-col-reverse items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p id={`${uid}-status`} role="alert" aria-live="assertive" className="min-h-5 text-sm">
                {status.kind === "error" && (
                  <span className="flex items-center gap-1.5 text-rose-300">
                    <CircleAlert size={14} aria-hidden="true" /> {status.message}
                  </span>
                )}
              </p>
              <Button
                type="submit"
                disabled={status.kind === "submitting"}
                icon={
                  status.kind === "submitting" ? (
                    <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <ArrowRight size={16} aria-hidden="true" />
                  )
                }
              >
                {status.kind === "submitting" ? "Sending…" : "Send message"}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </TypingSparks>
  );
}
