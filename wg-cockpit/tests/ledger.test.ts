import test from "node:test";
import assert from "node:assert/strict";
import { netOwedPhilipToMarcel, splitByPercent, splitEvenly } from "../src/domain/ledger.ts";

test("50/50 verteilt Cent-Reste deterministisch", () => {
  assert.deepEqual(splitEvenly(10001, ["marcel", "philip"]), [
    { person: "marcel", cents: 5001 }, { person: "philip", cents: 5000 },
  ]);
});

test("ungleiche Aufteilung landet exakt beim Gesamtbetrag", () => {
  assert.deepEqual(splitByPercent(101, [{ person: "marcel", percent: 70 }, { person: "philip", percent: 30 }]), [
    { person: "marcel", cents: 71 }, { person: "philip", cents: 30 },
  ]);
});

test("nur eine Person trägt die Ausgabe", () => {
  assert.equal(netOwedPhilipToMarcel([{ kind: "expense", payer: "marcel", shares: [{ person: "marcel", cents: 0 }, { person: "philip", cents: 20000 }] }]), 20000);
});

test("Ausgaben werden verrechnet und ein Settlement gleicht den Saldo aus", () => {
  const bookings = [
    { kind: "expense" as const, payer: "marcel" as const, shares: splitEvenly(20000, ["marcel", "philip"]) },
    { kind: "expense" as const, payer: "philip" as const, shares: splitEvenly(12000, ["marcel", "philip"]) },
  ];
  assert.equal(netOwedPhilipToMarcel(bookings), 4000);
  assert.equal(netOwedPhilipToMarcel([...bookings, { kind: "settlement", from: "philip", to: "marcel", cents: 4000 }]), 0);
});

test("Wohnungskonto-Ausgaben und interne Transfers erzeugen keine private Schuld", () => {
  const bookings = [
    { kind: "expense" as const, payer: "apartment" as const, shares: splitEvenly(98000, ["marcel", "philip"]) },
    { kind: "transfer" as const, from: "marcel" as const, to: "apartment" as const, cents: 70000 },
  ];
  assert.equal(netOwedPhilipToMarcel(bookings), 0);
});
