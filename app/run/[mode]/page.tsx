import { Suspense } from 'react';
import { RunRoute } from '@/components/screens/RunRoute';
import { Spinner } from '@/components/ui/bits';

export const metadata = { title: 'Play' };

export default function RunPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <RunRoute />
    </Suspense>
  );
}
