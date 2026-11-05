import { route, ag, err, valid, callback } from "../../lib/common.js";
export default route("POST", async (req, res, b) => {
  const { name, email, password } = b;
  if (!name || name.length > 100 || !valid.email(email) || !valid.pw(password)) return res.status(400).json({ error: "Check your name, email and password (8+ characters with a letter and a number)." });
  const r = await ag("/api/proxy/email/signup", { email, password, name, callback_url: callback });
  return r.ok ? res.json({ ok: true }) : res.status(r.status === 429 ? 429 : 400).json({ error: err(r, "Sign-up failed") });
});
