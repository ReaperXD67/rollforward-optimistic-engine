# Engineering decisions

This file is intentionally written for a technical reviewer. It records the decisions that change behavior, the alternatives considered, and the evidence needed to challenge them.

## D-001 — Choose the Full-stack Engineer assessment

**Status:** Accepted  
**Decision:** Target the Full-stack Engineer track, with Frontend Engineer as the fallback.

The candidate's strongest verifiable work spans both interface and systems concerns: TypeScript/React/Next.js products, Python/FastAPI services, Java APIs, PostgreSQL, Redis, authentication, event-driven integrations, and production runbooks. Anzibloom's published Full-stack focus—end-to-end behavior, optimistic state, APIs, and correctness—has the greatest overlap and therefore the lowest role-inflation risk.

The Frontend track is a credible fallback, but its HTML/CSS/JavaScript format narrows the evidence to browser fundamentals. Principal/Staff and architecture tracks create a seniority-claim risk because a case study can overstate influence that a reviewer cannot verify from one repository.

## D-002 — Optimize for inspectable correctness, not feature volume

**Status:** Accepted  
**Decision:** Build one production-shaped optimistic workflow and make its failure semantics observable.

The product will treat an optimistic mutation as a small state machine:

```text
draft -> queued -> in_flight -> acknowledged
                    |              |
                    v              v
                 rejected       superseded
                    |
                    v
               rolled_back
```

The reviewer should be able to answer four questions without reading every file:

- What did the user intend?
- What did the interface render immediately?
- What did the server accept?
- How did the system recover when those facts diverged?

## D-003 — Use explicit preconditions at the API boundary

**Status:** Accepted  
**Decision:** Every state-changing request carries an idempotency key and the resource version it was based on.

The server returns a new version with each accepted mutation. A stale precondition becomes a typed conflict rather than a silent last-write-wins overwrite. The client can then rebase a commutative operation or ask for resolution when intent is ambiguous.

This mirrors HTTP's `If-Match` semantics for preventing lost updates while keeping the demo implementation small and inspectable.

## D-004 — Separate the domain reducer from transport and animation

**Status:** Accepted  
**Decision:** Optimistic projection is a pure reducer. Persistence, retry policy, cross-tab transport, and UI motion are adapters around it.

This makes race conditions testable with a deterministic clock and allows motion to be disabled under `prefers-reduced-motion` without changing correctness.

## D-005 — Make chaos deterministic

**Status:** Accepted  
**Decision:** Failure scenarios use seeded pseudo-randomness and an event transcript.

Random failures look impressive but produce weak evidence because a reviewer cannot reproduce them. A seed plus transcript turns the demo into an executable incident report.

## AI assistance disclosure

OpenAI Codex was used for research, implementation assistance, test generation, and documentation. The candidate remains responsible for understanding, validating, and explaining every submitted decision. The final repository will include the exact verification commands and known limitations.

