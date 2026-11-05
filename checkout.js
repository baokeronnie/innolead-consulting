import crypto from "node:crypto";
import { route, session, redis, storageReady } from "../lib/common.js";
import { PRICES } from "../lib/prices.js";
// Booking request. Online payment is not connected yet: the Academy team confirms each request and sends payment details.
export default route("POST", async (req, res, b) => {
  const s = session(req); if (!s) return res.status(401).json({ error: "Please log in to continue." });
  if (!storageReady) return res.status(503).json({ error: "Booking requests are not available yet. Please email academy@innoleadafrica.com." });
  const fullName = String(b.fullName || "").trim(), phone = String(b.phone || "").trim(), digits = phone.replace(/\D/g, "");
  if (fullName.length < 2 || fullName.length > 100) return res.status(400).json({ error: "Enter your full name." });
  if (!/^\+?[\d\s()-]{7,20}$/.test(phone) || digits.length < 7 || digits.length > 15) return res.status(400).json({ error: "Enter a valid contact number." });
  if (b.acknowledged !== true) return res.status(400).json({ error: "Please tick the box to confirm you are willingly paying for this course." });
  const p = PRICES[b.slug]; if (!p) return res.status(400).json({ error: "Unknown course." });
  let amount = p.price, label = "";
  if (p.opts) { const o = p.opts[Number(b.option)]; if (!o) return res.status(400).json({ error: "Choose an option." }); amount = o.price; label = o.label; }
  const id = "IL-" + crypto.randomBytes(4).toString("hex").toUpperCase();
  const title = p.title + (label ? " – " + label : "");
  const now = new Date().toISOString();
  const order = {
    id, userId: s.id, email: s.email, fullName, phone,
    slug: b.slug, title, amountUsd: amount ?? null,
    acknowledgedAt: now, acknowledgement: "Customer acknowledged they are willingly paying for " + title + " at " + (amount ? "USD " + amount.toFixed(2) : "the listed price") + ".",
    status: "requested", transactionId: null, // set to the DPO transaction ID when online payment is connected
    created: now,
  };
  await redis("SET", "order:" + id, JSON.stringify(order));
  await redis("RPUSH", "orders:all", id);
  await redis("RPUSH", "orders:" + s.email, id);
  res.json({ ok: true, id });
});
