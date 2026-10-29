export interface Contact {
  id: string;
  name: string;
  phone: string;
  city: string;
  truck: string;
  // How a simulated owner behaves. Ignored on live calls.
  persona?: Persona;
}

export interface Persona {
  available: boolean;
  open: number; // first quote
  floor: number; // lowest they'll go
  concede: number; // how much they drop per round
  vehicle: string;
  driver: string;
  driverPhone: string;
  busyLine?: string;
}

export type CallStatus =
  | "queued"
  | "ringing"
  | "talking"
  | "agreed" // owner agreed within budget, waiting for the other calls
  | "booked" // won the load
  | "released" // agreed, but another truck was cheaper
  | "too_expensive"
  | "not_free"
  | "call_later"
  | "no_answer"
  | "failed";

export const TERMINAL: CallStatus[] = [
  "agreed",
  "booked",
  "released",
  "too_expensive",
  "not_free",
  "call_later",
  "no_answer",
  "failed",
];

export interface Turn {
  who: "agent" | "owner";
  text: string;
  at: number;
}

export interface Call {
  id: string;
  contact: Contact;
  status: CallStatus;
  quotes: number[];
  offers: number[];
  agreedRate?: number;
  vehicle?: string;
  driverPhone?: string;
  transcript: Turn[];
  startedAt?: number;
  endedAt?: number;
  executionId?: string;
  sim?: SimState;
}

export interface SimState {
  phase:
    | "dial"
    | "greet"
    | "owner_answer"
    | "agent_respond"
    | "owner_reply"
    | "details"
    | "readback"
    | "confirm"
    | "done";
  nextAt: number;
  pendingQuote?: number;
  pendingFinal?: boolean;
}

export interface Booking {
  callId: string;
  ownerName: string;
  rate: number;
  vehicle: string;
  driverPhone: string;
  savedVsCeiling: number;
  seconds: number;
}

export interface Load {
  id: string;
  createdAt: number;
  transporter: string;
  from: string;
  to: string;
  pickup: string;
  truck: string;
  weightTons: number;
  target: number;
  ceiling: number;
  mode: "sim" | "live";
  status: "calling" | "booked" | "no_truck";
  calls: Call[];
  booking?: Booking;
}

export interface LoadInput {
  transporter: string;
  from: string;
  to: string;
  pickup: string;
  truck: string;
  weightTons: number;
  target: number;
  ceiling: number;
  contacts: Contact[];
  mode: "sim" | "live";
}
