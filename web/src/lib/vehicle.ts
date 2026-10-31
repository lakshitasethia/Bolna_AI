// Indian registration numbers are SS RR LL NNNN: a two-letter state code, a
// one or two digit RTO code, a one to three letter series, and a four digit
// number. "mh-12 ab 1234" -> "MH 12 AB 1234"; anything else -> null.
export function normalizeVehicle(raw: string | undefined): string | null {
  const s = (raw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const m = s.match(/^([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{4})$/);
  return m ? `${m[1]} ${m[2]} ${m[3]} ${m[4]}` : null;
}

// A ten digit Indian mobile number, with or without 91, 0091 or a leading 0.
// "+91 98290 41234" -> "9829041234"; anything else -> null.
export function normalizeMobile(raw: string | undefined): string | null {
  let d = (raw ?? "").replace(/\D/g, "").replace(/^0+/, "");
  if (/^91\d{10,11}$/.test(d)) d = d.slice(2).replace(/^0/, "");
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}

export const MAX_DETAIL_RETRIES = 2;

const ASK_AGAIN = {
  vehicle_number: "Gaadi number tukdon mein bataiye: pehle state aur RTO, jaise M H 1 2. Phir series, phir aakhri chaar number.",
  driver_phone: "Driver ka dus digit ka mobile number, paanch paanch karke bataiye.",
};

type Detail = keyof typeof ASK_AGAIN;

// Asks only for the piece that's missing, so an owner doesn't repeat what we heard.
function vehicleQuestion(raw: string | undefined) {
  const s = (raw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (/^[A-Z]{2}\d{1,2}[A-Z]{1,3}\d*$/.test(s)) return "Sirf aakhri chaar number bataiye, ek ek karke.";
  if (/^[A-Z]{2}\d{1,2}$/.test(s)) return "Ab series ke akshar bataiye.";
  return ASK_AGAIN.vehicle_number;
}

export type DetailCheck =
  | { retry: Detail; say: string }
  | { retry?: undefined; vehicle: string; driverPhone: string; toCheck: boolean };

// Asks again for a bad number a limited number of times, because owners give up
// long before a transcriber gets a spelled-out plate right. After that the
// booking goes through with what we heard, flagged for the desk to confirm.
export function checkDetails(retries: Partial<Record<Detail, number>>, rawVehicle?: string, rawPhone?: string): DetailCheck {
  const vehicle = normalizeVehicle(rawVehicle);
  const driverPhone = normalizeMobile(rawPhone);
  const bad: Detail[] = [...(vehicle ? [] : ["vehicle_number" as const]), ...(driverPhone ? [] : ["driver_phone" as const])];
  for (const field of bad) {
    const used = retries[field] ?? 0;
    if (used < MAX_DETAIL_RETRIES) {
      retries[field] = used + 1;
      return { retry: field, say: field === "vehicle_number" ? vehicleQuestion(rawVehicle) : ASK_AGAIN[field] };
    }
  }
  return {
    vehicle: vehicle ?? (rawVehicle ?? "").toUpperCase().trim(),
    driverPhone: driverPhone ?? (rawPhone ?? "").trim(),
    toCheck: bad.length > 0,
  };
}
