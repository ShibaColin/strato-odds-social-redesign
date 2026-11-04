# Importing the handoff into the real application repository

The standalone handoff has its own root commit. Do not merge that unrelated history into the application root or replace the production README/package/server with reference files.

## AI workflow

Open the actual production checkout and provide this handoff as a second folder or import it under `design-handoff/strato-odds-next/`. Give the AI `AI_IMPLEMENTATION_PROMPT.md` and the target checkout. Read target instructions first.

## Branch workflow

Start from the production team's current approved integration branch and a clean working tree. The commands below use placeholders intentionally; discover the real remote/base first.

```sh
git -C /path/to/real-app status --short
git -C /path/to/real-app fetch origin
git -C /path/to/real-app switch THE_VERIFIED_INTEGRATION_BRANCH
git -C /path/to/real-app pull --ff-only
git -C /path/to/real-app switch -c codex/odds-social-redesign

# Preview exactly where the isolated handoff would be copied:
python3 /path/to/this-handoff/scripts/install_handoff.py /path/to/real-app

# Apply only after inspecting the dry run. Existing destination is never overwritten:
python3 /path/to/this-handoff/scripts/install_handoff.py /path/to/real-app --apply

# Review and commit the imported reference, then implement in real app modules:
git -C /path/to/real-app diff --stat
git -C /path/to/real-app add design-handoff/strato-odds-next
git -C /path/to/real-app commit -m "Add exact STRATO Odds redesign reference and AI implementation guide"
```

After actual implementation and appropriate checks, push the feature branch and open a review PR. Do not force-push the integration branch. This import script neither pushes nor changes production application files.

## Git bundle

Developers can clone the supplied `.bundle` directly:

```sh
git clone /path/to/STRATO-Odds-Developer-Handoff.bundle strato-odds-handoff
cd strato-odds-handoff
python3 scripts/verify_reference.py --run-tests
```

The bundle includes the handoff commit/branch. The source ZIP includes the same files without `.git`. The GitHub repository provides the same source as ordinary commits.
