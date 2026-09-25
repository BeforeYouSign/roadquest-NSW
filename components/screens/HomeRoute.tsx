'use client';
import { useGame } from '@/lib/store';
import { Landing } from './Landing';
import { Dashboard } from './Dashboard';
import { Spinner } from '@/components/ui/bits';

export function HomeRoute() {
  const hydrated = useGame((s) => s.hydrated);
  const hasProfile = useGame((s) => !!s.profile);
  if (!hydrated) return <Spinner label="Starting RoadQuest" />;
  return hasProfile ? <Dashboard /> : <Landing />;
}
