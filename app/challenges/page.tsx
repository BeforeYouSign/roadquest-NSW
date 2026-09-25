import { RequireProfile } from '@/components/screens/RequireProfile';
import { Challenges } from '@/components/screens/Challenges';

export const metadata = { title: 'Challenges' };

export default function Page() {
  return (
    <RequireProfile>
      <Challenges />
    </RequireProfile>
  );
}
