import { RequireProfile } from '@/components/screens/RequireProfile';
import { LicenceScreen } from '@/components/screens/LicenceScreen';

export const metadata = { title: 'Virtual Licence' };

export default function Page() {
  return (
    <RequireProfile>
      <LicenceScreen />
    </RequireProfile>
  );
}
