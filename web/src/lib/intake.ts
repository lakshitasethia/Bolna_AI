import type { Turn } from "./types.ts";

// A transporter phoning in the demo load, for the desk's sample call.
// "agent" is Bhaada's intake line, "owner" is the transporter on the phone.
export const SAMPLE_INTAKE: Omit<Turn, "at">[] = [
  { who: "agent", text: "Namaste, Bhaada desk. Load bataiye." },
  {
    who: "owner",
    text: "Sharma Roadlines se bol raha hoon. Kal subah 6 baje Okhla se Jaipur, 32 foot container chahiye, 20 ton maal.",
  },
  { who: "agent", text: "Okhla se Jaipur, kal subah 6 baje, 32 ft container, 20 ton. Maximum kitna de sakte hain?" },
  { who: "owner", text: "38 hazaar tak. Usse upar nahi." },
  { who: "agent", text: "₹38,000 maximum. Main ₹35,000 se shuru karungi, aapka maximum kisi ko nahi bataungi. Post kar doon?" },
  { who: "owner", text: "Haan, kar do." },
  { who: "agent", text: "Load post ho gaya. 6 gaadi waalon ko ek saath call kar rahi hoon. Sabse sasti gaadi book karke confirm karti hoon." },
];
