import { RequireProfile } from '@/components/screens/RequireProfile';
import { MapScreen } from '@/components/screens/MapScreen';

export const metadata = { title: 'Map' };

export default function Page() {
  return (
    <RequireProfile>
      <MapScreen />
    </RequireProfile>
  );
}
