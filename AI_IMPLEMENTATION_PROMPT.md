# Task: implement the STRATO Odds social redesign in the real application

You are working with the real STRATO Odds developers. Implement the experience in this handoff in the production codebase, retaining the reviewed design and all interactions. The handoff includes the exact runnable reference, not just screenshots. Do the work, run the appropriate checks, and prepare a reviewable branch/PR. This prompt does not authorize deployment, merging, real financial transactions or external social posts.

## Inputs and order

1. Read the production repository's AGENTS/CONTRIBUTING instructions, package manifests, architecture, wallet/auth code, API clients, market schema, indexers, tests and deployment configuration.
2. Read this handoff's `README.md`, `docs/DESIGN_SPEC.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/INTEGRATION_CONTRACTS.md` and `docs/ACCEPTANCE.md`. Run the reference and inspect every route in desktop and mobile sizes.
3. Verify `REFERENCE_MANIFEST.json` with `python3 scripts/verify_reference.py --run-tests`. Do not change the frozen reference to make production comparisons pass.
4. Produce a file-level integration map from the actual repository. Identify existing community, leaderboard, maker, reward, market and portfolio capabilities before creating duplicates. Clearly mark any capability whose backend does not yet exist.

## Required outcome

Match the reference's professional, spacious STRATO design. Retain official assets, Inter, navy/blue surfaces, consistent grid, restrained gold incentive highlights and the large editorial banners. Keep topics on top and the app navigation in the right menu. Every market card has fixed date and volume slots and a separate Live label. Preserve binary and multi-outcome variants and correct per-outcome buy buttons.

Implement market details with true market-probability history, decimal detail percentages, fine Live autoscale, proper timestamp spacing, real-time order-book deltas, stale/reconnect states and own/followed entry markers. Start live feeds without waiting for history or trade requests; merge late history without losing newer ticks. Keep the ticket, amount input and spin progress stable through updates. A separate USD asset feed must not overwrite the probability or resolution oracle. Small real price changes should be visible without manufacturing activity. Handle expired short-duration links gracefully.

Integrate Buy/Sell/Limit/Portfolio through the real app's existing transaction and accounting flow. Keep confirmations, balance/reserve validation, partial sells, cancellation and settlement. Easy Earn requires a simple amount entry, a review and collapsible advanced spread settings. Actual maker quotes, collateral reservation, accrual and reward claims need a real backend; a simulated deposit or painted YOU row is not production market making.

Implement social theses with linked markets/conviction, posts, threads/replies, follows, saved posts, reposts, proposals/votes and a news tab. Persist through authenticated server APIs and use real identities. Link real public/consented fills to trader/chart activity. Support X sharing and opt-in account-linked publishing with per-user OAuth credentials; respect failed/pending states and retries without duplicate posts. Retain an Instagram sharecard; do not claim Instagram auto-publishing without implementing the eligible account flow.

Implement day/month/all-time leaderboards with profit, volume and win-rate filters backed by real calculations. Implement funded maker incentives, rewards, missions and referral/research programs; eligibility and awards are server-authoritative and idempotent. Keep one spin per ten eligible confirmed predictions, exactly once. Reuse the supplied sonic identity with an opt-in toggle and persisted volume.

## Working method

Follow the ordered milestones in `docs/IMPLEMENTATION_PLAN.md`, adapting file paths to the real app. Preserve existing correct behavior and its tests. Add meaningful coverage around live-stream lifecycle, ledger/settlement boundaries, reward idempotency and authenticated social actions. Prefer the app's existing frameworks and libraries. Do not replace the app with `reference/server.py`.

If the backend can be implemented within this repository's scope, implement it. If an external contract, account permission or funded reward program is genuinely missing, build the validated adapter/state boundaries, expose an honest unavailable state and list the exact dependency. Do not say the entire production task is done while core behaviors are still simulated.

Before handoff, complete `docs/ACCEPTANCE.md`. Return the changed modules, real integrations completed, tests run, screenshots, any remaining external dependency and the reviewable branch/PR. Include a short migration/rollback plan for schema changes. No deployment or merge until separately authorized.
