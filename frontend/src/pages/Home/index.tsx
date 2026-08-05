import { HeroSection } from './HeroSection'
import { FeaturesSection } from './FeaturesSection'
import { HowItWorksSection } from './HowItWorksSection'
import { PricingSection } from './PricingSection'
import { IntegrationsSection } from './IntegrationsSection'
import { CtaSection } from './CtaSection'

// TestimonialsSection is intentionally omitted until we have real customer
// quotes — no fabricated testimonials on the marketing page.
export function HomePage() {
  return (
    <main>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <IntegrationsSection />
      <CtaSection />
    </main>
  )
}
