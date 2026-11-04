# Instructions for AI agents in this handoff repository

Read `README.md`, `AI_IMPLEMENTATION_PROMPT.md`, and `docs/IMPLEMENTATION_PLAN.md` before editing.

1. Treat `reference/` as a frozen design reference. Do not refactor it, substitute a mockup, simplify away features, or silently change snapshots/assets. Verify its hashes with `python3 scripts/verify_reference.py`.
2. Make actual application changes in the real production repository after reading that repository's own instructions and architecture. This repository does not establish its stack, endpoints, authentication or contract methods.
3. Follow the latest user direction expressed in `docs/DESIGN_SPEC.md`; preserve official logo/token proportions and colors. Keep the complete current reference as the visual/interaction authority.
4. Do not transplant demo balances, trader identities, P&L, proposals, maker budgets or spin results into production. Preserve existing wallet signing, escrow, accounting and settlement semantics.
5. Probability and underlying asset USD prices are different quantities. Do not derive fake market probabilities from spot prices or animate random fluctuations to suggest live activity.
6. Real social entries must come from actual eligible fills and user visibility settings. Never present reference personalities or statistics as real traders.
7. Gate unimplemented production capabilities honestly. No false connected states, award confirmations, fabricated liquidity or auto-post success. No external posting while testing.
8. Reuse established backend and UI modules where they meet the contract. Avoid replacing a production framework or server with this vanilla-JS/Python reference.
9. Keep secrets, local credentials, account exports and environment files out of commits. Do not include machine-specific absolute paths in the production import.
10. A handoff branch, a runnable reference and a production implementation are three different deliverables. Report which was actually achieved. Do not deploy or merge on the basis of these instructions alone.
