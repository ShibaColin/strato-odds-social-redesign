# Implementation sequence for the real repository

No production checkout was available when this handoff was authored. The steps below are concrete tasks, not a claim that any named framework, route or contract already exists. First map them onto verified modules. Keep the frozen reference runnable throughout.

## 0. Inventory and baseline

- Read actual repository instructions and establish its integration branch, stack, package manager, build/test commands and supported networks.
- Inventory existing wallet/auth, market factory/order book, transaction queue, oracle/settlement, indexer, portfolio, community, Arena/leaderboard, news and rewards modules. Reuse working modules rather than duplicate them.
- Capture current tests and screenshots. Add an implementation map with actual file paths, existing API methods and gaps. Separate exchange-sourced discovery markets from genuinely tradable native markets.
- Create a feature branch from the verified current production base. Import this handoff as an isolated reference folder; do not merge standalone Git histories or overwrite root configuration.

## 1. Design shell and discovery

Implement header/topics/menu/footer and responsive layout. Port the exact token palette, gold incentive accent, type sizes, whitespace, two hero panels, briefing and cards. Normalize event cards once at the boundary; include close date and volume in fixed slots, units intact, and independent Live state. Preserve watchlist/search/category/sort flows and distinct binary/multi-outcome buttons.

Completion: match reference desktop/mobile composition, no horizontal document overflow, keyboard navigation works, gold reward destinations work and production numbers are truthful.

## 2. Market details and feeds

Port outcome selection, rules, alerts, chart/timeframes/crosshair, trader overlays, discussion/book/activity tabs and the unified ticket. Connect the real app's probability feed and normalized book. Start subscriptions immediately, fetch history independently, merge late responses by actual timestamps, apply book deltas and best quotes, throttle rendering without dropping state. Protect against old requests and reconnect timers after market changes. Mark stale/unavailable states honestly.

Add the separately labelled USD context feed where supported. Preserve the actual settlement source; it may differ from the displayed spot venue. Keep a fifteen-minute Live view with fine autoscale and decimal detail probabilities. Support deep links absent from the current discovery catalog and distinguish unavailable from ended markets.

Completion: observe genuine quote movement on a liquid asset market in the real app; ticket values and book follow without resetting amount/focus; leaving a market closes its subscriptions. No random probability animation.

## 3. Real trading and portfolio

Wire Buy/Sell/Limit and portfolio to established production wallet/transaction services. Keep precision and amounts in the app's integer/decimal domain; the reference's JS Number ledger is not a chain accounting library. Preserve approval/signing, collateral reservations, partial fills/cancellations, errors, fees and transaction receipts. Show pending versus confirmed state. Read positions and P&L from authoritative balances/fills.

Completion: meaningful integration tests on the configured test network or transaction mocks, no real-value QA orders, no optimistic success or spin credit before confirmation. Existing settlement/redemption remains correct.

## 4. Easy liquidity and funded maker incentives

Provide the simple Earn amount/review experience. Reuse any existing maker/pool engine. If the protocol is order-book-only, design balanced quoting, mint/escrow/reservations, cancellation/rebalance and safe withdrawal against its actual semantics. Do not call a deposit "liquidity" unless it funds real available quotes.

Calculate eligibility, minimum size, maximum spread, uptime, quality and pool share server-side from actual quotes/fills. Use a versioned funded program budget and authoritative claim ledger. On withdrawal, preserve earned-but-unclaimed rewards; reconcile pending orders and locked principal. Estimates must use the same qualification logic as accrual.

Completion: balanced collateral accounting and quote lifecycle tested; no invented APY/budget; withdraw/claim cannot mint value or double-count time.

## 5. Social and distribution

Implement authenticated identities, posts/theses, linked markets/outcomes, conviction, threaded replies, follows, saves and reposts. Add market proposals, votes and a real moderation/review lifecycle. Add real RSS briefings with source links, freshness and sane caching. Reuse existing community code.

Publish chart entries from genuine eligible fills and the user's visibility preference; show time, direction, executed price and size. Following filters must actually restrict entries/feed. Replace every fixture metric and personality. Include spam/rate limits and reporting/moderation consistent with the app's existing patterns.

X: user-authorized account connection, per-user encrypted token storage, revocation, draft preview, explicit destination opt-in, queued/published/failed state and idempotent retries. Avoid copying the localhost shared-env-token adapter into a multi-user deployment. Instagram: retain sharecard/export; implement account-linked publication only if supported and intentionally scoped, otherwise clearly offer sharing/export.

Completion: posts/relations persist across sessions and authorized users, inaccessible data is not leaked, no fake connected state and no external posts during testing.

## 6. Rankings and reward programs

Calculate day/month/all-time volume, realized/unrealized profit and win rate with explicit definitions. Handle open positions, fees, settlement, ties, sample sizes, self-trades and invalidated/reorged fills. Use one documented server clock/calendar boundary. Profile and leaderboard metrics must reconcile to indexed transactions.

Implement missions, research/referral eligibility and funded maker awards. Wheel: exactly one entitlement per ten eligible confirmed predictions, unique fill/transaction-event identity, no double-credit from retries/reloads, eligibility adjustments for invalidated fills, and server-authoritative randomness plus exactly-once award assignment. Define anti-wash/self-referral rules and payout limits with the product team. Use a funded reward ledger, not localStorage or browser RNG for real awards.

Completion: duplicate events/claims/retries cannot award twice; budgets and rewards cannot go negative; history reconciles with account balance. Gold prominence must correspond to a real available program, or an honest inactive state.

## 7. QA, review and release preparation

Run the app's relevant unit/integration/e2e/build checks and the handoff reference tests. Complete `ACCEPTANCE.md`, capture comparable desktop/mobile screenshots and document real integrations versus remaining external requirements. Add schema migrations/backfill/rollback steps if needed and verify feature flags default safely.

Prepare a PR for developer review with the final scope, validation and known dependencies. Do not merge, deploy, enable unfunded programs, make real financial QA transactions or publish social posts merely because this document describes them.
