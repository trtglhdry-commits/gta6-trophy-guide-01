# Leonida Trophy Guide — GTA VI (PS5)

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/trtglhdry-commits/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/trtglhdry-commits/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all **55 Grand Theft Auto VI trophies** on PlayStation 5 (1 platinum, 2 gold, 6 silver, 46 bronze — 28 of them hidden until earned), built for the [make.fun GTA 6 trophy guide bounty](https://make.fun/bounty/gta6-trophy-guide-01).

## What it is

- **Every trophy with its official name, description and grade** exactly as PlayStation publishes them (Exophase / PSNProfiles list), plus a guide in our own words that cites its sources — what to do, where and how, and when it can be missed.
- **A tracker:** tick trophies off and your progress is saved in the browser (localStorage); export it to a file and import it back.
- **Filters** by kind — Story (17), Missable (1), Collectibles (4), Activities (34), Online (0: the whole list is single-player and offline) — plus grade filter and search.
- **Spoiler setting:** with “Hide story spoilers” on, story trophies you have not earned yet show no name or description until you earn or reveal them.
- **Platinum roadmap** in three stages (story ~60–80h, 100% checklist ~100h, cleanup ~10h), built from the official descriptions and PowerPyx's roadmap, with the one possibly-missable trophy flagged: Positive Mental Attitude and its Chapter 1 balcony meditation.
- **Honest about the unknown:** five trophies have no confirmed method as of 19 November 2026 (In The Beginning…, Bad Luck, I Guess, The Truth Is Out There, Ten Pin, and one detail of Fair Game) — the guide says so instead of inventing one.

## How to run it

No build step. Serve `app/` with any static server and open it in desktop Chrome — it works with the network off:

```sh
node serve.ts   # serves app/ at http://localhost:8080
```

Or open `app/index.html` from any static file server with `app/` at its root. Every file the app loads is under `app/`; it makes no network request at run time.

## Layout

- `app/index.html` — the page shell: progress card, views, toolbar, checklist panes.
- `app/app.js` — loads the trophy data, renders the checklist, detail panel and roadmap, and keeps progress, spoilers and filters in localStorage.
- `app/style.css` — the look: a Vice City sunset in CSS only (deep violet, hot pink, gold). No images, no external fonts.
- `app/data/trophies.json` — the 55 trophies: official name, description and grade, hidden flag, kind, missable flag, target, roadmap stage, chapter, plus each guide in our own words with its sources.
- `main.ts` — the entry program: copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored make.fun library.
- `screenshots/` — four real renders of the guide in a browser (see `shots.json`).

## Sources

The guides draw on PowerPyx's GTA 6 Trophy Guide & Roadmap, Push Square's trophy guide, PlanetGTA6's trophy list (official names/descriptions cross-checked with Exophase, PSNProfiles and TrueAchievements), Output Lag, GTA Zone, KeenGamer, Leonida Intel and EGamers. Each trophy's guide names its sources beside it; the full list is in the app under “Sources & method”. No guide text is copied from any of them.

An unofficial fan guide. No Rockstar Games logo, artwork or game imagery is used.
