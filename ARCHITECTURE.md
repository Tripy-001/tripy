# Tripy — Architecture Overview

This doc contains two diagrams and a short explanation of how Tripy's main parts are organized and how they interact.

---

## 1) Main parts (components)

```mermaid
flowchart LR
  A[User] --> B[Frontend - Next.js]
  B --> C[Firebase Client SDK]
  B --> D[Next.js API Routes]
  D --> E[Firebase Admin]
  D --> F[FastAPI Agent]
  F --> G[LLM Provider]
  F --> H[External Tools]
  D --> I[Cloud Storage]
  E --> J[Firestore]
  J -->|realtime| B
  H -->|webhooks| D

  classDef infra fill:#f8fafc,stroke:#111827,color:#111827
  class E,J,I,H infra
```

---

## 2) How these parts talk (sequence)

```mermaid
sequenceDiagram
  participant U as User
  participant F as Frontend (Next.js)
  participant FB as Firebase Auth
  participant A as Next.js API
  participant S as FastAPI Agent
  participant L as LLM Provider
  participant DB as Firestore
  participant P as Payment Provider

  U->>F: Sign in (Google) and obtain Firebase token
  F->>FB: Client SDK handles auth
  U->>F: Click "Generate itinerary"
  F->>A: POST /api/trips (include Firebase token)
  A->>FB: Verify token via Firebase Admin
  A->>S: POST /generate (request LLM-backed plan)
  S->>L: Request LLM completion + tool calls (places, times)
  L-->>S: Itinerary payload
  S-->>A: Generated itinerary JSON
  A->>DB: Write trip doc + metadata
  DB-->>F: Realtime snapshot updates
  F-->>U: Render trip page (maps, days, costs)

  %% Checklist flow
  U->>F: Click initialize checklist
  F->>A: POST /api/trips/{id}/todos/initialize
  A->>DB: Batch write todos under trips/{id}/todos
  DB-->>F: Todos appear via realtime listener

  %% Booking flow (stub)
  U->>F: Start checkout
  F->>A: POST /api/checkout -> create payment intent
  A->>P: Create payment session
  P-->>A: Webhook -> payment confirmed
  A->>DB: Persist booking + update trip status
  DB-->>F: Booking confirmed UI updates

  %% Realtime edits
  U->>F: Edit todo / itinerary
  F->>DB: Client SDK update (writes) or call A for server-validated changes
  DB-->>OtherClients: Real-time sync across sessions
```

---

## Architecture details — Frontend

- Framework: Next.js 15 (App Router), TypeScript, React.
- State: Zustand store for auth and trip data; components use hooks (e.g., `useTripTodos`).
- Auth: Firebase client SDK for sign-in (Google) and short-lived ID tokens.
- Data: Realtime listeners (Firestore onSnapshot) for trips and todos; optimistic updates for UI responsiveness.
- UI pieces: Trip page (day-by-day), `TripTodoList` (accordion per day), `TodoWidget` (floating), Chat Assistant component.
- API usage: For server-verified or heavy ops (generation, initialize batch writes, booking), the frontend calls Next.js API routes.
- UX notes: Floating widget uses CSS overlay; accessible keyboard interactions and mobile-friendly layout.

## Architecture details — FastAPI Agent backend

- Role: A separate service responsible for LLM orchestration, tool calls (Places/Maps lookups), and heavier async workflows.
- Deployment: Containerized (Docker) service, can run on the same cloud project or separate host; scale independently from the Next.js frontend.
- Interface: Exposes HTTP endpoints consumed by Next.js API routes (e.g., `/generate`, `/chat`, `/tools/places`).
- LLM & tools: Calls external LLM APIs and third-party services; manages retries, caching, and structured output normalization.
- Async & scaling: Use background job queue (Redis + RQ/Celery or FastAPI background tasks) for long-running jobs and streaming responses.
- Security: Requests from Next.js API are authenticated via a signed service token or mutual TLS; logs are audited and rate-limited.
- Observability: Structured logging, tracing (OpenTelemetry), and metrics for latency and error rates.

## Integration notes

- Authentication flow: Frontend gets Firebase token; Next.js API validates the token using Firebase Admin and only then calls the FastAPI agent (service-to-service auth).
- Data ownership: Trips and todos live in Firestore; Next.js API and FastAPI can write to Firestore via Admin SDK for server-side writes.
- Realtime UX: Frontend relies on Firestore listeners to reflect changes made by any service or client instantly.
- Payments: Next.js API mediates payment provider calls and handles webhooks to mark bookings; sensitive operations never run on the client.

---

If you want, I can:

- Add a simplified PNG export of the Mermaid diagrams and embed them in this file for guaranteed rendering on GitHub pages.
- Create a small README section with commands to run the FastAPI agent locally (Dockerfile + docker-compose example).

*File added: `ARCHITECTURE.md` — diagrams + concise architecture notes.*
