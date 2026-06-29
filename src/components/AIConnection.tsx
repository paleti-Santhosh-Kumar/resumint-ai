import { useState } from "react";
import { motion } from "framer-motion";
import {
  X, KeyRound, Cpu, Eye, EyeOff, Check, ExternalLink, Zap, Trash2, Sparkles,
} from "lucide-react";
import {
  getKey, setKey, clearKey, getModel, setModel, hasAI, RECOMMENDED_MODELS,
} from "../lib/openrouter";
import { useToast } from "./Toast";

export default function AIConnection({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [key, setKeyState] = useState(getKey());
  const [model, setModelState] = useState(getModel());
  const [show, setShow] = useState(false);
  const connected = hasAI();

  const save = () => {
    setKey(key);
    setModel(model);
    toast(
      key.trim() ? "AI connected" : "AI key cleared",
      "success",
      key.trim() ? `Using ${RECOMMENDED_MODELS.find((m) => m.id === model)?.label ?? model}` : "Falling back to built-in engine."
    );
    onClose();
  };

  const disconnect = () => {
    clearKey();
    setKeyState("");
    toast("AI disconnected", "info", "Using the built-in local engine.");
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()} transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong w-full max-w-lg rounded-t-3xl p-6 sm:rounded-3xl"
      >
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${connected ? "bg-emerald-500/20" : "bg-gradient-to-br from-brand-500 to-cyber-500"}`}>
              {connected ? <Check className="h-5 w-5 text-emerald-400" /> : <Sparkles className="h-5 w-5 text-white" />}
            </span>
            <div>
              <h3 className="font-display text-lg font-bold text-white">AI Connection</h3>
              <p className="text-xs text-slate-400">{connected ? "Live via OpenRouter" : "Connect to enable real AI"}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        {connected && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5">
            <span className="flex items-center gap-2 text-xs font-medium text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Connected · {RECOMMENDED_MODELS.find((m) => m.id === getModel())?.label ?? getModel()}
            </span>
            <button onClick={disconnect} className="flex items-center gap-1 text-[11px] text-emerald-300/80 hover:text-white">
              <Trash2 className="h-3 w-3" /> Disconnect
            </button>
          </div>
        )}

        {/* Key */}
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-300">
          <KeyRound className="h-3.5 w-3.5 text-brand-300" /> OpenRouter API key
        </label>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={key}
            onChange={(e) => setKeyState(e.target.value)}
            placeholder="sk-or-v1-..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-3 pr-10 text-sm text-white placeholder:text-slate-500 focus:border-brand-400/60 focus:outline-none"
          />
          <button onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <a
          href="https://openrouter.ai/keys" target="_blank" rel="noreferrer"
          className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-cyber-300 hover:text-cyber-200"
        >
          Get a free key at openrouter.ai <ExternalLink className="h-3 w-3" />
        </a>

        {/* Model */}
        <label className="mb-1.5 mt-5 flex items-center gap-1.5 text-xs font-medium text-slate-300">
          <Cpu className="h-3.5 w-3.5 text-brand-300" /> Model
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {RECOMMENDED_MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => setModelState(m.id)}
              className={`flex items-start justify-between rounded-xl border p-2.5 text-left transition ${
                model === m.id ? "border-brand-400/60 bg-brand-500/15" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
              }`}
            >
              <div>
                <p className="text-[13px] font-semibold text-white">{m.label}</p>
                <p className="text-[10px] text-slate-500">{m.note}</p>
              </div>
              {model === m.id && <Check className="h-4 w-4 shrink-0 text-brand-300" />}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-xl bg-white/[0.03] p-3">
          <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
          <p className="text-[11px] leading-relaxed text-slate-400">
            Your key is stored only in <span className="text-slate-200">your browser</span> (localStorage) and sent directly to OpenRouter. It never touches our servers. Without a key, every AI feature still works using the built-in local engine.
          </p>
        </div>

        <button
          onClick={save}
          disabled={key.trim().length < 12 && key.trim().length > 0}
          className="btn-glow mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Check className="h-4 w-4" /> {connected ? "Update connection" : "Connect & enable AI"}
        </button>
      </motion.div>
    </motion.div>
  );
}
