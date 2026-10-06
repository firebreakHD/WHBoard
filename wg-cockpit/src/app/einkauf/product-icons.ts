const catalog:Record<string,string>={
  "Obst & Gemüse":"Apfel|🍎;Grüner Apfel|🍏;Birne|🍐;Orange|🍊;Zitrone|🍋;Limette|🍋;Banane|🍌;Wassermelone|🍉;Weintrauben|🍇;Erdbeeren|🍓;Heidelbeeren|🫐;Melone|🍈;Kirschen|🍒;Pfirsich|🍑;Mango|🥭;Ananas|🍍;Kokosnuss|🥥;Kiwi|🥝;Tomate|🍅;Avocado|🥑;Aubergine|🍆;Kartoffel|🥔;Karotte|🥕;Mais|🌽;Paprika|🫑;Gurke|🥒;Blattsalat|🥬;Brokkoli|🥦;Knoblauch|🧄;Zwiebel|🧅;Pilze|🍄;Erdnüsse|🥜;Kastanie|🌰;Oliven|🫒;Süßkartoffel|🍠;Ingwer|🫚;Erbsen|🫛;Kräuter|🌿",
  "Backwaren":"Brot|🍞;Baguette|🥖;Croissant|🥐;Brezel|🥨;Bagel|🥯;Pfannkuchen|🥞;Waffeln|🧇;Käsegebäck|🧀;Kuchen|🍰;Torte|🎂;Muffin|🧁;Keks|🍪;Brotstange|🥖;Toastbrot|🍞;Donut|🍩;Zimtschnecke|🥐;Cracker|🍘;Reiswaffeln|🍘;Semmel|🥯",
  "Milchprodukte":"Milch|🥛;Butter|🧈;Käse|🧀;Ei|🥚;Joghurt|🥣;Sahne|🥛;Topfen|🥣;Quark|🥣;Frischkäse|🧀;Mozzarella|🧀;Parmesan|🧀;Feta|🧀;Gouda|🧀;Pudding|🍮;Eiscreme|🍨;Softeis|🍦;Milchshake|🥤;Haferdrink|🥛;Schmand|🥣;Kefir|🥛;Skyr|🥣;Margarine|🧈;Eierkarton|🥚",
  "Fleisch & Fisch":"Huhn|🍗;Hähnchen|🍗;Steak|🥩;Fleisch|🍖;Speck|🥓;Wurst|🌭;Burger|🍔;Fisch|🐟;Lachs|🐟;Thunfisch|🐟;Garnele|🦐;Krabbe|🦀;Muscheln|🦪;Sushi|🍣;Fischstäbchen|🐟;Hackfleisch|🥩;Schinken|🥓;Pute|🍗;Tofu|🧈",
  "Nudeln & Reis":"Spaghetti|🍝;Nudeln|🍝;Pasta|🍝;Lasagne|🍝;Ravioli|🥟;Makkaroni|🍝;Reis|🍚;Reisschale|🍚;Risotto|🍚;Couscous|🍚;Quinoa|🌾;Haferflocken|🥣;Müsli|🥣;Cornflakes|🥣;Mehl|🌾;Linsen|🫘;Bohnen|🫘;Kichererbsen|🫘;Polenta|🌽;Kartoffelpüree|🥔",
  "Getränke":"Wasser|💧;Mineralwasser|💧;Kaffee|☕;Tee|🍵;Grüner Tee|🍵;Saft|🧃;Orangensaft|🍊;Apfelsaft|🍎;Limonade|🥤;Cola|🥤;Eistee|🧋;Energy-Drink|⚡;Bier|🍺;Wein|🍷;Sekt|🥂;Milchkaffee|☕;Kakao|☕;Smoothie|🥤;Kokosdrink|🥥;Sirup|🍯;Trinkflasche|🧴;Thermoskanne|☕",
  "Snacks":"Chips|🍿;Popcorn|🍿;Schokolade|🍫;Pralinen|🍬;Bonbons|🍬;Gummibärchen|🍬;Lutscher|🍭;Kaugummi|🍬;Nüsse|🥜;Salzstangen|🥨;Cracker|🍘;Tortilla-Chips|🌮;Nachos|🧀;Energieriegel|🍫;Müsliriegel|🥜;Pudding|🍮;Gelee|🍮;Marshmallows|🍡;Kekse|🍪;Studentenfutter|🥜",
  "Haushalt":"Toilettenpapier|🧻;Küchenrolle|🧻;Taschentücher|🤧;Spülmittel|🧴;Waschmittel|🧺;Weichspüler|🧴;Schwamm|🧽;Reinigungsmittel|🧹;Allzweckreiniger|🧴;Glasreiniger|🪟;Müllbeutel|🗑️;Alufolie|🧻;Backpapier|📜;Frischhaltefolie|🧻;Geschirrspültabs|🫧;Handseife|🧼;Shampoo|🧴;Duschgel|🧴;Zahnpasta|🪥;Zahnbürste|🪥;Deo|🧴;Rasierer|🪒;Batterien|🔋;Glühbirne|💡;Kerzen|🕯️;Pflaster|🩹;Staubsaugerbeutel|🧹",
  "Sonstiges":"Blumen|💐;Pflanze|🪴;Hundefutter|🐶;Katzenfutter|🐱;Tierfutter|🐾;Büromaterial|✏️;Stift|🖊️;Notizbuch|📓;Batterie|🔋;Geschenkpapier|🎁;Servietten|🧻;Grillkohle|🔥;Holz|🪵;Klebeband|📦;Paket|📦;Schuhcreme|👞;Sonnencreme|☀️;Insektenschutz|🦟;Medikamente|💊;Vitamine|💊"
};

export const productIcons=Object.entries(catalog).flatMap(([category,entries])=>entries.split(";").map(entry=>{const [name,emoji]=entry.split("|");return{name,emoji,category}}));
export const productIconCategories=["Alle",...Object.keys(catalog)];
