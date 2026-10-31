import { DEMO_CONTACTS } from "./demo.ts";
import { toE164 } from "./bolna.ts";
import type { Contact } from "./types.ts";

// The owners a transporter already works with. For a live demo, real numbers
// come from BHAADA_OWNER_PHONES, in order, as "phone" or "Name:phone",
// comma-separated, followed by any numbers typed on the desk. Owners without a
// number are simulated; numbers past the demo owners become extra owners.
export function network(typed: Contact[] = []): Contact[] {
  const entries = (process.env.BHAADA_OWNER_PHONES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const [name, phone] = entry.includes(":") ? entry.split(":") : ["", entry];
      return { name: name.trim(), phone: phone.trim() };
    });
  const seen = new Set<string>();
  const owners = [...entries, ...typed].filter((o) => {
    const number = toE164(o.phone);
    if (seen.has(number)) return false;
    seen.add(number);
    return true;
  });

  const demo = DEMO_CONTACTS.map((c, i) => {
    const entry = owners[i];
    return entry ? { ...c, name: entry.name || c.name, phone: entry.phone } : c;
  });
  const extra = owners.slice(DEMO_CONTACTS.length).map((o, i) => ({
    id: `c_extra_${i}`,
    name: o.name || "Owner",
    phone: o.phone,
    city: "",
    truck: DEMO_CONTACTS[0].truck,
  }));
  return [...demo, ...extra];
}
