# AGENTS.md — Marketing-Kitchen

## Ziel
Marketing-Kitchen ist eine statische, datengetriebene Empfehlungswebsite. Beiträge werden in `content/posts.json` gespeichert; Bilder liegen unter `assets/uploads/`. Die Website muss ohne Build-Schritt auf GitHub Pages und auf einer Synology Web Station funktionieren.

## Technische Regeln
- Nur HTML, CSS und Vanilla JavaScript im Frontend.
- Keine Frameworks und keine externen Laufzeit-Abhängigkeiten.
- Kein Geheimnis, Token oder Passwort darf im Repository landen.
- Nutzerinhalte immer mit DOM-APIs und `textContent` ausgeben, nicht ungeprüft über `innerHTML`.
- Externe URLs ausschließlich als `http:` oder `https:` akzeptieren.
- Vor Abschluss immer `node scripts/validate-content.mjs` ausführen.
- Änderungen müssen responsiv und tastaturbedienbar bleiben.
- `content/posts.json` muss valides JSON bleiben.

## Datenmodell eines Beitrags
```json
{
  "id": "eindeutiger-slug",
  "title": "Titel",
  "category": "restaurants | kitchen | tech",
  "excerpt": "Kurze persönliche Empfehlung",
  "image": "assets/uploads/datei.jpg oder https://...",
  "imageAlt": "Sachliche Bildbeschreibung",
  "url": "https://...",
  "linkText": "Mehr erfahren",
  "badge": "Optionaler kurzer Hinweis",
  "featured": false,
  "published": true,
  "publishedAt": "ISO-8601-Datum"
}
```

## Designrichtung
Editorial, hochwertig, warm, persönlich und klar. Keine generische Tech-Startup-Optik. Bestehende Farben, Typografie-Hierarchie und großzügige Abstände beibehalten, sofern eine Aufgabe nichts anderes verlangt.
