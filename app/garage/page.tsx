import { RequireProfile } from '@/components/screens/RequireProfile';
import { Garage } from '@/components/screens/Garage';

export const metadata = { title: 'Garage' };

export default function Page() {
  return (
    <RequireProfile>
      <Garage />
    </RequireProfile>
  );
}
