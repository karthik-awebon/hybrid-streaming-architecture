# Hybrid Streaming RAG Architecture

A modern, high-performance Next.js application demonstrating a **Hybrid Retrieval-Augmented Generation (RAG)** architecture. This project combines local browser-side embedding generation with remote vector search and streaming LLM responses.

## 🚀 Key Features

- **Hybrid RAG Workflow:** Generates embeddings locally in the browser using `Transformers.js` to reduce server load and improve privacy.
- **Layout-Aware Ingestion:** Uses Vision Language Models (VLM) to parse complex PDFs into structured Markdown, preserving tables, headers, and reading order.
- **Real-time Streaming:** Seamlessly streams AI responses using the Vercel AI SDK.
- **Vector Search:** Integrated with Pinecone for efficient context retrieval.
- **Dedicated Logging:** Centralized logging utility for consistent traceability across client and server.
- **Robust Testing:** Comprehensive test suite including Unit (Vitest), Integration, and End-to-End (Playwright) tests.
- **Type Safety:** Built with Strict TypeScript and Zod for runtime schema validation.

## 🛠️ Tech Stack

- **Framework:** Next.js 15+ (App Router)
- **Styling:** Tailwind CSS 4
- **AI Integration:** Vercel AI SDK, OpenAI
- **Embeddings:** Transformers.js (`Xenova/all-MiniLM-L6-v2`)
- **Database:** Pinecone (Vector Database)
- **Validation:** Zod
- **Testing:** Vitest, Playwright, Testing Library
- **Tooling:** ESLint, Prettier, Husky, Lint-staged

## 📦 Getting Started

### Prerequisites

- Node.js 20+
- NPM / PNPM / Bun
- Pinecone API Key
- OpenAI API Key

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-repo/hybrid-streaming-architecture.git
   cd hybrid-streaming-architecture
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env.local` file in the root directory:

   ```env
   OPENAI_API_KEY=your_openai_key
   PINECONE_API_KEY=your_pinecone_key
   PINECONE_INDEX=your_index_name

   # Optional overrides
   NEXT_PUBLIC_LOG_LEVEL=debug
   ```

### Running the Project

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

## 🧪 Testing & Quality

```bash
# Run unit and integration tests
npm test

# Run unit tests in watch mode
npm run test:watch

# Run end-to-end tests
npm run test:e2e

# Run type-checking
npm run type-check

# Lint the codebase
npm run lint
```

## 📐 Architecture Overview

1.  **Ingestion (Layout-Aware):**
    - **Complex PDFs:** Rendered to images in the browser and processed via a VLM Server Action to produce structured Markdown. The Markdown is then downloaded for user review and explicit ingestion.
    - **Text/Markdown/DOCX:** Chunked and embedded locally via Web Workers (Transformers.js), then upserted to Pinecone via Next.js Server Actions.
2.  **Retrieval:** When a user sends a message, a local embedding is generated and sent to the `/api/chat` route.
3.  **Augmentation:** The server queries Pinecone using the provided embedding to find relevant context.
4.  **Generation:** The system prompt is augmented with context, and the response is streamed back to the user using OpenAI.

## 📄 License

MIT
