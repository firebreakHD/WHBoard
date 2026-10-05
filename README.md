# WG Cockpit – Home Assistant Apps

Dieses Repository enthält zwei unabhängige Home Assistant Apps:

- `wg-cockpit` – Haushaltskonto, Einkauf und Marktanalyse
- `admin-cockpit` – getrenntes System- und Service-Cockpit

## Updates

Im Projektstamm `HA_Addon/build.ps1` ausführen. Das baut beide Apps, erhöht die
Patch-Version und aktualisiert `HA_Build/` sowie den GitHub-Repository-Ordner
`C:\Users\mt\Documents\GitHub\WHBoard`. Anschließend den Stand mit der Git-Software
committen und pushen. In Home Assistant das App-Repository aktualisieren; bei neuer
Version erscheint dann **Aktualisieren**. Das Update wird dort gestartet.

## WG Cockpit konfigurieren

Unter **Einstellungen → Apps → WG Cockpit → Konfiguration** kann das
Synchronisationsintervall zwischen 1 und 10 Sekunden eingestellt werden
(Vorgabe: 2 Sekunden). Der interne Ingress-Port 8099 ist fest für Home Assistant
reserviert und muss nicht geändert werden.

Der Export enthält Quellcode und Build-Konfiguration, aber keine lokalen Daten,
Abhängigkeiten, Build-Caches oder `.env`-Dateien. Haushaltsdaten bleiben im persistenten
`/data`-Speicher des WG Cockpit Add-ons.
