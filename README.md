# Backyard landing — backyard.cx

Static one-page site built from the Cannes 2026 slide deck: same design, same copy, one section per slide.
No framework and no build step: plain HTML, CSS and a small script.

```
index.html          page (fallback numbers are baked into the markup)
assets/styles.css   styles from the deck, adapted to a scrolling page
assets/app.js       section nav + loads /landing.json
assets/favicon.svg
assets/partners/   partner logos (from the previous backyard.cx site)
landing.json        example data with the deck's current values (dev placeholder)
```

## Live data: `/landing.json`

On load the page fetches `/landing.json` from the same domain and replaces:

| JSON field          | Where on the page                       | Shown as |
|---------------------|-----------------------------------------|----------|
| `titles`            | Traction · Titles entrusted to us       | `2000` → **2K+**, `2500` → **2.5K+** |
| `views`             | Traction · Monthly views generated      | `35000000` → **35M+** |
| `subscribers_total` | Traction · Subs across our network      | `9000000` → **9M+** |
| `active_channels`   | Traction · Channels live                | `15` → **15.** |
| `channels[]`        | Network · first 9 channel cards in the order sent (worker ranks by last month's views): name, avatar, language, subscribers, link; the 10th cell is "And others" | `1220000` → **1.22M subs** |

The numbers arrive already rounded by the worker (titles up to 500, views up to 5M, channels up to 5, subscribers total up to 1M).
If the file is missing or broken, the page keeps the values in the markup. Channel links are accepted only for `https://*.youtube.com`, avatars only from YouTube's image hosts (`ggpht.com`, `ytimg.com`, `googleusercontent.com`); without an avatar the card shows the channel's initial.

Schema (same as the worker's monthly snapshot):

```json
{
  "period": "2026-09",
  "generated_at": "2026-10-06T03:00:00Z",
  "titles": 2000,
  "views": 35000000,
  "active_channels": 15,
  "subscribers_total": 9000000,
  "channels": [
    {"name": "Horroryard", "url": "https://www.youtube.com/@horror_backyard", "language": "ru", "subscribers": 1600000, "avatar_url": "https://yt3.ggpht.com/..."}
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

## Deploy (server with the dashyard docker stack)

The landing is served by the `nginx` container from `/home/landing` on the host
(mounted read-only as `/var/www/landing`, see `docker-compose.prod.yml` in dashyard).

One-time setup:

```
git clone https://github.com/Ennorath/Backyard-landing.git /home/backyard-landing
sudo cp -a /home/landing /home/landing.php-backup        # keep the old PHP landing
sudo rsync -a --delete --exclude .git --exclude README.md --exclude landing.json \
  /home/backyard-landing/ /home/landing/
```

`.git` must never land in `/home/landing`: nginx would serve it publicly.

nginx in dashyard (`docker/nginx.conf.template`, `backyard.cx` server block) must serve
`index.html` at `/` instead of the old PHP page, and expose `/landing.json` from the admin site:

```
location = / { try_files /index.html =404; }
```

After changing the template: `docker compose -f docker-compose.prod.yml restart nginx`.

Updating the landing later (no container restart needed, files are read live):

```
git -C /home/backyard-landing pull
sudo rsync -a --delete --exclude .git --exclude README.md --exclude landing.json \
  /home/backyard-landing/ /home/landing/
```

`/assets/` is cached for 30 days, so bump `?v=` on the CSS/JS links in `index.html` when they change.

## Cursor fluid trail

`assets/fluid.js` is an adapted copy of [WebGL-Fluid-Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation) (MIT, © Pavel Dobryakov):
GUI, promo and analytics removed, transparent canvas.
The motion uses the same settings and logic as genpeach.ai's cursor: dye and velocity are added only on frames where the cursor
moved (velocity = 5 × pixels moved, 8 on touch), dye fades by 3% and velocity by 2% per frame
(`DENSITY_DISSIPATION` 1.86, `VELOCITY_DISSIPATION` 1.22), `SPLAT_RADIUS` 0.2, bloom on, canvas in CSS pixels.
So the orb starts tiny, grows into a white-hot core only while the cursor keeps moving (a still cursor adds nothing)
and fades once it stops; a fast cursor leaves a swirling trail.
The simulation runs in genpeach's peach (`SPLAT_COLOR` × `SPLAT_AMOUNT` 0.15); the last lines of the display shader swap that
peach for the site's red (`#ff2d2d`) and keep the white.
As on genpeach.ai, the canvas sits behind the content (`.deck` is above it), so text and buttons stay on top of the orb;
grid cells are transparent with lines drawn by `box-shadow`, so the orb also shows through the tables. It never takes clicks.
On phones the orb follows the finger while it touches the screen (no shading there, like genpeach).
It is skipped without WebGL and with `prefers-reduced-motion`.
Tune it in the `config` object at the top of `fluid.js` (e.g. `DENSITY_DISSIPATION` for how fast the trail fades).
