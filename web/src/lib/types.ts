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
  noAnswer?: boolean;
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
  | "outbid" // within budget, but wouldn't beat a truck another agent had locked
  | "too_expensive"
  | "not_free"
  | "call_later"
  | "no_answer"
  | "failed";

export const TERMINAL: CallStatus[] = [
  "agreed",
  "booked",
  "released",
  "outbid",
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
  agent: string; // "A", "B", ... one voice agent per owner
  live: boolean; // a real Bolna call, or a simulated owner
  contact: Contact;
  status: CallStatus;
  quotes: number[];
  offers: number[];
  agreedRate?: number;
  vehicle?: string;
  driverPhone?: string;
  detailRetries?: { vehicle_number?: number; driver_phone?: number };
  detailsToCheck?: boolean; // the owner's numbers never passed our checks; a person should confirm them
  transcript: Turn[];
  rival?: number; // the locked rate this agent last used as leverage
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

// What the agents on one load tell each other.
export interface BoardEvent {
  at: number;
  agent: string;
  kind: "locked" | "beat" | "backup" | "broadcast" | "outbid" | "booked" | "no_truck";
  rate?: number;
  text: string;
}

export interface Booking {
  callId: string;
  ownerName: string;
  rate: number;
  vehicle: string;
  driverPhone: string;
  detailsToCheck: boolean;
  savedVsCeiling: number;
  savedVsFirst: number; // how far the agents pushed below the first truck that agreed
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
  source: "desk" | "phone"; // posted from the desk, or the transporter phoned it in
  session?: string; // the desk tab that started the phone-in
  transporterPhone?: string;
  intake?: Turn[]; // the transporter's call, when it was phoned in
  status: "calling" | "booked" | "no_truck";
  calls: Call[];
  board: BoardEvent[];
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
  source?: Load["source"];
  session?: string;
  transporterPhone?: string;
  intake?: Turn[];
}
