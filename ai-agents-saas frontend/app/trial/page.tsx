"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import {
  ArrowLeft,
  Search,
  Share2,
  Zap,
  CheckCircle,
  Star,
  TrendingUp,
  Users,
  Mail,
  Target,
} from "lucide-react"

const trialTools = [
  {
    id: "seo-audit",
    name: "SEO Audit Agent",
    description: "Comprehensive website SEO analysis and recommendations",
    icon: Search,
    color: "bg-green-600",
    route: "/tools/seo-audit",
  },
  {
    id: "social-media",
    name: "Social Media Content Generator",
    description: "Create engaging posts for all social platforms",
    icon: Share2,
    color: "bg-blue-600",
    route: "/tools/social-media",
  },
]

const allFeatures = [
  "2 AI Marketing Tools Access",
  "50 Content Generations",
  "Basic Analytics Dashboard",
  "Email Support",
  "No Credit Card Required",
  "Cancel Anytime",
]

export default function TrialPage() {
  const router = useRouter()
  const [selectedTool, setSelectedTool] = useState<string | null>(null)

  const handleToolClick = (toolRoute: string, toolId: string) => {
    setSelectedTool(toolId)
    setTimeout(() => {
      router.push(toolRoute)
    }, 300)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-slate-100 text-gray-900">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <Link
          href="/"
          className="inline-flex items-center text-blue-700 mb-6 hover:text-blue-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-20">
        <div className="relative container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2 mb-6">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium">7-Day Free Trial</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Try 2 Powerful AI Tools <br />
            Completely Free
          </h1>

          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Experience the power of AI marketing automation with our most popular tools. No credit card required.
          </p>
        </div>
      </section>

      {/* Free Trial Tools */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800">
              Your Free Trial Includes
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get full access to these 2 powerful AI marketing tools for 7 days. Experience the difference AI can make
              in your marketing workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Trial Tools */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Try These Tools Now</h2>

              {trialTools.map((tool) => {
                const IconComponent = tool.icon
                const isSelected = selectedTool === tool.id

                return (
                  <Card
                    key={tool.id}
                    className={`bg-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${
                      isSelected ? "ring-2 ring-blue-500 scale-105" : ""
                    }`}
                    onClick={() => handleToolClick(tool.route, tool.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`${tool.color} p-3 rounded-lg`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            {tool.name}
                          </h3>
                          <p className="text-gray-600 mb-4">{tool.description}</p>
                          <Button
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                            disabled={isSelected}
                          >
                            {isSelected ? (
                              <>
                                <Zap className="w-4 h-4 mr-2 animate-spin" />
                                Launching...
                              </>
                            ) : (
                              <>
                                Try {tool.name}
                                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Trial Benefits */}
            <div className="space-y-6">
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-gray-800 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    What's Included in Your Trial
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {allFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-white shadow text-center p-4">
                  <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">95%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </Card>
                <Card className="bg-white shadow text-center p-4">
                  <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">10K+</div>
                  <div className="text-sm text-gray-600">Happy Users</div>
                </Card>
              </div>

              {/* CTA */}
              <Card className="bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg">
                <CardContent className="p-6 text-center">
                  <Mail className="w-12 h-12 text-white mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Ready to Get Started?</h3>
                  <p className="mb-4">
                    Sign up now and start generating professional marketing content in minutes.
                  </p>
                  <Link href="/auth/register">
                    <Button className="bg-white text-blue-700 font-semibold hover:bg-gray-100 w-full">
                      Start Free Trial
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">© 2025 AI Marketing Tools. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
