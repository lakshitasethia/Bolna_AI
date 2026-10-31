import { parseRupees } from "./bolna.ts";

// What the transporter has said so far on a phone-in, before the load is posted.
export interface LoadDraft {
  from?: string;
  to?: string;
  pickup?: string;
  truck?: string;
  weightTons?: number;
  target?: number;
  ceiling?: number;
}

// Unknown tool params arrive empty or as "None"; only what was really said counts.
const text = (v?: string) => (v?.trim() && v.trim() !== "None" ? v.trim() : undefined);
const amount = (v?: string) => (parseRupees(text(v)) > 0 ? parseRupees(text(v)) : undefined);

export function draftFrom(p: Record<string, string>): LoadDraft {
  const tons = Number(text(p.weight_tons));
  const draft: LoadDraft = {
    from: text(p.pickup_place),
    to: text(p.drop_place),
    pickup: text(p.pickup_time),
    truck: text(p.truck),
    weightTons: tons > 0 ? tons : undefined,
    target: amount(p.target_rate),
    ceiling: amount(p.max_rate),
  };
  return Object.fromEntries(Object.entries(draft).filter(([, v]) => v !== undefined));
}
