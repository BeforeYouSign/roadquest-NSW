import { LegalPage } from '@/components/screens/LegalPage';

export const metadata = { title: 'Privacy' };

export default function PrivacyPage() {
  return (
    <LegalPage kicker="Privacy" title="Privacy">
      <p>RoadQuest NSW is designed for young people, so we collect as little as possible and show even less.</p>
      <h2>What we collect</h2>
      <ul>
        <li><b>First name and surname</b>: stored privately. They are <b>never</b> shown to other players or on any leaderboard.</li>
        <li><b>Username</b> and <b>NSW suburb</b>: shown publicly on leaderboards and the Suburb Championship.</li>
        <li><b>Game progress</b>: answers, scores, XP, coins, achievements and garage choices.</li>
      </ul>
      <h2>What we don&apos;t do</h2>
      <ul>
        <li>No passwords, email addresses, phone numbers or street addresses.</li>
        <li>No messaging between players and no public text posts.</li>
        <li>No advertising and no selling of data.</li>
        <li>No real-money purchases.</li>
      </ul>
      <h2>Your account</h2>
      <p>Your profile is linked to your browser or device through a secure anonymous session. If you clear your browser data, you may lose access to that profile. To ask for your data to be deleted, contact the site operator.</p>
      <p>In demo mode (before the site owner connects a database), everything is stored only in your own browser.</p>
    </LegalPage>
  );
}
