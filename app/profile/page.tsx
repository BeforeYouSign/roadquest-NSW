import { RequireProfile } from '@/components/screens/RequireProfile';
import { Profile } from '@/components/screens/Profile';

export const metadata = { title: 'Profile' };

export default function Page() {
  return (
    <RequireProfile>
      <Profile />
    </RequireProfile>
  );
}
