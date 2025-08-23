"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"
import {
  Search,
  Share2,
  PenTool,
  Mail,
  BarChart3,
  Megaphone,
  Layout,
  TrendingUp,
  Users,
  Video,
  Rocket,
  Play,
  MapPin,
  CheckCircle,
  Star,
  ArrowRight,
} from "lucide-react"

interface AIAgent {
  id: number
  slug: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  shadowColor: string
  category: string
  features: string[]
  benefits: string[]
  pricing: string
  available: boolean
  freeTrial?: boolean
}

const aiAgents = [
  {
    id: 1,
    slug: "seo-audit",
    title: "SEO Audit Tool",
    description: "Comprehensive technical SEO analysis with detailed performance insights and actionable recommendations",
    icon: Search,
    color: "from-green-400 to-emerald-600",
    shadowColor: "shadow-green-500/50",
    category: "SEO",
    features: [
      "Complete technical SEO audit",
      "Meta title & description analysis",
      "Social media tags validation",
      "Keyword usage optimization",
      "Heading structure analysis",
      "Page speed & performance testing",
      "HTML compression analysis",
      "Mobile usability testing",
      "Server & security checks",
      "Robots.txt & sitemap validation",
      "Image optimization insights",
      "Detailed recommendations",
      "Downloadable PDF reports",
    ],
    benefits: [
      "Improve search engine rankings",
      "Increase organic traffic by 40%",
      "Fix technical SEO issues",
      "Optimize page loading speed",
      "Enhance mobile user experience",
    ],
    pricing: "Free in trial",
    available: true,
    freeTrial: true,
  },
  {
    id: 2,
    slug: "social-media",
    title: "Social Media Content Generator",
    description: "Generate engaging social media posts for all platforms with scheduling capabilities",
    icon: Share2,
    color: "from-pink-400 to-rose-600",
    shadowColor: "shadow-pink-500/50",
    category: "Content",
    features: [
      "Multi-platform content creation",
      "Instagram, LinkedIn, Twitter, Facebook posts",
      "Hashtag optimization & research",
      "Visual content suggestions",
      "Engagement-focused copywriting",
      "Posting schedule recommendations",
      "Trend analysis & insights",
      "Brand voice consistency",
    ],
    benefits: [
      "Save 10+ hours per week",
      "Increase engagement by 60%",
      "Consistent brand presence",
      "Viral content creation",
    ],
    pricing: "Free in trial",
    available: true,
    freeTrial: true,
  },
  {
    id: 3,
    slug: "blog-writing",
    title: "Blog Writing & Optimization",
    description: "AI-powered long-form content creation optimized for search engines",
    icon: PenTool,
    color: "from-blue-400 to-cyan-600",
    shadowColor: "shadow-blue-500/50",
    category: "Content",
    features: [
      "Long-form content generation (500-5000 words)",
      "SEO-optimized articles",
      "Keyword integration & density",
      "Meta descriptions & titles",
      "Content structure optimization",
      "Plagiarism-free content",
      "Multiple writing styles",
      "Content calendar integration",
    ],
    benefits: [
      "Publish 5x more content",
      "Rank higher on Google",
      "Drive organic traffic",
      "Establish thought leadership",
    ],
    pricing: "Pro plan required",
    available: false,
    freeTrial: false,
  },
  {
    id: 4,
    slug: "email-marketing",
    title: "Email Marketing Agent",
    description: "Create compelling email campaigns and automated sequences",
    icon: Mail,
    color: "from-purple-400 to-violet-600",
    shadowColor: "shadow-purple-500/50",
    category: "Email",
    features: [
      "Email campaign creation",
      "Automated drip sequences",
      "Subject line optimization",
      "Personalization at scale",
      "A/B testing suggestions",
      "Newsletter templates",
      "Welcome series automation",
      "Re-engagement campaigns",
    ],
    benefits: [
      "Increase open rates by 35%",
      "Boost click-through rates",
      "Automate lead nurturing",
      "Recover abandoned carts",
    ],
    pricing: "Pro plan required",
    available: false,
    freeTrial: false,
  },
  {
    id: 5,
    slug: "client-reporting",
    title: "Client Reporting Agent",
    description: "Automated monthly reports with KPI analysis and visual charts",
    icon: BarChart3,
    color: "from-orange-400 to-red-600",
    shadowColor: "shadow-orange-500/50",
    category: "Analytics",
    features: [
      "Automated report generation",
      "KPI tracking & analysis",
      "Visual charts & graphs",
      "Custom branding options",
      "Multi-client management",
      "Performance insights",
      "Goal tracking & progress",
      "Executive summaries",
    ],
    benefits: ["Save 15+ hours monthly", "Impress clients with data", "Track ROI effectively", "Retain clients longer"],
    pricing: "Pro plan required",
    available: false,
    freeTrial: false,
  },
  {
    id: 6,
    slug: "ad-copy",
    title: "Ad Copy Generator",
    description: "High-converting ad creatives for Google, Meta, and LinkedIn platforms",
    icon: Megaphone,
    color: "from-yellow-400 to-orange-600",
    shadowColor: "shadow-yellow-500/50",
    category: "Advertising",
    features: [
      "Google Ads copy generation",
      "Facebook & Instagram ads",
      "LinkedIn sponsored content",
      "Multiple ad variations",
      "A/B testing copy sets",
      "Conversion-focused headlines",
      "Call-to-action optimization",
      "Industry-specific templates",
    ],
    benefits: ["Increase CTR by 45%", "Lower cost per click", "Higher conversion rates", "Scale ad campaigns faster"],
    pricing: "Pro plan required",
    available: false,
    freeTrial: false,
  },
  {
    id: 7,
    slug: "landing-page",
    title: "Landing Page Builder Assistant",
    description: "Auto-generate compelling landing page copy that converts",
    icon: Layout,
    color: "from-teal-400 to-green-600",
    shadowColor: "shadow-teal-500/50",
    category: "Conversion",
    features: [
      "Landing page copywriting",
      "Conversion-optimized headlines",
      "Benefit-focused content",
      "Social proof integration",
      "CTA optimization",
      "Mobile-responsive copy",
      "A/B testing variations",
      "Industry templates",
    ],
    benefits: ["Increase conversions by 50%", "Reduce bounce rates", "Generate more leads", "Improve ROI"    ],
    pricing: "Pro plan required",
    available: false,
    freeTrial: false,
  },
  {
    id: 8,
    slug: "competitor-analysis",
    title: "Competitor Analysis Agent",
    description: "Deep competitor insights and SWOT analysis for strategic advantage",
    icon: TrendingUp,
    color: "from-indigo-400 to-purple-600",
    shadowColor: "shadow-indigo-500/50",
    category: "Research",
    features: [
      "Competitor website analysis",
      "SWOT analysis generation",
      "Market positioning insights",
      "Content gap analysis",
      "Pricing strategy comparison",
      "Social media benchmarking",
      "SEO competitor research",
      "Strategic recommendations",
    ],
    benefits: [
      "Stay ahead of competition",
      "Identify market opportunities",
      "Optimize pricing strategy",
      "Improve market position",
    ],
    pricing: "Pro plan required",
    available: false,
    freeTrial: false,
  },
  {
    id: 9,
    slug: "cold-outreach",
    title: "Cold Outreach Personalization",
    description: "Personalized outreach messages based on prospect research",
    icon: Users,
    color: "from-rose-400 to-pink-600",
    shadowColor: "shadow-rose-500/50",
    category: "Outreach",
    features: [
      "Personalized email templates",
      "LinkedIn outreach messages",
      "Prospect research integration",
      "Follow-up sequences",
      "Response rate optimization",
      "Industry-specific approaches",
      "Pain point identification",
      "Value proposition crafting",
    ],
    benefits: [
      "Increase response rates by 70%",
      "Generate more qualified leads",
      "Automate prospecting",
      "Scale outreach efforts",
    ],
    pricing: "Pro plan required",
    available: false,
    freeTrial: false,
  },
  {
    id: 10,
    slug: "reels-scripts",
    title: "Reels/Shorts Scriptwriter",
    description: "Engaging short-form video scripts with visual suggestions",
    icon: Video,
    color: "from-cyan-400 to-blue-600",
    shadowColor: "shadow-cyan-500/50",
    category: "Video",
    features: [
      "Instagram Reels scripts",
      "YouTube Shorts content",
      "TikTok video scripts",
      "Hook optimization",
      "Visual cue suggestions",
      "Trending topic integration",
      "Call-to-action scripts",
      "Engagement optimization",
    ],
    benefits: [
      "Go viral with engaging content",
      "Increase video views by 300%",
      "Build brand awareness",
      "Drive traffic to website",
    ],
    pricing: "Pro plan required",
    available: false,
    freeTrial: false,
  },
  {
    id: 11,
    slug: "product-launch",
    title: "Product Launch Agent",
    description: "Complete launch campaign with emails, posts, and content calendar",
    icon: Rocket,
    color: "from-violet-400 to-purple-600",
    shadowColor: "shadow-violet-500/50",
    category: "Launch",
    features: [
      "Launch strategy planning",
      "Pre-launch email sequences",
      "Social media campaigns",
      "Press release templates",
      "Content calendar creation",
      "Influencer outreach scripts",
      "Launch day coordination",
      "Post-launch follow-up",
    ],
    benefits: ["Successful product launches", "Maximum market impact", "Coordinated campaigns", "Higher launch ROI"],
    pricing: "Agency plan required",
    available: false,
    freeTrial: false,
  },
  {
    id: 12,
    slug: "blog-to-video",
    title: "Blog-to-Video Agent",
    description: "Convert blog content into engaging video scripts and storyboards",
    icon: Play,
    color: "from-emerald-400 to-teal-600",
    shadowColor: "shadow-emerald-500/50",
    category: "Video",
    features: [
      "Blog post to video conversion",
      "Script generation",
      "Storyboard creation",
      "Visual scene descriptions",
      "Voiceover scripts",
      "Engagement hooks",
      "Call-to-action integration",
      "Multiple video formats",
    ],
    benefits: [
      "Repurpose content efficiently",
      "Reach video audiences",
      "Increase content ROI",
      "Diversify content formats",
    ],
    pricing: "Agency plan required",
    available: false,
    freeTrial: false,
  },
  {
    id: 13,
    slug: "local-seo",
    title: "Local SEO Booster",
    description: "Optimize local search visibility and Google Business Profile",
    icon: MapPin,
    color: "from-amber-400 to-yellow-600",
    shadowColor: "shadow-amber-500/50",
    category: "Local SEO",
    features: [
      "Google Business Profile optimization",
      "Local keyword research",
      "Citation building strategy",
      "Review management templates",
      "Local content creation",
      "NAP consistency checks",
      "Local link building",
      "Maps ranking optimization",
    ],
    benefits: [
      "Dominate local search",
      "Increase foot traffic",
      "Get more local customers",
      "Outrank local competitors",
    ],
    pricing: "Agency plan required",
    available: false,
    freeTrial: false,
  },
]

export function AIAgentsGrid() {
  const [selectedTool, setSelectedTool] = useState<AIAgent | null>(null)

  const handleToolClick = (tool: AIAgent) => {
    setSelectedTool(tool)
  }

  const handleCloseModal = () => {
    setSelectedTool(null)
  }

  return (
    <>
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Powerful AI Marketing Agents
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose from our comprehensive suite of AI-powered marketing tools designed to automate and optimize your
              digital marketing efforts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {aiAgents.map((agent) => {
              const IconComponent = agent.icon
              return (
                <Card
                  key={agent.id}
                  className="group relative overflow-hidden border-0 bg-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer"
                  style={{
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 25px 50px -12px ${agent.shadowColor.replace("shadow-", "").replace("/50", "")}`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                  }}
                  onClick={() => handleToolClick(agent)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-r ${agent.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                      >
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      {agent.freeTrial && (
                        <Badge className="bg-green-100 text-green-800 text-xs font-medium">
                          Free Trial
                        </Badge>
                      )}
                    </div>
                    <Badge variant="secondary" className="w-fit text-xs">
                      {agent.category}
                    </Badge>
                    <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-gray-900 group-hover:to-gray-600 group-hover:bg-clip-text transition-all duration-300">
                      {agent.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 leading-relaxed">{agent.description}</CardDescription>
                  </CardContent>

                  {/* Gradient overlay on hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${agent.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                  ></div>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Tool Details Modal */}
      <Dialog open={!!selectedTool} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTool && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`w-16 h-16 rounded-xl bg-gradient-to-r ${selectedTool.color} flex items-center justify-center`}
                  >
                    <selectedTool.icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-gray-900">{selectedTool.title}</DialogTitle>
                    <DialogDescription className="text-gray-600 text-base">
                      {selectedTool.description}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Features */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Key Features
                  </h3>
                  <ul className="space-y-3">
                    {selectedTool.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Benefits */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    Benefits & Results
                  </h3>
                  <ul className="space-y-3 mb-6">
                    {selectedTool.benefits.map((benefit: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <ArrowRight className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 font-medium">{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Pricing */}
                  <div className="p-4 bg-gray-50 rounded-lg mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Pricing</h4>
                    <Badge
                      className={`${
                        selectedTool.freeTrial ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {selectedTool.freeTrial ? "Free in Trial" : selectedTool.pricing}
                    </Badge>
                    {selectedTool.freeTrial && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ Available in your free trial
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {selectedTool.freeTrial ? (
                      <Link href={`/tools/${selectedTool.slug}`} className="block">
                        <Button
                          className={`w-full bg-gradient-to-r ${selectedTool.color} hover:opacity-90 text-white font-semibold py-3`}
                          onClick={handleCloseModal}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Launch Tool Now
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/upgrade" className="block">
                        <Button
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3"
                          onClick={handleCloseModal}
                        >
                          <Rocket className="w-4 h-4 mr-2" />
                          Upgrade to Access
                        </Button>
                      </Link>
                    )}

                    {/* Show "Start Free Trial" only for tools with freeTrial: true */}
                    {selectedTool.freeTrial ? (
                      <Link href="/auth/register" className="block">
                        <Button variant="outline" className="w-full bg-transparent" onClick={handleCloseModal}>
                          Start Free Trial
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/upgrade" className="block">
                        <Button variant="outline" className="w-full bg-transparent border-orange-200 text-orange-600 hover:bg-orange-50" onClick={handleCloseModal}>
                          <Rocket className="w-4 h-4 mr-2" />
                          Upgrade Required
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}