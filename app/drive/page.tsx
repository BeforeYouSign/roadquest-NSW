import { Suspense } from 'react';
import { DriveRoute } from '@/components/screens/DriveRoute';
import { Spinner } from '@/components/ui/bits';

export const metadata = { title: 'Drive' };

export default function DrivePage() {
  return (
    <Suspense fallback={<Spinner />}>
      <DriveRoute />
    </Suspense>
  );
}
