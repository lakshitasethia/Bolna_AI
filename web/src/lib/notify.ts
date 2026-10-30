import { inr } from "./negotiate.ts";
import type { Load } from "./types.ts";

// Sends the booking to the transporter on Telegram, if a bot is configured.
export async function notifyBooked(load: Load) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat || !load.booking) return;

  const b = load.booking;
  const text = [
    `✅ Booked: ${load.from} → ${load.to}, ${load.pickup}`,
    `${b.ownerName}, ${b.vehicle}, driver ${b.driverPhone}`,
    ...(b.detailsToCheck ? ["⚠️ Vehicle or driver number unclear, confirm with the owner"] : []),
    `${inr(b.rate)} (${inr(b.savedVsCeiling)} under your max)`,
    ...(b.savedVsFirst > 0 ? [`Agents pushed ${inr(b.savedVsFirst)} below the first truck that agreed`] : []),
    `${load.calls.length} agents in parallel, ${b.seconds}s`,
  ].join("\n");

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text }),
  }).catch(() => undefined);
}
