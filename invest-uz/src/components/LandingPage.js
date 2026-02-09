import HeroSection from './HeroSection';
import ProblemSolution from './ProblemSolution';
import CompetitionSection from './CompetitionSection';
import HowItWorks from './HowItWorks';
import TeamSection from './TeamSection';
import WhyUs from './WhyUs';
import Roadmap from './Roadmap';

function LandingPage() {
  return (
    <main className="page">
      <HeroSection />
      <ProblemSolution />
      <CompetitionSection />
      <Roadmap />
      <HowItWorks />
      <WhyUs />
      <TeamSection />
    </main>
  );
}

export default LandingPage;
