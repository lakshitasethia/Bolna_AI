// The price rules live here, not in the voice prompt, so no conversation can
// talk the agent past the transporter's ceiling.

export interface Terms {
  target: number; // where we open
  ceiling: number; // never pay more than this
  step?: number; // smallest move, in rupees
  maxRounds?: number; // counters before we take or leave the quote
}

export interface History {
  offers: number[]; // what we've offered so far
  quotes: number[]; // what the owner has asked so far
}

export type Decision =
  | { action: "accept"; rate: number }
  | { action: "counter"; offer: number }
  | { action: "decline"; lastOffer: number };

export const STEP = 500;

const roundDown = (n: number, step: number) => Math.floor(n / step) * step;

export function decide(terms: Terms, history: History, quote: number, isFinal = false): Decision {
  const step = terms.step ?? STEP;
  const maxRounds = terms.maxRounds ?? 3;
  const { target, ceiling } = terms;

  if (!Number.isFinite(quote) || quote <= 0) {
    throw new Error(`Invalid quote: ${quote}`);
  }
  if (target > ceiling) {
    throw new Error("Target is above the ceiling");
  }

  const lastOffer = history.offers.at(-1);
  const take = (): Decision =>
    quote <= ceiling ? { action: "accept", rate: quote } : { action: "decline", lastOffer: lastOffer ?? target };

  if (quote <= target) return { action: "accept", rate: quote };
  // "Final" only counts once we've made an offer, so an opening "final" still gets one counter.
  if ((isFinal && lastOffer !== undefined) || history.offers.length >= maxRounds) return take();

  // Open at target, then meet the owner halfway, rounded down to the step.
  let offer = lastOffer === undefined ? target : roundDown(lastOffer + (quote - lastOffer) / 2, step);
  if (lastOffer !== undefined && offer <= lastOffer) offer = lastOffer + step;
  offer = Math.min(offer, ceiling);

  // Already at the ceiling and can't move: take it if it fits, else walk away.
  if (lastOffer !== undefined && offer <= lastOffer) return take();
  // Our next offer would meet or beat their ask, or the gap is one step.
  if (offer >= quote || (quote <= ceiling && quote - offer <= step)) return take();

  return { action: "counter", offer };
}

// Speech to text drops words, so "38 hazaar" can arrive as 38. An amount this far
// from the budget is a mishearing, and accepting it would book a truck for ₹38.
export const plausibleQuote = (quote: number, ceiling: number) => quote >= ceiling / 4 && quote <= ceiling * 4;

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

// A line the voice agent can say for each decision. The LLM may rephrase it.
// `rival` is a rate another agent really has locked on this load; it is the
// only competing price the agent is ever allowed to mention.
export function sayFor(decision: Decision, ownerName: string, rival?: number): string {
  switch (decision.action) {
    case "accept":
      return `Theek hai ${ownerName} ji, ${inr(decision.rate)} note kar liya. Ab gaadi ka state aur RTO code bataiye, jaise M H 1 2.`;
    case "counter":
      return rival
        ? `${ownerName} ji, ek gaadi ${inr(rival)} mein mil rahi hai. ${inr(decision.offer)} mein karoge toh load aapka.`
        : `${ownerName} ji, ${inr(decision.offer)} tak ho jayega. Chalega?`;
    case "decline":
      return rival
        ? `${ownerName} ji, ek gaadi ${inr(rival)} mein lag rahi hai, usse upar nahi ja sakte. Agli baar zaroor. Dhanyavaad!`
        : `Itna budget nahi hai ${ownerName} ji. Agli baar zaroor. Dhanyavaad!`;
  }
}
