# Start-Prompt für Codex

Arbeite im verbundenen GitHub-Repository `marketing-kitchen`.

Lies zuerst `AGENTS.md`, `README.md` und die bestehende Ordnerstruktur. Prüfe danach die Website lokal mit einem einfachen HTTP-Server und führe `node scripts/validate-content.mjs` aus.

Ziel des Projekts:
1. Die Marke **Marketing-Kitchen** bleibt unverändert.
2. Die Website ist eine persönliche, hochwertige Empfehlungsplattform für Restaurants, Küchen-Hardware und Tech-Gadgets.
3. Beiträge werden nicht mehr direkt im HTML gepflegt, sondern aus `content/posts.json` geladen.
4. Neue Beiträge sollen über den Google-Apps-Script-Importer in `apps-script/` per E-Mail oder über das geschützte Formular veröffentlicht werden.
5. Die Website muss ohne Build-Prozess auf GitHub Pages und alternativ auf einer Synology Web Station laufen.

Arbeitsregeln:
- Keine Geheimnisse oder Tokens einchecken.
- Keine neuen Frameworks oder unnötigen Abhängigkeiten einführen.
- Sicherheit, Barrierefreiheit, mobile Darstellung und Ladezeit berücksichtigen.
- Bestehende Funktionen nicht entfernen, ohne einen gleichwertigen Ersatz zu liefern.
- Nach jeder Änderung die JSON-Validierung ausführen.
- Änderungen als überschaubaren Pull Request mit kurzer Testbeschreibung bereitstellen.

Erste Aufgabe:
Analysiere das gesamte Repository auf Fehler, unklare Setup-Schritte und Sicherheitsrisiken. Verbessere nur Punkte, die konkret nachvollziehbar sind. Aktualisiere bei Bedarf die Dokumentation und liefere einen Pull Request.
