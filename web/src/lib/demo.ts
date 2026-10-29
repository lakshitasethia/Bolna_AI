import type { Contact } from "./types.ts";

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

export const DEMO_CONTACTS: Contact[] = [
  {
    id: "c_raju",
    name: "Raju Yadav",
    phone: "",
    city: "Okhla",
    truck: "32 ft container",
    persona: {
      available: true,
      open: 42000,
      floor: 37500,
      concede: 2000,
      vehicle: "HR55 AK 7781",
      driver: "Mahesh",
      driverPhone: "98110 22314",
    },
  },
  {
    id: "c_gurpreet",
    name: "Gurpreet Singh",
    phone: "",
    city: "Kundli",
    truck: "32 ft container",
    persona: {
      available: true,
      open: 39000,
      floor: 36500,
      concede: 1500,
      vehicle: "RJ14 GB 4521",
      driver: "Suresh",
      driverPhone: "98290 41234",
    },
  },
  {
    id: "c_anwar",
    name: "Anwar Khan",
    phone: "",
    city: "Gurgaon",
    truck: "32 ft container",
    persona: {
      available: false,
      open: 0,
      floor: 0,
      concede: 0,
      vehicle: "",
      driver: "",
      driverPhone: "",
      busyLine: "Nahi bhai, gaadi Ludhiana mein hai. Parso free hogi.",
    },
  },
];
