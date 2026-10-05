"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, MessageCircle, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";

type Source = { title: string; href: string };
type Msg = { role: "user" | "bot"; text: string; sources?: Source[]; pending?: boolean };

const SUGGESTIONS = [
  "What did Aloke do at Rizz Technologies?",
  "Has he used PyTorch?",
  "Which projects use RAG?",
  "Where did he study?",
];

/** Floating "Ask about me" chat, answering from the portfolio's own content via /api/ask. */
export function AskMe() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    setInput("");
    setBusy(true);
    setMsgs((m) => [...m, { role: "user", text: q }, { role: "bot", text: "", pending: true }]);
    let reply: Msg;
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = (await res.json().catch(() => ({}))) as { answer?: string; sources?: Source[]; error?: string };
      reply = { role: "bot", text: data.answer ?? data.error ?? "Something went wrong. Please try again.", sources: data.sources };
    } catch {
      reply = { role: "bot", text: "Network error — check your connection and try again." };
    }
    setMsgs((m) => [...m.slice(0, -1), reply]);
    setBusy(false);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="ask-me-panel"
        className="btn-glow fixed right-4 bottom-4 z-[56] inline-flex h-11 items-center gap-2 rounded-full bg-fg pr-4 pl-3.5 text-sm font-medium text-ink shadow-[0_10px_40px_-10px_rgb(142_162_255/0.6)] md:right-6 md:bottom-6"
        whileTap={{ scale: 0.96 }}
      >
        {open ? <X size={16} aria-hidden="true" /> : <MessageCircle size={16} aria-hidden="true" />}
        {open ? "Close" : "Ask about me"}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.section
            id="ask-me-panel"
            role="dialog"
            aria-label="Ask about Aloke"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-x-3 bottom-[4.5rem] z-[56] flex max-h-[min(560px,72vh)] flex-col overflow-hidden rounded-3xl border border-line-strong bg-ink-2/95 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)] backdrop-blur-xl md:inset-x-auto md:right-6 md:bottom-20 md:w-[380px]"
          >
            <header className="border-b border-line px-5 py-4">
              <p className="text-sm font-medium">Ask about Aloke</p>
              <p className="mt-0.5 text-xs text-subtle">Answers come only from this portfolio, with links to the source.</p>
            </header>

            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
              {msgs.length === 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-subtle">Try one of these:</p>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => ask(s)}
                      className="block w-full rounded-xl border border-line px-3 py-2 text-left text-sm text-muted transition-colors hover:border-line-strong hover:text-fg"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {msgs.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      m.role === "user" ? "bg-fg text-ink" : "border border-line bg-white/[0.03] text-fg",
                    )}
                  >
                    {m.pending ? (
                      <span className="inline-flex gap-1 py-1" aria-label="Thinking">
                        {[0, 1, 2].map((d) => (
                          <span key={d} className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted" style={{ animationDelay: `${d * 0.15}s` }} />
                        ))}
                      </span>
                    ) : (
                      m.text
                    )}
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.sources.map((s) => (
                          <a
                            key={s.title}
                            href={s.href}
                            onClick={() => setOpen(false)}
                            className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] text-accent transition-colors hover:bg-accent/20"
                          >
                            {s.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-line p-3">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={300}
                placeholder="Ask anything about Aloke…"
                aria-label="Your question"
                className="h-10 flex-1 rounded-full border border-line bg-transparent px-4 text-sm text-fg placeholder:text-subtle focus:border-line-strong focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Send"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-fg text-ink transition-opacity disabled:opacity-40"
              >
                <ArrowUp size={16} aria-hidden="true" />
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
