import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Offer = {
  id: string;
  title: string;
  unit: string;
  price: number;
  oldPrice: number | null;
  image: string | null;
  url: string | null;
  store: string;
  storeName: string;
  discount: number | null;
  condition: string | null;
  validFrom:string|null;
  validUntil:string|null;
};

let cached: { offers: Offer[]; updatedAt: string | null; expires: number } | null = null;
const storeNames: Record<string, string> = {
  hofer: "HOFER",
  billa: "BILLA",
  spar: "SPAR",
  penny: "PENNY",
  alfies: "Alfies",
};

function decodeJsString(value: string) {
  try {
    return JSON.parse(value) as string;
  } catch {
    return value.slice(1, -1);
  }
}

function numeric(value: string) {
  if (!value || value === "null" || value === "undefined") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function dateValue(value:string){if(!value||value==="null"||value==="undefined")return null;const raw=value.startsWith('"')?decodeJsString(value):value.trim();const date=new Date(raw);return Number.isNaN(date.getTime())?null:date.toISOString()}

function readOffers(html: string): Offer[] {
  // Sparkorb renders its current, public offer cards into the page response.
  // Read only the displayed product fields; never manufacture a previous price.
  const pattern = /([a-z])\.id=(\d+);\1\.store_name=("(?:\\.|[^"\\])*?");\1\.store_category=("(?:\\.|[^"\\])*?");\1\.current_price=([^;]+);\1\.unit=("(?:\\.|[^"\\])*?");\1\.store_url=("(?:\\.|[^"\\])*?");\1\.store_image_url=("(?:\\.|[^"\\])*?");\1\.regular_price=([^;]+);\1\.sale_price=([^;]+);\1\.sale_min_qty=([^;]+);\1\.sale_label=([^;]+);\1\.valid_from=([^;]+);\1\.valid_until=([^;]+);\1\.store=("(?:\\.|[^"\\])*?")/g;
  const offers: Offer[] = [];
  for (const match of html.matchAll(pattern)) {
    const store = decodeJsString(match[15]);
    const price = numeric(match[10]) ?? numeric(match[5]);
    if (!price || !storeNames[store]) continue;
    const oldPrice = numeric(match[9]);
    offers.push({
      id: match[2],
      title: decodeJsString(match[3]),
      unit: decodeJsString(match[6]),
      price,
      oldPrice: oldPrice && oldPrice > price ? oldPrice : null,
      image: decodeJsString(match[8]) || null,
      url: decodeJsString(match[7]) || null,
      store,
      storeName: storeNames[store],
      discount: oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : null,
      condition: match[12] !== "null" ? decodeJsString(match[12]) : match[11] !== "null" ? `Ab ${match[11]}` : null,
      validFrom:dateValue(match[13]),
      validUntil:dateValue(match[14]),
    });
  }
  return offers;
}

export async function GET(request:Request) {
  const includeAll = new URL(request.url).searchParams.get("all") === "1";
  const respond = (data: { offers: Offer[]; updatedAt: string | null; expires: number }) => NextResponse.json({ ...data, offers: includeAll ? data.offers : data.offers.slice(0, 48) }, { headers: { "Cache-Control": "public, max-age=900, stale-while-revalidate=1800" } });
  if (cached && cached.expires > Date.now()) {
    return respond(cached);
  }
  try {
    const response = await fetch("https://sparkorb.at/angebote", {
      headers: { "user-agent": "Mozilla/5.0 WG-Cockpit/1.0", accept: "text/html" },
      next: { revalidate: 1800 },
    });
    if (!response.ok) throw new Error(`Angebotsquelle antwortet mit ${response.status}.`);
    const html = await response.text();
    const offers = readOffers(html);
    if (!offers.length) throw new Error("Die Angebotsliste ist momentan nicht verfügbar.");
    const updatedAt = html.match(/Zuletzt aktualisiert:\s*([^<\n]+)/i)?.[1]?.trim() ?? null;
    cached = { offers, updatedAt, expires: Date.now() + 30 * 60_000 };
    return respond(cached);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Angebote konnten nicht geladen werden.";
    return NextResponse.json({ error: message }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
