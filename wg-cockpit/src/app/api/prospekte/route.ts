import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FlyerInfo = { publication: string; pageCount: number; image: string; title: string };
const cache = new Map<string, { value: FlyerInfo; expires: number }>();
const publicationLists = new Map<string, { value: PublitasPublication[]; expires: number }>();
const publicationData = new Map<string, { value: PublitasData; expires: number }>();
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36";
type PublitasPublication = { slug: string; title?: string; onlineAt?: string; url?: string };
type PublitasData = { config?: { description?: string; publicationTitle?: string }; spreads?: { pages?: string[] }[] };

async function publitasJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { "user-agent": USER_AGENT, accept: "application/json" }, next: { revalidate: 900 } });
  if (!response.ok) throw new Error(`Prospektquelle antwortet mit ${response.status}.`);
  return response.json() as Promise<T>;
}

async function latestPublication(group: string, predicate: (publication: PublitasPublication) => boolean = () => true) {
  let publications = publicationLists.get(group)?.value;
  if (!publications || (publicationLists.get(group)?.expires ?? 0) <= Date.now()) {
    publications = await publitasJson<PublitasPublication[]>(`https://api.publitas.com/v1/groups/${encodeURIComponent(group)}/publications.json`);
    publicationLists.set(group, { value: publications, expires: Date.now() + 15 * 60_000 });
  }
  const selected = [...(publications ?? [])].sort((a, b) => Date.parse(b.onlineAt ?? "") - Date.parse(a.onlineAt ?? "")).find(predicate);
  if (!selected) throw new Error("Beim Händler ist gerade kein aktuelles Bildprospekt veröffentlicht.");
  return selected;
}

function billaRegion(location: string) {
  const value = location.toLocaleLowerCase("de-AT");
  if (/tirol|innsbruck|kufstein|landeck/.test(value)) return "Tirol";
  if (/vorarlberg|bregenz|dornbirn|feldkirch/.test(value)) return "Vorarlberg";
  if (/salzburg/.test(value)) return "Salzburg";
  if (/kärnten|kaernten|klagenfurt|villach/.test(value)) return "Kärnten";
  if (/steiermark|graz|leoben|kapfenberg/.test(value)) return "Steiermark";
  if (/oberösterreich|oberoesterreich|linz|wels|ste[y]?r/.test(value)) return "Oberösterreich";
  if (/burgenland|eisenstadt|neusiedl/.test(value)) return "Burgenland";
  if (/niederösterreich|niederoesterreich|st\.?\s*pölten|st\.?\s*polten|baden|mödling|moedling|krems/.test(value)) return "Niederösterreich";
  return "Wien";
}

async function selectedPublication(retailer: string, location: string): Promise<{ group: string; slug: string; title?: string }> {
  if (retailer === "hofer") {
    const response = await fetch("https://katalog.hofer.at/", { redirect: "manual", headers: { "user-agent": USER_AGENT }, cache: "no-store" });
    const locationHeader = response.headers.get("location");
    const slug = locationHeader ? new URL(locationHeader, "https://katalog.hofer.at").pathname.split("/").filter(Boolean).pop() : undefined;
    if (!slug) throw new Error("Das aktuelle HOFER-Flugblatt wurde nicht gefunden.");
    return { group: "hofer-kommanditgesellschaft", slug };
  }
  const sources: Record<string, { group: string; matches?: (publication: PublitasPublication) => boolean }> = {
    spar: { group: "spar", matches: publication => /^spar folder/i.test(publication.title ?? "") },
    eurospar: { group: "spar", matches: publication => /^spar folder/i.test(publication.title ?? "") },
    interspar: { group: "interspar" },
    billa: { group: "billa-at", matches: publication => (publication.title ?? "").toLocaleLowerCase("de-AT") === `billa ${billaRegion(location)}`.toLocaleLowerCase("de-AT") },
    "billa-plus": { group: "billa-at", matches: publication => (publication.title ?? "").toLocaleLowerCase("de-AT") === `billa ${billaRegion(location)}`.toLocaleLowerCase("de-AT") },
    lidl: { group: "lidl-at", matches: publication => /^lidl 3 days/i.test(publication.title ?? "") },
    penny: { group: "penny" },
    dm: { group: "dm-drogerie-markt-gmbh" },
    bipa: { group: "bipa" },
  };
  const source = sources[retailer];
  if (!source) throw new Error("Für diesen Händler ist derzeit kein Bildprospekt angebunden.");
  const publication = await latestPublication(source.group, source.matches);
  return { group: source.group, slug: publication.slug, title: publication.title };
}

async function getFlyerInfo(retailer: string, page: number, location: string): Promise<FlyerInfo> {
  const { group, slug, title: listedTitle } = await selectedPublication(retailer, location);
  const cacheKey = `${group}:${slug}:${page}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.value;
  // Publitas documents this public, unauthenticated endpoint for integrations.
  // Its spread list contains a distinct original image path for every page.
  let data = publicationData.get(`${group}:${slug}`)?.value;
  if (!data || (publicationData.get(`${group}:${slug}`)?.expires ?? 0) <= Date.now()) {
    data = await publitasJson<PublitasData>(`https://api.publitas.com/v1/groups/${encodeURIComponent(group)}/publications/${encodeURIComponent(slug)}.json`);
    publicationData.set(`${group}:${slug}`, { value: data, expires: Date.now() + 15 * 60_000 });
  }
  const pages = (data.spreads ?? []).flatMap(spread => spread.pages ?? []);
  if (!pages.length || !pages[page - 1]) throw new Error("Die angeforderte Prospektseite ist nicht verfügbar.");
  const image = `https://view.publitas.com${pages[page - 1]}-at1600.jpg`;
  const pageCount = pages.length;
  const publication = `https://view.publitas.com/${group}/${slug}`;
  const title = data.config?.description || listedTitle || data.config?.publicationTitle || "Aktuelles Flugblatt";
  const value = { publication, pageCount, image, title };
  cache.set(cacheKey, { value, expires: Date.now() + 15 * 60_000 });
  return value;
}

export async function GET(request: NextRequest) {
  const retailer = request.nextUrl.searchParams.get("retailer");
  const page = Number(request.nextUrl.searchParams.get("page") ?? 1);
  const location = request.nextUrl.searchParams.get("location") ?? "";
  if (!retailer || !Number.isInteger(page) || page < 1 || page > 120) {
    return NextResponse.json({ error: "Für diesen Händler ist aktuell kein Bild-Viewer verfügbar." }, { status: 404 });
  }
  try {
    const flyer = await getFlyerInfo(retailer, page, location);
    if (request.nextUrl.searchParams.get("raw") === "1") {
      return NextResponse.redirect(flyer.image, { headers: { "Cache-Control": "public, max-age=900, stale-while-revalidate=1800" } });
    }
    return NextResponse.json(flyer, { headers: { "Cache-Control": "private, max-age=300, stale-while-revalidate=600" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Das Prospekt ist gerade nicht erreichbar.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
