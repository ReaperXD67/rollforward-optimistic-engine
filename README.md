# ROLLFORWARD

**Act now. Reconcile truth later.**

[![Verification](https://github.com/ReaperXD67/rollforward-optimistic-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/ReaperXD67/rollforward-optimistic-engine/actions/workflows/ci.yml)

ROLLFORWARD is a release-command workspace built to demonstrate senior full-stack judgment under the hardest part of optimistic interfaces: the unhappy path.

The product lets operators coordinate a production rollout while a deterministic network simulator injects latency, failure, duplication, and version conflicts. Every speculative action is visible, reversible, idempotent, and traceable from intent to server acknowledgement.

## Why this project

Anzibloom describes its Full-stack Engineer assessment as **optimistic interface coding** evaluated for **end-to-end interface behavior, optimistic state, APIs, and correctness**. The repository is deliberately optimized around that narrow signal rather than feature count.

The commit history deliberately separates the role decision, the working engine, and the verification evidence so the reasoning is inspectable instead of hidden inside one large delivery.

## Reviewer path

1. Read [DECISIONS.md](./DECISIONS.md) for the product and engineering tradeoffs.
2. Follow the [90-second reviewer guide](./docs/REVIEWER_GUIDE.md), then inspect the [architecture and correctness model](./docs/ARCHITECTURE.md).
3. Run the app and select **Long tail** or **Contention**.
4. Trigger concurrent mutations, injected failures, and stale-version conflicts.
5. Inspect or export the mutation ledger, then replay the deterministic scenario.
6. Run the test suite to verify the same invariants without the UI.

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

```bash
npx playwright install chromium
npm run test:e2e
```

The real-browser suite verifies deterministic retry and conflict flows, IndexedDB recovery, cross-tab truth propagation, responsive overflow, and axe-core accessibility rules.

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

Unsettled mutations are transactionally persisted in IndexedDB. Interrupted in-flight writes return to the causal queue after reload with the same key. Confirmed versions propagate across same-origin tabs through `BroadcastChannel` and are accepted only when they are newer.

## Status

- [x] Assessment and role research
- [x] Full-stack scope selected
- [x] Optimistic consistency model specified
- [x] Application foundation
- [x] Interactive command deck
- [x] Adversarial reducer, API, chaos, and outbox tests
- [x] Responsive and reduced-motion implementation
- [x] Dependency audit and continuous verification
- [x] Final reviewer evidence

> This repository does not contain Anzibloom's private starter package. The published assessment rules state that the package is downloaded only after starting the fixed 24-hour attempt. Material AI assistance will be disclosed here and in `DECISIONS.md` before any official submission.
