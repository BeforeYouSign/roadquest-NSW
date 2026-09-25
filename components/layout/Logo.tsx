export function LogoMark({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="lm" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#ffd84d" />
          <stop offset="1" stopColor="#ff7a1a" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="44" height="44" rx="8" transform="rotate(45 32 32)" fill="url(#lm)" stroke="#050915" strokeWidth="3" />
      <path d="M26 46 L30 18 L34 18 L38 46 Z" fill="#050915" />
      <path d="M31.2 22 L32.8 22 L33 28 L31 28 Z M30.7 32 L33.3 32 L33.6 39 L30.4 39 Z" fill="#ffd84d" />
    </svg>
  );
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display tracking-wide leading-none ${className}`}>
      <span className="text-white">ROAD</span>
      <span className="text-sun-400">QUEST</span>
      <span className="ml-1 text-aqua-400 text-[0.7em] align-top">NSW</span>
    </span>
  );
}
