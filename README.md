# Marketing-Kitchen

Eine statische, datengetriebene Empfehlungswebsite für Restaurants, Küchen-Hardware und Tech-Gadgets. Beiträge werden aus `content/posts.json` geladen und können per E-Mail oder über ein geschütztes Smartphone-Formular veröffentlicht werden.

## Was gegenüber der ursprünglichen Datei geändert wurde

- Inhalte sind nicht mehr fest in `index.html` eingebaut.
- Design, JavaScript und Daten sind sauber getrennt.
- Kategorien, Suche, responsive Karten und hervorgehobene Beiträge werden dynamisch erzeugt.
- Neue Beiträge samt Bild können automatisch aus Gmail in das GitHub-Repository geschrieben werden.
- GitHub Actions prüft die Inhaltsdatei und veröffentlicht die Seite auf GitHub Pages.
- Ein geschütztes Webformular ist als Alternative zur E-Mail enthalten.

## Projektstruktur

```text
marketing-kitchen/
├── .github/workflows/pages.yml    # Prüfung und GitHub-Pages-Deployment
├── apps-script/                    # Gmail-Importer und Formular
├── assets/css/styles.css           # Design
├── assets/js/app.js                # Laden, Filtern und Darstellen
├── assets/uploads/                 # Beitragsbilder
├── content/posts.json              # Kategorien und Beiträge
├── scripts/validate-content.mjs    # JSON-Prüfung
├── AGENTS.md                       # dauerhafte Regeln für Codex
├── CODEX_PROMPT.md                 # erster Auftrag für Codex
└── index.html
```

## Lokal ansehen

Die Website muss über HTTP geöffnet werden, weil Browser lokale `fetch()`-Aufrufe blockieren können.

```bash
python -m http.server 8080
```

Danach im Browser `http://localhost:8080` öffnen.

Inhaltsdatei prüfen:

```bash
node scripts/validate-content.mjs
```

## GitHub einrichten

### Neues Repository über die GitHub-Website

1. Auf GitHub ein neues Repository `marketing-kitchen` erstellen.
2. Den Inhalt dieses Projektordners in das Repository übertragen.
3. Unter **Settings → Pages → Build and deployment** als Quelle **GitHub Actions** auswählen.
4. Nach einem Push auf `main` prüft und veröffentlicht `.github/workflows/pages.yml` die Website.

### Über Git auf der Kommandozeile

```bash
git init
git add .
git commit -m "Initial Marketing-Kitchen website"
git branch -M main
git remote add origin https://github.com/DEIN-BENUTZER/marketing-kitchen.git
git push -u origin main
```

## Codex mit dem Repository verwenden

1. In Codex GitHub verbinden und den Zugriff auf das Repository `marketing-kitchen` erlauben.
2. Das Repository als Arbeitsumgebung auswählen.
3. Den Inhalt von `CODEX_PROMPT.md` als ersten Auftrag verwenden.
4. Codex Änderungen als Branch beziehungsweise Pull Request erstellen lassen.
5. Vor dem Zusammenführen die Vorschau und den Action-Lauf kontrollieren.

`AGENTS.md` gibt Codex dauerhafte Projektregeln, insbesondere zur Datensicherheit, Barrierefreiheit und JSON-Prüfung.

## Beiträge per E-Mail veröffentlichen

Die detaillierte Einrichtung steht in [`apps-script/README.md`](apps-script/README.md).

Empfohlenes Schema mit Gmail-Plus-Aliassen:

| Empfänger | Kategorie |
|---|---|
| `deinpostfach+restaurant@gmail.com` | Restaurants |
| `deinpostfach+kueche@gmail.com` | Küchen-Hardware |
| `deinpostfach+tech@gmail.com` | Tech-Gadgets |

Beispiel:

```text
An: deinpostfach+kueche@gmail.com
Betreff: Küchenmesser von Global

Das ist wirklich eines der besten Messer, die ich je hatte.
Gibt es auf Amazon unter https://www.amazon.at/messer

Anhang: messer.jpg
```

Das Script legt das Bild unter `assets/uploads/` ab, ergänzt `content/posts.json` und erzeugt dadurch automatisch einen neuen GitHub-Commit. Danach läuft das Pages-Deployment.

## Alternative: Smartphone-Formular

Das Apps-Script-Projekt enthält `Form.html`. Als nur für das eigene Google-Konto zugängliche Web-App bereitgestellt, lässt sich darüber ein Beitrag mit Bild, Kategorie, Text und Link veröffentlichen. Diese Variante ist meist noch verlässlicher als E-Mail und benötigt auf dem Smartphone keine GitHub-App.

## Synology NAS statt GitHub Pages

Die Seite bleibt vollständig statisch und kann weiterhin über Synology Web Station betrieben werden. Dafür den Repository-Inhalt in den Web-Ordner der NAS kopieren oder dort das Repository auschecken. Der E-Mail-Importer schreibt weiterhin zu GitHub; die NAS muss anschließend neue Commits abrufen. Das kann manuell oder über eine geplante Synology-Aufgabe mit `git pull --ff-only` erfolgen.

Für den einfachsten Betrieb ist GitHub Pages vorzuziehen: Jeder neue E-Mail-Beitrag wird nach dem Commit automatisch veröffentlicht, ohne dass die NAS synchronisiert werden muss.

## Rechtliche Hinweise

Bei Affiliate-Links oder bezahlten Empfehlungen sollte die Kennzeichnung transparent im Beitrag und gegebenenfalls zusätzlich im Impressum erfolgen. Für eine öffentlich erreichbare österreichische Website sind außerdem ein passendes Impressum und eine Datenschutzerklärung einzuplanen.
