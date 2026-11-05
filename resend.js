import { route, ag, valid, callback } from "../../lib/common.js";
export default route("POST", async (req, res, b) => {
  if (!valid.email(b.email)) return res.status(400).json({ error: "Invalid email" });
  await ag("/api/proxy/email/verify/resend", { email: b.email, callback_url: callback });
  res.json({ ok: true });
});
