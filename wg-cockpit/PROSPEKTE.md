# Prospekte & Angebote

The Prospekte page links to live, official retailer pages. The weekly offer carousel reads the public Sparkorb offers page. General product searches read Sparkorb's public server-rendered product search (`/app?q=…`) and cache each query for one hour. No private retailer API is used.

| Retailer | Official source | Notes |
| --- | --- | --- |
| HOFER | https://www.hofer.at/flugblatt | Current online leaflet |
| SPAR / EUROSPAR | https://www.spar.at/aktionen | Regional leaflets |
| INTERSPAR | https://www.interspar.at/aktionen/ | Region-specific leaflets |
| BILLA / BILLA PLUS | https://www.billa.at/unsere-aktionen | Digital leaflets and offers |
| Lidl | https://www.lidl.at/c/flugblatt/s10012330 | Choose a branch for local offers |
| PENNY | https://www.penny.at/flugblatt | Online weekly leaflet |
| dm | https://www.dm.at/dm-journal-447278 | dm Journal and immergünstig express |
| BIPA | https://www.bipa.at/angebote | Official offers |

The app remembers the entered location and radius in shared WG state. Sparkorb reports that its online product prices are refreshed daily and cover BILLA, SPAR, HOFER, PENNY and Alfies; product search compares those displayed shop prices. Those are Austrian online assortment prices, not confirmed stock or prices at the selected nearby branch. Retailers that vary by region still ask the user to choose the matching market on their own page. Offer validity appears only when the source provides dates. No common documented, free Austrian leaflet API or generally embeddable viewer was found during implementation. The source pages can change their URL or behavior.

The outbound page buttons are the viewer fallback: retailer-hosted leaflets remain under each retailer's own display and usage rules.
