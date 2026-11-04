# Acceptance checklist

The frozen reference is complete as a local prototype. Production completion requires the applicable items below in the actual application; checking only the prototype is insufficient.

## Visual/interaction parity

- [ ] Official logo proportions and Inter preserved; navy/blue identity with restrained gold incentives.
- [ ] Desktop header/topics/menu/footer match the reference hierarchy; direct gold Rewards action works.
- [ ] Large hero and briefing; coherent three/two/one-column cards; long questions do not widen the page.
- [ ] Every card has date and volume in fixed slots, correct units, unknown-volume placeholder, independent Live badge.
- [ ] Binary and grouped outcome variants target correct per-outcome trade contexts.
- [ ] Market details, outcome selection, tabs, graph ranges, crosshair, markers and alert/rules actions work.
- [ ] Buy/Sell/Earn reviews show accurate amounts, shares and possible payout; pending/error states are meaningful.
- [ ] Whole ticket + spin progress remains one block. Scroll at 1280×720, 390×844 and a short landscape viewport; no overlap, clipped submission action or document overflow.
- [ ] Gold Earn links, maker banner, reward progress/wheel/program accents remain prominent without turning all actions gold.
- [ ] Social composer, thesis/market/conviction, thread/reply, follow, save, repost, news, ideas/votes and profile flows persist and work by keyboard.
- [ ] Leaderboard period and metric changes update actual ranking and follow state consistently.
- [ ] Sound opt-in/volume/reduced-motion work. Incoming public ticks do not play transaction jingles.

## Live data and lifecycle

- [ ] Observe two genuine market quote changes on an active asset market; record actual timestamps and the corresponding ticket/book updates.
- [ ] Fine Live autoscale and decimal percentages expose small real moves. No generated jitter or fabricated price history.
- [ ] Underlying USD feed is labelled separately and never overwrites probability, P&L marks or oracle settlement.
- [ ] Late history response preserves newer live ticks. Stale REST response cannot rewind the stream.
- [ ] Delta deletion, best quote, crossed/empty book, reconnect, out-of-order/gap, stale feed and unsupported source cases tested.
- [ ] Amount input/focus and scroll position survive live updates. Routing/timeframe changes clean old subscriptions and timers.
- [ ] Deep links outside the current catalog load separately; ended/unavailable markets recover instead of hanging.

## Actual application behavior

- [ ] Use real wallet/auth, network, token precision, collateral/reserves and transaction lifecycle.
- [ ] Buy, partial/full sell, limit reserve/fill/cancel, settlement/redemption and Portfolio remain correct; no real-value QA transaction is required to verify the UI.
- [ ] Actual liquidity deploys funded quotes or pool capital. Principal/reserves/withdrawals and accrued claims reconcile.
- [ ] Maker eligibility, estimates, uptime and budgets use authoritative state; no copied fixture APY or program amount.
- [ ] No fixture people, chart entries, fabricated ranking metrics, local balances or mock award success in production mode.
- [ ] Social writes enforce authorship, access and rate limits; votes/follows cannot be duplicated by replay.
- [ ] X publishing is per-user opt-in with real auth and idempotent state. No actual social post is made during QA. Instagram export does not imply auto-publishing.
- [ ] Reward entitlements/awards/claims are idempotent under duplicate fill events, double-clicks, reloads, concurrent sessions and failures.
- [ ] Rankings reconcile against Portfolio/fills with documented period, fee, volume and win-rate definitions.

## Review package

- [ ] Baseline reference manifest verification and 21 reference tests pass.
- [ ] Production app's relevant type/build/lint/unit/integration/e2e checks run, with actual results listed.
- [ ] Comparable desktop/mobile screenshots captured; varying market prices are not treated as pixel-regression failures.
- [ ] Existing production functionality and contracts preserved or intentionally migrated with tests.
- [ ] Schema migrations, rollback and feature-flag defaults documented if changed.
- [ ] Remaining external dependencies explicitly listed. No claim of full production completion while core writes are still fixtures.
- [ ] Branch/PR reviewable. Deployment and merge remain separate actions.
