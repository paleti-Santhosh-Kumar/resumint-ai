// ───────────────────────────────────────────────────────────────────────────
//  OpenRouter client — powers every AI feature from the browser.
//
//  OpenRouter supports CORS, so it CAN be called client-side (unlike Resend).
//  Pattern: "Bring Your Own Key" — the user pastes THEIR OWN OpenRouter key
//  into the AI Connection panel; it's stored in localStorage and used for
//  calls. We never hardcode a key (it'd be public in the bundle).
//
//  Docs: https://openrouter.ai/docs  (OpenAI-compatible)
// ───────────────────────────────────────────────────────────────────────────

const KEY_STORE = "resumint.openrouter.key";
const MODEL_STORE = "resumint.openrouter.model";

export const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

/** Curated set of capable models. The user's own key determines cost/credits. */
export const RECOMMENDED_MODELS = [
  { id: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash", note: "Fast · cheap · default" },
  { id: "openai/gpt-4o-mini", label: "GPT-4o mini", note: "Reliable & cheap" },
  { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet", note: "Best writing quality" },
  { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B", note: "Open model" },
  { id: "deepseek/deepseek-chat", label: "DeepSeek Chat", note: "Strong reasoning, low cost" },
  { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B (Free)", note: "Free tier · rate-limited" },
];

const DEFAULT_MODEL = RECOMMENDED_MODELS[0].id;

function ls(k: string) {
  try { return localStorage.getItem(k) ?? ""; } catch { return ""; }
}
function setLs(k: string, v: string) {
  try { localStorage.setItem(k, v); } catch { /* ignore */ }
}

export function getKey(): string { return ls(KEY_STORE); }
export function setKey(key: string) { setLs(KEY_STORE, key.trim()); }
export function clearKey() { setLs(KEY_STORE, ""); }
export function getModel(): string { return ls(MODEL_STORE) || DEFAULT_MODEL; }
export function setModel(model: string) { setLs(MODEL_STORE, model); }

/** True when an OpenRouter key is configured (AI runs live). */
export function hasAI(): boolean { return getKey().length > 12; }

export type Msg = { role: "system" | "user" | "assistant"; content: string };

function headers() {
  return {
    Authorization: `Bearer ${getKey()}`,
    "Content-Type": "application/json",
    "HTTP-Referer": typeof location !== "undefined" ? location.origin : "https://resumint.ai",
    "X-Title": "RESUMINT AI",
  };
}

/** Non-streaming completion. Returns the assistant message text. */
export async function chat(messages: Msg[], opts?: { temperature?: number; maxTokens?: number }): Promise<string> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      model: getModel(),
      messages,
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.maxTokens,
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(parseError(res.status, txt));
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() ?? "";
}

/** Streaming completion via SSE. Calls onToken for each delta. */
export async function streamChat(
  messages: Msg[],
  onToken: (delta: string) => void,
  opts?: { temperature?: number; signal?: AbortSignal }
): Promise<string> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: headers(),
    signal: opts?.signal,
    body: JSON.stringify({
      model: getModel(),
      messages,
      stream: true,
      temperature: opts?.temperature ?? 0.7,
    }),
  });
  if (!res.ok || !res.body) {
    const txt = await res.text().catch(() => "");
    throw new Error(parseError(res.status, txt));
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith(":")) continue; // keep-alive comment
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") return full;
      try {
        const json = JSON.parse(payload);
        const delta: string = json?.choices?.[0]?.delta?.content ?? "";
        if (delta) { full += delta; onToken(delta); }
      } catch {
        /* ignore malformed chunk */
      }
    }
  }
  return full;
}

function parseError(status: number, body: string): string {
  let msg = body;
  try {
    const j = JSON.parse(body);
    msg = j?.error?.message || j?.message || body;
  } catch { /* keep raw */ }
  if (status === 401) return "Invalid OpenRouter key. Check it in the AI Connection panel.";
  if (status === 402) return "Insufficient credits on your OpenRouter account.";
  if (status === 429) return "Rate limited. Try again shortly or pick another model.";
  if (status === 400 && /model/i.test(msg)) return "Model not available. Pick another in the AI Connection panel.";
  return msg || `Request failed (${status}).`;
}
