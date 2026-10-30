import { DEMO_CONTACTS } from "./demo.ts";
import type { Contact } from "./types.ts";

// The owners a transporter already works with. For a live demo, real numbers
// come from BHAADA_OWNER_PHONES, in order, as "phone" or "Name:phone",
// comma-separated. Owners without a number are simulated.
export function network(): Contact[] {
  const entries = (process.env.BHAADA_OWNER_PHONES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return DEMO_CONTACTS.map((c, i) => {
    const entry = entries[i];
    if (!entry) return c;
    const [name, phone] = entry.includes(":") ? entry.split(":") : [c.name, entry];
    return { ...c, name: name.trim() || c.name, phone: phone.trim() };
  });
}
