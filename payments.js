import { redis } from "./common.js";
import { sendMail, paymentEmail } from "./mail.js";

// Call this once the payment provider confirms a payment (for DPO: after verifyToken returns result 000).
// It marks the order paid, stores the transaction ID, and emails the Academy team once.
// Safe to call twice: the order is only marked once and the email is only sent once.
export async function markPaid(orderId, transactionId) {
  const raw = await redis("GET", "order:" + orderId);
  if (!raw) throw new Error("Order not found: " + orderId);
  const o = JSON.parse(raw);
  if (o.status !== "paid") { o.status = "paid"; o.transactionId = transactionId; o.paidAt = new Date().toISOString(); }
  if (!o.notified) {
    const lock = await redis("SET", "lock:notify:" + orderId, "1", "NX", "EX", 60); // stops two simultaneous calls sending two emails
    if (lock) {
      try {
        await sendMail({ to: process.env.ACADEMY_EMAIL || "academy@innoleadafrica.com", replyTo: o.email, ...paymentEmail(o) });
        o.notified = true; o.notifyError = null;
      } catch (e) { o.notifyError = String(e.message).slice(0, 300); console.error("Payment email failed for", o.id, e.message); }
    }
  }
  await redis("SET", "order:" + orderId, JSON.stringify(o));
  return o;
}
