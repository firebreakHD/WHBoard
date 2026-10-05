import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://wg:wg@localhost:5432/wg_cockpit" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const [marcel, philip] = await Promise.all([
    prisma.user.upsert({ where: { email: "marcel@wg.local" }, update: {}, create: { displayName: "Marcel", email: "marcel@wg.local", role: "ADMIN" } }),
    prisma.user.upsert({ where: { email: "philip@wg.local" }, update: {}, create: { displayName: "Philip", email: "philip@wg.local", role: "ADMIN" } }),
  ]);
  const [marcelAccount, philipAccount, apartment] = await Promise.all([
    prisma.account.upsert({ where: { name: "Marcel" }, update: { userId: marcel.id }, create: { name: "Marcel", type: "PERSON", userId: marcel.id } }),
    prisma.account.upsert({ where: { name: "Philip" }, update: { userId: philip.id }, create: { name: "Philip", type: "PERSON", userId: philip.id } }),
    prisma.account.upsert({ where: { name: "Wohnungskonto" }, update: {}, create: { name: "Wohnungskonto", type: "APARTMENT" } }),
  ]);
  const categoryInfo = [
    ["Miete", "#13805f", "home"], ["Internet", "#4a83bf", "wifi"], ["Strom", "#d5a341", "zap"],
    ["Wohnen", "#76a8cb", "home"], ["Einkauf", "#df8f72", "shopping-basket"], ["Möbel", "#b78655", "armchair"], ["Sonstiges", "#9b8bb7", "more-horizontal"],
  ] as const;
  const categories = new Map<string, string>();
  for (const [name, color, icon] of categoryInfo) {
    const category = await prisma.category.upsert({ where: { name }, update: { color, icon }, create: { name, color, icon } });
    categories.set(name, category.id);
  }
  const templates = [
    { name: "Miete", amountCents: 98000, payerId: apartment.id, categoryId: categories.get("Miete")!, dueDay: 3 },
    { name: "Internet", amountCents: 4990, payerId: marcelAccount.id, categoryId: categories.get("Internet")!, dueDay: 10 },
    { name: "Strom", amountCents: null, payerId: marcelAccount.id, categoryId: categories.get("Strom")!, dueDay: 25 },
    { name: "ORF", amountCents: 1530, payerId: philipAccount.id, categoryId: categories.get("Wohnen")!, dueDay: 15 },
  ];
  const seededTemplates = [];
  for (const template of templates) {
    const saved = await prisma.expenseTemplate.upsert({ where: { id: `seed-${template.name.toLowerCase()}` }, update: {}, create: { id: `seed-${template.name.toLowerCase()}`, ...template, recurrence: "MONTHLY", splitType: "EQUAL", participants: [marcel.id, philip.id] } });
    seededTemplates.push(saved);
  }
  const october = new Date("2026-10-01T00:00:00+02:00");
  for (const template of seededTemplates) {
    await prisma.expectedPayment.upsert({ where: { templateId_month: { templateId: template.id, month: october } }, update: {}, create: { templateId: template.id, month: october, title: template.name, amountCents: template.amountCents } });
  }
  await prisma.booking.deleteMany({ where: { id: { startsWith: "seed-" } } });
  const examples: { id: string; type: "EXPENSE"; title: string; amountCents: number; date: string; payerId: string; categoryId: string; shares: [string, number][] }[] = [
    { id: "seed-rent", type: "EXPENSE" as const, title: "Miete", amountCents: 98000, date: "2026-09-03T10:00:00+02:00", payerId: apartment.id, categoryId: categories.get("Miete")!, shares: [[marcel.id, 49000], [philip.id, 49000]] },
    { id: "seed-internet", type: "EXPENSE" as const, title: "Internet", amountCents: 4990, date: "2026-09-10T10:00:00+02:00", payerId: marcelAccount.id, categoryId: categories.get("Internet")!, shares: [[marcel.id, 2495], [philip.id, 2495]] },
    { id: "seed-orf", type: "EXPENSE" as const, title: "ORF Gebühr", amountCents: 1530, date: "2026-09-15T10:00:00+02:00", payerId: philipAccount.id, categoryId: categories.get("Wohnen")!, shares: [[marcel.id, 765], [philip.id, 765]] },
    { id: "seed-strom", type: "EXPENSE" as const, title: "Strom Abschlag", amountCents: 12000, date: "2026-09-25T10:00:00+02:00", payerId: philipAccount.id, categoryId: categories.get("Strom")!, shares: [[marcel.id, 6000], [philip.id, 6000]] },
    { id: "seed-billa", type: "EXPENSE" as const, title: "Lebensmittel Billa", amountCents: 6432, date: "2026-09-28T12:42:00+02:00", payerId: philipAccount.id, categoryId: categories.get("Einkauf")!, shares: [[marcel.id, 3216], [philip.id, 3216]] },
    { id: "seed-table", type: "EXPENSE" as const, title: "Tisch Wohnzimmer", amountCents: 20000, date: "2026-09-30T14:22:00+02:00", payerId: marcelAccount.id, categoryId: categories.get("Möbel")!, shares: [[marcel.id, 10000], [philip.id, 10000]] },
  ];
  for (const row of examples) {
    const { shares, date, payerId, categoryId, ...data } = row;
    await prisma.booking.create({ data: { ...data, date: new Date(date), payer: { connect: { id: payerId } }, category: { connect: { id: categoryId } }, shares: { create: shares.map(([userId, cents]) => ({ user: { connect: { id: userId } }, cents })) } } });
  }
  await prisma.booking.create({ data: { id: "seed-transfer-marcel", type: "TRANSFER", title: "Einzahlung Wohnungskonto", amountCents: 70000, date: new Date("2026-09-01T10:00:00+02:00"), fromAccountId: marcelAccount.id, toAccountId: apartment.id, status: "PAID" } });
  await prisma.shoppingItem.deleteMany({ where: { id: { startsWith: "seed-item-" } } });
  await prisma.shoppingItem.createMany({ data: [
    { id: "seed-item-milch", name: "Milch", category: "Milchprodukte", quantity: "2x", checked: true, checkedAt: new Date("2026-09-29") },
    { id: "seed-item-eier", name: "Eier", category: "Milchprodukte", quantity: "10 Stück", checked: true, checkedAt: new Date("2026-09-29") },
    { id: "seed-item-brot", name: "Brot", category: "Backwaren", quantity: "1x", checked: true, checkedAt: new Date("2026-09-29") },
    { id: "seed-item-tomaten", name: "Tomaten", category: "Obst & Gemüse", quantity: "1 kg" }, { id: "seed-item-nudeln", name: "Nudeln", category: "Nudeln & Reis", quantity: "1 Packung" },
    { id: "seed-item-kaese", name: "Käse", category: "Milchprodukte", quantity: "1x" }, { id: "seed-item-wcpapier", name: "WC Papier", category: "Haushalt", quantity: "1 Packung" },
  ] });
  const assets = [
    ["BTC", "Bitcoin", "CRYPTO", 6142000, "2.300"], ["ETH", "Ethereum", "CRYPTO", 342000, "1.700"], ["SOL", "Solana", "CRYPTO", 13700, "3.100"],
    ["BNB", "BNB", "CRYPTO", 54700, "1.200"], ["XRP", "XRP", "CRYPTO", 56, "0.800"], ["ADA", "Cardano", "CRYPTO", 41, "1.000"],
    ["DOGE", "Dogecoin", "CRYPTO", 6, "-0.400"], ["AVAX", "Avalanche", "CRYPTO", 1820, "2.600"], ["IONQ", "IonQ", "QUANTUM", 1942, "4.200"],
    ["RGTI", "Rigetti", "QUANTUM", 214, "-1.100"], ["QBTS", "D-Wave", "QUANTUM", 138, "3.800"], ["IBM", "IBM", "EQUITY", 14720, "1.500"],
    ["GOOGL", "Google", "EQUITY", 14130, "1.900"], ["MSFT", "Microsoft", "EQUITY", 47610, "1.400"], ["AMZN", "Amazon", "EQUITY", 16230, "1.100"], ["NVDA", "Nvidia", "EQUITY", 89040, "2.700"],
  ] as const;
  await prisma.assetSnapshot.deleteMany({ where: { isDemo: true } });
  const savedAssets = new Map<string, string>();
  for (const [symbol, name, kind, priceCents, change] of assets) {
    const asset = await prisma.marketAsset.upsert({ where: { symbol }, update: { name, kind }, create: { symbol, name, kind } });
    savedAssets.set(symbol, asset.id);
    await prisma.assetSnapshot.create({ data: { assetId: asset.id, priceCents, change24h: change, capturedAt: new Date("2026-09-30T16:00:00+02:00"), isDemo: true } });
  }
  const news = [
    ["gpt51", "Modelle", "Neue GPT-5.1 Modelle vorgestellt", "Verbesserte Reasoning-Fähigkeiten und niedrigere Kosten.", "OpenAI", "2026-09-30T14:22:00+02:00"],
    ["nvidia-ai", "Chips", "Nvidia präsentiert neue Chips", "Neue Chips mit Fokus auf Effizienz für KI.", "Nvidia Newsroom", "2026-09-29T18:04:00+02:00"],
    ["ionq-deal", "Quantum", "IonQ schließt Partnerschaft im Regierungssektor", "Langfristiger Vertrag mit US-Behörde für Quantencomputing.", "IonQ News", "2026-09-30T10:43:00+02:00"],
    ["bitcoin", "Krypto", "Bitcoin steigt über 61.000 €", "Positive ETF-Zuflüsse und steigendes Interesse am Markt.", "CoinDesk", "2026-09-30T16:22:00+02:00"],
  ] as const;
  for (const [providerId, category, title, summary, sourceName, publishedAt] of news) {
    await prisma.marketNews.upsert({ where: { providerId_sourceName: { providerId, sourceName } }, update: {}, create: { providerId, category, title, summary, sourceName, publishedAt: new Date(publishedAt), tags: [category] } });
  }
  for (const [userId, assetSymbol] of [[marcel.id, "BTC"], [marcel.id, "NVDA"], [marcel.id, "IONQ"], [philip.id, "ETH"]] as const) {
    await prisma.watchlistItem.upsert({ where: { userId_assetId: { userId, assetId: savedAssets.get(assetSymbol)! } }, update: {}, create: { userId, assetId: savedAssets.get(assetSymbol)! } });
  }
  console.log(`Seed abgeschlossen: ${marcel.displayName}, ${philip.displayName}, ${templates.length} Templates, ${examples.length} Buchungen.`);
}

main().finally(async () => prisma.$disconnect());
