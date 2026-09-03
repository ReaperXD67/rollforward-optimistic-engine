# Reviewer guide

This repository is the recommended proof for the **Full-stack Engineer** assessment. It is intentionally narrow: one optimistic workflow, taken past the happy path until its timing, durability, concurrency, and recovery semantics are inspectable.

## The 90-second path

1. Open the deployed product, or run `npm install && npm run dev` and visit `http://localhost:5173`.
2. Press **Run the failure path** in the hero, then enter **Break the network. Keep the intent.**
3. The guided path selects **Long tail** and advances **Atlas search relevance** through the real engine.
4. Observe the stage change immediately while the chip says `projected`.
5. Watch the ledger contain a transient failure, release the same-key retry, and converge at `server v5`.
6. Select **Reset**, then **Contention**, and advance all three services in order. One write succeeds; two expose typed conflicts and explicit rollback.

The interface explains the system without DevTools. The code and tests then let a reviewer challenge every claim.

## Where the thinking lives

| Question | Start here |
| --- | --- |
| Why this assessment? | [`report-source.md`](../report-source.md) and [`DECISIONS.md`](../DECISIONS.md) |
| What are the invariants? | [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) |
| How is speculative state derived? | [`src/domain/engine.ts`](../src/domain/engine.ts) |
| How are duplicates and stale writes handled? | [`server/app.ts`](../server/app.ts) |
| How does reload recovery work? | [`src/storage/outbox.ts`](../src/storage/outbox.ts) |
| Which production claims are deliberately not made? | [`docs/THREAT_MODEL.md`](./THREAT_MODEL.md) |
| Are the failure paths executable? | [`server/app.test.ts`](../server/app.test.ts) and [`e2e/rollforward.spec.ts`](../e2e/rollforward.spec.ts) |

## Verified scenarios

| Scenario | Expected, repeatable evidence |
| --- | --- |
| Long-tail transport | Immediate projection → retryable `503` → exponential backoff → same-key retry → `server v5` |
| Contended writes | Three resources proceed concurrently; stale resources adopt remote versions and roll back ambiguous local intent |
| Offline reload | Active intent persists in IndexedDB, restores as queued, and reconciles with its original key |
| Concurrent duplicate | Two simultaneous requests coalesce behind one canonical mutation; the duplicate receives the same result |
| Cross-tab acknowledgement | A second tab accepts only a strictly newer canonical version through `BroadcastChannel` |
| Reset during flight | Client epoch and server generation prevent the old request from crossing the reset boundary |
| Concurrent public visitors | Browser-scoped UUIDs select bounded, expiring server contexts so stores and chaos controls cannot interfere |
| Narrow viewport | 390×844 remains interactive with no horizontal document overflow |
| Accessibility | axe-core reports no automatically detectable violations in desktop or narrow layouts |

## Verification

```bash
npm audit --audit-level=high
npm run check
npx playwright install chromium
npm run test:e2e
```

`npm run check` runs ESLint, 38 deterministic unit/API tests, and both production builds. Seven Playwright scenarios exercise the guided promise, browser state, IndexedDB, deterministic contention, multiple tabs, reduced-motion behavior, responsive overflow, and axe-core accessibility rules. GitHub Actions repeats the locked install, audit, source/build verification, Chromium installation, and browser suite on every push.

The production artifact was also smoke-tested as one Express process: `/`, `/healthz`, and `/api/snapshot` returned `200`; the app shell was served; the snapshot contained three releases with `Cache-Control: no-store`; Helmet's content security and `nosniff` headers were present; and `X-Powered-By` was absent.

## What I would discuss in review

- Why projected state is derived instead of stored.
- Why conflicts settle rather than silently rebase ambiguous intent.
- Why idempotency needs request fingerprints and in-flight coalescing, not just a cache after success.
- Why deterministic chaos must be keyed by semantic scenario coordinates and attempt number, separately from command identity.
- Why an IndexedDB outbox must update individual records when multiple tabs share the database.
- Which parts would move to durable infrastructure before production and which domain invariants would remain unchanged.

## Scope honesty

Each public browser receives an isolated, expiring process-local store and replay index. Authentication, durable tenancy, shared persistence, rate limiting, and durable event delivery remain documented extension points, not hidden assumptions. AI assistance is disclosed in [`DECISIONS.md`](../DECISIONS.md); the candidate is responsible for understanding and defending every line submitted.
