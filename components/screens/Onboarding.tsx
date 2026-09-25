'use client';
// First-time experience: splash → register → starter car → tutorial → first drive.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Loader2, Lock, ShieldCheck, X } from 'lucide-react';
import { GameButton } from '@/components/ui/Button';
import { LogoMark, Wordmark } from '@/components/layout/Logo';
import { CarProfile } from '@/components/art/CarProfile';
import { DriveGame } from '@/components/drive/DriveGame';
import { CARS, GAME } from '@/lib/config';
import { defaultCustom, setOnboarded, useGame } from '@/lib/store';
import { normaliseSuburb, validateName, validateSuburb, validateUsername } from '@/lib/validation';
import { checkUsername, registerPlayer } from '@/lib/api';
import { QUESTION_MAP } from '@/lib/questions';
import suburbs from '@/data/config/suburbs.json';
import { IS_DEMO } from '@/lib/env';

type Step = 'splash' | 'register' | 'car' | 'tutorial' | 'drive';

const TUTORIAL_LEVEL = {
  id: 'first-drive',
  name: 'Your First Drive',
  theme: { scenery: 'suburb', env: 'day' as const, lanes: 2, speedLimit: 50, grass: '#4caf50' },
  events: ['tutorial-gas', 'tutorial-lane', 'stop', 'checkpoint'],
};

export function Onboarding() {
  const router = useRouter();
  const hydrated = useGame((s) => s.hydrated);
  const profile = useGame((s) => s.profile);
  const onboarded = useGame((s) => s.onboarded);
  const [step, setStep] = useState<Step>('splash');
  const [form, setForm] = useState({ firstName: '', surname: '', username: '', suburb: '' });
  const [car, setCar] = useState('zippy');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [avail, setAvail] = useState<'idle' | 'checking' | 'ok' | 'taken'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [tut, setTut] = useState(0);
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (profile && onboarded) router.replace('/');
    else if (profile && step === 'splash') setStep('tutorial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const errors = useMemo(
    () => ({
      firstName: validateName(form.firstName, 'First name'),
      surname: validateName(form.surname, 'Surname'),
      username: validateUsername(form.username),
      suburb: validateSuburb(form.suburb),
    }),
    [form],
  );

  useEffect(() => {
    if (errors.username) {
      setAvail('idle');
      return;
    }
    setAvail('checking');
    if (checkTimer.current) clearTimeout(checkTimer.current);
    checkTimer.current = setTimeout(async () => {
      try {
        const r = await checkUsername(form.username.trim());
        setAvail(r.available ? 'ok' : 'taken');
      } catch {
        setAvail('idle');
      }
    }, 450);
  }, [form.username, errors.username]);

  const valid = !errors.firstName && !errors.surname && !errors.username && !errors.suburb && avail !== 'taken';

  const submit = async () => {
    setTouched({ firstName: true, surname: true, username: true, suburb: true });
    if (!valid) return;
    setStep('car');
  };

  const finishRegistration = async () => {
    setSubmitting(true);
    setServerError(null);
    const r = await registerPlayer({ firstName: form.firstName.trim(), surname: form.surname.trim(), username: form.username.trim(), suburb: normaliseSuburb(form.suburb), starterCar: car });
    setSubmitting(false);
    if (!r.ok) {
      setServerError(r.error);
      if (r.error.toLowerCase().includes('taken')) {
        setAvail('taken');
        setStep('register');
      }
      return;
    }
    setStep('tutorial');
  };

  if (step === 'drive') {
    const q = QUESTION_MAP['si052'] ?? QUESTION_MAP['in014'];
    return <DriveGame level={TUTORIAL_LEVEL} questions={q ? [q] : []} mode="onboarding" tutorial exitHref="/" onDone={() => setOnboarded(true)} />;
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <div className="mx-auto w-full max-w-xl px-4 py-6 flex-1 flex flex-col">
        {step !== 'splash' && (
          <div className="flex items-center gap-2 mb-6">
            <LogoMark className="w-8 h-8" />
            <Wordmark className="text-lg" />
            <div className="ml-auto flex gap-1.5" aria-label="Setup progress">
              {(['register', 'car', 'tutorial'] as Step[]).map((s, i) => (
                <span key={s} className={`h-2 rounded-full transition-all ${['register', 'car', 'tutorial'].indexOf(step) >= i ? 'w-8 bg-sun-400' : 'w-4 bg-white/15'}`} />
              ))}
            </div>
          </div>
        )}

        {step === 'splash' && (
          <button className="flex-1 flex flex-col items-center justify-center text-center gap-6 focus-ring rounded-3xl" onClick={() => setStep('register')} aria-label="Tap to start">
            <div className="animate-float"><LogoMark className="w-28 h-28" /></div>
            <Wordmark className="text-4xl sm:text-6xl" />
            <p className="font-display text-xl text-night-200 leading-snug">LEARN THE ROAD.<br />BEAT THE TEST.<br /><span className="text-sun-400">RULE YOUR SUBURB.</span></p>
            <span className="mt-6 font-display text-lg text-aqua-400 animate-pulse">TAP TO START</span>
          </button>
        )}

        {step === 'register' && (
          <form
            className="animate-slide-up"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
            noValidate
          >
            <h1 className="font-display text-4xl mb-1">Create your driver</h1>
            <p className="text-night-300 mb-5">No password needed — your profile is saved securely to this device.</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} onBlur={() => setTouched({ ...touched, firstName: true })} error={touched.firstName ? errors.firstName : null} autoComplete="given-name" />
              <Field label="Surname" value={form.surname} onChange={(v) => setForm({ ...form, surname: v })} onBlur={() => setTouched({ ...touched, surname: true })} error={touched.surname ? errors.surname : null} autoComplete="family-name" />
            </div>
            <div className="mt-3 rounded-2xl bg-leaf-600/10 border border-leaf-500/30 px-3 py-2 text-xs text-leaf-300 flex gap-2">
              <Lock className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>Your first name and surname are <b>private</b> and never shown publicly. Other players only ever see your <b>username</b> and <b>suburb</b>.</span>
            </div>
            <div className="mt-4">
              <Field
                label="Username"
                value={form.username}
                onChange={(v) => setForm({ ...form, username: v.replace(/\s/g, '') })}
                onBlur={() => setTouched({ ...touched, username: true })}
                error={(touched.username || form.username.length > 2) ? errors.username ?? (avail === 'taken' ? 'That username is already taken.' : null) : null}
                hint="3–20 letters, numbers or underscores. e.g. RoadKing87"
                autoComplete="off"
                right={avail === 'checking' ? <Loader2 className="w-5 h-5 animate-spin text-night-300" /> : avail === 'ok' ? <Check className="w-5 h-5 text-leaf-400" aria-label="available" /> : avail === 'taken' ? <X className="w-5 h-5 text-danger-400" aria-label="taken" /> : null}
                maxLength={20}
              />
            </div>
            <div className="mt-4">
              <Field label="NSW suburb" value={form.suburb} onChange={(v) => setForm({ ...form, suburb: v })} onBlur={() => setTouched({ ...touched, suburb: true })} error={touched.suburb ? errors.suburb : null} hint="You'll compete for your suburb in the NSW Suburb Championship." list="suburb-list" autoComplete="address-level2" maxLength={40} />
              <datalist id="suburb-list">
                {(suburbs as string[]).map((s) => <option key={s} value={s} />)}
              </datalist>
            </div>
            {form.username && !errors.username && (
              <div className="mt-5 card-game p-4">
                <div className="text-[11px] font-extrabold uppercase tracking-widest text-night-300 mb-2">How you&apos;ll appear on leaderboards</div>
                <div className="flex items-center gap-3">
                  <span className="font-display text-sun-400 text-xl">#1</span>
                  <span className="font-bold">{form.username}</span>
                  <span className="text-night-300 text-sm">{form.suburb ? normaliseSuburb(form.suburb) : 'Your suburb'}</span>
                </div>
              </div>
            )}
            {serverError && <p className="mt-4 text-danger-400 font-bold" role="alert">{serverError}</p>}
            <GameButton type="submit" tone="sun" size="lg" full className="mt-6" disabled={avail === 'checking'}>
              Next: choose your car <ArrowRight className="w-5 h-5" />
            </GameButton>
            <p className="mt-3 text-[11px] text-night-400 text-center">
              By continuing you agree to the <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy</a> notes. {IS_DEMO && 'Demo mode: your profile stays on this device.'}
            </p>
          </form>
        )}

        {step === 'car' && (
          <div className="animate-slide-up">
            <h1 className="font-display text-4xl mb-1">Choose your starter car</h1>
            <p className="text-night-300 mb-5">Cars are cosmetic — they never change your answers. Unlock more in the Garage.</p>
            <div className="grid gap-3">
              {CARS.filter((c) => c.starter).map((c) => (
                <button key={c.id} onClick={() => setCar(c.id)} className={`card-game p-3 flex items-center gap-3 text-left transition focus-ring ${car === c.id ? 'border-sun-400 ring-2 ring-sun-400/50' : ''}`} aria-pressed={car === c.id}>
                  <CarProfile car={c} custom={{ ...defaultCustom(c.id), plateText: form.username.slice(0, 7).toUpperCase() || 'L3ARN' }} className="w-40 h-20 shrink-0" />
                  <div>
                    <div className="font-display text-xl">{c.name}</div>
                    <div className="text-sm text-night-300">{c.class}</div>
                  </div>
                  {car === c.id && <Check className="ml-auto w-7 h-7 text-sun-400" />}
                </button>
              ))}
            </div>
            {serverError && <p className="mt-4 text-danger-400 font-bold" role="alert">{serverError}</p>}
            <div className="flex gap-3 mt-6">
              <GameButton tone="dark" onClick={() => setStep('register')}>Back</GameButton>
              <GameButton tone="sun" size="lg" className="flex-1" onClick={() => void finishRegistration()} disabled={submitting}>
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Get my keys <ArrowRight className="w-5 h-5" /></>}
              </GameButton>
            </div>
          </div>
        )}

        {step === 'tutorial' && (
          <div className="animate-slide-up flex-1 flex flex-col">
            {[
              { t: 'Drive', b: 'Hold GAS to go, BRAKE to slow down. On a keyboard use ↑ and ↓ (or W/S).', e: '🚗' },
              { t: 'Signal first', b: 'Tap an INDICATOR before you change lanes (Q/E on a keyboard). Forgetting has consequences!', e: '↔️' },
              { t: 'Make the call', b: 'Decision points pause the road and test a real NSW road rule. Wrong calls show you what happens — then teach you why.', e: '🟦' },
            ].map((c, i) =>
              i === tut ? (
                <div key={c.t} className="card-game p-8 text-center flex-1 flex flex-col items-center justify-center animate-pop">
                  <div className="text-6xl mb-4" aria-hidden="true">{c.e}</div>
                  <div className="text-xs font-extrabold tracking-[.3em] text-aqua-400 mb-1">TIP {i + 1} OF 3</div>
                  <h2 className="font-display text-3xl mb-3">{c.t}</h2>
                  <p className="text-night-200 text-lg max-w-sm">{c.b}</p>
                </div>
              ) : null,
            )}
            <div className="flex gap-3 mt-5">
              {tut < 2 ? (
                <>
                  <GameButton tone="dark" onClick={() => setStep('drive')}>Skip</GameButton>
                  <GameButton tone="sun" size="lg" className="flex-1" onClick={() => setTut(tut + 1)}>Next <ArrowRight className="w-5 h-5" /></GameButton>
                </>
              ) : (
                <GameButton tone="sun" size="xl" full onClick={() => setStep('drive')}>Start your first drive</GameButton>
              )}
            </div>
            <p className="mt-4 text-xs text-night-400 flex gap-2 justify-center"><ShieldCheck className="w-4 h-4" aria-hidden="true" /> {GAME.branding.disclaimer.split('.')[0]}.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, onBlur, error, hint, right, ...rest }: { label: string; value: string; onChange: (v: string) => void; onBlur?: () => void; error?: string | null; hint?: string; right?: React.ReactNode; autoComplete?: string; list?: string; maxLength?: number }) {
  const id = `f-${label.replace(/\s/g, '').toLowerCase()}`;
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-extrabold uppercase tracking-widest text-night-300 mb-1.5">{label}</label>
      <div className="relative">
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          className={`w-full rounded-2xl bg-night-800 border-2 px-4 py-3.5 text-lg font-bold outline-none transition placeholder:text-night-500 focus:border-sun-400 ${error ? 'border-danger-400' : 'border-white/10'} ${right ? 'pr-11' : ''}`}
          {...rest}
        />
        {right && <span className="absolute right-3 top-1/2 -translate-y-1/2">{right}</span>}
      </div>
      {error ? <p id={`${id}-err`} className="mt-1 text-sm font-bold text-danger-400">{error}</p> : hint ? <p id={`${id}-hint`} className="mt-1 text-xs text-night-400">{hint}</p> : null}
    </div>
  );
}
