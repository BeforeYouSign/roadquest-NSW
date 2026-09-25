'use client';
import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/lib/store';
import { Spinner } from '@/components/ui/bits';

/** Sends players without a profile to the registration flow. */
export function RequireProfile({ children }: { children: ReactNode }) {
  const hydrated = useGame((s) => s.hydrated);
  const hasProfile = useGame((s) => !!s.profile);
  const router = useRouter();
  useEffect(() => {
    if (hydrated && !hasProfile) router.replace('/start');
  }, [hydrated, hasProfile, router]);
  if (!hydrated || !hasProfile) return <Spinner />;
  return <>{children}</>;
}
