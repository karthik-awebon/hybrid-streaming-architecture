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
