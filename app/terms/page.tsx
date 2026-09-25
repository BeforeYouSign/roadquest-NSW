import { LegalPage } from '@/components/screens/LegalPage';
import { GAME } from '@/lib/config';

export const metadata = { title: 'Terms' };

export default function TermsPage() {
  return (
    <LegalPage kicker="Terms" title="Terms of use">
      <ul>
        <li>RoadQuest NSW is a free educational game provided as-is, for study and entertainment.</li>
        <li>{GAME.branding.disclaimer}</li>
        <li>Passing an in-game test does not mean you will pass an official test, and the virtual licence is not a government licence.</li>
        <li>Choose a respectful username. Offensive or impersonating usernames may be removed.</li>
        <li>Don&apos;t try to cheat the leaderboards, for example by automating answers or tampering with the site. Suspicious scores may be removed.</li>
        <li>Coins and cars are cosmetic game items with no real-world value and can&apos;t be bought or sold.</li>
        <li>Never play while driving a real vehicle.</li>
      </ul>
    </LegalPage>
  );
}
