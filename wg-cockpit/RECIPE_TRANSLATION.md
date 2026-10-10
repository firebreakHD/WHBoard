# Rezeptregeln und Übersetzung

Für Vorschläge gelten dauerhaft: deutsche Anzeige und kein Fisch / keine Meeresfrüchte. Auch Zutaten und Zubereitung werden geprüft. Cooklang-Kurztexte werden erst nach einer Zutatenprüfung vorgeschlagen. Eigene gespeicherte Texte werden nicht automatisch umgeschrieben.

Vorschläge kommen bevorzugt aus drei bereits deutschsprachigen Quellen mit Rezeptfotos: GuteKueche Österreich, GuteKueche Deutschland und LECKER. Die Auswahl mischt die Quellen. Fisch, Meeresfrüchte und fehlende Bilder werden vor der Anzeige ausgeschlossen. TheMealDB und Cooklang ergänzen die Auswahl, soweit eine deutsche Übersetzung und Bilder verfügbar sind. Pro Vorschlagsbereich werden bis zu neun unterschiedliche passende Rezepte angezeigt; bei einem Ausfall bleiben die bisherigen Vorschläge erhalten.

Die Übersetzung läuft im Add-on auf dem Server über MyMemory. Erfolgreiche Übersetzungen werden zwischengespeichert. Bei Fehlern, Zeitüberschreitungen oder ausgeschöpftem Kontingent wird kein englischer Originaltext angezeigt. Betroffene Vorschläge werden ausgelassen; beim Öffnen erscheint eine deutsche Fehlermeldung. Die Zahl der Vorschläge kann dadurch kleiner sein.

Optional kann ein eigener LibreTranslate-Dienst genutzt werden:

- `RECIPE_TRANSLATION_URL`: Basisadresse des Dienstes, z. B. `http://libretranslate:5000/`.
- `RECIPE_TRANSLATION_KEY`: API-Schlüssel, falls die Instanz einen verlangt.

Diese Variablen werden ausschließlich serverseitig gelesen. Ohne Konfiguration bleibt MyMemory aktiv. LibreTranslate erkennt die Quellsprache automatisch: https://docs.libretranslate.com/guides/api_usage/ . MyMemory: https://mymemory.translated.net/doc/spec.php .

Die Prüfung berücksichtigt bekannte deutsche, englische und weitere verbreitete Namen für Fisch, Meeresfrüchte und entsprechende Würzsaucen. Sie ist eine Haushaltsfilterregel und keine Allergenprüfung.
