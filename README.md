# ROLLFORWARD

**Act now. Reconcile truth later.**

ROLLFORWARD is a release-command workspace built to demonstrate senior full-stack judgment under the hardest part of optimistic interfaces: the unhappy path.

The product lets operators coordinate a production rollout while a deterministic network simulator injects latency, failure, duplication, and version conflicts. Every speculative action is visible, reversible, idempotent, and traceable from intent to server acknowledgement.

## Why this project

Anzibloom describes its Full-stack Engineer assessment as **optimistic interface coding** evaluated for **end-to-end interface behavior, optimistic state, APIs, and correctness**. The repository is deliberately optimized around that narrow signal rather than feature count.

The current first checkpoint contains the role decision and architecture brief. Implementation, verification, and reviewer evidence follow as separate commits so the reasoning is inspectable in the history.

## Reviewer path

1. Read [DECISIONS.md](./DECISIONS.md) for the product and engineering tradeoffs.
2. Run the app and select **Chaos lab**.
3. Trigger concurrent mutations, injected failures, and stale-version conflicts.
4. Inspect the mutation ledger and replay the deterministic scenario.
5. Run the test suite to verify the same invariants without the UI.

## Run locally

Requires Node.js 24 or newer.

```bash
npm install
npm run dev
```

The product runs at `http://localhost:5173`; the API runs at `http://localhost:8787`.

```bash
npm run check
```

`check` runs static analysis, the reducer/API test suite, and both production builds.

## Architecture at a glance

```text
operator intent
      |
      v
pure optimistic reducer ---> projected interface
      |
      v
per-resource causal queue
      |
      v
conditional HTTP command ---> deterministic chaos edge
      |                              |
      +---- ack / retry / 412 <------+ 
                     |
                     v
              canonical snapshot
```

The UI never mutates canonical data. It renders a projection of confirmed releases plus active intent. The API requires both `Idempotency-Key` and `If-Match`, allowing retries without duplicated effects and conflicts without lost updates.

## Status

- [x] Assessment and role research
- [x] Full-stack scope selected
- [x] Optimistic consistency model specified
- [x] Application foundation
- [x] Interactive command deck
- [ ] Adversarial tests and accessibility pass
- [ ] Final reviewer evidence

> This repository does not contain Anzibloom's private starter package. The published assessment rules state that the package is downloaded only after starting the fixed 24-hour attempt. Material AI assistance will be disclosed here and in `DECISIONS.md` before any official submission.
