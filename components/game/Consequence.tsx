'use client';
// In-game consequences for wrong decisions — stylised, never graphic.
import { useEffect, useRef } from 'react';
import { sfx } from '@/lib/sound';
import type { ConsequenceType } from '@/lib/types';
import { VehicleTop } from '@/components/art/vehicles';
import { useGame } from '@/lib/store';

const COPY: Record<ConsequenceType, { title: string; sub: string; color: string }> = {
  'near-miss': { title: 'NEAR MISS!', sub: 'Two paths crossed at the same time.', color: '#f97316' },
  police: { title: 'PULLED OVER!', sub: 'In-game infringement notice issued.', color: '#3b82f6' },
  camera: { title: 'FLASH!', sub: 'Caught on camera.', color: '#f8fafc' },
  'emergency-brake': { title: 'EMERGENCY STOP!', sub: 'Someone on foot was in your path.', color: '#ef4444' },
  'parking-fine': { title: 'PARKING FINE!', sub: 'A ticket lands on your windscreen.', color: '#facc15' },
  roadworks: { title: 'DANGER ZONE!', sub: 'Road workers and cones everywhere.', color: '#f59e0b' },
  tailgate: { title: 'TOO CLOSE!', sub: 'No room to react.', color: '#f43f5e' },
  drift: { title: 'DRIFTING!', sub: 'Your car wanders across the line.', color: '#a78bfa' },
  'hard-stop': { title: 'SUDDEN STOP!', sub: 'Everything in the car keeps moving.', color: '#22d3ee' },
  siren: { title: 'BLOCKED!', sub: 'An emergency vehicle is stuck behind you.', color: '#ef4444' },
};

function Stage({ type }: { type: ConsequenceType }) {
  switch (type) {
    case 'near-miss':
    case 'tailgate':
      return (
        <svg viewBox="0 0 300 200" className="w-full h-full">
          <rect width="300" height="200" fill="#4b5563" />
          <rect x="125" width="50" height="200" fill="#374151" />
          <line x1="150" y1="0" x2="150" y2="200" stroke="#fff" strokeDasharray="10 10" strokeWidth="2" />
          {type === 'near-miss' ? (
            <>
              <g style={{ animation: 'cqA 1.3s ease-out forwards' }}><g transform="translate(137 200)"><VehicleTop color="blue" /></g></g>
              <g style={{ animation: 'cqB 1.3s ease-out forwards' }}><g transform="translate(-30 88) rotate(90)"><VehicleTop color="red" /></g></g>
            </>
          ) : (
            <>
              <g transform="translate(137 70)"><VehicleTop color="red" braking /></g>
              <g style={{ animation: 'cqTail 1.2s ease-out forwards' }}><g transform="translate(137 200)"><VehicleTop color="blue" /></g></g>
            </>
          )}
          <g style={{ animation: 'cqBurst 1.3s ease-out forwards', opacity: 0 }}>
            <polygon points="150,60 158,82 182,78 164,94 176,116 152,104 136,124 134,100 110,96 130,84 120,62 142,74" fill="#fde047" stroke="#f97316" strokeWidth="3" />
          </g>
        </svg>
      );
    case 'police':
      return (
        <svg viewBox="0 0 300 200" className="w-full h-full">
          <rect width="300" height="200" fill="#4b5563" />
          <line x1="150" y1="0" x2="150" y2="200" stroke="#fff" strokeDasharray="10 10" strokeWidth="2" />
          <g transform="translate(120 80)"><VehicleTop color="blue" /></g>
          <g style={{ animation: 'cqCop 1.2s ease-out forwards' }}><g transform="translate(120 250)"><VehicleTop color="police" /></g></g>
          <rect x="175" y="40" width="110" height="120" rx="6" fill="#fff" style={{ animation: 'cqTicket 1.4s ease-out forwards', opacity: 0 }} />
          <g style={{ animation: 'cqTicket 1.4s ease-out forwards', opacity: 0 }}>
            <text x="230" y="64" textAnchor="middle" fontSize="11" fontWeight="900" fill="#1d4ed8" fontFamily="Arial">GAME</text>
            <text x="230" y="78" textAnchor="middle" fontSize="11" fontWeight="900" fill="#1d4ed8" fontFamily="Arial">INFRINGEMENT</text>
            {[92, 104, 116, 128].map((y) => <rect key={y} x="188" y={y} width={y === 128 ? 50 : 84} height="5" fill="#cbd5e1" />)}
            <text x="230" y="150" textAnchor="middle" fontSize="10" fontWeight="900" fill="#dc2626" fontFamily="Arial">-50 SAFETY</text>
          </g>
        </svg>
      );
    case 'camera':
      return (
        <svg viewBox="0 0 300 200" className="w-full h-full">
          <rect width="300" height="200" fill="#1f2937" />
          <rect x="40" y="30" width="16" height="170" fill="#6b7280" />
          <rect x="28" y="20" width="40" height="66" rx="6" fill="#111827" stroke="#e5e7eb" />
          <circle cx="48" cy="38" r="9" fill="#ef4444" />
          <circle cx="48" cy="58" r="9" fill="#1f2937" />
          <rect x="190" y="30" width="70" height="44" rx="6" fill="#374151" stroke="#9ca3af" />
          <circle cx="225" cy="52" r="14" fill="#0f172a" stroke="#9ca3af" strokeWidth="3" />
          <g style={{ animation: 'cqDrive 1.2s linear forwards' }}><g transform="translate(150 230)"><VehicleTop color="yellow" /></g></g>
          <rect width="300" height="200" fill="#fff" style={{ animation: 'flash .7s .45s ease-out both', opacity: 0 }} />
        </svg>
      );
    case 'emergency-brake':
      return (
        <svg viewBox="0 0 300 200" className="w-full h-full">
          <rect width="300" height="200" fill="#4b5563" />
          {Array.from({ length: 9 }, (_, i) => <rect key={i} x={70 + i * 18} y="60" width="10" height="36" fill="#fff" />)}
          <g style={{ animation: 'cqPed 1.2s ease-in-out forwards' }}>
            <circle cx="140" cy="78" r="9" fill="#0ea5e9" stroke="#0f172a" strokeWidth="2" />
            <circle cx="140" cy="78" r="4.5" fill="#7c4a2d" />
          </g>
          <g style={{ animation: 'cqSkid 1s ease-out forwards' }}><g transform="translate(140 240)"><VehicleTop color="blue" braking /></g></g>
          <path d="M132 200 L132 150 M148 200 L148 150" stroke="#111" strokeWidth="5" opacity=".5" style={{ animation: 'flash 1.4s ease-out both' }} />
        </svg>
      );
    case 'parking-fine':
      return (
        <svg viewBox="0 0 300 200" className="w-full h-full">
          <rect width="300" height="200" fill="#0f172a" />
          <path d="M20 180 Q150 40 280 180 Z" fill="#1e3a8a" opacity=".6" />
          <g style={{ animation: 'cqTicketDrop 1.3s cubic-bezier(.2,1.4,.4,1) forwards' }}>
            <rect x="105" y="30" width="90" height="120" rx="4" fill="#fde047" transform="rotate(-6 150 90)" />
            <text x="150" y="68" textAnchor="middle" fontSize="12" fontWeight="900" fontFamily="Arial" transform="rotate(-6 150 90)">PARKING</text>
            <text x="150" y="84" textAnchor="middle" fontSize="12" fontWeight="900" fontFamily="Arial" transform="rotate(-6 150 90)">FINE</text>
            <text x="150" y="118" textAnchor="middle" fontSize="10" fontWeight="700" fontFamily="Arial" transform="rotate(-6 150 90)">(game only)</text>
          </g>
        </svg>
      );
    case 'roadworks':
      return (
        <svg viewBox="0 0 300 200" className="w-full h-full">
          <rect width="300" height="200" fill="#4b5563" />
          {[60, 110, 160, 210].map((x, i) => (
            <path key={x} d={`M${x - 12} 120 L${x} 80 L${x + 12} 120 Z`} fill="#f97316" stroke="#fff" strokeWidth="3" style={{ animation: `cqCone 1s ${i * 0.08}s ease-out forwards`, transformOrigin: `${x}px 120px` }} />
          ))}
          <g style={{ animation: 'cqDrive 1.1s ease-out forwards' }}><g transform="translate(130 240)"><VehicleTop color="yellow" /></g></g>
          <rect x="220" y="40" width="60" height="40" rx="4" fill="#fde047" stroke="#111" strokeWidth="2" />
          <text x="250" y="65" textAnchor="middle" fontSize="11" fontWeight="900" fontFamily="Arial">SLOW</text>
        </svg>
      );
    case 'drift':
      return (
        <svg viewBox="0 0 300 200" className="w-full h-full">
          <rect width="300" height="200" fill="#111827" />
          <line x1="150" y1="0" x2="150" y2="200" stroke="#fde047" strokeWidth="3" />
          <g style={{ animation: 'cqDrift 1.4s ease-in-out forwards' }}><g transform="translate(120 120)"><VehicleTop color="blue" /></g></g>
          <text x="90" y="60" fontSize="28" fontWeight="900" fill="#a78bfa" fontFamily="Arial" style={{ animation: 'float 1.2s ease-in-out infinite' }}>z z Z</text>
        </svg>
      );
    case 'hard-stop':
      return (
        <svg viewBox="0 0 300 200" className="w-full h-full">
          <rect width="300" height="200" fill="#0f172a" />
          <rect x="60" y="60" width="180" height="90" rx="20" fill="#334155" />
          <g style={{ animation: 'cqLurch 1s ease-out forwards' }}>
            <circle cx="150" cy="90" r="16" fill="#e7c9a9" stroke="#111" strokeWidth="2" />
            <rect x="134" y="106" width="32" height="30" rx="8" fill="#60a5fa" />
          </g>
          <text x="150" y="182" textAnchor="middle" fontSize="12" fontWeight="800" fill="#22d3ee" fontFamily="Arial">Belts hold you in place</text>
        </svg>
      );
    case 'siren':
      return (
        <svg viewBox="0 0 300 200" className="w-full h-full">
          <rect width="300" height="200" fill="#4b5563" />
          <line x1="150" y1="0" x2="150" y2="200" stroke="#fff" strokeDasharray="10 10" strokeWidth="2" />
          <g transform="translate(135 80)"><VehicleTop color="blue" /></g>
          <g style={{ animation: 'cqCop 1.2s ease-out forwards' }}><g transform="translate(135 250)"><VehicleTop color="ambulance" /></g></g>
          <rect width="300" height="200" style={{ animation: 'sirenLeft .5s linear infinite' }} opacity=".35" />
        </svg>
      );
  }
}

/** Plays for ~1.6s, then calls onDone. */
export function Consequence({ type, onDone }: { type: ConsequenceType; onDone: () => void }) {
  const reduced = useGame((s) => s.settings.reducedMotion);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    if (type === 'camera') setTimeout(() => sfx.camera(), 450);
    else if (type === 'police' || type === 'siren') sfx.siren();
    else if (type === 'emergency-brake' || type === 'tailgate' || type === 'near-miss') {
      sfx.skid();
      setTimeout(() => sfx.horn(), 250);
    } else sfx.wrong();
    const id = setTimeout(() => done.current(), reduced ? 900 : 1700);
    return () => clearTimeout(id);
  }, [type, reduced]);
  const c = COPY[type];
  return (
    <div className="fixed inset-0 z-[55] grid place-items-center bg-night-950/85 backdrop-blur-sm p-4" role="alert" aria-live="assertive">
      <style>{`
        @keyframes cqA { 0%{transform:translateY(0)} 70%{transform:translateY(-110px)} 100%{transform:translateY(-108px) rotate(-4deg)} }
        @keyframes cqB { 0%{transform:translateX(0)} 70%{transform:translateX(150px)} 100%{transform:translateX(148px)} }
        @keyframes cqBurst { 0%,55%{opacity:0;transform:scale(.4)} 70%{opacity:1;transform:scale(1.15)} 100%{opacity:1;transform:scale(1)} }
        @keyframes cqTail { 0%{transform:translateY(0)} 80%{transform:translateY(-92px)} 100%{transform:translateY(-90px)} }
        @keyframes cqCop { 0%{transform:translateY(0)} 100%{transform:translateY(-110px)} }
        @keyframes cqTicket { 0%,50%{opacity:0;transform:translateY(20px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes cqDrive { 0%{transform:translateY(0)} 100%{transform:translateY(-280px)} }
        @keyframes cqPed { 0%{transform:translateX(-80px)} 100%{transform:translateX(0)} }
        @keyframes cqSkid { 0%{transform:translateY(0)} 75%{transform:translateY(-118px) rotate(3deg)} 100%{transform:translateY(-116px) rotate(2deg)} }
        @keyframes cqTicketDrop { 0%{transform:translateY(-200px) rotate(-20deg)} 100%{transform:translateY(0) rotate(0)} }
        @keyframes cqCone { 0%{transform:rotate(0)} 60%{transform:rotate(0)} 100%{transform:rotate(80deg) translateY(10px)} }
        @keyframes cqDrift { 0%{transform:translateX(0) rotate(0)} 100%{transform:translateX(60px) rotate(14deg)} }
        @keyframes cqLurch { 0%{transform:translateY(0)} 40%{transform:translateY(-26px) scale(1.08)} 100%{transform:translateY(0)} }
      `}</style>
      <div className="w-full max-w-md text-center animate-pop">
        <div className="rounded-3xl overflow-hidden border-4 shadow-2xl aspect-[3/2]" style={{ borderColor: c.color }}>
          <Stage type={type} />
        </div>
        <div className="font-display text-5xl md:text-6xl mt-4 text-outline" style={{ color: c.color }}>{c.title}</div>
        <p className="text-night-200 font-bold mt-1">{c.sub}</p>
      </div>
    </div>
  );
}
