'use client';

import { LocalIngest } from '@/components/LocalIngest';
import { LocalChat } from '@/components/LocalChat';
import { Header } from '@/components/Header';

export default function DashboardPage() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header isReady={true} />

      <div className="flex-1 w-full max-w-5xl mx-auto bg-white shadow-sm border-x border-slate-100">
        <main className="h-full px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-14rem)]">
            {/* Left Column: Ingest */}
            <div className="lg:col-span-4 h-full">
              <LocalIngest />
            </div>

            {/* Right Column: Chat */}
            <div className="lg:col-span-8 h-full">
              <LocalChat />
            </div>
          </div>
        </main>
      </div>

      <footer className="py-4 text-center text-slate-400 text-xs uppercase tracking-widest font-bold bg-white border-t border-slate-200 shrink-0">
        Hybrid Streaming Architecture • 100% Local Inference
      </footer>
    </div>
  );
}
