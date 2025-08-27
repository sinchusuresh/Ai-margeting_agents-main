"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, Star, Crown, ArrowRight, Zap, Users, Shield, Sparkles, Loader2 } from "lucide-react"

const plans = [
  {
    name: "Starter",
    monthlyPrice: "$19",
    yearlyPrice: "$182",
    period: "per month",
    description: "Perfect for small businesses and freelancers",
    features: [
      "Access to 5 AI tools",
      "30 generations per month",
      "PDF/CSV exports",
      "Email support",
      "Basic templates",
      "Usage analytics",
    ],
    tools: ["SEO Audit", "Social Media Generator", "Blog Writing", "Email Marketing", "Ad Copy Generator"],
    cta: "Upgrade to Starter",
    popular: false,
    color: "from-blue-400 to-blue-600",
    savings: "Save $46/year",
  },
  {
    name: "Pro",
    monthlyPrice: "$29",
    yearlyPrice: "$278",
    period: "per month",
    description: "Most popular for growing marketing teams",
    features: [
      "Access to all 13 AI tools",
      "100 generations per month",
      "Advanced exports (PDF, CSV, JSON)",
      "Priority support",
      "Custom templates",
      "Advanced analytics dashboard",
      "Team collaboration",
      "API access",
    ],
    tools: ["All 13 AI Marketing Tools", "Advanced Features", "Priority Support"],
    cta: "Upgrade to Pro",
    popular: true,
    color: "from-purple-400 to-purple-600",
    savings: "Save $70/year",
  },
  {
    name: "Agency",
    monthlyPrice: "$49",
    yearlyPrice: "$470",
    period: "per month",
    description: "For agencies and large marketing teams",
    features: [
      "Unlimited AI tool usage",
      "Unlimited generations",
      "White-label exports",
      "Dedicated account manager",
      "Custom integrations",
      "Advanced team management",
      "Priority phone support",
      "Custom training sessions",
    ],
    tools: ["Everything in Pro", "White-label Features", "Dedicated Support"],
    cta: "Contact Sales",
    popular: false,
    color: "from-orange-400 to-orange-600",
    savings: "Save $118/year",
  },
]

export default function UpgradePage() {
  const [billingCycle, setBillingCycle] = useState("monthly")
  const [selectedPlan, setSelectedPlan] = useState("pro")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  // Handle success/cancel redirects
  useEffect(() => {
    const success = searchParams.get("success")
    const canceled = searchParams.get("canceled")
    const sessionId = searchParams.get("session_id")

    if (success && sessionId) {
      // Payment successful - you could show a success message or redirect
      console.log("Payment successful!")
      // Optionally redirect to dashboard or show success message
    }

    if (canceled) {
      // Payment canceled
      console.log("Payment canceled")
      setError("Payment was canceled. Please try again.")
    }
  }, [searchParams])

  const handleUpgrade = async (planName: string) => {
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      
      if (!token) {
        setError("Please log in to upgrade your plan")
        router.push("/auth/login")
        return
      }

      // Convert plan name to lowercase for API
      const plan = planName.toLowerCase()
      
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan: plan,
          billingPeriod: billingCycle,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Only redirect to login if it's a 401 error (unauthorized)
        if (response.status === 401) {
          localStorage.removeItem("token")
          setError("Please log in to upgrade your plan")
          router.push("/auth/login")
          return
        }
        
        // For other errors, show the specific error message
        const errorMessage = errorData.message || "Failed to create checkout session"
        console.error("Checkout error:", errorMessage)
        throw new Error(errorMessage)
      }

      const { url } = await response.json()
      
      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (err) {
      console.error("Error creating checkout session:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white py-20">
        <div className="absolute inset-0 bg-[url('/placeholder.svg?height=600&width=1200')] opacity-10"></div>
        <div className="relative container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <Crown className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium">Upgrade Your Plan</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Unlock the Full Power
            <br />
            of AI Marketing
          </h1>

          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Get access to all 13 AI marketing tools and supercharge your marketing workflow with unlimited
            possibilities.
          </p>

          <div className="flex items-center justify-center gap-8 text-blue-200">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <span>All 13 Tools</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>Team Features</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span>Priority Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <section className="py-4">
          <div className="container mx-auto px-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600">{error}</p>
              {error.includes("Please log in") && (
                <div className="mt-4">
                  <Link href="/auth/login">
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                      Log In
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Billing Toggle */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center mb-12">
            <div className="bg-white rounded-full p-1 shadow-lg">
              <div className="flex items-center">
                <button
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    billingCycle === "monthly"
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-gray-600 hover:text-purple-600"
                  }`}
                  onClick={() => setBillingCycle("monthly")}
                >
                  Monthly
                </button>
                <button
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    billingCycle === "yearly"
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-gray-600 hover:text-purple-600"
                  }`}
                  onClick={() => setBillingCycle("yearly")}
                >
                  Yearly
                  <Badge className="ml-2 bg-green-100 text-green-800 text-xs">Save 20%</Badge>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="pb-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative overflow-hidden border-0 bg-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 ${
                  plan.popular ? "ring-2 ring-purple-500 scale-105" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center py-2 text-sm font-semibold">
                      <Star className="inline w-4 h-4 mr-1" />
                      Most Popular
                    </div>
                  </div>
                )}

                <CardHeader className={`${plan.popular ? "pt-12" : "pt-6"} pb-4`}>
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-r ${plan.color} flex items-center justify-center mb-4`}
                  >
                    <span className="text-white font-bold text-xl">{plan.name[0]}</span>
                  </div>

                  <CardTitle className="text-2xl font-bold text-gray-900">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-600">{plan.description}</CardDescription>

                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-gray-600 ml-2">/{billingCycle === "yearly" ? "year" : plan.period}</span>
                    {billingCycle === "yearly" && plan.savings && (
                      <div className="text-sm text-green-600 font-medium mt-1">{plan.savings}</div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Features included:</h4>
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">AI Tools Access:</h4>
                    <ul className="space-y-2">
                      {plan.tools.map((tool, toolIndex) => (
                        <li key={toolIndex} className="flex items-center gap-3">
                          <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0" />
                          <span className="text-gray-700 text-sm">{tool}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    className={`w-full mt-6 bg-gradient-to-r ${plan.color} hover:opacity-90 text-white font-semibold py-3 rounded-lg transition-all duration-300`}
                    onClick={() => handleUpgrade(plan.name)}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {plan.cta}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/dashboard" className="text-purple-600 hover:underline">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
