"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import Link from "next/link"
import {
  ArrowLeft,
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
  Lock,
  Crown,
  Filter,
  Zap,
} from "lucide-react"
import { useUserStore } from "@/lib/user-store"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { useApi } from "@/hooks/use-api"
import { userApi, subscriptionApi } from "@/lib/api-services"
import { useAdmin } from "@/hooks/use-admin"

// Tool categories
const categories = ["All", "SEO", "Content", "Email", "Analytics", "Advertising", "Social Media", "Local SEO"]

// Tool definitions with icons and metadata
const toolDefinitions = {
  "seo-audit": {
    title: "SEO Audit Tool",
    description: "Comprehensive technical SEO analysis with detailed performance insights and actionable recommendations",
    icon: Search,
    color: "from-green-400 to-emerald-600",
    shadowColor: "#34D399",
    category: "SEO",
  },
  "social-media": {
    title: "Social Media Content Generator",
    description: "Generate engaging social media posts for all platforms with scheduling capabilities",
    icon: Share2,
    color: "from-pink-400 to-rose-600",
    shadowColor: "#F472B6",
    category: "Social Media",
  },
  "blog-writing": {
    title: "Blog Writing & Optimization",
    description: "AI-powered long-form content creation optimized for search engines",
    icon: PenTool,
    color: "from-blue-400 to-cyan-600",
    shadowColor: "#60A5FA",
    category: "Content",
  },
  "email-marketing": {
    title: "Email Marketing Agent",
    description: "Create compelling email campaigns and automated sequences",
    icon: Mail,
    color: "from-purple-400 to-violet-600",
    shadowColor: "#A78BFA",
    category: "Email",
  },
  "client-reporting": {
    title: "Client Reporting Agent",
    description: "Automated monthly reports with KPI analysis and visual charts",
    icon: BarChart3,
    color: "from-orange-400 to-red-600",
    shadowColor: "#FB923C",
    category: "Analytics",
  },
  "ad-copy": {
    title: "Ad Copy Generator",
    description: "High-converting ad creatives for Google, Meta, and LinkedIn platforms",
    icon: Megaphone,
    color: "from-yellow-400 to-orange-600",
    shadowColor: "#FACC15",
    category: "Advertising",
  },
  "landing-page": {
    title: "Landing Page Builder Assistant",
    description: "Auto-generate compelling landing page copy that converts",
    icon: Layout,
    color: "from-indigo-400 to-purple-600",
    shadowColor: "#818CF8",
    category: "Content",
  },
  "product-launch": {
    title: "Product Launch Agent",
    description: "Strategic product launch planning and marketing automation",
    icon: Rocket,
    color: "from-red-400 to-pink-600",
    shadowColor: "#F871A5",
    category: "Content",
  },
  "competitor-analysis": {
    title: "Competitor Analysis Tool",
    description: "Deep dive into competitor strategies and market positioning",
    icon: Users,
    color: "from-blue-400 to-indigo-600",
    shadowColor: "#60A5FA",
    category: "Analytics",
  },
  "cold-outreach": {
    title: "Cold Outreach Generator",
    description: "Personalized cold email and LinkedIn outreach sequences",
    icon: Mail,
    color: "from-teal-400 to-cyan-600",
    shadowColor: "#2DD4BF",
    category: "Email",
  },
  "reels-scripts": {
    title: "Reels Script Generator",
    description: "Engaging short-form video scripts for social media",
    icon: Video,
    color: "from-purple-400 to-pink-600",
    shadowColor: "#A78BFA",
    category: "Content",
  },
  "local-seo": {
    title: "Local SEO Optimization",
    description: "Local search optimization for businesses and services",
    icon: MapPin,
    color: "from-green-400 to-teal-600",
    shadowColor: "#34D399",
    category: "Local SEO",
  },
}

export default function AllToolsPage() {
  const { user } = useUserStore()
  const { isAdmin } = useAdmin()
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [showAvailableOnly, setShowAvailableOnly] = useState(false)
  const [availableTools, setAvailableTools] = useState<string[]>([])
  const [userSubscription, setUserSubscription] = useState<any>(null)

  // API hooks
  const profileApi = useApi(userApi.getProfile)
  const subscriptionApiHook = useApi(subscriptionApi.getSubscription)

  useEffect(() => {
    // Fetch user profile and subscription data
    profileApi.execute()
    subscriptionApiHook.execute()
  }, [])

  // Update local state when API data changes
  useEffect(() => {
    if (profileApi.data) {
      setAvailableTools(profileApi.data.availableTools || [])
    }
  }, [profileApi.data])

  useEffect(() => {
    if (subscriptionApiHook.data) {
      setUserSubscription(subscriptionApiHook.data)
    }
  }, [subscriptionApiHook.data])

  const getToolAvailability = (toolId: string) => {
    // Admin users have access to all tools
    if (isAdmin) {
      return true
    }
    
    // Check if tool is in user's available tools list
    return availableTools.includes(toolId)
  }

  const getToolPlan = (toolId: string) => {
    // Admin users see all tools as available
    if (isAdmin) {
      return "Admin Access"
    }
    
    // Determine required plan based on tool availability
    if (availableTools.includes(toolId)) {
      return "Available"
    }
    
    // Map tools to plans based on subscription requirements
    const freeTools = ["seo-audit", "social-media"]
    const starterTools = ["blog-writing", "email-marketing", "ad-copy"]
    const proTools = ["client-reporting", "landing-page", "competitor-analysis", "cold-outreach", "reels-scripts", "product-launch", "blog-to-video", "local-seo"]
    
    if (freeTools.includes(toolId)) {
      return "Free Trial"
    } else if (starterTools.includes(toolId)) {
      return "Starter"
    } else if (proTools.includes(toolId)) {
      return "Pro"
    }
    
    return "Free Trial"
  }

  const filteredTools = Object.entries(toolDefinitions).filter(([toolId, tool]) => {
    const categoryMatch = selectedCategory === "All" || tool.category === selectedCategory
    const availabilityMatch = !showAvailableOnly || getToolAvailability(toolId)
    return categoryMatch && availabilityMatch
  })

  // Show loading state while fetching data
  if (profileApi.loading && availableTools.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner size="lg" text="Loading available tools..." />
        </div>
      </div>
    )
  }

  // Show error state if loading failed
  if (profileApi.error && availableTools.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <EmptyState
            icon={Zap}
            title="Failed to load tools"
            description={profileApi.error}
            action={
              <button
                onClick={() => profileApi.execute()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Try Again
              </button>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All AI Marketing Tools</h1>
              <p className="text-gray-600">
                Explore {isAdmin ? "all" : Object.keys(toolDefinitions).length} powerful AI tools designed to automate your marketing workflow
                {isAdmin && " (Admin access to all tools)"}
              </p>
            </div>
          </div>

          {userSubscription?.plan === "free_trial" && (
            <Link href="/upgrade">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by:</span>
          </div>

          {categories.map((category) => (
            <button
              key={category}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                selectedCategory === category
                  ? "bg-purple-600 text-white"
                  : "bg-white text-gray-600 hover:bg-purple-50 hover:text-purple-600"
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}

          <button
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
              showAvailableOnly
                ? "bg-green-600 text-white"
                : "bg-white text-gray-600 hover:bg-green-50 hover:text-green-600"
            }`}
            onClick={() => setShowAvailableOnly(!showAvailableOnly)}
          >
            Available Only
          </button>
        </div>

        {/* Tools Grid */}
        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map(([toolId, tool]) => {
              const IconComponent = tool.icon
              const isAvailable = getToolAvailability(toolId)
              const requiredPlan = getToolPlan(toolId)
              
              return (
                <Card
                  key={toolId}
                  className={`group relative overflow-hidden border bg-white hover:shadow-xl transition-all duration-300 ${
                    !isAvailable ? "opacity-70" : ""
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-r ${tool.color} flex items-center justify-center`}
                      >
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                                                                <Badge
                        variant="secondary"
                        className={`text-xs ${
                          isAdmin 
                            ? "bg-purple-100 text-purple-800"
                            : isAvailable 
                              ? "bg-green-100 text-green-800" 
                              : requiredPlan === "Free Trial"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {requiredPlan}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-900">{tool.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 mb-4">{tool.description}</CardDescription>
                    {isAvailable ? (
                      <Link href={`/tools/${toolId}`}>
                        <Button className={`w-full bg-gradient-to-r ${tool.color} text-white`}>
                          <Play className="w-4 h-4 mr-2" />
                          {isAdmin ? "Admin Access" : "Launch Tool"}
                        </Button>
                      </Link>
                    ) : (
                      requiredPlan === "Free Trial" ? (
                        <Link href={`/tools/${toolId}`}>
                          <Button className="w-full bg-gradient-to-r from-orange-400 to-red-500 text-white">
                            <Play className="w-4 h-4 mr-2" />
                            Try Free Trial
                          </Button>
                        </Link>
                      ) : (
                        <Link href="/upgrade">
                          <Button variant="outline" className="w-full">
                            <Crown className="w-4 h-4 mr-2" />
                            Upgrade to Access
                          </Button>
                        </Link>
                      )
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <EmptyState
            icon={Zap}
            title="No tools found"
            description={`No tools match the selected filters. Try adjusting your selection or check back later.`}
          />
        )}
      </div>
    </div>
  )
}
