import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Send, X, Sparkles, Cpu, AlertTriangle } from "lucide-react";
import { chatCopilot } from "../lib/aiService";
import { hasAI } from "../lib/openrouter";

type Msg = { role: "user" | "ai"; text: string };

const SUGGESTIONS = [
  "Check my ATS score",
  "Write a cover letter",
  "Run a mock interview",
  "Estimate my salary",
];

export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "ai",
      text: "Hi! I'm your RESUMINT AI career copilot — online 24/7. Ask me about ATS scores, cover letters, interviews, or salary.",
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || typing) return;
    setInput("");
    const history = messages
      .filter((m) => m.text)
      .map((m) => ({ role: (m.role === "ai" ? "assistant" : "user") as "assistant" | "user", content: m.text }));
    setMessages((m) => [...m, { role: "user", text }, { role: "ai", text: "" }]);
    setTyping(true);

    try {
      await chatCopilot(history, text, (delta) => {
        setTyping(false);
        setMessages((m) => {
          const copy = m.slice();
          copy[copy.length - 1] = { role: "ai", text: (copy[copy.length - 1]?.text ?? "") + delta };
          return copy;
        });
      });
    } catch {
      setMessages((m) => {
        const copy = m.slice();
        const last = copy[copy.length - 1];
        if (last && !last.text) last.text = "Sorry — I couldn't reach the AI. Check your OpenRouter key in the AI Connection panel, or try again.";
        return copy;
      });
    } finally {
      setTyping(false);
    }
  };

  return (
    <>
      {/* launcher */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 200, damping: 16 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-5 right-5 z-[60] grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-cyber-500 text-white shadow-xl shadow-brand-500/40"
        aria-label="Open AI assistant"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-brand-500/40" style={{ animationDuration: "2.4s" }} />
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <Bot className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="glass-strong fixed bottom-24 right-5 z-[60] flex h-[min(560px,70vh)] w-[min(390px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-3xl"
          >
            {/* header */}
            <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-5 py-4">
              <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-cyber-500">
                <Sparkles className="h-4 w-4 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-ink-900 bg-emerald-400" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">RESUMINT Copilot</p>
                <p className="flex items-center gap-1 text-[11px] text-emerald-400">
                  {hasAI() ? (
                    <><Cpu className="h-3 w-3" /> Live AI · OpenRouter</>
                  ) : (
                    <><AlertTriangle className="h-3 w-3 text-amber-400" /> <span className="text-amber-400">Local mode · add a key</span></>
                  )}
                </p>
              </div>
            </div>

            {/* messages */}
            <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={[
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                      m.role === "user"
                        ? "bg-gradient-to-br from-brand-500 to-brand-600 text-white"
                        : "bg-white/[0.06] text-slate-200 ring-1 ring-white/10",
                    ].join(" ")}
                  >
                    {m.text}
                    {m.role === "ai" && i === messages.length - 1 && typing === false && m.text.length === 0 ? "" : ""}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="flex gap-1 rounded-2xl bg-white/[0.06] px-4 py-3 ring-1 ring-white/10">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                        style={{ animationDelay: `${d * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* suggestions */}
            <div className="flex flex-wrap gap-1.5 px-4 pb-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-brand-400/50 hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* input */}
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex items-center gap-2 border-t border-white/10 p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about your career…"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-brand-400/60 focus:outline-none"
              />
              <button
                type="submit"
                disabled={typing}
                className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-cyber-500 text-white transition disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
