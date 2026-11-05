import { route, cookies, cookie } from "../../lib/common.js";
import { APP_URL } from "../../lib/common.js";
const AG = (process.env.AUTHGATE_URL || "https://authgate.dev").replace(/\/$/, "");
export default route("POST", async (req, res) => {
  const rt = cookies(req).ag_rt;
  if (rt) await fetch(AG + "/api/proxy/sessions/revoke", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: rt }) }).catch(() => {});
  res.setHeader("Set-Cookie", [cookie("il_s", "", 0), cookie("ag_rt", "", 0)]);
  res.json({ ok: true });
});
