# STRATO Newsdesk

Public reader terminal for crypto, stocks, commodities and geopolitical news, with an independent private Telegram/editorial pipeline.

This `newsdesk` branch contains the complete Newsdesk project at the repository root. The repository's `main` branch is a separate Odds project. Clone this branch explicitly:

```sh
git clone --branch newsdesk --single-branch https://github.com/ShibaColin/strato-odds-social-redesign.git strato-newsdesk
cd strato-newsdesk
npm ci
cp .dev.vars.example .dev.vars
npx wrangler d1 execute site-creator-d1 --local --config wrangler.local.jsonc --file drizzle/0000_good_lester.sql
npm run dev -- --host 127.0.0.1 --port 5173
```

Use Node.js 22.13 or newer. Open http://127.0.0.1:5173. A fresh clone has no production database, history or credentials. The UI can load official TradingView charts/calendar immediately; the shared news feed and native crypto/metals snapshots require your own initialized D1 and collectors below.

## What is included

- Responsive read-only news terminal and bookmarks, topic filters, light/dark themes.
- Official embedded TradingView tools and worldwide economic calendar, Actual/Forecast/Previous releases.
- Native crypto screener with search/sort, official provider logos and in-desk chart navigation.
- Bitcoin halving, US debt, tokenized gold/silver supply and separate historical USD benchmark.
- STRATO native asset/network metrics and relevant active prediction-market matching.
- News ingestion, deduplication, private English editorial rewrites, Telegram media and separate market replies.
- Python collectors, systemd service/timer examples, SQLite/D1 schema, and required original media with provenance.

## Local database and private collectors

The quickstart applies the checked-in schema to local D1 using `wrangler.local.jsonc`; its database name matches the Vite local binding. For a real deployment, create a new D1 database and apply that SQL before starting the updater. `db/schema.ts` is the source schema.

Generate a separate 32-byte hexadecimal server key. Put its SHA256 hex digest in `METALS_INGEST_SHA256` in `.dev.vars` (or your deployment's secret storage). Send the original key only in `X-Newsdesk-Metals-Key` to private endpoints. Never send this key to the browser.

A fresh authenticated ingest can be started with `POST /api/jobs/bootstrap` and the key header. With `EDITORIAL_PIPELINE=local`, use the editorial worker to prepare text/media. For text-only source processing, leave that variable unset. Telegram remains disabled until you provide your own bot token and recipient. Do not reuse the author's live server, bot, Site identity or credentials.

## Build and deploy your own instance

```sh
npx tsc --noEmit
npm run build
```

The application is a Vinext/React Cloudflare Worker, not a static-only export. The Worker entry is `worker/index.ts`; `vite.config.ts` sets local D1 emulation. Production needs a D1 binding named `DB`, its own Worker deployment/configuration, and configured runtime secrets. `dist/server` contains the generated build. Public GET routes serve the reader; job, post, settings, writing and MCP operations require the private key independently of site visibility.

`.openai/hosting.json` deliberately has no original Site project ID. If deploying through Sites, register your own Site and use its returned identity. If deploying directly to Cloudflare, supply your own Wrangler account/database configuration. Local preview does not require the author's Sites account.

## Optional always-on server

`ops/` contains all four collectors (news refresh, editorial/media, crypto, metals) and their hardened systemd units. Install under `/opt/strato-newsdesk`, set `NEWSDESK_ORIGIN` in `/etc/strato-newsdesk/newsdesk.env`, and store credentials in root-only files loaded with systemd `LoadCredential`. Use your own host and SSH identity. The `sites-service-token` credential is needed only for Sites dispatch; direct hosting can leave that file empty while still requiring the independent private key.

The editorial worker needs Python 3, Pillow (`pip install -r ops/requirements.txt`), and Ollama with `qwen3:8b` on localhost:11434. Other collectors use the Python standard library. News refresh runs each minute, crypto attempts each minute and metals refreshes every five minutes. Public provider rate limits may delay updates; timestamps and stale states remain explicit. The app never invents historical ounce supply or sends posts directly to X.

See [server details](ops/SERVER.md), [market research](MARKET-RESEARCH.md), and [implementation history](docs/IMPLEMENTATION-HISTORY.md). Historical notes describe the original hosted deployment; configuration in this branch is intentionally reusable.

## Assets and rights

Official STRATO logos/tokens preserve supplied artwork and proportions. Photo/logo provenance is retained in `ops/media-assets/*registry.json` and `public/metals/SOURCES.json`. Third-party trademarks and media retain their existing rights; a public source branch does not relicense those assets. Review those records when redistributing or replacing media.

No production secrets, live database records, SSH keys, local caches, dependencies or build outputs are included.
