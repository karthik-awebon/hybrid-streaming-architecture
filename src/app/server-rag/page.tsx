'use client';

import { ServerChat } from '@/components/ServerChat';
import { Header } from '@/components/Header';

export default function ServerRagPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header isReady={true} />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-center h-[calc(100vh-12rem)]">
          <div className="w-full max-w-4xl h-full">
            <ServerChat />
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-slate-400 text-xs uppercase tracking-widest font-bold bg-white border-t border-slate-200 shrink-0">
        Hybrid Streaming Architecture • Server-Side Inference
      </footer>
    </div>
  );
}
