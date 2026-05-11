'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';

export default function HomePage() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header isReady={true} />

      <div className="flex-1 w-full max-w-5xl mx-auto bg-white shadow-sm border-x border-slate-100">
        <main className="px-4 py-16 flex flex-col items-center justify-center">
          <div className="text-center max-w-2xl mb-16">
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-4">
              Hybrid Streaming RAG
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Explore three distinct Semantic Search implementations leveraging local, remote, and
              hybrid strategies for embeddings and LLM inference.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            {/* Hybrid RAG Card */}
            <Link
              href="/hybrid-rag"
              className="group block bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all"
            >
              <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                Hybrid RAG
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Browser-based local embeddings combined with a remote Pinecone vector database and
                server-side LLM streaming.
              </p>
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Try it out &rarr;
              </div>
            </Link>

            {/* Local RAG Card */}
            <Link
              href="/local-rag"
              className="group block bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all"
            >
              <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                Local RAG
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                100% Local Inference. Uses WebLLM for generation and an in-browser Orama DB for
                search. No server required.
              </p>
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Try it out &rarr;
              </div>
            </Link>

            {/* Server RAG Card */}
            <Link
              href="/server-rag"
              className="group block bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all"
            >
              <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                Server RAG
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Traditional architecture. All embeddings generation, vector search, and LLM
                inference occur remotely on the server.
              </p>
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Try it out &rarr;
              </div>
            </Link>

            {/* Ingest Card */}
            <Link
              href="/ingest"
              className="group block bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all"
            >
              <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                Data Ingestion
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Chunk and embed large texts directly in your browser, then securely upload them to
                the remote Pinecone index.
              </p>
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Try it out &rarr;
              </div>
            </Link>
          </div>
        </main>
      </div>

      <footer className="py-6 text-center text-slate-400 text-sm bg-white border-t border-slate-200 shrink-0">
        <p>Built with Next.js 15+ and Vercel AI SDK</p>
      </footer>
    </div>
  );
}
