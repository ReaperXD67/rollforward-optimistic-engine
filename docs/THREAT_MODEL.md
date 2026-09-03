# Threat model

ROLLFORWARD is a public assessment artifact. It has a browser client, an HTTP command API, isolated in-memory canonical stores, and a deterministic fault simulator. It is not represented as an authenticated multi-tenant service.

## Assets and trust boundaries

The protected assets are canonical release state, operator intent, the idempotency namespace, and the integrity of the visible mutation transcript. Browser input becomes untrusted at the API boundary. IndexedDB and `BroadcastChannel` are convenience transports and never supersede a newer server version.

| Threat | Control in this artifact |
| --- | --- |
| Duplicate delivery changes state twice | Stable key, request fingerprint, in-flight coalescing, and replay cache |
| Concurrent writers silently lose data | Versioned `If-Match` precondition |
| Header and body identify different commands | Header key must equal the validated command ID |
| Oversized or malformed input consumes resources | 32 KB JSON limit and strict Zod schema |
| Delayed cross-tab message rewinds state | Strictly newer versions only |
| In-flight write crosses a scenario reset | Client epoch and server generation fence |
| Anonymous reviewers interfere with each other | Browser-stable scenario UUID, per-scenario state, 30-minute TTL, and LRU capacity bound |
| Scenario identifiers exhaust process memory | Strict UUID validation, 256-context cap, idle expiry, and 512-result replay cap per context |
| Script injection through release or actor text | React text rendering; no raw HTML injection |
| Dependency or workflow-action drift | Locked npm install, SHA-pinned workflow actions, Dependabot, audit, and CI verification |
| Unnecessary server fingerprinting | Framework header disabled and Helmet defaults |

## Required before a public, multi-tenant deployment

- Authenticate users and authorize every release within its tenant.
- Add CSRF protection if credentials move to cookies.
- Store commands and idempotency results transactionally in a durable shared database.
- Add tenant- and identity-aware rate limits, immutable audit records, and abuse monitoring.
- Move secrets to managed storage; terminate TLS at a trusted edge; monitor logs, traces, and alerts.
- Define retention and redaction policies for operator identity and transcripts.

Documenting these gaps is part of the design: demo controls are not represented as production guarantees.
