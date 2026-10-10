# Remaining account setup

Use **cneuralnetwork** for all repository and service setup. The private source repository is https://github.com/cneuralnetwork/import-rescue.

## Entire

The CLI is locally available at `.tools/entire`, with Codex hooks configured. Add that directory to PATH when starting Codex so the hooks can find the binary. Approve the seven hooks in Codex `/hooks`; the CLI currently reports them as pending approval.

Entire terms were approved by the account owner. GitHub now confirms **cneuralnetwork** and is waiting at the Entire authorization screen (identity and read email access). Once authorized, review the repository installation permissions and limit repository access to `import-rescue`. Then run `entire login` for CLI authentication if required, connect/import this GitHub repository, and verify a new committed checkpoint in the dashboard.

Latest local imported checkpoint: `01M4KHE1JKEKED094S42AE3HYC`. This is useful local evidence, not a verified hosted checkpoint link. Do not invent a link or mark this requirement complete. The event guide's commit URL pattern is `https://entire.io/gh/OWNER/REPO/commit/FULL_COMMIT_SHA`; use it only after the corresponding commit/checkpoint is visible and accessible to reviewers.

## cfo.ai

Sign in at https://app.cfo.ai/login using the account associated with cneuralnetwork. For event credits use https://cfo.ai/neathacks. The supplied event instructions say card entry is required and the subscription should be cancelled immediately after signup. The account owner must handle payment details and confirm cancellation.

Paste the working prompt from `docs/business-plan.md`, provide the assumptions, and save the resulting plan/export. Add its real URL as `CFO_PLAN_URL` only after the plan exists. The local draft is explicitly not cfo.ai output.

## Model advisor

Add `OPENAI_API_KEY` through the local app's Integrations form or directly in `.env`. Do not put it in Git or a chat message. Set `OPENAI_MODEL` to an available model if needed. Restart the server, inspect an ambiguous scenario, and run **Review current mapping**. Verify the LLM/tool trace in neatlogs before claiming a model-powered demonstration. All proposed mappings still require operator approval and deterministic validation.

## Evidence and sharing

The app is local at http://localhost:4173. No internet deployment or contest submission has been performed. The repository is private, so reviewers need access or a separately authorized public release. Raw data, credentials, and session history are not part of the source-code push.
