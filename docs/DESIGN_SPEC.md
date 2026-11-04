# Design specification and source map

The authoritative design is the entire `reference/public/` implementation. This document indexes it; it is not permission to reduce it to a generic dashboard. Values in screenshots and snapshots change with live data.

## Latest user direction

Professional prediction-market usability inspired by Polymarket, with STRATO's own identity. Larger banners, more whitespace, consistent cards, fewer explanatory filler sentences, more real news and a much richer social experience inspired by the social trader/entry visibility of OKX/Fomo. Avoid dense clusters of tiny widgets. Move secondary information into lower sections or collapsed controls.

The visible user interface should look realistic without repeated demo/source labels. Developer documentation and a concise About explanation retain provenance. Do not remove truthful pending/unavailable states, simulate production success or disguise fake statistics as real.

## Tokens and layout

- Navy `#001B71`, blue `#3452FF`, paper `#FAFBFD`; Inter UI font with tabular numerals.
- Gold reward tokens: fill `#EFCD77`, paper `#FFF8E8`, ink `#795313`, border `#E9D398`. Gold is for incentives: header Rewards, earn links, market maker banner, Earn CTA and wheel/program accents. Trading keeps blue primary actions and green/red outcomes.
- Max content width 1480px; desktop gutters 40px. Desktop header 94px; topic bar 61px. Mobile reference breakpoint 560px with 17px main gutters, a two-row header and horizontally scrollable topics.
- Cards: white, cool hairline border, approximately 9–11px corners. Three market columns at desktop, two at intermediate widths, one on mobile. Use `minmax(0,1fr)` and shrinkable text children to prevent long questions forcing overflow.
- Official `assets/odds.png`, `assets/icon.png`, fonts and WAV files are supplied. Do not redraw/recolor/stretch logos. Do not invent portraits or platform statistics.
- Preserve actual source CSS values and responsive rules when in doubt. Adapt them into the existing app's token/component system.

## Page and interaction map

| Surface | Exact source in `reference/public/app.mjs` | Notes |
|---|---|---|
| Shell | `header`, `navigation`, `footer` | Topics, search, balance, direct gold Rewards action, hamburger sections; complete footer |
| Discovery | `hero`, `featureNews`, `followingStrip`, `marketsPage`, `card` | Large feature panels, pulse, cards, briefing below; date/volume always in the same slots; separate Live badge |
| Detail | `marketPage`, `paintChart`, `chartPointer`, `loadMarket` | Outcome picker, rule/alert controls, decimal probability, chart ranges and crosshair |
| Execution | `ticket`, `ticketCalculation`, `review`, `confirmTrade` | Buy/Sell/Earn, Market/Limit, simple amount/presets, review; advanced liquidity settings collapsed |
| Book | `paintBook`, `detailPanel` | Live book with cumulative depth; YOU rows in the reference are local LP illustrations |
| Social | `socialPage`, `postMarkup`, `composer`, `publish`, `showThread` | Theses, attached market, conviction, replies, saving/reposts, Following, news and ideas |
| Social distribution | `sharePost`, `xDraft`, sharecard functions | X draft/optional adapter; portrait sharecard; actual connection status |
| Traders | `tradersPage`, `showProfile` | Podium + rankings by period and metric, follow state, profile details |
| Liquidity | `poolsPage`, `maker.mjs` | Deposit amount, quote settings, daily program, quality/share/accrual and withdrawal |
| Rewards | `rewardsPage`, `wheel`, `spin` | One spin per ten predictions; maker section, missions, referrals and research rewards |
| Portfolio | `portfolioPage`, `portfolioContent` | Positions, orders, liquidity and activity; account export |

Some source helper names may occur alongside inline handlers; follow actual call sites. There is no production file mapping yet.

## Market card consistency

Every card has `card-date`, `card-volume` and an independent `card-live-slot`. Missing volume is `Vol. —`; do not substitute a date or invent zero. Kalshi's contract count must not be labelled USD. The date's tooltip contains the complete local timestamp. Clarify settlement versus close time from production schema; do not conflate them.

A binary market has a large chance and two priced outcome buttons. A multi-outcome event displays its top two outcome rows, with distinct chances and Yes/No buttons for each underlying market. Buttons must target the correct market/outcome, not only the parent event.

## Live behavior

`chart.mjs` uses actual timestamp geometry. `market-feed.mjs` normalizes CLOB snapshots, price deltas, best bid/ask and last-trade events. Probability remains in [0,1]. `liveWindow` retains a genuine observation preceding the fifteen-minute window without fabricating a boundary point. Live autoscale makes small real changes visible; the ordinary view has a wider minimum range.

`asset-feed.mjs` supplies a separate BTC/ETH/SOL/DOGE/XRP/ZEC USD context feed only for compatible price questions, excluding concept and unrelated questions. It never feeds the prediction ledger or oracle settlement. Price color changes reflect actual upticks/downticks. A subtle endpoint pulse is decorative; reduced-motion preferences disable it. Stale feeds lose their fresh status.

On desktop the entire ticket, including wheel progress, is one scrollable sticky block below the header/topics. On mobile it is in document flow after the chart and before discussion. No separately positioned reward block may overlap amount controls, submit buttons or the order book.

## Sound

`audio/strato-trade.wav`, `strato-liquidity.wav`, `strato-win.wav` are original synthesized motifs. `sound.mjs` applies the persisted sound preference and volume. Default off; playback follows a user gesture. Production success sounds must follow confirmed success, not an optimistic transaction that later fails. Do not sound every incoming public tick.
