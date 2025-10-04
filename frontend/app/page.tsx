'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to explore page
    router.push('/explore');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 mx-auto rounded-full border border-cyan-400/50 flex items-center justify-center shadow-[0_0_30px_rgba(56,189,248,0.45)]">
          <div className="w-8 h-8 border-t-2 border-l-2 border-cyan-300 rounded-full animate-spin" />
        </div>
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-200 font-semibold">Initializing</p>
        <p className="text-lg text-slate-100 font-medium">Loading BioSpace Knowledge Engine...</p>
      </div>
    </div>
  );
}