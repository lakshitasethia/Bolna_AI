// Copy for the Ruko site. Figures are sourced in /research.md.

export const STEPS = [
  "Calms them down first",
  "Asks what a bank manager would",
  "Spots the scam script",
  "Says it plainly: hang up",
  "Alerts the family instantly",
  "Golden-hour recovery steps",
  "Practice scam drills",
  "Works on any phone, no app",
  "Hindi, Hinglish & your language",
];

export const SCAMS = [
  {
    name: "The FedEx Parcel",
    tags: "IVR / Courier / Customs",
    quote: "Your parcel has drugs in it. Stay on the line.",
    starts: "IVR call",
    moves: "Fake customs officer",
    asks: "Security deposit",
    tone: "a",
  },
  {
    name: "Digital Arrest",
    tags: "Video call / CBI / ED",
    quote: "You are under digital arrest. Tell no one.",
    starts: "Phone call",
    moves: "WhatsApp video, uniforms",
    asks: "Transfer to ‘RBI account’",
    tone: "b",
  },
  {
    name: "TRAI SIM Block",
    tags: "IVR / Telecom",
    quote: "Your SIM will be blocked in two hours.",
    starts: "Press 9 robocall",
    moves: "Fake TRAI officer",
    asks: "Aadhaar & OTP",
    tone: "c",
  },
  {
    name: "KYC Update",
    tags: "SMS / Bank / APK",
    quote: "Your account freezes today. Install this app.",
    starts: "SMS link",
    moves: "Screen-share app",
    asks: "OTP, full access",
    tone: "b",
  },
  {
    name: "Power Cut Tonight",
    tags: "SMS / Electricity",
    quote: "Bill unpaid. Power will be cut at 9:30 pm.",
    starts: "SMS + call",
    moves: "Fake lineman",
    asks: "Instant UPI payment",
    tone: "c",
  },
  {
    name: "Your Son Is Arrested",
    tags: "WhatsApp / Voice clone",
    quote: "Papa, they’ve arrested me. Send money now.",
    starts: "Unknown number",
    moves: "Cloned voice, crying",
    asks: "Urgent UPI to ‘lawyer’",
    tone: "a",
  },
];

export const NUMBERS = [
  {
    source: "Govt. of India (I4C / MHA)",
    rows: [
      ["Lost to cyber fraud in 2025", "₹22,495 cr"],
      ["Complaints filed in 2025", "24 lakh+"],
      ["Lost to ‘digital arrest’ in 2024", "₹1,935 cr"],
      ["Saved by fast reporting in 2025", "₹8,000 cr+"],
    ],
  },
  {
    source: "Truecaller India, 2025",
    rows: [
      ["Spam calls received", "4,168 cr"],
      ["Fraud calls detected", "770 cr"],
      ["Unknown calls that were spam", "66%"],
    ],
  },
  {
    source: "Senior citizens",
    rows: [
      ["Find basic feature phones easy", "71%"],
      ["Actually use smartphones", "41%"],
      ["Embarrassed to ask for help again", "44%"],
    ],
  },
  {
    source: "Supreme Court of India",
    rows: [["Lost to digital arrest, “mostly elderly”", "₹3,000 cr+"]],
  },
];
