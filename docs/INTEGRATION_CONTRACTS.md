# Required integration semantics

These are **adapter requirements**, not assertions that production has these route names. Inspect and map actual services first. Use the real application's integer/decimal money types, network identifiers, pagination and authentication conventions.

## Identity and state

- Scope each user action to an authenticated account/wallet and network. A browser-local `you` fixture is not identity.
- Key markets by the actual network + contract/market identity; key outcomes separately. Parent events can contain several tradable binary markets.
- All writes need idempotency keys and server/chain-side authorization. Success state requires authoritative acknowledgement. Avoid duplicate side effects after retries.

## Market read model

Minimum event fields: stable identity, title, category/tags, image, close/expiry and resolution time if different, source identity, tradeability, total volume with its unit, optional 24h volume, market children. Child fields include identity, question, explicit outcome names, probability, quote timestamp, book/stream identity, rules, resolution source and liquidity when actually known.

Probability is a unitless decimal [0,1]. Price per share is in the settlement asset's units. Asset spot price is a separate USD quantity. `null` volume means unknown; zero means a measured zero. Do not turn contract counts into USD or strip source/network identity because ordinary source badges are visually suppressed.

Third-party public discovery markets are not automatically executable on STRATO. Only show an executable production trade/LP action where a real native market/bridge/routing capability is verified. Retain the reference's conceptual examples as proposal/preview content, not falsely tradeable listings.

## Probability/book stream

Normalize snapshot, book-level delta, best bid/ask, trade, heartbeat/disconnect and resolution events. Retain exchange/chain timestamps and a monotonic sequence/cursor where available. Book levels update by exact price; zero size deletes a level. Recover a gap with a fresh snapshot. Ignore unrelated outcomes, obsolete requests and stale responses after switching markets.

Compute the displayed quote using the actual product convention, document whether midpoint or last executed trade is used, and retain bid/ask/spread. No valid two-sided book means unavailable midpoint, not an invented 50%. A separate last-trade quote must carry its own timestamp.

Subscribe immediately; history and activity load independently. Merge late history without discarding live observations. Reconnect with backoff, cancel timers/subscriptions on leave, bound memory and render rate. A REST fallback must not rewind a newer stream observation. No random price jitter. Staleness is based on actual valid observations, not the animation clock.

USD asset context: a separate `{product, currency, price, timestamp}` stream with independent freshness and history. Coinbase in the reference is context; the production market's oracle is authoritative for settlement.

## Trading and portfolio

Order lifecycle: draft → review → wallet/signature/approval if needed → submitted/pending → accepted/open/partially-filled/filled/cancelled/rejected. The real protocol can have different states; map without hiding meaningful pending/error cases. Check available collateral, reserves, decimal precision and side/outcome. Sales cannot exceed available unreserved outcome tokens.

Portfolio valuations need quantity, cost basis, reserved amount, settlement claimability and a defined mark. Never conflate gross payout, P&L and trading volume. Limit fills count once by the protocol's unique fill identity. Rollbacks/reorgs must adjust eligibility and account state through existing reconciliation mechanisms.

## Maker/LP

An easy deposit UI must map to a real pool or collateralized quoting strategy. Required read state: deployed and available principal, locked reservations, active quotes, spread, eligible size, quote uptime/quality, program version/budget, estimated accrual and claimable amount. Estimates and claims must use the same eligibility model.

Required writes: reviewed provision, quote adjustment/rebalance where relevant, withdrawal and claim. Coordinate open orders/escrow before withdrawal. Keep earned rewards when withdrawing. Program budgets, start/end times and qualification conditions must be verified and configured, not copied from fixture values.

## Social and proposals

Persist authenticated profile, post/thesis, attached market/outcome, conviction, visibility, thread/reply parent, timestamps, edits/deletion/moderation state, follows, saves, repost attribution, proposals and one eligible vote per account/proposal. Paginate feeds. Check access on every mutation; don't trust client-supplied author/wallet IDs.

A chart entry requires an actual fill ID, market/outcome, executed price/quantity/notional, timestamp, trader identity and permitted visibility. Keep real public source fills distinct from app community posts in the data model. The reference random stream and seeded personalities are not production feed inputs.

Proposals need status (submitted/review/approved/rejected/listed), vote totals derived from eligible votes, a resolution-rule proposal and a link to any eventual listed market. Posting a suggestion must not automatically create a financial market.

## Social publishing

Per-account X authorization, granted scope, token expiry/revocation, encrypted server-side storage and callback validation belong to production auth. Publishing is opt-in per post/destination. Keep draft/queued/published/failed plus a stable external ID/URL. Retrying cannot duplicate a published post. Never leak tokens into browser state, client bundles or logs. The local shared-env-token adapter is only an example.

Instagram export works as a file/share action. Automatic publication is a separate account/API capability; do not show a connected success state unless implemented and authorized.

## Rewards and leaderboards

Use authoritative eligible-fill events with a unique identity including network/transaction/log or equivalent. Specify whether partial fills make one prediction and how same-market churn, self-trades, cancelled orders, reverted fills, reorgs and fee-only activity qualify. Ten eligible predictions generate one entitlement exactly once; expiry and program version are explicit.

Create one immutable reward decision per entitlement and one idempotent transfer/credit. Browser reload, click retry, concurrent sessions and duplicate chain events cannot generate another award. Use a server/protocol randomness mechanism suitable for the actual program, not the browser's random segment. Maintain funded budgets and verifiable award/claim history.

Leaderboards define period boundaries/timezone, realized versus unrealized P&L, fees, volume units, settled-only win rate, minimum sample and tie rules. Calculate from the same indexed fills and settlements as Portfolio. Do not copy the reference's deterministic fabricated ranking metrics.
