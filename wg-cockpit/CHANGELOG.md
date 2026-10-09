## 0.1.112

- Korrigiert den Kostenrechnung-Menülink innerhalb von Home Assistant, damit die Seite über den Ingress-Pfad statt mit einem 404 geöffnet wird.

## 0.1.111

- Ergänzt die persönliche Kostenrechnung mit PIN, PDF-Kontoauszug-Import und editierbaren Monatsbuchungen.
- Aktualisiert Summen beim Löschen sofort und trennt Sparbeträge von anderen Kosten.
- Erhöht beim lokalen Produktionsbuild die Add-on-Version und die angezeigte App-Version zusammen. Fehlgeschlagene Builds setzen die Version zurück.
- Behält beim Home-Assistant-Containerbuild die bereits veröffentlichte Version bei.

## 0.1.110

- Lädt die ausführlichen Rezeptdetails erst beim Öffnen. Dadurch werden Zutaten und sämtliche Schritte dann vollständig ins Deutsche übertragen, ohne die gesamte Suche auszubremsen.
- Übersetzt auch verfügbare Rezeptbeschreibungen und vereinheitlicht die angezeigten Mengen für Österreich.

## 0.1.109

- Aktiviert den Zieh-zum-Aktualisieren-Refresh über die gesamte Rezeptansicht, einschließlich „Uhrzeit“.
- Übersetzt Rezeptbeschreibungen, Zutaten und Zubereitungsschritte konsequent ins Deutsche, sofern die Quelle nicht deutsch ist.
- Rechnet englische Gewichtsmaße wie Pfund und Unzen in gebräuchliche Gramm- und Kilogrammangaben um und vereinheitlicht Stückangaben.
- Entfernt den zusätzlichen Trenner und Leerraum vor der ersten Angebotsüberschrift in „Entdecken“.

## 0.1.108

- Setzt das kompakte Standort- und Umkreisfeld direkt unter die Angebote, ohne zusätzliche Beschreibungstexte.
- Zeigt darunter die Produktsuche und anschließend die Prospekte.
- Macht die Produktsuch-Kacheln vollständig antippbar und erweitert den unteren Scrollabstand leicht, damit die letzte Kachel nicht unter der Handy-Menüleiste endet.

## 0.1.107

- Öffnet „Entdecken“ immer zuerst mit „Angebote und Prospekte“.
- Ordnet die Ansicht neu: Angebotsraster, Produktsuche und darunter die verfügbaren Prospekte.

## 0.1.106

- Entfernt den Favoritenstern aus den Marktprodukten in der Einkaufssuche und ergänzt ein integriertes X zum Abbrechen in der Einkaufs- und Produktsuche bei Angebote und Prospekte.
- Zeigt das Markt-Badge nur bei Artikeln aus dem Angebotsraster und speichert es nicht als dauerhafte Produkteigenschaft.
- Setzt der Einkauf-Tab am Handy die Einkaufsliste zurück, beendet die Suche und schließt Entdecken.
- Verkürzt den Leerraum nach den letzten Einkaufskacheln am Handy und hält das Suchfeld innerhalb des Inhaltsbereichs.

## 0.1.105

- Entfernt den Favoritenstern aus den gefundenen Marktprodukten in der Einkaufssuche.
- Ergänzt ein transparentes X im Suchfeld, das die Suche samt Treffern schließt; dasselbe Verhalten gilt für die Produktsuche bei Angebote und Prospekte.
- Zeigt das Markt-Badge nur bei Artikeln aus dem Angebotsraster; normale Markt-Suchergebnisse erhalten kein dauerhaftes Händler-Badge.
- Setzt der Einkauf-Tab am Handy die Einkaufsliste zurück, beendet eine offene Suche und schließt Entdecken.
- Verkürzt den leeren Nachlauf am Ende der Einkaufsliste am Handy auf einen kleinen unteren Abstand.

## 0.1.104

- Ergänzt den Tab „Tageszeit“ mit neun Rezeptideen für Frühstück, Mittagessen, Kaffeezeit oder Abendessen und aktualisiert ihn bei einem Wechsel der Tageszeit.
- Verbessert die deutsche Zutatenzuordnung, übersetzt englische Zubereitungsschritte samt Zutatenbegriffen und hebt die passenden Produkte in jedem Schritt fett hervor.
- Setzt die Rezeptportionen beim Öffnen standardmäßig auf zwei.
- Blendet während der Suche die bereits hinzugefügte Liste aus und hält Produkt- und Marktresultate am Handy in zweispaltigen Kacheln mit vertikalem Seitenscroll.
- Versteckt die Angebots-Rasterpfeile am Handy und hält Suchfeld sowie Marktauswahl innerhalb der Seitenränder.

## 0.1.103

- Löst das Aktualisieren von Rezepten auch aus, wenn die Ziehgeste auf einer Rezept- oder Zutatenkachel beginnt; beim Scrollen von weiter unten greift der Refresh erst nach Erreichen des oberen Seitenrands.

## 0.1.102

- Verknüpft kurzes haptisches Feedback für Rezeptwechsel, Portionen, Zutaten, Favoriten und Angebotsaktionen mit der gemeinsamen Einstellung.
- Aktiviert Pinch-Zoom am Handy und Scrollrad-Zoom am PC im Prospekt-Viewer; horizontale Seitenwechsel bleiben davon getrennt.
- Wendet die Kachel-/Listen-Einstellung auch auf mobile Preis-Suchergebnisse und alle Kategorien im Einkaufsstart an.
- Zeigt bei Rezepten und Suchtreffern bereits vorhandene Listeneinträge samt gespeicherter Menge.
- Übersetzt längere Rezeptzubereitungen vollständig in handliche Schritte und entfernt das Rezeptbild aus der Schrittansicht.
- Übernimmt Angebots- und Suchbilder sowie bekannte Preise in die Einkaufsliste und füllt passende Preise beim Abhaken vor.
- Ergänzt die Einkaufs-Suche um Marktpreise unter den vorhandenen Produkten, mit Marktfilter, Preisvergleich, Mengenanzeige und Ein-Klick-Hinzufügen.
## 0.1.101

- Verhindert Mengen von 0 bei manuellem Hinzufügen, Bearbeiten, Rezeptzutaten, Belegen und beim Anpassen im Einkaufsmodus.
- Vereinfacht die Produktsuche: Tippen fügt 1 hinzu, erneutes Tippen erhöht die Menge; separate Mengen- und Hakenbuttons entfallen.
- Zeigt Prospekte erst, wenn aktuelle lesbare Bildseiten verfügbar sind, prüft diese bei Standortänderungen neu und entfernt leere Händlerkarten.
- Bindet die echten Nah&Frisch-Wochenprospektbilder ein und macht sie direkt blätterbar; neue Seiten werden regelmäßig von der offiziellen Quelle geholt.
- Aktualisiert Prospekte und Wochenangebote während der geöffneten Ansicht automatisch alle sechs Stunden.
- Stellt die allgemeine Produktsuche über den Standortbereich.

## 0.1.98

- Ergänzt „Pull to refresh“ bei Rezepten: Am oberen Listenrand nach unten ziehen lädt neue Vorschläge und setzt die Ansicht weich zurück.
- Lässt die Rezeptsuche live während der Eingabe suchen; das Aktualisieren-Symbol steht am PC neben dem Suchfeld und am Handy übernimmt das Herunterziehen.
## 0.1.97

- Zeigt bei Wochenangeboten den aktuellen Listenbestand und erlaubt weiteres Hinzufügen; entfernt Favoriten und den Günstigsten-Hinweis aus dem Angebotsraster.
- Ergänzt Mengensteuerung, Speichern und Marktauswahl in der allgemeinen Produktsuche sowie Marktkennzeichnung bei Angebotsartikeln auf der Einkaufsliste.
- Ergänzt Händlerlinks für Nah&Frisch, BIPA, dm, LIBRO und PAGRO sowie die Bezeichnung „Angebote und Prospekte“ und richtet die mobile Aktionsleiste neu aus.
- Ersetzt „Beliebt“ durch saisonale Rezeptvorschläge, lädt neun Entdecken-Vorschläge und macht die Zubereitungsansicht sichtbar bedienbar.
- Entfernt das Angebots-Badge automatisch nur bei markierten Artikeln, die tatsächlich aus dem Angebotsraster übernommen wurden.
## 0.1.96

- Entfernt veraltete Angebots-Badges auch bei manuell markierten Artikeln, wenn kein passendes aktives Angebot mehr im Feed steht.

## 0.1.95

- Entfernt das Angebots-Badge und gespeicherte Angebotsdaten automatisch, sobald ein verknüpftes Angebot abgelaufen oder aus dem aktuellen Angebotsfeed verschwunden ist.
- Prüft Angebotsartikel beim Öffnen der Einkaufsliste, bei der Rückkehr zur App und während der Nutzung erneut.

## 0.1.93

- Ergänzt eine allgemeine Produktsuche mit normalen Onlinepreisen mehrerer Händler; das Suchfeld öffnet unter der Überschrift.
- Sortiert Produkte nach Marke und Namen, vergleicht Händlerpreise je Produkt und markiert den günstigsten Treffer sowie den niedrigsten Einheitspreis.
- Lässt den Bereich mit Wochenangeboten separat und zeigt die Abweichung zwischen Onlinepreis und Filialpreis transparent an.

## 0.1.92

- Übersetzt auch Mengen und Zubereitungsangaben direkt in der Rezeptansicht lesbar ins Deutsche.

## 0.1.91

- Verknüpft Produktfavoriten nach Marke und Produktart, damit markierte Markenangebote künftig passend hervorgehoben werden.

## 0.1.90

- Ergänzt eine ein- und ausklappbare Suche für aktuelle Angebote mit Händlerfilter, Produktfavoriten und günstigstem Suchtreffer.
- Zeigt Angebotslaufzeiten nur an, wenn die Angebotsquelle konkrete Datumswerte liefert, und markiert Dringend-Produkte wieder rötlich.
- Verbessert die Mengenübernahme aus Rezepten, Bild-Fehlerdarstellung und die lesbare Schritt-für-Schritt-Zubereitung.
- Übernimmt dauerhafte Produktmengen als Wiederholmenge; einmalige Mengeneingaben bleiben einmalig.

## 0.1.89

- Erweitert die Rezeptsuche über zusätzliche Seiten der Cooklang Federation und mehrere Suchvarianten; bis zu 180 passende Treffer werden zusammengeführt.
- Sortiert genaue Titelübereinstimmungen vor breiteren Rezeptvarianten.

## 0.1.87

- Ergänzt weitere deutsche Zutatenzuordnungen und übersetzt Zubereitungszusätze bei Mengen.
- Bereinigt Rezeptschritte, damit Nummerierungen nicht doppelt als eigener Schritt erscheinen.

## 0.1.86

- Verbessert deutsche Rezeptnamen und Suchbegriffe samt zusätzlichen passenden Treffern aus zwei kostenlosen Rezeptquellen.
- Ergänzt deutsche Zutaten- und Mengenbezeichnungen sowie klar strukturierte Kochschritte.

## 0.1.85

- Ermöglicht die deutsche Rezeptsuche mit passenden englischen Suchvarianten und zusätzlicher Suche bei DummyJSON.
- Übersetzt Rezeptnamen, Zutaten, Mengen und Zubereitungsschritte nach Möglichkeit ins Deutsche.
- Ergänzt den Bereich „Könntest du schon haben“ und einen Tab für bereits zur Einkaufsliste übernommene Rezepte.
- Passt Rezeptkarten und Zubereitungsschritte an das WG-Cockpit-Design an.

## 0.1.84

- Vereinigt Rezepte und Prospekte unter dem Kompass-Button in einer Entdecken-Ansicht mit gespeicherten Tabs.
- Versteckt die Hauptnavigation in Entdecken; Zurück und Browser-Zurück führen zurück zur Einkaufsliste.
- Stellt Rezept-Angebotslinks auf den Prospekte-Tab um und verbessert die mobile Rezeptübersicht.

## 0.1.83

- Führt Rezepte und Prospekte unter dem Kompass-Button in einer gemeinsamen Entdecken-Ansicht mit dauerhaft gespeicherten Tabs zusammen.
- Blendet die Hauptnavigation in Entdecken aus und unterstützt Zurück-Taste sowie Browser-Zurück.
- Entfernt die zusätzliche Außenkarte im Entdecken-Bereich und verbessert die Rezeptkarten auf kleinen Displays.

## 0.1.82

- Fügt Wochenangebote mit Originalnamen direkt über ein Mengen- und Prioritätenfenster zur Einkaufsliste hinzu; „Angebot“ ist vorausgewählt, langes Drücken öffnet die Produktseite.
- Lädt Prospekt- und Angebotsdaten nach einer Standort- oder Umkreisänderung erneut; Prospekt-Pinch-Zoom am Handy ist aktiv, die Zoom-Prozentleiste dort ausgeblendet.
- Ergänzt eine Einkaufsanalyse mit Monatsverlauf, Geschäftssummen und aufgeschlüsselten Produktpreisen.
- Macht die Rezeptansicht vollflächig, ergänzt Live-Suche auf der kostenlosen TheMealDB-API und normalisiert erkannte Produktnamen wie warmes Wasser zu Wasser.
- Benennt den Ablaufknopf in „Einkauf buchen“ um und richtet ihn am Handy rechts aus.
## 0.1.81

- Verhindert doppelte Zufallsvorschläge und rechnet auch einfache Bruchmengen bei der Portionsanpassung um.

## 0.1.80

- Ergänzt im Einkaufsbereich „Rezepte & Inspiration“ mit Suche, Favoriten, eigenen WG-Rezepten und einer Übersicht häufig übernommener Rezepte.
- Zeigt Rezeptzutaten vor dem Hinzufügen einzeln an; typische Vorräte wie Butter, Öl, Kaffee oder Gewürze sind zunächst abgewählt und lassen sich antippen.
- Passt Mengen an die gewählte Portionszahl an, übernimmt nur ausgewählte Zutaten in die gemeinsame Liste und führt gleiche Produkte mit ihren Mengen zusammen.
- Zeigt passende aktuelle Angebote bei erkannten Zutaten an und verlinkt Rezeptquelle sowie Originalrezept.
- Ergänzt die Standortsuche für Prospekte um eine manuelle Übernahme, falls der Geocoder nicht erreichbar ist.

## 0.1.79

- Ergänzt Standortvorschläge beim Tippen mit Ort, Adresse oder Postleitzahl und speichert die Auswahl erst nach dem Antippen.
- Zeigt passende österreichische Orte und Adressen an; bei Nichterreichbarkeit kann die Eingabe weiterhin manuell übernommen werden.
- Ergänzt den Herkunftshinweis für die OpenStreetMap-basierten Ortsvorschläge.

## 0.1.78

- Aktiviert „Einkauf starten“ nur, wenn Artikel auf der Einkaufsliste stehen; der Bon-Einkauf bleibt auch bei leerer Liste verfügbar.
- Ersetzt den Kamera-Aufruf beim Bon durch eine Live-Vorschau mit Beleg-Rahmen und rundem Auslöser; Datei-Upload bleibt verfügbar.
- Macht Kundenkarten bearbeitbar und erlaubt Code- oder Bildkarten mit optionalem Code und optionaler Notiz.
- Öffnet gespeicherte Kartenbilder bei Antippen groß und schließt die Ansicht bei Klick außerhalb.

## 0.1.77

- Zeigt Prospektseiten standardmäßig etwas kleiner mit sichtbarem Rand; Zoom-out ist bis 70 % möglich, damit ganze Seiten leichter ins Bild passen.

## 0.1.76

- Blendet am Handy die untere Hauptnavigation aus, solange ein Prospekt geöffnet ist, und zeigt den Prospekt bildschirmfüllend an.

## 0.1.75

- Ergänzt eine verstellbare Prospektvergrößerung mit Zwei-Finger-Zoom und Verschieben am Handy sowie Mausrad, Ziehen und Plus/Minus-Steuerung am PC.
- Verhindert, dass beim Verschieben einer vergrößerten Seite versehentlich zur nächsten Prospektseite gewechselt wird.

## 0.1.74

- Ergänzt über den Prospekten eine horizontal durchscrollbare Angebotsleiste mit Händlerfiltern, Produktbildern, Aktionspreisen und verfügbaren Streichpreisen.
- Zeigt die Angebotsquelle und ihren Aktualisierungsstand an; Händler ohne Angebotsdaten bleiben über ihre Prospekte erreichbar.
- Repariert langes Drücken zum Bearbeiten in Favoriten und „Alle Artikel“; Kacheln auf eurer Einkaufsliste bleiben ausschließlich zum Entfernen antippbar.

## 0.1.72

- Synchronisiert externe Änderungen an der Einkaufsliste mit einem laufenden Einkaufsstart; entfernte Artikel verschwinden auch aus Fortschritt und offenen Kategorien.
- Beendet den Einkaufsstart automatisch, wenn die Liste außerhalb des Moduls geleert wird, und setzt den Button wieder auf „Einkauf starten“.
- Ergänzt „Einkauf abbrechen“, das den laufenden Status löscht; Schließen pausiert weiterhin zum späteren Fortsetzen.

## 0.1.71

- Richtet das Einstellungs-Zahnrad am mobilen Dashboard rechts neben der Überschrift aus.

## 0.1.70

- Lädt für jeden Händler im Prospektbereich die echten, einzelnen Bildseiten aus den aktuellen Publikationen; ergänzt auch das dm Journal als blätterbares Prospekt.
- Hält die Prospektseiten am Handy und PC einzeln, horizontal navigierbar und mit stabiler Seitenanzeige.
- Zeigt das Zahnrad auf dem mobilen WG-Dashboard oben rechts an und öffnet damit die App-Einstellungen.

## 0.1.68

- Zeigt das Einstellungs-Zahnrad am Handy zuverlässig nur auf dem Dashboard-Start an, auch über Home-Assistant-Ingress.
- Sendet Einkaufs-Vibrationen an die Home-Assistant-Companion-App und nutzt die Browser-Vibration als Fallback.
- Vereinfacht die Karten- und Bon-Kamera auf einen nativen Kamera-Aufruf plus Upload und gestaltet den Bon-Dialog mobil mit festem Aktionsbereich.

## 0.1.67

- Gelistete Artikel verschwinden aus Favoriten und „Alle Artikel“ und erscheinen nach dem Entfernen oder Abschließen des Einkaufs wieder.

## 0.1.63

- Repariert den Kartenbild-Upload am PC und ergänzt am Handy eine bedienbare Live-Kamera mit nativer Kamera-Auswahl als Fallback.
- Ergänzt den Prospektbereich mit gemerktem Standort, Umkreis, Händlerfavoriten und offiziellen Händlerquellen.
- Ergänzt optionales kurzes Vibrationsfeedback beim Hinzufügen, Entfernen und Abhaken; vereinheitlicht die Kachelhintergründe für gelistete und nicht gelistete Artikel.

## 0.1.61

- Ergänzt optionales, kurzes Vibrationsfeedback beim Hinzufügen, Entfernen und Abhaken in der Einkaufsliste.
- Vereinheitlicht die Kachelhintergründe auf eine Farbe für Produkte auf der Liste und eine für noch nicht hinzugefügte Produkte.

## 0.1.60

- Repariert den Kartenbild-Upload am PC und macht Kameraaufnahme und Bildauswahl am Handy direkt bedienbar; die native Kamera dient als Fallback, wenn kein Live-Feed verfügbar ist.

## 0.1.59

- Stellt den Bearbeitungsstift auch bei Favoriten dar.
- Ergänzt Schuld-Rückzahlungen um 15 €, 25 € und den exakten Restbetrag.
- Setzt für eine Vorlage „Tanken“ ohne Betrag den Richtwert von 55,11 € für 30 l Super 95.
- Zeigt manuelle Buchungen auch dann im Haushaltskonto, wenn ihr Name einer Fixkosten- oder Fixeinnahmen-Vorlage entspricht; Dashboard und Monatsverlauf zeigen dieselben Bewegungen.

## 0.1.58

- Zeigt Liste, Favoriten und Produktkatalog in natürlicher Höhe ohne verschachtelte Scrollflächen; die Einkaufsseite scrollt wieder als eine zusammenhängende Seite.

## 0.1.57

- Begrenzt lange Einkaufslisten, Favoriten und den Produktkatalog auf eigene Scrollbereiche; „Alle Artikel“ erhält mehr Platz und eine besser sichtbare Scrollleiste.

## 0.1.56

- Bietet beim Einkaufsabschluss Bar und Karte persönlich als Schulden sowie Karte Wohnung als vorausgewählte WG-Ausgabe.
- Macht gespeicherte Buchungsvorlagen durch Antippen des Namens bearbeitbar.
- Verhindert am Handy horizontales Seitenwischen und das Zurückfedern der Einkaufsseite.

## 0.1.55

- Synchronisiert den laufenden Einkaufsablauf geräteübergreifend und behält ihn beim Schließen offen; erst der erfolgreiche Abschluss setzt „Einkauf starten“ wieder auf Grün.

## 0.1.54

- Ergänzt Kundenkarten um Kartenfoto per PC-Upload oder Handykamera; Bilder werden geräteübergreifend gespeichert und beim Löschen der Karte entfernt.
- Zeigt ohne Ladenlayout-Sortierung direkt die Artikel in der gewählten Kachel- oder Listenansicht.

## 0.1.53

- Öffnet „Buchen“ bei gespeicherten Buchungen direkt im Buchungsfenster und übernimmt den optional hinterlegten Betrag.

## 0.1.52

- Ordnet Einkaufsschlüsse abhängig von der Zahlungsart dem Haushaltskonto oder dem Schuldenverlauf zu.
- Öffnet aus Einkaufsbuchungen und übernommenen Einkäufen ein lesbares Artikelprotokoll in der eingestellten Kachel- oder Listenansicht.
- Zeigt bei einem laufenden Einkauf „Einkauf fortsetzen“ orange an und prüft fehlende Artikelpreise vor dem Abschluss.
- Zeigt beim Einkauf ohne Ladenlayout-Sortierung direkt die Produktkacheln oder Liste.

## 0.1.51

- Zeigt Artikel-Preisfelder im Einkaufsablauf und in der Bon-Prüfung dauerhaft an, ohne sie automatisch zu fokussieren.
- Ignoriert leere oder 0-Preise bei der Summe.
- Warnt bei teilweise ausgefüllten Artikelpreisen und springt kurz rot markiert zum ersten fehlenden Preis.

## 0.1.50

- Passt Fotoaufnahme und Upload-Aktion optisch an die WG-Cockpit-Buttons an.
- Zeigt beim Einkaufsstart als Käufer nur noch Marcel und Philip.
- Markiert beim Abschließen einer Kategorie alle noch offenen Artikel als erledigt.

## 0.1.49

- Stellt das Videoelement bereits vor Freigabe des Kamerastreams bereit, damit die mobile Live-Vorschau zuverlässig startet.

## 0.1.48

- Öffnet „Per Bon eingeben“ auf dem PC direkt mit der Dateiauswahl.
- Zeigt am Handy einen Live-Kameravorschaubildschirm mit Fotoaufnahme und separatem Foto-Upload.
- Stoppt die Kamera nach der Aufnahme oder beim Schließen des Dialogs.

## 0.1.47

- Ergänzt „Per Bon eingeben“ mit Foto/Upload und lokaler OCR-Erkennung für deutsche Kassenbons.
- Lässt erkannte Artikel, Mengen, Preise, Laden und Datum vor der Buchung prüfen und korrigieren.
- Speichert den Bon getrennt von den synchronisierten Haushaltsdaten und verknüpft ihn mit der Finanzzeile.
- Öffnet bei Klick auf die Einkaufsbuchung Artikelübersicht und Kassenzettel; beim Löschen wird auch der Beleg entfernt.
- Entfernt die globale Preise-Checkbox; Preise erscheinen erst, wenn sie eingegeben oder erkannt wurden.

## 0.1.43

- Erstellt beim Einkaufsabschluss eine löschbare Haushaltskonto-Ausgabe mit Datum, Laden, Käufer, Zahlungsart und Artikeln.
- Übernimmt die Summe erfasster Artikelpreise automatisch als Buchungsbetrag.
- Behält den optionalen Einkaufsablauf bei und zeigt seinen Start als kleine grüne Aktion neben der Suche.
- Ergänzt den gemeinsamen Kachel- und Listenmodus und behebt die abgeschnittene Symbolkategorien-Leiste.
## 0.1.42

- Fügt einen optionalen, standardmäßig deaktivierten Einkaufsablauf mit Laden, Käufer, Fortschritt und Abschluss hinzu.
- Platziert „Einkauf starten“ als kleine grüne Aktion neben Suche und Kundenkarten.
- Ergänzt eine gemeinsame Kachel- oder Listenansicht für Favoriten, Produktkatalog und Einkaufsablauf.
- Hält die Symbolkategorien sichtbar und begrenzt das Scrollen im Symbol-Popup auf die Trefferliste.

## 0.1.41

- Zeigt aktive Prioritäten im Bereich Alle Artikel einmalig als dezente Symbole ohne rote Kachelumrandung.
- Übernimmt Produktprioritäten beim Hinzufügen in die Einkaufsliste.
- Entfernt eine reservierte Leerzeile oberhalb der Einkaufsliste.
## 0.1.40

- Übernimmt gespeicherte Prioritäten beim Hinzufügen eines Katalogprodukts in die Einkaufsliste.

## 0.1.39

- Trennt temporäre Bearbeitung per langem Drücken vom dauerhaften Produktkatalog-Bearbeitungsmodus am Stift.
- Speichert temporäre Änderungen direkt in die aktuelle Einkaufsliste; bestehende Listeneinträge werden aktualisiert.
- Ergänzt ein durchsuchbares Symbol-Popup mit 209 Produktsymbolen, Kategorien, passenden Vorschlägen und Web-Symbolen.

## 0.1.38

- Bringt das Datenquellen-Fenster auf PC und Handy vollständig in den Vordergrund und sperrt die darunterliegende Ansicht bis zum Schließen.
- Vergrößert Schrift, Abstände und Kartenkontrast in der mobilen KI- und Quantum-Übersicht.
- Bewahrt beim Bearbeiten eines Einkaufslisten-Artikels die bereits eingetragene Listenmenge.

# Changelog

## 0.1.37

- Ergänzt die automatische externe Emoji-Suche mit herunterladbaren Symbolbildern und lokalen Vorschlägen als Fallback.
- Speichert Produktbearbeitungen dauerhaft für künftige Einkäufe und aktualisiert vorhandene Listeneinträge; langes Drücken öffnet den Bearbeitungsmodus auch am PC.
- Zeigt die Datenquellen immer im Vordergrund und macht die KI- und Quantum-Kacheln auf dem Handy besser lesbar.
- Fixiert die mobile Einkaufssuche direkt unter der Überschrift und über die volle Bildschirmbreite.

## 0.1.36

- Zeigt die aktuelle Add-on-Version auf der Einstellungsseite.
- Ersetzt den Dashboard-Hinweis zu Fixkosten durch den Verlauf der letzten Schulden und verbreitert beide Verlaufsbereiche.

## 0.1.35

- Zeigt „Nachträglich buchen“ in jeder Monatsansicht dauerhaft an.

## 0.1.34

- Behebt die mobile Start-Navigation unter Home Assistant Ingress: „Start“ öffnet wieder das WG-Dashboard.
- Zeigt den Einstellungszugang dauerhaft in der oberen Leiste.
- Macht das Formular zum Anlegen weiterer WG-Kundenkarten nach der ersten Karte einklappbar.







