import { LegalPage } from '@/components/screens/LegalPage';
import { GAME } from '@/lib/config';

export const metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <LegalPage kicker="About" title="About RoadQuest NSW">
      <p><b>RoadQuest NSW</b> is an independent study game that helps people aged around 16–17 prepare for their NSW Learner licence by turning road rules into driving challenges, mini-games and friendly competition.</p>
      <p>{GAME.branding.disclaimer}</p>
      <h2>Where the content comes from</h2>
      <p>The questions and answers are drawn from supplied NSW Class C (car) Driver Knowledge Test study material. The diagrams and photos in that material have been re-created as original game artwork. The explanations say why each rule matters; they do not add new road rules.</p>
      <p>Road rules and licensing requirements change. Always check official NSW Government resources for the current rules before you drive or sit a test.</p>
      <h2>The practice tests</h2>
      <p>{GAME.branding.testDisclaimer}</p>
      <h2>The virtual licence</h2>
      <p>The RoadQuest Virtual Learner Licence is a game achievement. It is not a government licence, and it does not let you drive.</p>
    </LegalPage>
  );
}
