export type PersonId = "marcel" | "philip" | "apartment";
export type BookingKind = "expense" | "transfer" | "settlement" | "expectedPayment";
export type Share = { person: Exclude<PersonId, "apartment">; cents: number };
export type LedgerBooking =
  | { kind: "expense"; payer: PersonId; shares: Share[] }
  | { kind: "transfer"; from: PersonId; to: PersonId; cents: number }
  | { kind: "settlement"; from: Exclude<PersonId, "apartment">; to: Exclude<PersonId, "apartment">; cents: number }
  | { kind: "expectedPayment"; cents: number };

/** Splits a positive amount in cents evenly, assigning leftover cents in participant order. */
export function splitEvenly(cents: number, people: Share["person"][]): Share[] {
  assertCents(cents);
  if (!people.length) throw new Error("Mindestens eine Person muss beteiligt sein.");
  const base = Math.floor(cents / people.length);
  let leftover = cents - base * people.length;
  return people.map(person => ({ person, cents: base + (leftover-- > 0 ? 1 : 0) }));
}

/** Converts percentage shares into cents and assigns rounding remainder to the last share. */
export function splitByPercent(cents: number, percentages: { person: Share["person"]; percent: number }[]): Share[] {
  assertCents(cents);
  const sum = percentages.reduce((total, item) => total + item.percent, 0);
  if (!percentages.length || Math.abs(sum - 100) > 0.000001 || percentages.some(p => p.percent < 0)) {
    throw new Error("Die prozentuale Aufteilung muss zusammen 100 % ergeben.");
  }
  let assigned = 0;
  return percentages.map((item, index) => {
    const share = index === percentages.length - 1 ? cents - assigned : Math.round(cents * item.percent / 100);
    assigned += share;
    return { person: item.person, cents: share };
  });
}

/**
 * Returns the net amount Philip owes Marcel in cents. Positive = Philip → Marcel;
 * negative = Marcel → Philip. Internal account transfers are excluded from expenses.
 */
export function netOwedPhilipToMarcel(bookings: LedgerBooking[]): number {
  let balanceForMarcel = 0;
  for (const booking of bookings) {
    if (booking.kind === "expense") {
      if (booking.payer === "apartment") continue;
      const paidByMarcel = booking.payer === "marcel" ? booking.shares.reduce((n, s) => n + s.cents, 0) : 0;
      const marcelShare = booking.shares.filter(s => s.person === "marcel").reduce((n, s) => n + s.cents, 0);
      balanceForMarcel += paidByMarcel - marcelShare;
    } else if (booking.kind === "settlement") {
      assertCents(booking.cents);
      if (booking.from === "philip" && booking.to === "marcel") balanceForMarcel -= booking.cents;
      if (booking.from === "marcel" && booking.to === "philip") balanceForMarcel += booking.cents;
    }
    // Transfers fund accounts but never count as shared consumption or settle personal debt.
  }
  return balanceForMarcel;
}

export function formatEuro(cents: number): string {
  return new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function assertCents(cents: number): void {
  if (!Number.isSafeInteger(cents) || cents < 0) throw new Error("Geldbeträge müssen positive ganze Cent-Beträge sein.");
}
