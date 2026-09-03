# Anzibloom assessment strategy — source report

**Audience:** Anzibloom technical review team and candidate  
**Date:** 2026-09-03  
**Scope:** Public Anzibloom assessment catalog, public assessment workflow, current candidate GitHub evidence, and engineering sources relevant to optimistic interfaces. The private timed starter package was not accessed or started.

## Direct answer

Select **Full-stack Engineer**. It is the strongest evidence-to-rubric match and the safest way to demonstrate senior judgment without making an unverifiable seniority claim. Build a focused optimistic workflow whose behavior remains correct under latency, rejection, duplication, out-of-order acknowledgement, offline replay, and stale-version conflict.

## What Anzibloom says it evaluates

Anzibloom positions verification as role-specific evidence reviewed by a human, with correctness, reasoning, judgment, and communication all contributing to the result. Its public site describes Git take-homes as 60–90 minutes of expected effort with a 24-hour submission window after starting and a credential that remains reusable for 12 months after passing. [Anzibloom — Technology recruitment and verified talent](https://www.anzibloom.com/)

The live assessment catalog listed 79 roles across ten disciplines on the access date. The Full-stack Engineer entry was labeled “Optimistic interface coding,” and its published focus in the application bundle was “end-to-end interface behavior, optimistic state, APIs, and correctness.” The Frontend Engineer entry emphasized accessible interfaces, browser behavior, state, and product judgment. [Anzibloom assessment catalog](https://app.anzibloom.com/assessment)

The assessment UI states that starting a Git take-home creates a fixed 24-hour deadline and downloads the published ZIP. It also explicitly permits documentation, web research, and AI assistance when material assistance is disclosed in `DECISIONS.md`; the package must remain private and the candidate remains responsible for the work. This repository therefore records assistance and does not attempt to obtain or redistribute the gated starter.

## Candidate-to-role fit

The candidate's public GitHub account shows recent, inspectable work across the exact Full-stack surface:

- **MinePulse:** TypeScript, Next.js, PostgreSQL, Redis, Java/Paper plugin, Docker, and production runbooks.
- **Revive AI:** TypeScript, Next.js, Cloudflare Workers, payment integrations, auditability, and explainable automation.
- **Autonomous Personal Agent:** Python/FastAPI, PostgreSQL, Redis, Docker, security policy, and durable workflows.
- **Distributed Search Typeahead:** FastAPI, PostgreSQL, multi-node Redis, batching, failover, metrics, and a React client.
- **FinShot:** TypeScript, React, Express, MongoDB, analytics, and document extraction.

This makes Full-stack a direct extension of demonstrated work. Frontend remains a strong alternative. Data Scientist, Security Engineer, and Android Engineer are credible but would rely on older or narrower evidence. Principal/Staff, Engineering Manager, and architecture case studies would make broader seniority claims than the public evidence can safely support.

## Technical synthesis

React's current `useOptimistic` guidance treats the optimistic value as a temporary projection during an Action and recommends reducer-based updates when the base state can change concurrently. [React — `useOptimistic`](https://react.dev/reference/react/useOptimistic)

TanStack Query's guidance adds the operational mechanics: cancel stale refetches, snapshot prior data, apply the optimistic value, roll back on failure, and reconcile after settlement. [TanStack Query — Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)

At the protocol boundary, HTTP `If-Match` exists specifically to prevent the lost-update problem when multiple agents act on one resource. ROLLFORWARD adopts the same version-precondition model rather than hiding conflicts behind last-write-wins. [RFC 9110 — If-Match](https://www.rfc-editor.org/rfc/rfc9110.html#name-if-match)

For browser resilience, IndexedDB offers asynchronous transactional storage for structured client data, while BroadcastChannel supports same-origin communication between tabs. Those capabilities map cleanly to a durable mutation outbox and cross-tab acknowledgement fan-out. [MDN — IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), [MDN — Broadcast Channel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API)

## Recommendation

The differentiator should not be decorative scope. It should be a reviewer-visible correctness story:

1. An operator action appears immediately.
2. The mutation ledger records intent, causal parent, version precondition, and idempotency key.
3. A deterministic simulator produces acknowledgements, rejection, duplicate delivery, and conflicts.
4. The client reconciles or rolls back without corrupting confirmed state.
5. The same scenario is replayable in tests and in the UI.

## Material limitations

- The exact private task and starter repository are unavailable until an authenticated candidate starts the timed attempt.
- Public role labels describe assessment focus but not the complete reviewer rubric.
- GitHub repositories demonstrate technical breadth, not employment seniority or cross-team organizational influence.

## Claim-to-source ledger

| Claim | Source | Publisher | Accessed | Notes |
|---|---|---|---|---|
| Human review, assessment duration, 24-hour take-home window, 12-month credential | [Technology Recruitment and Verified Talent](https://www.anzibloom.com/) | Anzibloom | 2026-09-03 | First-party public site |
| 79 roles and role-specific assessment formats | [Assessment catalog](https://app.anzibloom.com/assessment) | Anzibloom | 2026-09-03 | First-party live catalog; no login used |
| Optimistic reducer behavior under concurrent base-state changes | [`useOptimistic`](https://react.dev/reference/react/useOptimistic) | React | 2026-09-03 | First-party framework documentation |
| Snapshot, rollback, and reconciliation patterns | [Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates) | TanStack Query | 2026-09-03 | First-party library documentation |
| Conditional writes prevent lost updates | [RFC 9110 §13.1.1](https://www.rfc-editor.org/rfc/rfc9110.html#name-if-match) | IETF / RFC Editor | 2026-09-03 | Standards-track protocol specification |
| Structured transactional browser storage | [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) | MDN Web Docs | 2026-09-03 | Technical reference |
| Same-origin cross-tab messaging | [Broadcast Channel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API) | MDN Web Docs | 2026-09-03 | Technical reference |

## Research stop condition

Discovery covered every published role title and format, the assessment workflow, the candidate's strongest public repositories, and primary technical sources for the chosen risk model. Further public searching would not reveal the private starter or exact rubric, so the next information gain comes from the authenticated package, not broader web research.

