"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Star } from "lucide-react"
import Link from "next/link"

const plans = [
  {
    name: "Free Trial",
    monthlyPrice: "$0",
    yearlyPrice: "$0",
    period: "7 days",
    description: "Perfect for testing our AI agents",
    features: ["Access to 2 AI tools", "Limited generations", "Basic exports", "Email support"],
    cta: "Start Free Trial",
    popular: false,
    color: "from-gray-400 to-gray-600",
  },
  {
    name: "Starter",
    monthlyPrice: "$19",
    yearlyPrice: "$182",
    period: "per month",
    description: "Great for small businesses and freelancers",
    features: ["Access to 5 AI tools", "30 generations/month", "PDF/CSV exports", "Email support", "Basic templates"],
    cta: "Get Started",
    popular: false,
    color: "from-blue-400 to-blue-600",
  },
  {
    name: "Pro",
    monthlyPrice: "$29",
    yearlyPrice: "$278",
    period: "per month",
    description: "Perfect for growing marketing teams",
    features: [
      "Access to all 13 tools",
      "100 generations/month",
      "Advanced exports",
      "Priority support",
      "Custom templates",
      "Analytics dashboard",
    ],
    cta: "Go Pro",
    popular: true,
    color: "from-purple-400 to-purple-600",
  },
  {
    name: "Agency",
    monthlyPrice: "$49",
    yearlyPrice: "$470",
    period: "per month",
    description: "For agencies and large teams",
    features: [
      "Unlimited usage",
      "White-label exports",
      "Team collaboration",
      "Priority support",
      "Custom integrations",
      "Dedicated account manager",
    ],
    cta: "Contact Sales",
    popular: false,
    color: "from-orange-400 to-orange-600",
  },
]

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState("monthly")

  return (
    <section id="pricing" className="py-20 px-4 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Choose Your Plan
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Start with our free trial and upgrade as your business grows. All plans include our core AI marketing tools.
          </p>
        </div>

        {/* Billing Toggle */}
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
                <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Save 20%</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
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
                    {billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}
                  </span>
                  <span className="text-gray-600 ml-2">
                    /{billingCycle === "monthly" ? plan.period : "year"}
                  </span>
                  {billingCycle === "yearly" && plan.name !== "Free Trial" && (
                    <div className="text-sm text-green-600 font-medium mt-1">
                      Save ${billingCycle === "monthly" ? 0 : (parseInt(plan.monthlyPrice.slice(1)) * 12 - parseInt(plan.yearlyPrice.slice(1)))}/year
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/auth/register" className="block">
                  <Button
                    className={`w-full mt-6 bg-gradient-to-r ${plan.color} hover:opacity-90 text-white font-semibold py-3 rounded-lg transition-all duration-300`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600">
            All plans include 24/7 support and regular updates. No setup fees or hidden costs.
          </p>
        </div>
      </div>
    </section>
  )
}
