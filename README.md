# Ethan Roach: website

This is a plain static site with no build step. Every page is a normal HTML file, so it can be hosted for free anywhere (GitHub Pages, Netlify, Cloudflare Pages, Vercel).

## Preview on your Mac

```
cd ~/ethanroach-site
python3 -m http.server 8765
```

Then open http://127.0.0.1:8765. Opening the files by double-clicking won't work, because the Sunrise Log needs a server.

## Daily: add a Sunrise Log entry

Open `data/log.json` and add one entry inside the `[ ]`. Newest or oldest first both work, since the site sorts them.

```json
[
  {
    "day": 1,
    "date": "2026-11-26",
    "sunrise": "7:22 AM",
    "outside": "6:42 AM",
    "note": "One honest line about this morning.",
    "photo": "/assets/log/day-1.jpg",
    "alt": "Orange sky over the field"
  }
]
```

- Put a comma between entries.
- `photo` and `alt` are optional. Put photos in `assets/log/`.
- `link` is optional: the full https link to that day's X post (shows "See it on X ↗").
- The home page strip, the streak counts and the EXP-003 progress bar all update from this file.
- Each entry gets its own link, `/log/#day-N`, that you can share on X.

## Start EXP-003

At the top of `assets/site.js`, set `EXP003_START` to the first day, for example `"2026-11-26"`. The 30 blocks fill in from your log entries.

## Turn on the forms

The signup, "Walk with me" and Grove waitlist forms need a free form service. Here's how with Formspree (free tier):

1. Make an account at formspree.io and create ONE form (e.g. "Website").
2. Paste its URL into `FORM_URL` at the top of `assets/site.js`. All three forms send to it; each email says which list it came from (sunrise-reset, walk-with-me, grove-waitlist). To split them later, fill `FORM_ENDPOINTS` (`reset`, `walk`, `grove`).

Until then, the forms honestly say "Signups open soon."

## Photos

Each photo spot has a comment in the HTML showing exactly what to paste:

- home hero: `index.html`
- the story section: `index.html`
- portrait: `about/index.html`
- rhythm media: `rhythms/*/index.html`

## Domain

The canonical/share links use `https://0xroachyeth.github.io`. When you get a custom domain, add it in the repo Settings → Pages and find-and-replace that address in all `.html` files.

## Text to fill in

Search the HTML for `placeholder` or `[`. Those spots show in gold on the page until you replace them.

## The 7-Day Sunrise Reset

The Reset lives at `/reset/` (all 7 days on one page, anchors `#day-1`…`#day-7`). Signing up on the home page sends the email to Formspree and then opens `/reset/#day-1`. Edit the days directly in `reset/index.html`. When you change `assets/style.css` or `assets/site.js`, bump the `?v=` number in the HTML links so browsers load the new file.
