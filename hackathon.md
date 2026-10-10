# Import Rescue build log

## Project

Import Rescue repairs supplier CSV imports with per-value provenance, explicit ambiguity review, and reconciled staging. Operations teams and agencies can inspect what changed before committing validated orders.

## Team

ISeeData. Repository owner: cneuralnetwork. No additional team identities are assumed.

## Stack

React 19, TypeScript, Vite, Express, PapaParse, Node SQLite, Radix Dialog, neatlogs SDK. Optional OpenAI mapping advisor. Entire CLI with imported coding-session checkpoints. Local business-plan draft prepared for cfo.ai.

## 2026-10-10: functioning local MVP

- Inspected the supplied Claude design-system artifact and implemented its paper/ink palette, Instrument Sans interface, IBM Plex Mono data, compact radii, status semantics, and value receipts.
- Generated a ledger still-life for the upload dialog. Prompt and provenance: [asset record](docs/asset-provenance.md).
- Implemented CSV inspection, schema-version plans, an allowlisted worker runner, exact cents, validation, duplicate holds, explicit decisions, transactional staging, retraction after drift, and idempotent retries.
- Built five reproducible failure scenarios and the interactive mid-run format change.
- Ran the original 10 engine/worker/SQLite tests and API smoke workflow. Reference demo: 128 = 125 + 3 rows; $27,354.12 = $26,098.08 + $1,256.04. See [API evidence](docs/evidence/api-smoke.json).
- Verified hosted neatlogs workflow and child tool traces. Investigated a trace-status issue: completed spans were left UNSET by the manual wrapper and appeared as errors. Fixed explicit OK status on successful workflow and tool spans. Export only aggregate workflow results, not returned row documents.
- Installed Entire 0.11.4 from the official release and verified its checksum. Imported existing Codex history. Local checkpoint: `01M4JQR5WFHQQHGBFMTYQ3H6YG`. This is read-only imported history, not proof of a published commit checkpoint.
- Prepared [pricing, cost, revenue, and runway assumptions](docs/business-plan.md), including founder-salary sensitivity. cfo.ai account output remains pending.

## 2026-10-11: verification and repository handoff

- Re-ran production build and engine/database tests after resuming the interrupted session.
- Fixed a mobile page-overflow bug caused by an absolutely positioned screen-reader table label escaping its scrolling container. Verified document width equals viewport width after the fix.
- Added keyboard arrow/Home/End tab navigation, current-page semantics, singular row copy, clearer unsafe-total feedback, and enforced owner-only permissions when saving provider keys.
- Tightened repeated-header detection so partial header-like values cannot silently vanish as headers. Added a regression test; all **11 tests pass**.
- Repeated the full demo in the actual browser: run `IR-449A4D0E`, 125 staged / 3 held, zero reconciliation deltas. Hosted post-fix trace showed workflow and child tool without the earlier error marker.
- Created private repository `cneuralnetwork/import-rescue` at the user's request. No other GitHub identity was used.
- Added run instructions, limitations, design review, and evidence. Credentials, databases, raw session transcripts, and private dashboard screenshots are excluded from the repository.

## Demo

Run `npm ci`, `npm run dev`, and visit http://localhost:4173. Follow the two-minute sequence in [README.md](README.md). This is a local app; no public deployment or submission has been made.

## Submission requirements and outstanding items

The [neatHack build guide](https://neatlogs.com/hackathon) and [Entire event guide](https://hack.entire.io/neathacks-2026/) require evidence of neatlogs, Entire, and cfo.ai. The Entire guide requests an accessible checkpoint link and checkpoint ID; a URL alone does not grant reviewer access.

- Working local app, sample data, tests, setup instructions, and business assumptions: prepared.
- neatlogs: hosted delivery verified in the owner's dashboard. Present the workflow and child span using the signed-in account; private trace contents are not published here.
- Entire: local CLI and imported checkpoint exist. Approve the Codex hooks and connect the GitHub repository to Entire, then verify a normal committed checkpoint and reviewer access. Imported history alone is not a claim of full submission compliance.
- cfo.ai: create the actual plan from the supplied draft and retain its export/link. Account setup, any card entry, and immediate subscription cancellation require the user's account interaction.
- OpenAI: add a key to enable and test the optional model advisor. Current demonstrated behavior uses the local rules.
- Public demo link/recording, reviewer access, and final contest submission: pending user direction.

Trails, Graph/Brain, and Crustdata were not used. No judging scores, eligibility, prizes, or deadline claims are invented.

Dependency check on 11 October: `npm audit` reports **0 high / 0 critical and 12 moderate** advisories in the neatlogs OpenTelemetry dependency chain. Compatible protobuf/Jaeger overrides removed the high-severity advisories. Forcing OpenTelemetry core v2 broke the SDK doctor, so that incompatible override was removed. Hosted spans were rechecked after restoring SDK compatibility. The remaining upstream advisories are not claimed as fixed.

The private repository was pushed and GitHub Actions was started. The unpublished bootstrap commit's attribution was corrected to cneuralnetwork before its first push. A fresh local Entire checkpoint was captured with that same identity: `01M4KHE1JKEKED094S42AE3HYC`. It remains imported, read-only, and local because Entire is not signed in. No older session metadata was pushed. The browser login is ready for the user to accept Entire's terms and connect the requested repository.

Final polish also resets mapping-form state when switching runs and exposes surplus original cells when inspecting malformed rows. All source cells remain available in exported JSON receipts.

Final receipt fixes passed all 11 tests and the production build. GitHub sign-in confirms cneuralnetwork; Entire account authorization is pending review. No hosted checkpoint is claimed.

## Sarvam advisor migration

Switched the optional advisor to Sarvam at the user's request. The compatibility client is pinned to Sarvam's official V1 endpoint and uses sarvam-105b by default. Credentials remain in the owner-only ignored .env. Headers and unresolved mapping targets are the only supplier schema context transmitted; suggestions still need operator approval. No live Sarvam success is claimed until a configured key is tested.

Live Sarvam review verified through the app on the synthetic ambiguous-units fixture. Initial completions exposed truncation and invalid suggestion fields; explicit response budget, disabled reasoning, structured JSON schema, and local suggestion guards fixed the flow. The completed review left both ambiguous records unresolved and required supplier confirmation. Fifteen tests and the production build pass. Keys remain excluded from Git.

The successful hosted neatlogs workflow contains a sarvam-105b LLM span (287 tokens, approximately 1 second) and reports completed=true. Earlier failed responses remain visible for failure-to-fix evidence.
