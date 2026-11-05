import { route, ag, err, valid } from "../../lib/common.js";
export default route("POST", async (req, res, b) => {
  const { email, code } = b;
  if (!valid.email(email) || !/^\d{6}$/.test(code || "")) return res.status(400).json({ error: "Enter the 6-digit code." });
  const r = await ag("/api/proxy/email/verify", { email, code });
  return r.ok ? res.json({ ok: true }) : res.status(400).json({ error: err(r, "That code did not work") });
});
