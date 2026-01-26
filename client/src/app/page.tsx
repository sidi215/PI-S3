import { HeroSection } from '@/components/landing/hero-section'
import { ProblemsSection } from '@/components/landing/problems-section'
import { SolutionsSection } from '@/components/landing/solutions-section'
import { HowItWorksSection } from '@/components/landing/how-it-works-section'
import { ForWhoSection } from '@/components/landing/for-who-section'
import { ImpactSection } from '@/components/landing/impact-section'
import { TrustSection } from '@/components/landing/trust-section'

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <ProblemsSection />
      <SolutionsSection />
      <HowItWorksSection />
      <ForWhoSection />
      <ImpactSection />
      <TrustSection />
    </div>
  )
}