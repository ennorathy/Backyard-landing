# Backyard landing — backyard.cx

Static one-page site built from the Cannes 2026 slide deck: same design, same copy, one section per slide.
No framework and no build step: plain HTML, CSS and a small script.

```
index.html          page (fallback numbers are baked into the markup)
assets/styles.css   styles from the deck, adapted to a scrolling page
assets/app.js       section nav + loads /landing.json
assets/favicon.svg
landing.json        example data with the deck's current values (dev placeholder)
```

## Live data: `/landing.json`

On load the page fetches `/landing.json` from the same domain and replaces:

| JSON field          | Where on the page                       | Shown as |
|---------------------|-----------------------------------------|----------|
| `views`             | Traction · Monthly views generated      | `35000000` → **35M+** |
| `subscribers_total` | Traction · Subs across our network      | `9000000` → **9M+** |
| `active_channels`   | Traction · Channels live                | `15` → **15.** |
| `channels[]`        | Network · channel cards (name, language, subscribers, link) | `1220000` → **1.22M subs** |
| `languages[]`       | Network · Languages we publish in       | `has_channel: false` → **Will be soon** |

The numbers arrive already rounded by the worker (views up to 5M, channels up to 5, subscribers total up to 1M).
If the file is missing or broken, the page keeps the values in the markup. Channel links are accepted only for `https://*.youtube.com`.

Schema (same as the worker's monthly snapshot):

```json
{
  "period": "2026-09",
  "generated_at": "2026-10-06T03:00:00Z",
  "views": 35000000,
  "active_channels": 15,
  "subscribers_total": 9000000,
  "channels": [
    {"name": "Horroryard", "url": "https://www.youtube.com/@horror_backyard", "language": "ru", "subscribers": 1600000}
  ],
  "languages": [
    {"code": "en", "name": "English", "has_channel": true},
    {"code": "es", "name": "Español", "has_channel": false}
  ]
}
```

## Run locally

```
python3 -m http.server 8000
```

Open http://localhost:8000 — the local `landing.json` is used.

## Deploy

Copy the files to the web root of backyard.cx on the same server as the admin site.
**Do not overwrite the real `/landing.json`** that the admin site publishes, e.g.:

```
rsync -av --exclude landing.json --exclude .git --exclude README.md ./ server:/var/www/backyard.cx/
```

Serve `/landing.json` with a short cache (e.g. `Cache-Control: no-cache`) so the monthly update shows up right away.
