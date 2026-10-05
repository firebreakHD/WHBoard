# WG Cockpit – Home Assistant Add-ons

Dieser Ordner wird mit `Erstelle-HA-Build.ps1` aus `HA_Addon/` erzeugt.
Die beiden Anwendungen bleiben eigenständige Home Assistant Add-ons:

- `wg-cockpit` – Haushaltskonto, Einkauf und Berichte
- `admin-cockpit` – System- und Serviceübersicht

`repository.yaml` kennzeichnet diesen Ordner als Add-on-Repository. Für das Eintragen
als Custom-Repository im Add-on-Store muss dieser Ordner in einem erreichbaren Git-
Repository liegen; Home Assistant nimmt dort eine Repository-URL entgegen. Bei jedem
Export wird die Patch-Version beider Add-ons erhöht, damit Home Assistant Änderungen
als Update erkennt. Der vorgeschaltete Ingress-Proxy bindet die Next.js-Oberfläche an
den dynamischen HA-Pfad und akzeptiert nur Verbindungen vom Home-Assistant-Proxy.

## Installation

Für GitHub muss der **Inhalt dieses Ordners** (also `repository.yaml`, `wg-cockpit/`
und `admin-cockpit/`) im Stammverzeichnis des Repositorys liegen. Home Assistant
liest Add-on-Repositories ab der Repository-Wurzel, nicht aus einem Unterordner wie
`HA_Build/`.

Nach einem Codewechsel `HA_Addon/build.ps1` im Projektstamm ausführen. Das Skript baut
beide Oberflächen, erhöht die Patch-Versionen, exportiert nach `HA_Build/` und
aktualisiert automatisch die Dateien und Add-on-Ordner im GitHub-Repository-Ordner
`C:\Users\mt\Documents\GitHub\WHBoard` (der `.git`-Ordner bleibt erhalten). Danach
den Stand dort mit der Git-Software committen/pushen.

In Home Assistant unter **Einstellungen → Apps → ⋮ → Repositories** das Repository
aktualisieren. Danach erscheint bei installierten Apps mit neuer Versionsnummer
**Aktualisieren**. Ein Git-Push startet Container nicht ungefragt neu.

Für einen lokalen Test können die beiden Add-on-Ordner direkt nach
`/addons/wg-cockpit` und `/addons/admin-cockpit` kopiert werden; danach den App-Store
aktualisieren und die Apps neu bauen/starten. Zwischen WG Cockpit und Admin Cockpit
gibt es absichtlich keine Portal-Verknüpfung.

Der Export enthält Quellcode und Build-Konfiguration, aber keine lokalen Daten,
Abhängigkeiten, Build-Caches oder `.env`-Dateien.
