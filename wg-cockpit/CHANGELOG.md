# Changelog

## 0.1.24

- Reserviert zwei Kachelreihen für die Einkaufsliste, damit Favoriten und Katalog beim Wechsel von null auf einen Artikel an ihrer Position bleiben.

## 0.1.23

- Fixiert das Scrollverhalten der Einkaufsliste: Hinzufügen und Entfernen springen nicht mehr automatisch; Favoriten und Produktkatalog scrollen jeweils im eigenen Bereich.
- Ergänzt beim Speichern eines bearbeiteten Katalogprodukts den Artikel direkt zur Einkaufsliste.
- Klappt die Icon-Auswahl standardmäßig ein, rückt Kategorie und Notiz nach unten und zeigt farbige Prioritäten samt Symbol am Produkt.
- Zeigt den Bearbeitungsstift nur im Katalog und verankert die Suche dauerhaft über der mobilen Navigation.

## 0.1.22

- Repariert das Hinzufügen von Einkaufsartikeln und „Artikel anlegen“ in Home-Assistant-Webviews ohne `crypto.randomUUID()`; die IDs funktionieren jetzt auch in unsicheren Browser-Kontexten.

## 0.1.21

## 0.1.19

- Behebt nicht reagierende Klicks nach Ingress- und Offline-Cache-Fehlern: der Service Worker ist auf den WG-Cockpit-Ingress begrenzt, cached nur Navigationen und liefert niemals HTML als Ersatz für Skripte oder API-Daten aus.
- Verhindert seitliches Überstehen auf schmalen Displays in Finanzreitern, Formularen, Fixkostenzeilen und Überschriften.

## 0.1.18

- Macht die mobilen Buchungs- und Schuldenfenster blickdicht und nahezu bildschirmfüllend; Abbrechen und „Zeile buchen“ beziehungsweise „Schuld eintragen“ bleiben unten angedockt.
- Verankert die Einkaufssuche direkt über der mobilen Navigation und verhindert seitliches Überstehen von Reitern, Formularen und Zeilen.
- Hebt „Geld rein“ dezent grün und „Geld raus“ dezent rot hervor.
- Startet den lokalen Entwickler-Modus mit Webpack ohne Source Maps, damit Next.js in OneDrive nicht an Turbopack-Cache-Schreibfehlern hängen bleibt.

## 0.1.16

- Setzt den Standardzeitraum für KI-, Quantum- und Krypto-Meldungen auf die letzten 24 Stunden.
- Öffnet 30-Tage-Kursverläufe am Handy als feste, abgedunkelte Dialoge mit Schließen-Schaltfläche; PC-Hover bleibt erhalten.
- Ergänzt am Ende des Produktkatalogs dauerhaft „Artikel anlegen“, erhöht beim erneuten Antippen die vorhandene Menge und blendet die ungenutzten Kategorienfilter aus.
- Macht Favoriten auf PC und Handy ein- und ausklappbar und gleicht den unteren Abstand der mobilen Navigation an den oberen an.
- Sperrt mobile Finanzformulare als Dialoge mit dauerhaft erreichbaren Aktionen.

## 0.1.15

- Korrigiert den Handy-Startknopf: „Start“ öffnet wieder das WG-Cockpit-Dashboard im Home-Assistant-Ingress.
- Macht die Schuldenkachel synchronisiert und öffnet sie zuverlässig direkt im Schulden-Tab.

## 0.1.14

- Zeigt am Handy im Dashboard nur die vier verlinkten Haushalts-Kacheln.
- Ergänzt direktes Löschen von Buchungen und Schuldenbewegungen; gelöschte manuelle Buchungen korrigieren den Kontostand.
- Vereinfacht die Schuldenaktionen zu „Etwas übernommen“ und „Etwas gezahlt“ oben in der Leiste.

## 0.1.13

- Entfernt einen doppelten Klickhandler beim Anlegen neuer Suchtreffer.

## 0.1.12

- Repariert die Einkaufslistenbedienung: Treffer antippen fügt hinzu und springt sichtbar zur Liste; die Suche hat keinen Plusknopf mehr.
- Sperrt den Hintergrund beim Bearbeiten und fixiert die Speichern-Leiste am Fensterrand.
- Ergänzt Emoji-Vorschläge und komprimierte eigene Produktbilder.
- Zeigt KI-Anbieter auf dem Handy einzeln wischbar und sortiert Krypto-Kurse vor den Meldungen.
- Ordnet mobile Finanz-Schnellaktionen oben an und verdichtet den Abstand zur unteren Navigation.

## 0.1.11

- Sichert die Dashboard-Navigation innerhalb des Home-Assistant-Ingress.
- Ergänzt monatsgefilterte Buchungen und berechnete Einnahmen, Ausgaben und Monatsrest.
- Fügt Artikel per Plusknopf oder Enter direkt zur Einkaufsliste hinzu.
- Fixiert das mobile Scrollfenster und die untere Navigation; blendet Menü- und Profilknopf oben aus.
- Zeigt Quantum-Aktien am Handy einzeln wischbar und ergänzt 30-Tage-Kursdiagramme per Preis-Pill.

## 0.1.9

- Korrigiert den Dashboard-Link in Home-Assistant-Ingress.
- Zeigt Monatswerte und Buchungen gefiltert nach Monat im Haushaltskonto.
- Macht das Hinzufügen von Einkaufsartikeln direkt per Plus und Enter möglich.
- Fixiert die mobile Navigation, blendet Hamburger- und Profilbutton oben aus und verbessert den Scrollbereich.
- Zeigt Quantum-Aktienkarten am Handy einzeln mit Wischwechsel; Kurs-Pills öffnen den 30-Tage-Verlauf.
## 0.1.8

- Repariert doppelt vorangestellte Home-Assistant-Ingress-Pfade, die Styles, Skripte und Klicks blockiert haben.
- Ergänzt eine mobil optimierte Navigation und größere, leicht antippbare Bereiche.
- Macht das Synchronisationsintervall in den Home-Assistant-App-Einstellungen von 1 bis 10 Sekunden einstellbar (Standard: 2 Sekunden).

## 0.1.7

- Behebt zwischengespeicherte Haushaltsdaten im Home-Assistant-Ingress. Finanz- und Einkaufsdaten werden geräteübergreifend wieder frisch vom Server geladen.
- Aktualisiert die App-Oberfläche und den Offline-Cache für Home Assistant.
