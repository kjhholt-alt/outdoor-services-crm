# PARKED — do not modify autonomously

**Parked: 2026-04-30**

This project is intentionally **parked** until Kruz returns to it. Nothing in
this directory should be modified by an autonomous Claude/Codex/agent run
without explicit, in-the-moment approval from Kruz.

## Why

There are 34 uncommitted files in the working tree from a production-hardening
sprint (Leads, CompanyProfile, Reports API, accounts/customers/services
backend changes, frontend client + package updates). Kruz has not had a chance
to review, test, and commit them. Until he does, autonomous changes risk:

- Mixing in with the uncommitted sprint and being lost when it is finally
  reviewed and rebased.
- Triggering a deploy to the **live client production environment** (Railway
  backend + Vercel frontend) used by All Around Town Outdoor Services.
- Breaking `STATUS.md`'s claim that the project is "FULLY DEPLOYED."

## Hard rules for any agent / Claude session

1. **No file edits in this directory.** Reads are fine; writes are not.
2. **No `git add` / `git commit` / `git push`** from inside `outdoor-crm/`.
3. **No `npm install`, `pip install`, migration runs, deploys, or env edits.**
4. **No "auto-commit" sweeps from the umbrella Projects repo** should pick up
   files inside `outdoor-crm/`. (The repo has its own `.git` so it is normally
   isolated, but check `git status` before running any wrapper script.)
5. If you genuinely need to touch this folder, **stop and ask Kruz first**.

## To unpark

When Kruz is ready:

1. `git -C outdoor-crm status` — confirm the 34 dirty files are still the
   intended sprint.
2. Run backend tests (`pytest` in `backend/`) and frontend build.
3. Decide: commit + push the sprint, or stash/discard.
4. Delete this `PARKED.md` file.
5. Update `STATUS.md` with the new date and outcome.

## Linked docs

- `STATUS.md` — last marked LIVE on 2026-04-09 (stale).
- `CLAUDE.md` — project context for AATOS client.
- `PROPOSAL.md` — client-facing pricing.
- `../PORTFOLIO_STATUS_2026-04-30.md` — portfolio-level snapshot that flagged
  this as the highest open risk.
