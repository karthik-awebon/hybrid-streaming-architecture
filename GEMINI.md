# Project Context: Hybrid Streaming RAG Architecture

## Project Overview

This is a **Next.js 15+** application (App Router) focused on a **Hybrid RAG (Retrieval-Augmented Generation)** architecture. It leverages browser-side capabilities for embedding generation to offload server processing and uses remote vector stores (Pinecone) for scalable search.

### Main Technologies

- **Frontend/Backend:** Next.js (TypeScript), React 19.
- **AI/LLM:** Vercel AI SDK, OpenAI, Transformers.js (for local embeddings).
- **Vector Database:** Pinecone.
- **Styling:** Tailwind CSS 4.
- **Testing:** Vitest (Unit/Integration), Playwright (E2E).
- **Logging:** Custom centralized logger utility.

## Building and Running

- **Development:** `npm run dev`
- **Build:** `npm run build`
- **Start Production:** `npm run start`
- **Linting:** `npm run lint`
- **Type Checking:** `npm run type-check`
- **Testing:**
  - Unit/Integration: `npm test` or `npm run test:watch`
  - End-to-End: `npm run test:e2e`

## Development Conventions

### Architectural Directives

- **Local-First Embeddings:** Whenever possible, use Transformers.js in the browser (via Web Workers) to generate embeddings.
- **Layout-Aware Ingestion:** Use VLM-powered Server Actions to convert complex PDF visuals into structured Markdown before local ingestion.
- **Streaming Responses:** Use `ai` package hooks and `streamText` for real-time AI interactions.
- **Server Actions:** Use Server Actions (e.g., `src/actions/ingest.ts`) for database mutations.
- **Validation:** Use Zod schemas (found in `src/schemas/`) for all API and form data.
- **Standardized Responses:** Use `src/utils/api-response.ts` for consistent API success/error formats.

### Coding Style & Standards

- **Strict TypeScript:** No `any`. Explicit interfaces for props and API payloads.
- **Functional Components:** Prefer functional components with hooks.
- **Centralized Constants:** Use `src/constants.ts` for environment variable access and global configuration.
- **Logging:** Always use the custom `logger` utility from `@/utils/logger` instead of raw `console.log`.
- **Error Handling:** Use the `getErrorMessage` utility and custom error classes from `@/utils/errors.ts`.

### Testing Practices

- **Coverage:** Unit tests should cover utilities, hooks, and components.
- **E2E:** Critical user flows (Chat, Ingestion, Navigation) are covered by Playwright specs in `src/test/e2e/`.
- **Mocks:** Use established mocks in `src/test/mocks/` for complex dependencies like AI SDK or Pinecone.

## Key Directories

- `src/actions/`: Next.js Server Actions.
- `src/app/api/`: API routes (including chat streaming).
- `src/components/`: Reusable UI components.
- `src/hooks/`: Custom React hooks for business logic.
- `src/lib/`: Core libraries and worker implementations.
- `src/schemas/`: Zod validation schemas.
- `src/utils/`: Shared utility functions and logging.
