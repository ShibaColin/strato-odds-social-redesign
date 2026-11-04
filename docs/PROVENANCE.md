# Provenance and scope

Reference captured for handoff on 4 November 2026 (America/New_York). The app/snapshots record source fetch times in UTC. Public feed contents will change.

## Exact reference

`reference/` is copied byte-for-byte from the current STRATO Odds Social Redesign local source. Only the machine-specific `CURRENT-LOCATION.json`, `.DS_Store` and disposable Python caches were excluded. `REFERENCE_MANIFEST.json` records every included file and SHA-256. There are no account exports, wallet keys, environment files or user credentials in this package. `reference/server.py` is a localhost/read-only-feed proxy, with an optional explicitly configured X publishing adapter; it is not the production server.

## Assets

STRATO Odds logos/icons are official supplied brand files and remain unchanged. Inter includes its supplied license under `reference/public/assets/`. Original STRATO WAV motifs are included. Public market thumbnails and news images are third-party editorial reference media, not newly licensed original STRATO art. Public availability does not grant blanket redistribution, endorsement or promotional rights. Preserve attribution/source metadata and let the production team use its approved image/media pipeline; do not attach an open-source license to third-party media or the whole package without an authorized licensing decision.

No new open-source license is selected for this handoff. Existing third-party font licenses remain in place. Public GitHub visibility makes downloading easy; it does not automatically license every asset for every purpose.

## Real read-only data

The reference connects public STRATO Odds markets/books; Polymarket catalog, probability history, books and public trades; Kalshi public events/books/candles; Coinbase Exchange spot ticks/minute candles for supported crypto context; and BBC/CoinDesk/Federal Reserve/NASA RSS. These feeds do not imply that the displayed external markets can be traded or settled on STRATO.

## Simulated state

The local ledger's 10,000 opening USDST balance, all fills/limit matching, LP deposits/YOU quotes, modeled maker budgets/accrual, spins/awards, referrals/missions/research XP, sample personalities/metrics, rankings, initial discussion and social entries are fixtures. Local posts persist only in that browser. A later developer must not infer that the real app lacks a feature merely because the reference implements a local version.

Concept questions are hypothetical market proposals. They are not assertions that a crime, compromise or other event occurred. Their probabilities/histories are illustrative and must not become production oracle claims. Existing external market questions are examples, not claims of originality or native listing.

## Repository inspection status

The connected GitHub account did not expose the actual STRATO Odds repository at preparation time. This standalone repository contains no inspected production code or applied production patch. `IMPLEMENTATION_PLAN.md` begins with that inspection deliberately. Its proposed adapter semantics must be mapped to verified services before coding writes.
