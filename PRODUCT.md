# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary audience is Anzibloom's technical review team evaluating a Full-stack Engineer assessment. They need to understand the candidate's technical judgment, working style, code quality, and seniority quickly, then inspect the implementation in depth.

The product's operator persona is a release engineer coordinating multiple production rollouts under latency, partial failure, offline operation, retries, and concurrent writes.

## Product Purpose

ROLLFORWARD is an executable proof of senior full-stack judgment around optimistic interfaces. It lets an operator act immediately while making the gap between local intent and canonical server truth observable, recoverable, and reproducible.

Success means a reviewer can experience the difficult failure paths in the interface, trace each state transition to its implementation, and verify the same invariants through automated tests.

## Positioning

Unlike optimistic-interface demos that stop at instant feedback or a loading state, ROLLFORWARD treats failures, retries, conflicts, offline intent, and reset races as first-class states in a deterministic flight recorder.

## Operating Context

Reviewers first encounter a persuasive product surface, then operate a release-command deck. They select deterministic network profiles, advance release stages, change progress, disconnect transport, and inspect the mutation lifecycle from projection through acknowledgement, retry, conflict, or rollback.

The repository, commit history, reviewer guide, architecture record, threat model, and executable test suite are part of the evaluated product.

## Capabilities and Constraints

- React and TypeScript client with an Express command API.
- Confirmed state remains separate from projected state.
- Commands use stable idempotency keys and version preconditions.
- Per-resource causal ordering permits concurrency across independent releases.
- Unsettled mutations survive reload in IndexedDB.
- Newer canonical versions synchronize across same-origin tabs.
- Network behavior is deterministic by seed for reproducible review.
- The demonstration API uses an in-memory process store by design; durable multi-tenant storage, identity, and authorization are documented production extensions rather than fabricated capabilities.
- The repository does not contain Anzibloom's private timed starter package.

## Brand Commitments

The product name is ROLLFORWARD. Its voice is direct, technically exact, restrained, and confident. Product claims must be demonstrated by the running system or linked evidence. The supplied reference favors cinematic automotive motion, full-bleed dark imagery, disciplined display typography, and premium interaction craft; it is inspiration rather than a request to copy another site's branding.

## Evidence on Hand

- Pure reducer, HTTP command contract, deterministic chaos edge, persistent outbox, cross-tab merge, and reset fencing are implemented in the repository.
- Unit, API, browser, responsive, and accessibility tests are executable locally and in CI.
- `DECISIONS.md`, `docs/ARCHITECTURE.md`, `docs/THREAT_MODEL.md`, and `docs/REVIEWER_GUIDE.md` document the reasoning and evidence.
- No customers, production usage, commercial benchmarks, or independent performance claims exist and none may be invented.

## Product Principles

- Make system truth visible rather than asking reviewers to trust prose.
- Treat latency, failure, and concurrency as normal product states.
- Prefer deterministic evidence over theatrical randomness.
- Preserve operator intent without silently overwriting canonical truth.
- Pair expressive presentation with inspectable engineering substance.

## Accessibility & Inclusion

The experience must remain keyboard operable, respect reduced-motion preferences, maintain readable contrast, and avoid horizontal overflow at mobile widths. The existing browser suite includes automated accessibility checks.
