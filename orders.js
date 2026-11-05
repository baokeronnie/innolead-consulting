import { route, session, redis, storageReady } from "../lib/common.js";
export default route("GET", async (req, res) => {
  const s = session(req); if (!s) return res.status(401).json({ error: "login_required" });
  if (!storageReady) return res.json({ orders: [] });
  const ids = (await redis("LRANGE", "orders:" + s.email, 0, -1)) || [];
  const rows = ids.length ? await redis("MGET", ...ids.map(i => "order:" + i)) : [];
  const orders = rows.filter(Boolean).map(r => JSON.parse(r)).reverse().map(o => ({ id: o.id, title: o.title, status: o.status === "paid" ? "Paid" : "Booking requested", date: new Date(o.created).toLocaleDateString("en-GB"), tx: o.transactionId || null }));
  res.json({ orders });
});
