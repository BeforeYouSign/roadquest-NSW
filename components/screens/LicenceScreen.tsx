'use client';
import { useRef, useState } from 'react';
import { Check, Download, Lock, Share2, X } from 'lucide-react';
import { useGame, setLicence, pushToast } from '@/lib/store';
import { accuracy, finalTestUnlocked, licenceEligible, licenceNumber, masteryOf } from '@/lib/progression';
import { GAME, MASTERY_CATEGORIES } from '@/lib/config';
import { formatDate } from '@/lib/time';
import { GameButton, GameLink } from '@/components/ui/Button';
import { Confetti } from '@/components/game/Confetti';
import { skillTier } from '@/lib/scoring';

export function LicenceScreen() {
  const s = useGame((x) => x);
  const svgRef = useRef<SVGSVGElement>(null);
  const [busy, setBusy] = useState(false);
  const mastery = masteryOf(s);
  const lic = s.progress.licence;
  const eligible = licenceEligible(s, mastery);

  // If the player became eligible later (e.g. mastery reached after passing), let them claim.
  const claim = () => {
    if (!s.profile) return;
    setLicence({ number: licenceNumber(s.profile.id), awardedAt: Date.now(), skill: Math.round(s.stats.skill), accuracy: accuracy(s) });
    pushToast({ kind: 'unlock', title: 'VIRTUAL LEARNER LICENCE EARNED!', icon: 'IdCard' });
  };

  const toPng = async (): Promise<Blob | null> => {
    const svg = svgRef.current;
    if (!svg) return null;
    const xml = new XMLSerializer().serializeToString(svg);
    const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }));
    try {
      const img = new Image();
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error('image'));
        img.src = url;
      });
      const c = document.createElement('canvas');
      c.width = 1200;
      c.height = 760;
      const ctx = c.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0, c.width, c.height);
      return await new Promise((res) => c.toBlob((b) => res(b), 'image/png'));
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const download = async () => {
    setBusy(true);
    const b = await toPng();
    setBusy(false);
    if (!b) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = `roadquest-virtual-licence-${s.profile?.username ?? 'player'}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const share = async () => {
    const b = await toPng();
    if (!b) return;
    const file = new File([b], 'roadquest-licence.png', { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      await nav.share({ files: [file], title: 'My RoadQuest Virtual Learner Licence', text: 'I earned my RoadQuest NSW virtual game licence!' }).catch(() => undefined);
    } else void download();
  };

  const checks = [
    { ok: finalTestUnlocked(s, mastery), label: 'Reach the TEST READY licence rank' },
    { ok: MASTERY_CATEGORIES.every((c) => (mastery[c.id] ?? 0) >= GAME.licence.requiredCategoryMastery), label: `${Math.round(GAME.licence.requiredCategoryMastery * 100)}% mastery in every category` },
    { ok: s.progress.finalPassed, label: 'Pass the Ultimate NSW Learner Test' },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      {lic && <Confetti count={40} />}
      <div className="text-xs font-extrabold tracking-[.25em] text-aqua-400">ROADQUEST</div>
      <h1 className="font-display text-4xl md:text-5xl mb-6">Virtual Learner Licence</h1>
      {lic ? (
        <div className="animate-pop">
          <LicenceCard svgRef={svgRef} username={s.profile?.username ?? ''} number={lic.number} date={formatDate(lic.awardedAt)} skill={lic.skill} acc={lic.accuracy} />
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <GameButton tone="sun" size="lg" onClick={() => void download()} disabled={busy}><Download className="w-5 h-5" /> Download image</GameButton>
            <GameButton tone="aqua" size="lg" onClick={() => void share()}><Share2 className="w-5 h-5" /> Share</GameButton>
          </div>
          <p className="text-center text-xs text-night-400 mt-4">This is a virtual game achievement. It is NOT a government licence and cannot be used to drive.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div className="relative">
            <div className="blur-[2px] opacity-40 pointer-events-none" aria-hidden="true">
              <LicenceCard username={s.profile?.username ?? 'You'} number="RQ-????-????" date="—" skill={Math.round(s.stats.skill)} acc={accuracy(s)} />
            </div>
            <div className="absolute inset-0 grid place-items-center"><Lock className="w-16 h-16 text-white drop-shadow-xl" /></div>
          </div>
          <div className="card-game p-5">
            <div className="font-display text-2xl mb-3">How to earn it</div>
            <ul className="space-y-2">
              {checks.map((c) => (
                <li key={c.label} className="flex items-center gap-3">
                  <span className={`grid place-items-center w-8 h-8 rounded-xl ${c.ok ? 'bg-leaf-500 text-night-950' : 'bg-white/10 text-night-300'}`}>{c.ok ? <Check className="w-5 h-5" strokeWidth={3} /> : <X className="w-4 h-4" />}</span>
                  <span className={c.ok ? 'font-bold' : 'text-night-300'}>{c.label}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex gap-2 flex-wrap">
              {eligible ? <GameButton tone="leaf" onClick={claim}>Claim my licence</GameButton> : finalTestUnlocked(s, mastery) ? <GameLink href="/run/final" tone="sun">Take the Ultimate Test</GameLink> : <GameLink href="/map" tone="sun">Continue the journey</GameLink>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LicenceCard({ svgRef, username, number, date, skill, acc }: { svgRef?: React.Ref<SVGSVGElement>; username: string; number: string; date: string; skill: number; acc: number }) {
  const tier = skillTier(skill);
  return (
    <svg ref={svgRef} viewBox="0 0 600 380" className="w-full max-w-2xl mx-auto h-auto drop-shadow-2xl" role="img" aria-label={`RoadQuest virtual game licence for ${username}. Not a government licence.`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lcBg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset=".5" stopColor="#ff4d8d" />
          <stop offset="1" stopColor="#ff7a1a" />
        </linearGradient>
        <pattern id="lcDots" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.4" fill="#fff" opacity=".18" />
        </pattern>
      </defs>
      <rect width="600" height="380" rx="28" fill="url(#lcBg)" />
      <rect width="600" height="380" rx="28" fill="url(#lcDots)" />
      <rect x="14" y="14" width="572" height="352" rx="20" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="2" strokeDasharray="10 8" />
      <text x="36" y="62" fontFamily="Arial Black, Arial" fontWeight="900" fontSize="30" fill="#fff">ROAD<tspan fill="#ffd84d">QUEST</tspan><tspan fontSize="16" fill="#0b1022"> NSW</tspan></text>
      <text x="36" y="90" fontFamily="Arial" fontWeight="800" fontSize="15" fill="#0b1022" letterSpacing="3">VIRTUAL LEARNER LICENCE</text>
      <rect x="36" y="114" width="150" height="180" rx="18" fill="#0b1022" opacity=".85" />
      <text x="111" y="222" textAnchor="middle" fontFamily="Arial Black, Arial" fontWeight="900" fontSize="96" fill="#ffd84d">{username.slice(0, 1).toUpperCase()}</text>
      <rect x="86" y="248" width="50" height="34" rx="6" fill="#ffd84d" />
      <text x="111" y="275" textAnchor="middle" fontFamily="Arial Black, Arial" fontSize="28" fill="#0b1022">L</text>
      <g fontFamily="Arial" fill="#fff">
        <text x="212" y="136" fontSize="12" fontWeight="800" opacity=".8" letterSpacing="2">USERNAME</text>
        <text x="212" y="166" fontSize="30" fontWeight="900">{username}</text>
        <text x="212" y="200" fontSize="12" fontWeight="800" opacity=".8" letterSpacing="2">GAME LICENCE NO.</text>
        <text x="212" y="224" fontSize="22" fontWeight="900" fontFamily="Courier New, monospace">{number}</text>
        <text x="212" y="258" fontSize="12" fontWeight="800" opacity=".8" letterSpacing="2">ACHIEVED</text>
        <text x="212" y="280" fontSize="18" fontWeight="900">{date}</text>
        <text x="392" y="258" fontSize="12" fontWeight="800" opacity=".8" letterSpacing="2">SKILL · ACCURACY</text>
        <text x="392" y="280" fontSize="18" fontWeight="900">{skill.toLocaleString()} {tier.name} · {Math.round(acc * 100)}%</text>
      </g>
      <rect x="36" y="310" width="528" height="40" rx="12" fill="#0b1022" />
      <text x="300" y="336" textAnchor="middle" fontFamily="Arial Black, Arial" fontSize="15" fill="#ffd84d" letterSpacing="1.5">VIRTUAL GAME LICENCE · NOT A GOVERNMENT LICENCE</text>
      <circle cx="530" cy="70" r="34" fill="#ffd84d" stroke="#0b1022" strokeWidth="4" />
      <text x="530" y="66" textAnchor="middle" fontFamily="Arial Black, Arial" fontSize="12" fill="#0b1022">TEST</text>
      <text x="530" y="82" textAnchor="middle" fontFamily="Arial Black, Arial" fontSize="12" fill="#0b1022">PASSED</text>
    </svg>
  );
}
