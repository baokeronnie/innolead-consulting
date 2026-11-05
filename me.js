import { route, session } from "../../lib/common.js";
export default route("GET", async (req, res) => {
  const s = session(req);
  res.json({ user: s ? { name: s.name, email: s.email } : null });
});
