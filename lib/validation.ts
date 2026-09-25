// Registration validation — used in the browser AND re-checked on the server.

export const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

// Basic profanity / impersonation filter. Checked after "leetspeak" normalisation.
const BLOCKED = [
  'fuck', 'fuk', 'fck', 'shit', 'cunt', 'bitch', 'bastard', 'dick', 'cock', 'pussy', 'penis', 'vagina', 'boob', 'tits',
  'slut', 'whore', 'wank', 'twat', 'bollock', 'arse', 'asshole', 'dildo', 'porn', 'sex', 'rape', 'nazi', 'hitler',
  'nigg', 'nigga', 'fag', 'retard', 'spastic', 'kike', 'chink', 'coon', 'wog', 'abo', 'paki', 'tranny', 'dyke',
  'kill', 'suicide', 'murder', 'terror', 'isis', 'drug', 'cocaine', 'meth', 'weed', 'crack', 'piss', 'poo', 'crap', 'damn', 'bugger',
];
const WHOLE_WORD_ONLY = new Set(['abo', 'wog', 'coon', 'crack', 'weed', 'poo', 'arse', 'kill', 'dick', 'fag']);
const RESERVED = ['admin', 'administrator', 'moderator', 'mod', 'roadquest', 'official', 'support', 'staff', 'tfnsw', 'transportnsw', 'nswgov', 'nswgovernment', 'police', 'rms', 'servicensw', 'system', 'null', 'undefined', 'anonymous'];

function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/\$/g, 's')
    .replace(/@/g, 'a');
}

export function containsProfanity(input: string, wholeWordsOnly = false): boolean {
  const n = normalise(input);
  const compact = n.replace(/[^a-z]/g, '');
  const words = n.split(/[^a-z]+/).filter(Boolean);
  for (const w of BLOCKED) {
    if (wholeWordsOnly || WHOLE_WORD_ONLY.has(w)) {
      if (words.includes(w)) return true;
    } else if (compact.includes(w)) return true;
  }
  return false;
}

export function validateUsername(u: string): string | null {
  const v = u.trim();
  if (v.length < 3) return 'Username must be at least 3 characters.';
  if (v.length > 20) return 'Username must be 20 characters or fewer.';
  if (!USERNAME_RE.test(v)) return 'Use letters, numbers and underscores only (no spaces).';
  if (containsProfanity(v)) return "That username isn't allowed. Please choose another.";
  if (RESERVED.includes(v.toLowerCase().replace(/_/g, ''))) return 'That username is reserved.';
  return null;
}

export function validateName(n: string, label: string): string | null {
  const v = n.trim();
  if (!v) return `${label} is required.`;
  if (v.length > 40) return `${label} is too long.`;
  if (!/^[\p{L}][\p{L} '\-.]*$/u.test(v)) return `${label} can only contain letters, spaces, hyphens and apostrophes.`;
  return null;
}

export function normaliseSuburb(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/(^|[\s\-'])(\p{L})/gu, (_m, p1: string, p2: string) => p1 + p2.toUpperCase());
}

export function validateSuburb(s: string): string | null {
  const v = s.trim();
  if (v.length < 2) return 'Please enter your NSW suburb.';
  if (v.length > 40) return 'Suburb name is too long.';
  if (!/^[\p{L}][\p{L} '\-.]*$/u.test(v)) return 'Suburb can only contain letters, spaces, hyphens and apostrophes.';
  if (containsProfanity(v, true)) return 'Please enter a real NSW suburb.';
  return null;
}
