import type { Contact, Persona } from "./types.ts";

export const DEMO_LOAD = {
  transporter: "Sharma Roadlines",
  from: "Okhla, Delhi",
  to: "Jaipur",
  pickup: "kal subah 6 baje",
  truck: "32 ft container",
  weightTons: 20,
  target: 35000,
  ceiling: 38000,
};

const owner = (id: string, name: string, city: string, persona: Persona): Contact => ({
  id,
  name,
  phone: "",
  city,
  truck: "32 ft container",
  persona,
});

const busy = (line: string): Persona => ({
  available: false,
  open: 0,
  floor: 0,
  concede: 0,
  vehicle: "",
  driver: "",
  driverPhone: "",
  busyLine: line,
});

// Six owners the transporter already works with. Raju settles fast and high,
// which sets the bar; Gurpreet and then Mohan beat it once they hear it;
// Sukhwinder won't go under it.
export const DEMO_CONTACTS: Contact[] = [
  owner("c_raju", "Raju Yadav", "Okhla", {
    available: true,
    open: 38000,
    floor: 37000,
    concede: 1000,
    vehicle: "HR55 AK 7781",
    driver: "Mahesh",
    driverPhone: "98110 22314",
  }),
  owner("c_gurpreet", "Gurpreet Singh", "Kundli", {
    available: true,
    open: 39000,
    floor: 35500,
    concede: 1500,
    vehicle: "RJ14 GB 4521",
    driver: "Suresh",
    driverPhone: "98290 41234",
  }),
  owner("c_anwar", "Anwar Khan", "Gurugram", busy("Nahi bhai, gaadi Ludhiana mein hai. Parso free hogi.")),
  owner("c_sukhwinder", "Sukhwinder Gill", "Sonipat", {
    available: true,
    open: 40000,
    floor: 37000,
    concede: 1500,
    vehicle: "HR69 C 2210",
    driver: "Balwant",
    driverPhone: "99920 18877",
  }),
  owner("c_vikram", "Vikram Chauhan", "Faridabad", { ...busy(""), noAnswer: true }),
  owner("c_mohan", "Mohan Lal", "Ghaziabad", {
    available: true,
    open: 41000,
    floor: 35500,
    concede: 2000,
    vehicle: "UP14 FT 9032",
    driver: "Pappu",
    driverPhone: "97170 55620",
  }),
];
