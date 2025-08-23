"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Header } from "@/components/header"
import Link from "next/link"
import { ArrowLeft, Play, Download, Copy, CheckCircle, Loader2, Rocket, Lock, Crown, Calendar, Target, TrendingUp, Mail, Share2 } from 'lucide-react'
import { useUserStore } from "@/lib/user-store"
import { makeAuthenticatedRequest } from "@/lib/auth-utils"

interface LaunchPhase {
  phase: string
  timeline: string
  activities: string[]
  deliverables: string[]
  kpis: string[]
}

interface LaunchResult {
  timeline: LaunchPhase[]
  emailCampaigns: {
    prelaunch: string
    launch: string
    postlaunch: string
  }
  socialMediaPosts: {
    announcement: string
    countdown: string
    launch: string
    testimonial: string
  }
  pressRelease: string
  contentCalendar: {
    week: string
    content: Array<{
      date: string
      platform: string
      content: string
      type: string
    }>
  }[]
  analytics: {
    expectedReach: string
    projectedSignups: string
    estimatedRevenue: string
    conversionRate: string
  }
}

export default function ProductLaunchPage() {
  const { user } = useUserStore()
  const [formData, setFormData] = useState({
    productName: "",
    productType: "",
    targetAudience: "",
    launchDate: "",
    keyFeatures: "",
    pricing: "",
    competitors: "",
    launchGoals: "",
    budget: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<LaunchResult | null>(null)
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({})
  const [error, setError] = useState<string | null>(null)

  const hasAccess = user.plan === "Agency" || user.plan === "agency"

  // Transform AI response to match frontend structure
  const transformAIResponseToFrontendFormat = (aiOutput: any, formData: any) => {
    console.log('🔄 Transforming AI response:', aiOutput)
    console.log('📊 AI Output Structure:', Object.keys(aiOutput))
    
    // Transform timeline data
    const timeline = aiOutput.timeline || aiOutput.launchTimeline || []
    
    // Transform email campaigns
    const emailCampaigns = {
      prelaunch: aiOutput.emailCampaigns?.prelaunch || aiOutput.prelaunchEmail || 'Pre-launch email content will be generated',
      launch: aiOutput.emailCampaigns?.launch || aiOutput.launchEmail || 'Launch email content will be generated',
      postlaunch: aiOutput.emailCampaigns?.postlaunch || aiOutput.postlaunchEmail || 'Post-launch email content will be generated'
    }
    
    // Transform social media posts
    const socialMediaPosts = {
      announcement: aiOutput.socialMediaPosts?.announcement || aiOutput.announcementPost || 'Announcement post content',
      countdown: aiOutput.socialMediaPosts?.countdown || aiOutput.countdownPost || 'Countdown post content',
      launch: aiOutput.socialMediaPosts?.launch || aiOutput.launchPost || 'Launch post content',
      testimonial: aiOutput.socialMediaPosts?.testimonial || aiOutput.testimonialPost || 'Testimonial post content'
    }
    
    // Transform press release
    const pressRelease = aiOutput.pressRelease || aiOutput.pressReleaseContent || 'Professional press release content'
    
    // Transform content calendar
    const contentCalendar = aiOutput.contentCalendar || aiOutput.contentSchedule || []
    
    // Transform analytics
    const analytics = {
      expectedReach: aiOutput.analytics?.expectedReach || aiOutput.projectedReach || '10,000-50,000',
      projectedSignups: aiOutput.analytics?.projectedSignups || aiOutput.expectedSignups || '500-2,000',
      estimatedRevenue: aiOutput.analytics?.estimatedRevenue || aiOutput.projectedRevenue || '$50,000-$200,000',
      conversionRate: aiOutput.analytics?.conversionRate || aiOutput.expectedConversion || '5-8%'
    }

    return {
      timeline,
      emailCampaigns,
      socialMediaPosts,
      pressRelease,
      contentCalendar,
      analytics
    }
  }

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleGenerate = async () => {
    if (!hasAccess) {
      alert("Please upgrade to Agency plan to use this tool.")
      return
    }

    if (!formData.productName || !formData.targetAudience) {
      alert("Please enter product name and target audience")
      return
    }

    setIsGenerating(true)
    setResult(null)
    setError(null)

    try {
      // Prepare input data for the backend
      const inputData = {
        productName: formData.productName,
        productType: formData.productType || 'Not specified',
        targetAudience: formData.targetAudience,
        launchDate: formData.launchDate || 'Not specified',
        keyFeatures: formData.keyFeatures || 'Not specified',
        pricing: formData.pricing || 'Not specified',
        competitors: formData.competitors || 'Not specified',
        launchGoals: formData.launchGoals || 'Not specified',
        budget: formData.budget || 'Not specified'
      }

      // Call the backend API
      console.log('🚀 Calling backend API with input:', inputData);
      const data = await makeAuthenticatedRequest('/api/ai-tools/product-launch/generate', {
        method: 'POST',
        body: JSON.stringify({
          input: inputData,
          timestamp: Date.now() // Add timestamp to prevent caching
        })
      })
      console.log('✅ Backend API response received:', data);

      if (data.error) {
        throw new Error(data.error)
      }

      // Log launch plan details
      console.log('Product Launch Plan Response:', data.output);
      console.log('Product Name:', formData.productName);
      console.log('Target Audience:', formData.targetAudience);

      // Transform the data to match frontend expectations
      const transformedOutput = transformAIResponseToFrontendFormat(data.output, formData);
      setResult(transformedOutput);

      // Trigger dashboard refresh to show new activity
      localStorage.setItem('lastProfileUpdate', Date.now().toString())

    } catch (error: unknown) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('API key not configured')) {
        setError('OpenAI API key not configured. Please set up your API key.');
      } else if (errorMessage.includes('rate limit')) {
        setError('Rate limit exceeded. Please wait a moment and try again.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else if (errorMessage.includes('parse')) {
        setError('Failed to process AI response. Please try again.');
      } else if (errorMessage.includes('Server error')) {
        setError('Backend server error. Please check if your backend is running on port 5000.');
      } else if (errorMessage.includes('500')) {
        setError('Internal server error. Please try again or contact support.');
      } else {
        setError(`Failed to generate product launch plan: ${errorMessage}`);
      }

      // Add fallback data to ensure tool works
      const fallbackResult = {
        timeline: [
          {
            phase: 'Pre-Launch',
            timeline: '4 weeks before launch',
            activities: ['Market research', 'Audience building', 'Content creation'],
            deliverables: ['Landing page', 'Email sequences', 'Social media content'],
            kpis: ['Email list growth', 'Social media engagement', 'Website traffic']
          }
        ],
        emailCampaigns: {
          prelaunch: 'Pre-launch email sequence to build anticipation and collect leads',
          launch: 'Launch announcement email with clear call-to-action',
          postlaunch: 'Follow-up emails to nurture leads and drive conversions'
        },
        socialMediaPosts: {
          announcement: 'Exciting announcement post about the upcoming product launch',
          countdown: 'Countdown posts to build excitement and urgency',
          launch: 'Launch day celebration post with product details',
          testimonial: 'Customer testimonial and success story posts'
        },
        pressRelease: 'Professional press release announcing the product launch with key details and contact information',
        contentCalendar: [
          {
            week: 'Week 1',
            content: [
              {
                date: 'Monday',
                platform: 'LinkedIn',
                content: 'Product teaser post',
                type: 'Awareness'
              }
            ]
          }
        ],
        analytics: {
          expectedReach: '10,000-50,000',
          projectedSignups: '500-2,000',
          estimatedRevenue: '$50,000-$200,000',
          conversionRate: '5-8%'
        }
      }
      
      setResult(fallbackResult);
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied((prev) => ({ ...prev, [id]: true }))
    setTimeout(() => setCopied((prev) => ({ ...prev, [id]: false })), 2000)
  }

  const exportLaunchPlan = () => {
    if (!result) return

    // Create a comprehensive launch plan document
    const launchPlanContent = `
PRODUCT LAUNCH PLAN
===================

Product: ${formData.productName}
Target Audience: ${formData.targetAudience}
Launch Date: ${formData.launchDate}
Product Type: ${formData.productType}

PERFORMANCE PROJECTIONS
=======================
Expected Reach: ${result.analytics.expectedReach}
Projected Signups: ${result.analytics.projectedSignups}
Estimated Revenue: ${result.analytics.estimatedRevenue}
Conversion Rate: ${result.analytics.conversionRate}

LAUNCH TIMELINE & STRATEGY
==========================
${result.timeline.map((phase, index) => `
${phase.phase} (${phase.timeline})
${'='.repeat(phase.phase.length + phase.timeline.length + 3)}

Activities:
${phase.activities.map(activity => `• ${activity}`).join('\n')}

Deliverables:
${phase.deliverables.map(deliverable => `• ${deliverable}`).join('\n')}

Key Metrics:
${phase.kpis.map(kpi => `• ${kpi}`).join('\n')}
`).join('\n')}

EMAIL CAMPAIGNS
===============
${Object.entries(result.emailCampaigns).map(([type, content]) => `
${type.toUpperCase()} EMAIL
${'-'.repeat(type.length + 6)}

${content}
`).join('\n')}

SOCIAL MEDIA POSTS
==================
${Object.entries(result.socialMediaPosts).map(([type, content]) => `
${type.toUpperCase()} POST
${'-'.repeat(type.length + 5)}

${content}
`).join('\n')}

PRESS RELEASE
=============
${result.pressRelease}

CONTENT CALENDAR
================
${result.contentCalendar.map((week, weekIndex) => `
${week.week.toUpperCase()}
${'='.repeat(week.week.length)}

${week.content.map((item, itemIndex) => `
${item.date} - ${item.platform}
Type: ${item.type}
Content: ${item.content}
`).join('\n')}
`).join('\n')}

Generated on: ${new Date().toLocaleDateString()}
Generated by: AI Marketing Agents
    `.trim()

    // Create and download the file
    const blob = new Blob([launchPlanContent], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${formData.productName.replace(/[^a-zA-Z0-9]/g, '_')}_Launch_Plan.txt`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/tools" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tools
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-violet-400 to-purple-600 rounded-xl flex items-center justify-center">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Product Launch Agent</h1>
              {hasAccess ? (
                <Badge className="bg-green-100 text-green-800">Available</Badge>
              ) : (
                <Badge className="bg-orange-100 text-orange-800">Agency Required</Badge>
              )}
            </div>
            <p className="text-gray-600">Complete launch campaign with emails, posts, and content calendar</p>
          </div>
        </div>

        {!hasAccess && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <Lock className="h-4 w-4" />
            <AlertDescription className="text-orange-800">
              This tool requires an Agency plan.
              <Link href="/upgrade" className="font-semibold underline ml-1">
                Upgrade now
              </Link>{" "}
              to access this feature.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Launch Setup</CardTitle>
                <CardDescription>Configure your product launch campaign</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="productName">Product Name *</Label>
                  <Input
                    id="productName"
                    placeholder="Enter your product name"
                    value={formData.productName}
                    onChange={(e) => handleInputChange("productName", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productType">Product Type</Label>
                  <select
                    id="productType"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    value={formData.productType}
                    onChange={(e) => handleInputChange("productType", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select product type</option>
                    <option value="SaaS Platform">SaaS Platform</option>
                    <option value="Mobile App">Mobile App</option>
                    <option value="Physical Product">Physical Product</option>
                    <option value="Online Course">Online Course</option>
                    <option value="Consulting Service">Consulting Service</option>
                    <option value="E-book/Digital Product">E-book/Digital Product</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Target Audience *</Label>
                  <Input
                    id="targetAudience"
                    placeholder="Small business owners, marketers, developers"
                    value={formData.targetAudience}
                    onChange={(e) => handleInputChange("targetAudience", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="launchDate">Launch Date</Label>
                  <Input
                    id="launchDate"
                    type="date"
                    value={formData.launchDate}
                    onChange={(e) => handleInputChange("launchDate", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keyFeatures">Key Features</Label>
                  <Textarea
                    id="keyFeatures"
                    placeholder="List main features (comma separated)"
                    value={formData.keyFeatures}
                    onChange={(e) => handleInputChange("keyFeatures", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pricing">Pricing</Label>
                  <Input
                    id="pricing"
                    placeholder="$99/month, $299 one-time, Free with premium"
                    value={formData.pricing}
                    onChange={(e) => handleInputChange("pricing", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="competitors">Main Competitors</Label>
                  <Input
                    id="competitors"
                    placeholder="Competitor names (comma separated)"
                    value={formData.competitors}
                    onChange={(e) => handleInputChange("competitors", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="launchGoals">Launch Goals</Label>
                  <Textarea
                    id="launchGoals"
                    placeholder="What do you want to achieve with this launch?"
                    value={formData.launchGoals}
                    onChange={(e) => handleInputChange("launchGoals", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Marketing Budget</Label>
                  <select
                    id="budget"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    value={formData.budget}
                    onChange={(e) => handleInputChange("budget", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select budget range</option>
                    <option value="under-5k">Under $5,000</option>
                    <option value="5k-15k">$5,000 - $15,000</option>
                    <option value="15k-50k">$15,000 - $50,000</option>
                    <option value="50k-plus">$50,000+</option>
                  </select>
                </div>

                <div className="space-y-3 pt-4">
                  <Button
                    onClick={handleGenerate}
                    disabled={!hasAccess || isGenerating || !formData.productName || !formData.targetAudience}
                    className="w-full bg-gradient-to-r from-violet-400 to-purple-600 hover:opacity-90 text-white font-semibold py-3"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Launch Plan...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Generate Launch Campaign
                      </>
                    )}
                  </Button>

                  {!hasAccess && (
                    <div className="space-y-2">
                      <Link href="/upgrade">
                        <Button variant="outline" className="w-full bg-transparent">
                          <Crown className="w-4 h-4 mr-2" />
                          Upgrade to Agency Plan
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}
            {!result ? (
              <Card>
                <CardContent className="text-center py-20">
                  <Rocket className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Launch</h3>
                  <p className="text-gray-600">
                    {hasAccess
                      ? "Set up your product details and generate a comprehensive launch campaign"
                      : "Upgrade to Agency plan to access the product launch tool"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Performance Projections */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      Launch Projections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">{result.analytics.expectedReach}</div>
                        <div className="text-xs text-gray-600">Expected Reach</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">{result.analytics.projectedSignups}</div>
                        <div className="text-xs text-gray-600">Projected Signups</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">{result.analytics.estimatedRevenue}</div>
                        <div className="text-xs text-gray-600">Est. Revenue</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-lg font-bold text-yellow-600">{result.analytics.conversionRate}</div>
                        <div className="text-xs text-gray-600">Conversion Rate</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Launch Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-violet-500" />
                      Launch Timeline & Strategy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {result.timeline.map((phase, index) => (
                      <div key={index} className="border rounded-lg p-6 bg-white">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">{phase.phase}</h3>
                          <Badge variant="outline">{phase.timeline}</Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Activities:</h4>
                            <ul className="space-y-1 text-sm">
                              {phase.activities.map((activity, actIndex) => (
                                <li key={actIndex} className="flex items-start gap-2">
                                  <span className="w-2 h-2 bg-violet-500 rounded-full mt-2"></span>
                                  {activity}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Deliverables:</h4>
                            <ul className="space-y-1 text-sm">
                              {phase.deliverables.map((deliverable, delIndex) => (
                                <li key={delIndex} className="flex items-start gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                                  {deliverable}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Key Metrics:</h4>
                            <ul className="space-y-1 text-sm">
                              {phase.kpis.map((kpi, kpiIndex) => (
                                <li key={kpiIndex} className="flex items-start gap-2">
                                  <Target className="w-4 h-4 text-blue-500 mt-0.5" />
                                  {kpi}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Email Campaigns */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-blue-500" />
                      Email Campaign Templates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {Object.entries(result.emailCampaigns).map(([type, content]) => (
                      <div key={type} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium capitalize">{type.replace(/([A-Z])/g, " $1").trim()} Email</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(content, `email-${type}`)}
                          >
                            {copied[`email-${type}`] ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{content}</pre>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Social Media Posts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Share2 className="w-5 h-5 text-pink-500" />
                      Social Media Templates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(result.socialMediaPosts).map(([type, content]) => (
                      <div key={type} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium capitalize">{type} Post</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(content, `social-${type}`)}
                          >
                            {copied[`social-${type}`] ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-line">{content}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Press Release */}
                <Card>
                  <CardHeader>
                    <CardTitle>Press Release Template</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-gray-600">Professional press release for media outreach</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(result.pressRelease, "press-release")}
                      >
                        {copied["press-release"] ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{result.pressRelease}</pre>
                    </div>
                  </CardContent>
                </Card>

                {/* Content Calendar */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-orange-500" />
                      Content Calendar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.contentCalendar.map((week, weekIndex) => (
                      <div key={weekIndex} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">{week.week}</h4>
                        <div className="space-y-2">
                          {week.content.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="text-xs">
                                  {item.date}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {item.platform}
                                </Badge>
                                <span className="text-sm">{item.content}</span>
                              </div>
                              <Badge className="text-xs bg-blue-100 text-blue-800">{item.type}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(JSON.stringify(result, null, 2), "all-launch")}
                    className="flex-1"
                  >
                    {copied["all-launch"] ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    {copied["all-launch"] ? "Copied!" : "Copy All Content"}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 bg-transparent"
                    onClick={exportLaunchPlan}
                    disabled={!result}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Launch Plan
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
