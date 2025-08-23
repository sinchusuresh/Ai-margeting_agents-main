import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { AIAgentsGrid } from "@/components/ai-agents-grid"
import { PricingSection } from "@/components/pricing-section"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      <HeroSection />
      <AIAgentsGrid />
      <PricingSection />
      <Footer />
    </div>
  )
}
