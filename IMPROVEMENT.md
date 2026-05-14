1. Advanced Hybrid Orchestration
   Currently, you have separate routes for local-rag and server-rag. A true "Hybrid" system should decide where to route
   queries dynamically.
   - Smart Routing: Implement a "Broker" or "Router" that analyzes the query. If the query is about "my uploaded files"
     (private/local), use the Local RAG. If it's a general knowledge query or requires heavy compute, route to the Server
     RAG.
   - Parallel Competitive Retrieval: Fire both local and server searches simultaneously. Merge the results using Reciprocal
     Rank Fusion (RRF) to show the most relevant sources from both worlds.
   - Latency-First Fallback: Start with local retrieval (zero latency). If the confidence score is low, transparently trigger
     a server-side "Deep Search."

2. Local-First Enhancements (UX & Performance)
   Since you are using transformers.js, the initial model download is a bottleneck.

- Model Caching (IndexedDB): Ensure the embedding models are cached in the browser's Cache API or IndexedDB so users don't
  re-download 50MB-100MB on every session.
- Progressive Loading UI: Improve the ModelStatus component to show "Streaming Model" progress (MB downloaded) rather than
  just a generic loading state.
- Orama Persistence: Use the Opaque persistence layer of Orama to save the vector index to localStorage or IndexedDB,
  allowing the "local" database to survive page refreshes.

3. Retrieval Quality (RAG Precision)

- Semantic Chunking: Your chunking.ts likely uses fixed-size windows. Implement semantic chunking that breaks text based
  on sentence boundaries or structural headers to keep context intact.
- Re-ranking (Cross-Encoders): Local retrieval is often "noisy." After getting the top 20 results from Orama, use a
  lightweight re-ranker model (also via Transformers.js) to pick the top 5 most relevant snippets before sending them to
  the LLM.
- Metadata Filtering: Enhance your schemas to support filtering by "Upload Date," "File Type," or "Document Category"
  directly within the vector search.

4. Visual & Structural Ingestion

- VLM-Powered Ingestion: You mentioned VLM-powered Server Actions. Ensure you are extracting Tables and Charts from PDFs
  as structured Markdown. Raw text extraction often loses the context of data tables.
- Layout-Aware Parsing: Use a tool like pdf-parse or a server-side OCR to detect document structure (headings, footers,
  page numbers) to avoid "noise" in your embeddings.

5. Architectural & DX Improvements

- Edge Compatibility: Ensure your Server Actions and API routes are using the edge runtime where possible (especially for
  Pinecone/OpenAI calls) to minimize TTFB.
- Observability: Integrate a tool like LangSmith or Helicone into your logger.ts to trace RAG performance (retrieval time
  vs. generation time).
- Micro-Frontend Decoupling: As per your GEMINI.md directives, ensure the LocalChat and LocalIngest components are truly
  "plug-and-play." Can they be dropped into a completely different Next.js app with just a few props?

6. Security & Privacy

- Local-Only Mode: Add a "Privacy Lock" toggle. When enabled, it strictly prevents any local document content from being
  sent to the server-side LLM, perhaps switching to a local LLM (like WebLLM/Wasm) for generation.
  1. Smart Capability-Aware Routing (Unified Chat)
     Instead of forcing users to choose between Local, Server, or Hybrid RAG pages, create a unified
     <SmartChat> component.
  - The Strategy: On mount, profile the user's device capabilities (e.g., checking navigator.gpu for
    WebGPU support, checking memory).
  - The Fallback Chain:
    1.  Tier 1 (High-end devices): Default to fully Local RAG (WebLLM + Transformers.js + Orama) to
        minimize cloud costs and guarantee privacy.
    2.  Tier 2 (Mid-range devices): Fallback to Hybrid RAG (Local embeddings sent to Server for
        Pinecone retrieval & OpenAI inference) if WebGPU is absent but WASM is supported.
    3.  Tier 3 (Low-end/Mobile): Fallback to fully Server RAG if the device struggles with local
        execution.
  2. Embedding Fallback (Local → Server)
     Currently, your useEmbedding hook (Transformers.js) and hybrid-rag fail if the local WebWorker
     crashes or isn't supported.
  - The Strategy: Update the generateEmbedding function in your hooks to act as a proxy.
  - Implementation: Attempt to generate the embedding via the WebWorker. If it throws an error or
    takes too long (timeout), catch the error and automatically fetch the embedding via a server API
    endpoint (/api/embeddings using OpenAI).
  3. Inference & Retrieval Fallback (Server → Local)
     If your backend services go down (e.g., Pinecone is unreachable or OpenAI is rate-limiting you) or
     the user loses their internet connection (offline mode).
  - The Strategy: Leverage your local Orama database as an offline backup.
  - Implementation: In useChatLogic.ts (Hybrid RAG), wrap the server POST /api/chat call in a
    try/catch block. If the server request fails, automatically execute a local similarity search
    via Orama and pass the context to WebLLM for a local response.
  4. Mid-Stream Degradation
     If the user is using fully Local RAG but WebLLM starts to thrash or fails to generate tokens due to
     memory pressure mid-stream:
  - The Strategy: Intercept the error in the useWebLLM hook.
  - Implementation: Pause generation, log a warning to the user ("Local model ran out of memory,
    switching to cloud..."), and send the conversation history to the server (/api/server-chat) to
    seamlessly resume the response.
