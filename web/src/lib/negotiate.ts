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

const roundDown = (n: number, step: number) => Math.floor(n / step) * step;

export function decide(terms: Terms, history: History, quote: number, isFinal = false): Decision {
  const step = terms.step ?? 500;
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
  if (isFinal || history.offers.length >= maxRounds) return take();

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

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

// A line the voice agent can say for each decision. The LLM may rephrase it.
export function sayFor(decision: Decision, ownerName: string): string {
  switch (decision.action) {
    case "accept":
      return `Theek hai ${ownerName} ji, ${inr(decision.rate)} pakka. Gaadi number aur driver ka number bata dijiye.`;
    case "counter":
      return `${ownerName} ji, ${inr(decision.offer)} tak ho jayega. Chalega?`;
    case "decline":
      return `Itna budget nahi hai ${ownerName} ji. Agli baar zaroor. Dhanyavaad!`;
  }
}
