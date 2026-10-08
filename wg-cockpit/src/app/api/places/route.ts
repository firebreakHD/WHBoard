import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PhotonFeature = { properties?: {
  osm_id?: number | string; osm_type?: string; name?: string; street?: string; housenumber?: string;
  postcode?: string; city?: string; town?: string; village?: string; municipality?: string;
  district?: string; county?: string; state?: string; country?: string; countrycode?: string;
} };
type PlaceSuggestion = { id: string; label: string; primary: string; secondary: string };
const cache = new Map<string, { results: PlaceSuggestion[]; expires: number }>();

function unique(parts: (string | undefined)[]) {
  return [...new Set(parts.map(value => value?.trim()).filter((value): value is string => Boolean(value)))];
}

function formatPlace(feature: PhotonFeature, index: number): PlaceSuggestion | null {
  const place = feature.properties;
  if (!place || (place.countrycode && place.countrycode.toLocaleUpperCase() !== "AT")) return null;
  const locality = place.city || place.town || place.village || place.municipality || place.district || place.county || place.name;
  const street = unique([place.street, place.housenumber]).join(" ");
  const postalLocality = unique([place.postcode, locality]).join(" ");
  const primary = street || postalLocality || place.name || "Österreich";
  const secondary = unique([street ? postalLocality : undefined, place.district !== locality ? place.district : undefined, place.county !== locality ? place.county : undefined, place.state, place.country]).join(", ");
  const label = unique([street || undefined, postalLocality, place.state, place.country]).join(", ");
  return { id: `${place.osm_type ?? "place"}-${place.osm_id ?? index}`, label, primary, secondary };
}

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim().replace(/\s+/g, " ");
  if (query.length < 2) return NextResponse.json({ results: [] });
  if (query.length > 120) return NextResponse.json({ error: "Bitte kürzer suchen." }, { status: 400 });

  const key = query.toLocaleLowerCase("de-AT");
  const saved = cache.get(key);
  if (saved && saved.expires > Date.now()) return NextResponse.json({ results: saved.results });

  try {
    const url = new URL("https://photon.komoot.io/api/");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "7");
    url.searchParams.set("lang", "de");
    url.searchParams.set("countrycode", "AT");
    const response = await fetch(url, {
      headers: { "user-agent": "WG-Cockpit/0.1 (Home Assistant household dashboard)", accept: "application/json" },
      next: { revalidate: 21_600 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`Standortsuche antwortet mit ${response.status}.`);
    const data = await response.json() as { features?: PhotonFeature[] };
    const results = (data.features ?? []).map(formatPlace).filter((place): place is PlaceSuggestion => Boolean(place));
    cache.set(key, { results, expires: Date.now() + 21_600_000 });
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Standortvorschläge konnten nicht geladen werden:", error);
    return NextResponse.json({ error: "Standortvorschläge sind gerade nicht erreichbar." }, { status: 503 });
  }
}
