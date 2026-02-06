import HeroSection from './HeroSection';
import ProblemSolution from './ProblemSolution';
import HowItWorks from './HowItWorks';
import TeamSection from './TeamSection';
import WhyUs from './WhyUs';
import Roadmap from './Roadmap';

function LandingPage() {
  return (
    <main className="page">
      <HeroSection />
      <ProblemSolution />
      <Roadmap />
      <HowItWorks />
      <WhyUs />
      <TeamSection />
    </main>
  );
}

export default LandingPage;
