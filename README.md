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

Kopiere beide Add-on-Ordner direkt in die Home-Assistant-Freigabe `addons`
(beispielsweise nach `/addons/wg-cockpit` und `/addons/admin-cockpit`).
Aktualisiere danach in Home Assistant den App-Store, installiere beide Add-ons
und starte sie. Home Assistant baut die Images jeweils aus dem enthaltenen Dockerfile.

Die Verknüpfung zwischen den Portalen stellst du in den Optionen der Add-ons ein:
Im WG Cockpit die URL des Admin Cockpit und im Admin Cockpit die URL des WG Cockpit.

Der Export enthält Quellcode und Build-Konfiguration, aber keine lokalen Daten,
Abhängigkeiten, Build-Caches oder `.env`-Dateien.
