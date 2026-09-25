import { RequireProfile } from '@/components/screens/RequireProfile';
import { PlayHub } from '@/components/screens/PlayHub';

export const metadata = { title: 'Play' };

export default function Page() {
  return (
    <RequireProfile>
      <PlayHub />
    </RequireProfile>
  );
}
