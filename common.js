import crypto from "node:crypto";

const E = process.env;
export const APP_URL = (E.APP_URL || (E.VERCEL_PROJECT_PRODUCTION_URL ? "https://" + E.VERCEL_PROJECT_PRODUCTION_URL : "http://localhost:3000")).replace(/\/$/, "");
const AG = (E.AUTHGATE_URL || "https://authgate.dev").replace(/\/$/, "");
const secure = APP_URL.startsWith("https");

// Wraps a handler: checks the HTTP method and catches unexpected errors.
export const route = (method, fn) => async (req, res) => {
  if (req.method !== method) { res.setHeader("Allow", method); return res.status(405).json({ error: "Method not allowed" }); }
  try { await fn(req, res, typeof req.body === "object" && req.body ? req.body : {}); }
  catch (e) { console.error(e); res.status(500).json({ error: "Something went wrong. Please try again." }); }
};

// AuthGate (the API key never leaves the server)
export async function ag(path, body) {
  try {
    const r = await fetch(AG + path, { method: "POST", headers: { Authorization: "Bearer " + E.AUTHGATE_API_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    let j = {}; try { j = await r.json(); } catch {}
    return { ok: r.ok, status: r.status, j };
  } catch { return { ok: false, status: 502, j: { error: "Sign-in service is unreachable" } }; }
}
export const err = (r, d) => (r.j && (r.j.error || r.j.message)) || d;
export const callback = APP_URL + "/";

export const valid = {
  email: e => typeof e === "string" && /^\S+@\S+\.\S+$/.test(e) && e.length < 255,
  pw: p => typeof p === "string" && p.length >= 8 && p.length <= 128 && /[A-Za-z]/.test(p) && /\d/.test(p),
};

// Cookies and signed session
const sign = v => crypto.createHmac("sha256", E.SESSION_SECRET || "dev-only").update(v).digest("base64url");
export const mkSession = u => { const p = Buffer.from(JSON.stringify({ ...u, exp: Date.now() + 7 * 864e5 })).toString("base64url"); return p + "." + sign(p); };
export const cookie = (name, value, maxAge) => `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
const parse = req => Object.fromEntries((req.headers.cookie || "").split(";").map(s => s.trim().split(/=(.*)/s).slice(0, 2)).filter(a => a[0]));
export const cookies = parse;
export function session(req) {
  const t = parse(req).il_s; if (!t) return null;
  const [p, s] = t.split("."); if (!p || !s) return null;
  const good = sign(p); if (s.length !== good.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(good))) return null;
  try { const u = JSON.parse(Buffer.from(p, "base64url")); return u.exp > Date.now() ? u : null; } catch { return null; }
}

// Storage: Upstash Redis through its REST API (add it from the Vercel Marketplace)
const RURL = E.UPSTASH_REDIS_REST_URL || E.KV_REST_API_URL, RTOK = E.UPSTASH_REDIS_REST_TOKEN || E.KV_REST_API_TOKEN;
export const storageReady = !!(RURL && RTOK);
export async function redis(...cmd) {
  const r = await fetch(RURL, { method: "POST", headers: { Authorization: "Bearer " + RTOK, "Content-Type": "application/json" }, body: JSON.stringify(cmd) });
  const j = await r.json(); if (j.error) throw new Error(j.error); return j.result;
}
