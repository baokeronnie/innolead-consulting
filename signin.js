import { route, ag, valid, mkSession, cookie, callback } from "../../lib/common.js";
export default route("POST", async (req, res, b) => {
  const { email, password } = b;
  if (!valid.email(email) || typeof password !== "string") return res.status(401).json({ error: "Email or password is incorrect." });
  const r = await ag("/api/proxy/email/signin", { email, password, callback_url: callback });
  if (!r.ok) return res.status(r.status === 429 ? 429 : 401).json({ error: r.status === 429 ? "Too many attempts. Try again shortly." : "Email or password is incorrect." });
  const u = r.j.user || {};
  if (u.email_verified === false) return res.status(403).json({ error: "email_not_verified" });
  const out = [cookie("il_s", mkSession({ id: u.id, email: u.email || email, name: u.name || email }), 7 * 86400)];
  if (r.j.refresh_token) out.push(cookie("ag_rt", r.j.refresh_token, 30 * 86400));
  res.setHeader("Set-Cookie", out);
  res.json({ user: { name: u.name || email, email: u.email || email } });
});
