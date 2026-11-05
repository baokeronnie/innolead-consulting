// Email through Resend's REST API (https://resend.com). Needs RESEND_API_KEY and a verified sending domain.
const E = process.env;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export async function sendMail({ to, subject, text, html, replyTo }) {
  if (!E.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + E.RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ from: E.MAIL_FROM || "Innolead Website <notifications@innoleadafrica.com>", to: [to], subject, text, html, reply_to: replyTo }),
  });
  if (!r.ok) throw new Error("Resend " + r.status + ": " + (await r.text()));
}

// The message the Academy team receives when a payment succeeds.
export function paymentEmail(o) {
  const paid = new Date(o.paidAt).toUTCString();
  const rows = [
    ["Customer", o.fullName], ["Email", o.email], ["Contact number", o.phone],
    ["Course", o.title], ["Amount paid", o.amountUsd ? "USD " + Number(o.amountUsd).toFixed(2) : "See order"],
    ["Transaction ID", o.transactionId], ["Order reference", o.id], ["Paid at", paid],
    ["Acknowledged purchase", new Date(o.acknowledgedAt).toUTCString()],
  ];
  return {
    subject: `Payment received: ${o.title} (${o.fullName})`,
    text: "A customer has paid for an Academy course.\n\n" + rows.map(r => r[0] + ": " + r[1]).join("\n") + "\n\nReply to this email to contact the customer directly.",
    html: `<div style="font-family:Arial,sans-serif;max-width:560px"><h2 style="margin:0 0 8px">Payment received</h2><p>A customer has paid for an Academy course.</p><table style="border-collapse:collapse;width:100%">${rows.map(r => `<tr><td style="padding:8px 10px;border:1px solid #dce8ef;background:#f3f8fb;width:38%"><b>${esc(r[0])}</b></td><td style="padding:8px 10px;border:1px solid #dce8ef">${esc(r[1])}</td></tr>`).join("")}</table><p>Reply to this email to contact the customer directly.</p></div>`,
  };
}
