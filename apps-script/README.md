# Google Apps Script: E-Mail- und Formular-Publisher

## E-Mail-Prinzip

Verwende eine eigene Gmail- oder Google-Workspace-Adresse, zum Beispiel `marketingkitchen@gmail.com`. Plus-Aliasse benötigen keine zusätzlichen Postfächer:

- `marketingkitchen+restaurant@gmail.com` → Restaurants
- `marketingkitchen+kueche@gmail.com` → Küchen-Hardware
- `marketingkitchen+tech@gmail.com` → Tech-Gadgets

Der **Betreff ist ausschließlich der Beitragstitel**. Der normale Nachrichtentext wird zur Beschreibung. Das größte angehängte Bild wird als Beitragsbild verwendet; die erste Webadresse im Text wird zum Link.

Optionale Steuerzeilen im Nachrichtentext:

```text
Badge: Persönlicher Favorit
Linktext: Bei Amazon ansehen
Bildtext: Global Küchenmesser auf einem Holzbrett
Featured: ja

Das ist wirklich eines der besten Messer, die ich je hatte.
Gibt es auf Amazon unter https://www.amazon.at/messer
```

## Einrichtung

1. Neues Apps-Script-Projekt anlegen.
2. `Code.gs`, `Form.html` und `appsscript.json` aus diesem Ordner übernehmen.
3. Unter **Projekteinstellungen → Script Properties** folgende Werte anlegen:

| Property | Beispiel | Bedeutung |
|---|---|---|
| `GITHUB_OWNER` | `bernhardwitzeling` | GitHub-Benutzer oder Organisation |
| `GITHUB_REPO` | `marketing-kitchen` | Repository-Name |
| `GITHUB_BRANCH` | `main` | Ziel-Branch |
| `GITHUB_TOKEN` | geheim | Fine-grained GitHub Token |
| `MAILBOX_ADDRESS` | `marketingkitchen@gmail.com` | Basisadresse ohne Plus-Alias |
| `ALLOWED_SENDERS` | `meineadresse@example.com` | Kommagetrennte Absender-Whitelist |
| `SEND_CONFIRMATIONS` | `true` | Erfolgs- und Fehlermails senden |

4. Den GitHub Token als **fine-grained personal access token** nur für dieses Repository erstellen und lediglich **Contents: Read and write** erlauben.
5. In Apps Script die Funktion `setupMarketingKitchen()` einmal manuell starten und die Google-Berechtigungen bestätigen.
6. Eine Testmail an den passenden Plus-Alias senden.

## Geschütztes Formular als Alternative

1. In Apps Script **Bereitstellen → Neue Bereitstellung → Web-App** wählen.
2. Ausführen als: **Ich**.
3. Zugriff: möglichst **nur ich** bzw. nur die eigene Google-Workspace-Domain.
4. Die erzeugte Web-App-Adresse am Smartphone als Lesezeichen oder Home-Screen-Link speichern.

Das Formular ist die zuverlässigste Alternative, falls ein Mailprogramm Bilder nur eingebettet überträgt oder Plus-Aliasse in einer konkreten Mailumgebung nicht sauber erhalten bleiben.

## Sicherheit

- Token niemals in `Code.gs`, GitHub oder einer E-Mail speichern.
- `ALLOWED_SENDERS` ist verpflichtend; Nachrichten anderer Absender werden ignoriert.
- Das Webformular nicht öffentlich freigeben.
- Bei Token-Verlust den Token in GitHub sofort widerrufen und neu erstellen.
