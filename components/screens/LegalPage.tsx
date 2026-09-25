import type { ReactNode } from 'react';

export function LegalPage({ kicker, title, children }: { kicker: string; title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <div className="text-xs font-extrabold tracking-[.25em] text-aqua-400">{kicker}</div>
      <h1 className="font-display text-4xl md:text-5xl mb-6">{title}</h1>
      <div className="card-game p-6 md:p-8 space-y-4 leading-relaxed text-night-100 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:mt-6 [&_h2]:text-white [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_a]:text-sun-400 [&_a]:underline">
        {children}
      </div>
    </div>
  );
}
