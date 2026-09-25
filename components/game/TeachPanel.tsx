'use client';
import { AlertTriangle, BookOpenCheck, HeartPulse, ArrowRight } from 'lucide-react';
import { Visual } from '@/components/art/Visual';
import { CATEGORY_MAP } from '@/lib/config';
import { optionLabel } from '@/lib/questions';
import { useGame } from '@/lib/store';
import type { Question } from '@/lib/types';
import { GameButton } from '@/components/ui/Button';

/** WHAT HAPPENED? / CORRECT RULE / WHY IT MATTERS + an animated demo of the correct action. */
export function TeachPanel({ q, chosen, onContinue, happened }: { q: Question; chosen: string; onContinue: () => void; happened?: string }) {
  const reduced = useGame((s) => s.settings.reducedMotion);
  const cat = CATEGORY_MAP[q.category];
  const good = optionLabel(q.correctAnswer);
  return (
    <div className="fixed inset-0 z-[56] bg-night-950/90 backdrop-blur-md overflow-y-auto" role="dialog" aria-modal="true" aria-label="Learn the rule">
      <div className="mx-auto max-w-4xl p-4 md:p-8 animate-slide-up">
        <div className="grid md:grid-cols-2 gap-4 md:gap-6 items-start">
          <div className="order-2 md:order-1 space-y-3">
            <div className="card-game p-4 border-danger-500/40">
              <div className="flex items-center gap-2 text-danger-400 font-display text-lg"><AlertTriangle className="w-5 h-5" aria-hidden="true" /> WHAT HAPPENED?</div>
              <p className="mt-1 font-bold text-night-100">{happened ? happened : chosen === '__timeout__' ? 'You ran out of time.' : <>You chose: <span className="text-danger-300">“{chosen}”</span></>}</p>
            </div>
            <div className="card-game p-4 border-leaf-500/40">
              <div className="flex items-center gap-2 text-leaf-400 font-display text-lg"><BookOpenCheck className="w-5 h-5" aria-hidden="true" /> CORRECT RULE</div>
              <p className="mt-1 text-night-300 text-sm">{q.question}</p>
              <p className="mt-2 font-extrabold text-lg text-white">✓ {q.correctAnswer}</p>
            </div>
            <div className="card-game p-4 border-aqua-500/40">
              <div className="flex items-center gap-2 text-aqua-400 font-display text-lg"><HeartPulse className="w-5 h-5" aria-hidden="true" /> WHY IT MATTERS</div>
              <p className="mt-1 text-night-200">{cat?.whyItMatters}</p>
            </div>
            <p className="text-[11px] text-night-500">Source: {q.sourceCode} ({q.sourceCategory}), page {q.sourcePage} of the supplied study material.</p>
          </div>
          <div className="order-1 md:order-2">
            {q.visual ? (
              <figure className={`rounded-3xl overflow-hidden border-2 border-leaf-500/50 ${q.visual.kind === 'sign' || q.visual.kind === 'lights' ? 'bg-gradient-to-b from-sky-200 to-sky-100 p-4' : 'bg-night-950'}`}>
                <div className={q.visual.kind === 'sign' || q.visual.kind === 'lights' ? 'mx-auto max-w-[200px]' : ''}>
                  <Visual spec={q.visual} className="w-full h-auto block" teach reducedMotion={reduced} interaction={good ? { good: [good] } : undefined} />
                </div>
                <figcaption className="px-3 py-2 text-xs font-bold text-leaf-300 bg-night-900">
                  {q.visual.order ? `Correct order: ${q.visual.order.join(' → ')}` : q.visual.vehicles?.some((v) => v.move) ? 'Watch the correct movement' : 'The correct way'}
                </figcaption>
              </figure>
            ) : (
              <div className="card-game p-6 text-center">
                <div className="font-display text-6xl text-leaf-400">✓</div>
                <p className="font-bold mt-2">{q.correctAnswer}</p>
              </div>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-center">
          <GameButton tone="leaf" size="lg" onClick={onContinue} autoFocus>
            Continue <ArrowRight className="w-5 h-5" />
          </GameButton>
        </div>
      </div>
    </div>
  );
}
