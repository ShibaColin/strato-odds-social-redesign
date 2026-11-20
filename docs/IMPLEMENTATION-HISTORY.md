# STRATO Newsdesk

Owner-private English market-news desk, with a minute timer on the existing team Ubuntu server and private Telegram notifications through @STRATOnews_bot. Updated 5 November 2026.

One screen: categories, source-backed drafts, inline editing, source links and Copy post. News, edited drafts, prediction-market cadence and delivery history are centrally stored in Sites D1. The browser keeps a local backup of edits. Nothing is published automatically on X.

## Always-on updates

`ops/strato-newsdesk-refresh.timer` calls the private cloud collector every calendar minute, independent of the user's Mac, browser and phone. The server runs only the small standard-library Python updater in `ops/newsdesk_refresh.py`; Telegram credentials stay in Sites secrets. `ops/SERVER.md` contains deployment and maintenance instructions without credentials. BOOE is a separate service and is not modified.

The initial 74 articles were saved without alerts. Only new eligible articles produce Telegram posts. Source publication timing still limits RSS freshness. Collector leases, unique event keys and persistent delivery claims prevent routine duplication. Rate limits retry later; an ambiguous network send remains for review. Each run sends at most eight queued posts. A three-minute stale heartbeat is displayed as background inactive.

## Copy and prediction markets

The default is a source-based English post: concrete news first, useful excerpt details in separate paragraphs, and an occasional grounded closing line. JUST IN and BREAKING NEWS apply only to appropriate recent items. No decorative dashes, forced filler, invented price reactions or reused example facts. Existing user edits are preserved.

At most one prediction-markets reference per eight new posts, only when relevant. Settings offers Never, 5, 8, 10 or 20. The only promotional destination is https://stratoodds.com/. No token, lending, savings or general STRATO promotion.

AI rewriting is a separate, currently unconfigured integration. Configuring OPENAI_API_KEY and OPENAI_MODEL through Sites runtime secrets enables the writing queue; live AI writing must be verified after connection. Current unattended drafts use source headlines and excerpts.

## Development and verification

`npm run dev -- --host 127.0.0.1 --port 5173` starts local preview. TypeScript and production builds pass. SQLite-backed fixture tests cover initial baseline, new delivery, deduplication, promo cadence, rate-limit retry, uncertain-send suppression, shared reads, overlap leases, startup-confirmation guards and stale heartbeat behavior. Production verification also requires real scheduled server runs and a Telegram confirmation. No social-media posts are published by these tests.

Production secrets, temporary enrollment files, server credentials, dependencies and caches are excluded from the source ZIP. The temporary local Telegram enrollment secret was deleted after its cloud test.

## Market updates

BTC/ETH snapshots run at 08:00 and 20:00 Europe/Brussels with a 15-minute grace period. Coinbase USD spot quotes are validated and attributed. Measured sharp moves use 1h BTC 3% / ETH 4% bands and 24h 5% bands, a one-hour cooldown and persistent state. Independent market-cap and liquidation providers are not connected. See MARKET-RESEARCH.md for sources, limits and checks.

## Free reported market news and phone alerts

Public RSS from The Block, CryptoSlate and Watcher.Guru adds attributed liquidation and market-value reports without an extra API subscription. These are publisher-reported amounts, not an independent market-wide dataset. Feed publication timing determines delay. Telegram sends explicitly non-silent messages; Settings > Telegram > Test notification provides a repeatable one-minute rate-limited test. Phone notification permissions, muted chats, Focus and Scheduled Summary remain user device settings.

## Breaking coverage

Watcher.Guru Live polls its public Telegram preview every minute, separately from the publisher RSS. Original public timestamps/URLs and explicit attribution are retained. Public previews can be delayed, unavailable or incomplete; this is not a full X stream. Regulation/approval/banking news now passes the three extra market publisher filters. Initial catch-up is capped at three high-priority posts from the preceding 30 minutes.

## Editorial and image pipeline (17 November)

Posts are rewritten by Qwen3:8b locally on the existing server, through a separate systemd editorial timer. No paid writing API is configured. New deliveries wait for factual/originality validation and media preparation. Numeric additions, lost uncertainty, common new actors and copied twelve-word sequences are rejected. Rejected drafts retry; raw source copies are not silently sent. Human edits remain protected. Data-driven price summaries keep their deterministic factual copy.

The desk follows live Odds /api/v1/markets and /api/v1/events. Only OPEN status1, non-halted, non-hidden, unexpired markets qualify. Specific topic/entity matches select canonical /markets/address links. Links are checked again at copy time and delivery; no generic promotion cadence remains. If the API is unavailable or no active match exists, no link is inserted.

Images are rendered on the server from genuine assets and actual Coinbase/STRATO oracle data when available. File photographs retain provenance and licensing in metadata only. No synthetic charts or fake portraits. Media is downloadable from the private desk and attached to Telegram where caption limits allow. Images expire after three days; storage is capped at300 images. Sources remain in metadata/source buttons and are excluded from copied post text.

Extra feeds: CoinDesk canonical RSS without trailing slash, SEC legacy press RSS, ECB press RSS, Bank of England news RSS and EIA press RSS. Feed cadence honours known TTLs and Retry-After. These do not provide a full Reuters or full X timeline.

## Clean editorial media revision

Latest user instruction: images are purely visual. No publisher/source/license bars, duplicate names, archival captions or decorative labels on photos or paired images. Actual chart axes, ticker, price and timeframe remain intrinsic chart information. The renderer uses full-bleed photos, genuine official logo assets, high-resolution JPEG for photographic output and lossless PNG for charts. It preserves provenance in metadata. Attribution-free portrait/photographic replacements are bundled locally where verified; unsupported credit-dependent assets are omitted. Existing recent media refreshes independently of post text and delivery, including human-edited posts.

## Separate market replies and relevant image variation

News copy contains no market link. A matched active market appears as a separate copyable reply with the actual question, strike and UTC deadline where applicable, followed by its canonical URL. Copy time rechecks availability. Telegram sends this as a silent separate reply attached to the news message. A persisted reply outbox isolates retries from news delivery; ambiguous sends are held rather than duplicated. No matching active market means no reply.

Portrait and cash alternatives rotate by subject, avoid consecutive repeats and remain stable for the same story. Genuine identity photos are illustrative, not purported photographs of a reported event. Semiconductor imagery is generic circuitry, never labelled as a specific GPU. All provenance stays in metadata; photos and pairs have no captions, names or credit bars.

## Reader terminal — 18 November

The website is now a read-only financial terminal, distinct from Telegram's X-post workflow. Views include News Terminal, Market Overview, Economic Calendar, Official Releases, Gold & Silver, STRATO Live, bookmarks and source health. Search, topic/importance filters, Top ordering, pause/resume, compact/image preferences, light/dark modes, responsive navigation and story/chart readers are supported. Refresh only reads the shared feed; it never triggers delivery or rewrites from a visitor session. Existing publishing/worker endpoints retain the owner-private Sites boundary; audience was not expanded.

/api/terminal fetches actual Coinbase BTC/ETH quotes and historical closes, STRATO oracle GOLDST/SILVST USD-per-troy-ounce observations, canonical protocol TVL, staking values and validators. History and metrics use independent validation/failure handling, source timestamps, bounded calls and isolate caches. Staked value is separate from protocol TVL, and prices never imply audited reserves. /api/calendar reads official BEA/BLS ICS schedules independently; BEA is available, BLS currently returns403. No forecasts or fake releases are inserted.

Media v4 bundles55 curated identities/assets. Genuine crypto/company/bank/country/regulator/metals images cover more suitable stories without live thumbnail dependency. Context-bound charts use genuine Coinbase candles for8 cryptoassets and genuine STRATO oracle observations where available; older crypto news can use its actual publication-time window (up to24h), with the actual data date/time visible. Charts are rendered from real source data, not claimed TradingView screenshots. Ambiguous/unavailable data falls back to a relevant genuine identity or text. Recent image-only enrichment refreshes do not rewrite or resend existing stories.

Verification: TypeScript, production build, SQLite delivery/dedup/reply regressions, genuine-source histories/unit/freshness checks, official calendar DST/partial failure fixtures,25 representative media cases and live Coinbase chart retrieval. Browser QA covered desktop and390px mobile, search, gold/silver reader, actual metrics, calendar, bookmarks, theme and pause/resume. Preview uses an actual private-feed snapshot, not fabricated stories or metrics.

## Minimal terminal, TradingView and supply trackers — 18 November

The reader homepage is reduced to a compact feed and an optional worldwide TradingView calendar. There is no price ticker, market-pulse rail, network-stat rail or prominent ecosystem promotion. Images default to story readers; filter/display preferences sit in small popovers. Navigation collapses, and ecosystem destinations share one secondary menu. STRATO metrics and native issued-supply/price/market-value data remain in a separate section, using actual supplied asset logos.

TradingView has a dedicated workspace with19 free official tools selected one at a time: interactive charting, screeners, heatmaps, market tables, forex, symbol research, calendar and news. Official widget branding and exchange-specific data-delay notices are preserved. Current calendar/crypto screener use supported Web Components; remaining embeds use isolated official widgets. Coinbase's public live ticker also drives the halving price display, with a timestamped REST fallback.

/api/macro independently reads Treasury Debt-to-the-Penny and Monthly Treasury Statement records, plus actual Bitcoin blocks. US debt history extends to1993; reported debt/spending and modeled intraday estimates remain explicit separate modes. Bitcoin's next halving uses chain height, subsidy rules and a measured50,000-block interval, not a hard-coded calendar date.

/api/metals tracks verified circulating physical-bullion issuer tokens plus native GOLDST/SILVST issued supply. Troy-ounce conversion is explicit; wrappers, synthetic/miner/ETF exposure and unverified ounce ratios are excluded. Totals and STRATO shares refer to the listed tracked coverage, not an exhaustive world audit. Recent/stale/missing issuer coverage is disclosed. D1 caches provider snapshots5min and persists actual supply observations for30days. It never backfills invented history, and restarts visible series if issuer coverage changes. The existing minute tick schedules this refresh with waitUntil independently of news delivery, so history grows unattended. Initial supply graphs start collecting at activation.

Validation includes real TradingView chart/volume/live-update and global-calendar rendering; Treasury reconciliation/units/history, explicit projection, Bitcoin halving-boundary/freshness tests, native mixed-unit parsing and logos, metals wrapper/staleness/conversion/partial-coverage/cache/history tests, plus existing Telegram delivery/reply regression checks. Current owner-private sharing remains unchanged.

### Production source adapter and widget recovery

Production checks found CoinGecko unavailable from the Worker network while the existing Ubuntu server can read it successfully. A separate5min metals collector now reads the fixed13issuer query and stages original provider rows through /api/jobs/metals. That write route requires both the unchanged owner-private Site boundary and its own32-byte scoped collector key, verified against a secret SHA256 digest before reading or writing payload data. The plaintext key lives only in a root-readable server file mounted into the hardened collector service with LoadCredential; it is never bundled. Payload size, observation age, canonical issuer IDs and fresh unique XAUT/PAXG/KAG baselines are validated before database writes. Native STRATO data remains a direct official API read. Staged rows retain source timestamps. Failed snapshots have shorter cache lifetimes and cannot overwrite newer collector samples.

TradingView Web Components now wait for real provider-ready events and handle provider-error events; retry/reload and a direct tool link remain available. The crypto screener rendered151assets in Chrome but produced a provider error in IAB; the fallback was verified there. Charts, crypto heatmap and global calendar rendered real data in IAB. No claim is made that all third-party tools work in every embedded browser.


## Fast embedded markets and longer metal history — 18 November

The crypto screener is now a native same-origin table, replacing the provider component that failed in IAB. It searches and sorts actual CoinGecko top-100 market data, displays official provider-supplied asset logos and opens selected asset charts inside the desk. An authenticated Ubuntu collector refreshes staged data every minute; the Worker serves validated cached snapshots without an external request on page load. Source timestamps, stale states and retries remain explicit. Mobile uses a contained horizontal table rather than an external destination.

The global economic calendar now uses the lightweight official iframe with no country or importance restriction: Entire world, all impact levels. Its country selector stays inside the desk. One calendar instance persists between feed, full calendar and Live Releases, keeping provider data and selections loaded. The main chart is also warmed and retained between desk sections; crypto and metals snapshots are prefetched. Initial provider connections still depend on the network. Live Releases defaults to actual economic releases with Actual / Forecast / Previous values; official statements are a separate tab, rather than presenting statements as economic data.

Metal charts support 1D, 7D, 1M, 3M, 1Y and All, with touch/keyboard inspection and bounded rendering. Observed ounce supply and current USD value retain up to one year of genuine observations from tracker activation. Long-term value is a separate explicitly labelled daily USD market-cap benchmark: XAUT + PAXG + KAU for gold, KAG for silver, fetched once daily. It is not historical ounce supply or historical STRATO supply, and missing days are not invented. Existing tracked coverage and current STRATO share remain independently labelled.

Validation: native screener validation/identity/freshness/search/sort/cache tests; metals retention/range and benchmark ingest tests; TypeScript and production build. IAB checks covered actual worldwide calendar values and in-desk country selection, native crypto search and internal ETH chart selection, including 390px mobile layout. Existing news and Telegram delivery remain unchanged.


## Link-access reader desk

The reader site can now be shared publicly by URL. All jobs, post composition/editing, settings, writing, runtime status/config and MCP operations require the existing dedicated private server key before body parsing or execution, independently of Site visibility. The key remains in root-owned server credentials and a runtime digest only. Refresh/editorial services mount that credential explicitly; crypto/metals collectors already use it. Visitors can read news, media, charts and public market metrics without triggering Telegram or editing posts.
