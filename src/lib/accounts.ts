import type { ResumeData } from "./ai";

// ───────────────────────────────────────────────────────────────────────────
//  Per-user accounts + profiles (client-side, browser-stored).
//
//  Passwords are hashed with PBKDF2 (SHA-256, 100k iterations) + a per-user
//  salt via Web Crypto — a genuine slow hash (no plaintext, no rainbow tables).
//  For a hosted backend you'd swap these for bcrypt/Argon2 server-side; the
//  account/verify API here is shaped to map onto that directly.
//
//  Each user gets their own resume namespace so logging back in restores
//  exactly their content + template settings.
// ───────────────────────────────────────────────────────────────────────────

const ACCOUNTS_KEY = "resumint.accounts";
const SESSION_KEY = "resumint.session";

export type UserAccount = {
  email: string;
  name: string;
  salt: string;
  hash: string;
  createdAt: number;
  photo: string;
};

export type Session = { email: string; name: string; photo: string };

const RETURN_TO_KEY = "resumint.returnTo";

function loadAccounts(): Record<string, UserAccount> {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? "{}");
  } catch {
    return {};
  }
}
function saveAccounts(a: Record<string, UserAccount>) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(a));
  } catch {
    /* ignore */
  }
}

const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

export function genSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return toHex(arr.buffer);
}

/** PBKDF2 password hash (SHA-256, 100k iterations). Real slow KDF via Web Crypto. */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: enc.encode(salt), iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return toHex(bits);
}

export function getAccount(email: string): UserAccount | undefined {
  return loadAccounts()[email.toLowerCase()];
}
export function accountExists(email: string): boolean {
  return !!getAccount(email);
}

export async function createAccount(
  name: string,
  email: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const accounts = loadAccounts();
  const e = email.toLowerCase();
  if (accounts[e]) return { ok: false, error: "An account with this email already exists." };
  const salt = genSalt();
  const hash = await hashPassword(password, salt);
  accounts[e] = {
    email: e,
    name: name.trim() || email.split("@")[0],
    salt,
    hash,
    createdAt: Date.now(),
    photo: "",
  };
  saveAccounts(accounts);
  return { ok: true };
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const acct = getAccount(email);
  if (!acct) return { ok: false, error: "No account found with this email." };
  const hash = await hashPassword(password, acct.salt);
  if (hash !== acct.hash) return { ok: false, error: "Incorrect password. Try again." };
  return { ok: true };
}

export function updateAccount(email: string, patch: Partial<UserAccount>) {
  const accounts = loadAccounts();
  const e = email.toLowerCase();
  if (!accounts[e]) return;
  accounts[e] = { ...accounts[e], ...patch };
  saveAccounts(accounts);
}

export function accountCount(): number {
  return Object.keys(loadAccounts()).length;
}

/* ── Per-user resume storage namespace ── */
export function storageKeyFor(email: string | null): string {
  return email ? `resumint.resume.${email.toLowerCase()}` : "resumint.resume.v1";
}

export type Persisted = { data: ResumeData; template: string; accent: string; font: string };

export function loadScoped(key: string): Persisted | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as Persisted;
  } catch {
    return null;
  }
}
export function saveScoped(key: string, payload: Persisted) {
  try {
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

/* ── Session (no idle expiry — stays logged in until explicit sign-out) ── */
export function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}
export function persistSession(s: Session, remember = true) {
  const raw = JSON.stringify(s);
  try {
    sessionStorage.setItem(SESSION_KEY, raw);
  } catch {
    /* ignore */
  }
  if (remember) {
    try {
      localStorage.setItem(SESSION_KEY, raw);
    } catch {
      /* ignore */
    }
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/* ── "Continue where you stopped" route memory ── */
export function setReturnTo(path: string) {
  try {
    sessionStorage.setItem(RETURN_TO_KEY, path);
  } catch {
    /* ignore */
  }
}
export function getReturnTo(): string | null {
  try {
    const v = sessionStorage.getItem(RETURN_TO_KEY);
    sessionStorage.removeItem(RETURN_TO_KEY);
    return v && v !== "/auth" ? v : null;
  } catch {
    return null;
  }
}
