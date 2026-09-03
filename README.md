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

## Status

- [x] Assessment and role research
- [x] Full-stack scope selected
- [x] Optimistic consistency model specified
- [ ] Application foundation
- [ ] Interactive command deck
- [ ] Adversarial tests and accessibility pass
- [ ] Final reviewer evidence

> This repository does not contain Anzibloom's private starter package. The published assessment rules state that the package is downloaded only after starting the fixed 24-hour attempt. Material AI assistance will be disclosed here and in `DECISIONS.md` before any official submission.

