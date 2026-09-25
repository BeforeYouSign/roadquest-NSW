'use client';
import { useMemo, useState } from 'react';
import { Coins, Lock, Check, Award } from 'lucide-react';
import { CarProfile } from '@/components/art/CarProfile';
import { CARS, COSMETICS, ACHIEVEMENT_MAP, RARITY_STYLE } from '@/lib/config';
import { bumpCounter, defaultCustom, getState, pushToast, setGarage, spendCoins, useGame } from '@/lib/store';
import { levelFromXp } from '@/lib/scoring';
import { buyItem, saveProgress } from '@/lib/api';
import { processRewards, snapshot } from '@/lib/rewards';
import { IS_ONLINE } from '@/lib/env';
import { containsProfanity } from '@/lib/validation';
import { Tabs } from '@/components/ui/bits';
import { GameButton } from '@/components/ui/Button';
import { sfx } from '@/lib/sound';
import type { CarCustom, CarDef } from '@/lib/types';

type Slot = 'paints' | 'wheels' | 'roofs' | 'decals' | 'plates' | 'lplates' | 'interiors' | 'garages';
const SLOT_TABS: { id: Slot; label: string }[] = [
  { id: 'paints', label: 'Paint' },
  { id: 'wheels', label: 'Wheels' },
  { id: 'roofs', label: 'Roof' },
  { id: 'decals', label: 'Decals' },
  { id: 'plates', label: 'Plates' },
  { id: 'lplates', label: 'L-Plates' },
  { id: 'interiors', label: 'Interior' },
  { id: 'garages', label: 'Garage' },
];
const FIELD: Record<Slot, keyof CarCustom | 'background'> = { paints: 'paint', wheels: 'wheels', roofs: 'roof', decals: 'decal', plates: 'plate', lplates: 'lplate', interiors: 'interior', garages: 'background' };

interface Item { id: string; name: string; price: number; achievement?: string; hex?: string; bg?: string; from?: string; to?: string }

export function Garage() {
  const s = useGame((x) => x);
  const g = s.progress.garage;
  const [viewCar, setViewCar] = useState(g.current || 'zippy');
  const [slot, setSlot] = useState<Slot>('paints');
  const [busy, setBusy] = useState(false);
  const lvl = levelFromXp(s.stats.xp).level;
  const car = CARS.find((c) => c.id === viewCar) ?? CARS[0];
  const owned = g.owned.includes(car.id);
  const custom = g.custom[car.id] ?? defaultCustom(car.id);
  const bg = COSMETICS.garages.find((x) => x.id === g.background) ?? COSMETICS.garages[0];

  const carLock = (c: CarDef): string | null => {
    if (g.owned.includes(c.id)) return null;
    if (c.achievement && !s.progress.achievements[c.achievement]) return `Unlock: ${ACHIEVEMENT_MAP[c.achievement]?.name ?? 'achievement'}`;
    if (c.levelRequired && lvl < c.levelRequired) return `Reach level ${c.levelRequired}`;
    return null;
  };

  const purchase = async (kind: 'car' | 'cosmetic', id: string, price: number, onOk: () => void) => {
    if (busy) return;
    if (s.stats.coins < price) {
      pushToast({ kind: 'info', title: 'Not enough coins', body: `You need ${price - s.stats.coins} more coins. Play challenges to earn more!` });
      return;
    }
    setBusy(true);
    const before = snapshot();
    const r = await buyItem(kind, id);
    setBusy(false);
    if (!r.ok) {
      pushToast({ kind: 'info', title: 'Purchase failed', body: r.error });
      return;
    }
    if (!IS_ONLINE) spendCoins(price);
    sfx.coin();
    onOk();
    processRewards(before);
  };

  const buyCar = () =>
    purchase('car', car.id, car.price, () => {
      const cur = getState().progress.garage;
      setGarage({ owned: [...cur.owned, car.id], current: car.id, custom: { ...cur.custom, [car.id]: cur.custom[car.id] ?? defaultCustom(car.id) } });
      pushToast({ kind: 'unlock', title: `${car.name} unlocked!`, body: 'Now in your garage.', icon: 'Car' });
    });

  const claimCar = () => {
    const before = snapshot();
    const cur = getState().progress.garage;
    setGarage({ owned: [...cur.owned, car.id], current: car.id, custom: { ...cur.custom, [car.id]: cur.custom[car.id] ?? defaultCustom(car.id) } });
    pushToast({ kind: 'unlock', title: `${car.name} claimed!`, body: 'A rare reward for your achievements.', icon: 'Award' });
    sfx.achievement();
    processRewards(before);
  };

  const items = COSMETICS[slot] as Item[];
  const current = FIELD[slot] === 'background' ? g.background : custom[FIELD[slot] as keyof CarCustom];

  const apply = (item: Item) => {
    const key = `${slot}:${item.id}`;
    const has = g.cosmetics.includes(key) || (item.price === 0 && !item.achievement);
    const locked = item.achievement && !s.progress.achievements[item.achievement];
    const doApply = () => {
      const cur = getState().progress.garage;
      if (FIELD[slot] === 'background') setGarage({ background: item.id, cosmetics: Array.from(new Set([...cur.cosmetics, key])) });
      else setGarage({ custom: { ...cur.custom, [car.id]: { ...(cur.custom[car.id] ?? defaultCustom(car.id)), [FIELD[slot]]: item.id } }, cosmetics: Array.from(new Set([...cur.cosmetics, key])) });
      bumpCounter('customised');
      saveProgress();
      sfx.tap();
    };
    if (locked) return pushToast({ kind: 'info', title: 'Locked', body: `Earn "${ACHIEVEMENT_MAP[item.achievement!]?.name}" to unlock.` });
    if (FIELD[slot] !== 'background' && !owned) return pushToast({ kind: 'info', title: 'Own this car first', body: 'Unlock the car to customise it.' });
    if (has || item.price === 0) return doApply();
    void purchase('cosmetic', key, item.price, doApply);
  };

  const [plateText, setPlateText] = useState(custom.plateText);
  const savePlate = () => {
    const t = plateText.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
    if (!t || containsProfanity(t)) return pushToast({ kind: 'info', title: 'Plate not allowed', body: 'Use 1–7 letters or numbers (keep it clean!).' });
    const cur = getState().progress.garage;
    setGarage({ custom: { ...cur.custom, [car.id]: { ...(cur.custom[car.id] ?? defaultCustom(car.id)), plateText: t } } });
    bumpCounter('customised');
    saveProgress();
    pushToast({ kind: 'info', title: 'Plate updated', body: t });
  };

  const sortedCars = useMemo(() => [...CARS].sort((a, b) => Number(!!a.achievement) - Number(!!b.achievement) || a.price - b.price), []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <div className="text-xs font-extrabold tracking-[.25em] text-aqua-400">COSMETIC ONLY · NO REAL MONEY</div>
          <h1 className="font-display text-4xl md:text-5xl">Garage</h1>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 font-display text-xl"><Coins className="w-6 h-6 text-sun-400" /> {s.stats.coins.toLocaleString()}</div>
      </div>

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-5">
        <div className="min-w-0">
          <div className="rounded-[1.75rem] p-4 md:p-8 border border-white/10 relative overflow-hidden" style={{ background: `linear-gradient(160deg, ${bg.from}, ${bg.to})` }}>
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" aria-hidden="true" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-extrabold tracking-widest px-2 py-0.5 rounded-full" style={{ color: RARITY_STYLE[car.rarity].color, background: `${RARITY_STYLE[car.rarity].color}22` }}>{RARITY_STYLE[car.rarity].label}</span>
                <span className="text-xs text-night-200 font-bold">{car.class}</span>
              </div>
              <div className="font-display text-3xl md:text-4xl">{car.name}</div>
              <CarProfile car={car} custom={custom} className={`w-full h-auto mt-2 ${owned ? '' : 'opacity-70 grayscale-[.3]'}`} />
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {owned ? (
                  g.current === car.id ? (
                    <span className="rounded-xl bg-leaf-500 text-night-950 font-display px-4 py-2 flex items-center gap-1"><Check className="w-5 h-5" /> Driving this</span>
                  ) : (
                    <GameButton tone="leaf" onClick={() => { setGarage({ current: car.id }); saveProgress(); }}>Drive this car</GameButton>
                  )
                ) : carLock(car) ? (
                  <span className="rounded-xl bg-white/10 font-bold px-4 py-2 flex items-center gap-2"><Lock className="w-4 h-4" /> {carLock(car)}</span>
                ) : car.achievement ? (
                  <GameButton tone="grape" onClick={claimCar}><Award className="w-5 h-5" /> Claim reward car</GameButton>
                ) : (
                  <GameButton tone="sun" onClick={() => void buyCar()} disabled={busy}><Coins className="w-5 h-5" /> Buy for {car.price.toLocaleString()}</GameButton>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-3 overflow-x-auto no-scrollbar pb-2" role="listbox" aria-label="Cars">
            {sortedCars.map((c) => {
              const lock = carLock(c);
              const mine = g.owned.includes(c.id);
              return (
                <button key={c.id} onClick={() => { setViewCar(c.id); setPlateText((g.custom[c.id] ?? defaultCustom(c.id)).plateText); }} role="option" aria-selected={viewCar === c.id} className={`shrink-0 w-36 card-game p-2 text-left focus-ring ${viewCar === c.id ? 'border-sun-400 ring-2 ring-sun-400/40' : ''}`}>
                  <CarProfile car={c} custom={g.custom[c.id] ?? defaultCustom(c.id)} className={`w-full h-14 ${lock ? 'opacity-40 grayscale' : ''}`} showPlates={false} />
                  <div className="font-display text-sm leading-tight truncate">{c.name}</div>
                  <div className="text-[10px] font-bold truncate" style={{ color: RARITY_STYLE[c.rarity].color }}>
                    {mine ? 'OWNED' : lock ? '🔒 ' + (c.achievement ? 'Achievement' : `Lvl ${c.levelRequired}`) : c.price ? `${c.price.toLocaleString()} coins` : 'FREE'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card-game p-4 md:p-5 min-w-0">
          <div className="font-display text-2xl mb-3">Customise</div>
          <Tabs tabs={SLOT_TABS} value={slot} onChange={setSlot} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
            {items.map((item) => {
              const key = `${slot}:${item.id}`;
              const has = g.cosmetics.includes(key) || (item.price === 0 && !item.achievement);
              const locked = !!item.achievement && !s.progress.achievements[item.achievement];
              const active = current === item.id;
              return (
                <button key={item.id} onClick={() => apply(item)} className={`rounded-2xl p-3 border-2 text-left transition focus-ring ${active ? 'border-sun-400 bg-sun-500/10' : 'border-white/10 bg-night-800 hover:border-white/30'} ${locked ? 'opacity-50' : ''}`} aria-pressed={active}>
                  <Swatch slot={slot} item={item} />
                  <div className="font-bold text-sm mt-2 leading-tight">{item.name}</div>
                  <div className="text-[11px] font-extrabold mt-0.5">
                    {active ? <span className="text-leaf-400">EQUIPPED</span> : locked ? <span className="text-grape-300">🔒 {ACHIEVEMENT_MAP[item.achievement!]?.name}</span> : has ? <span className="text-night-300">OWNED</span> : <span className="text-sun-400">🪙 {item.price}</span>}
                  </div>
                </button>
              );
            })}
          </div>
          {slot === 'plates' && owned && (
            <div className="mt-4">
              <label htmlFor="plate" className="text-xs font-extrabold uppercase tracking-widest text-night-300">Custom plate text</label>
              <div className="flex gap-2 mt-1">
                <input id="plate" value={plateText} onChange={(e) => setPlateText(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7))} className="flex-1 rounded-xl bg-night-800 border-2 border-white/10 px-3 py-2 font-display text-xl tracking-widest uppercase focus:border-sun-400 outline-none" maxLength={7} />
                <GameButton tone="sun" onClick={savePlate}>Save</GameButton>
              </div>
              <p className="text-[11px] text-night-400 mt-1">Game plates only — not real registration plates.</p>
            </div>
          )}
          <p className="text-xs text-night-400 mt-4">Coins are earned only by playing. There are no loot boxes and nothing to buy with real money.</p>
        </div>
      </div>
    </div>
  );
}

function Swatch({ slot, item }: { slot: Slot; item: Item }) {
  if (slot === 'paints' || slot === 'interiors') return <div className="h-10 rounded-xl border border-white/20" style={{ background: item.hex }} />;
  if (slot === 'plates' || slot === 'lplates') return <div className="h-10 rounded-xl grid place-items-center font-display border border-black/40" style={{ background: item.bg, color: (item as { fg?: string }).fg }}>{slot === 'lplates' ? 'L' : 'ABC123'}</div>;
  if (slot === 'garages') return <div className="h-10 rounded-xl" style={{ background: `linear-gradient(135deg, ${item.from}, ${item.to})` }} />;
  return <div className="h-10 rounded-xl bg-white/5 grid place-items-center text-xl" aria-hidden="true">{slot === 'wheels' ? '⚙️' : slot === 'roofs' ? '🏄' : '✨'}</div>;
}

