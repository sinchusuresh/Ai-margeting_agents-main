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
import {
  ArrowLeft,
  Play,
  Download,
  Copy,
  CheckCircle,
  Loader2,
  Megaphone,
  Lock,
  Crown,
  Target,
  TrendingUp,
  Eye,
  MousePointer,
} from "lucide-react"
import { useUserStore } from "@/lib/user-store"
import { makeAuthenticatedRequest } from "@/lib/auth-utils"

interface AdVariation {
  platform: string
  format: string
  headline: string
  description: string
  cta: string
  character_count: {
    headline: number
    description: number
  }
  compliance_check: {
    passed: boolean
    issues: string[]
  }
}

interface AdCopyResult {
  variations: AdVariation[]
  performance_predictions: {
    expected_ctr: string
    expected_cpc: string
    expected_conversion_rate: string
  }
  optimization_tips: Array<{
    category: string
    tip: string
  }>
  a_b_test_suggestions: Array<{
    element: string
    variation_a: string
    variation_b: string
    test_hypothesis: string
  }>
  keyword_integration: {
    primary_keywords: string[]
    secondary_keywords: string[]
    keyword_density: number
  }
}

export default function AdCopyPage() {
  const { user } = useUserStore()
  const [formData, setFormData] = useState({
    product: "",
    audience: "",
    platforms: [] as string[],
    objective: "",
    tone: "",
    keywords: "",
    budget: "",
    competitors: "",
    usp: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<AdCopyResult | null>(null)
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({})
  const [isExporting, setIsExporting] = useState(false)

  const hasAccess = user.plan !== "Free Trial"

  const platforms = [
    { id: "google", name: "Google Ads", formats: ["Search", "Display", "Shopping"] },
    { id: "facebook", name: "Facebook Ads", formats: ["Feed", "Stories", "Carousel"] },
    { id: "instagram", name: "Instagram Ads", formats: ["Feed", "Stories", "Reels"] },
    { id: "linkedin", name: "LinkedIn Ads", formats: ["Sponsored Content", "Message Ads", "Text Ads"] },
    { id: "twitter", name: "Twitter Ads", formats: ["Promoted Tweets", "Promoted Accounts"] },
    { id: "youtube", name: "YouTube Ads", formats: ["Video", "Display", "Overlay"] },
  ]

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePlatformToggle = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }))
  }

  const handleGenerate = async () => {
    if (!hasAccess) {
      alert("Please upgrade to Pro or Agency plan to use this tool.")
      return
    }

    if (!formData.product || formData.platforms.length === 0) {
      alert("Please enter a product/service and select at least one platform")
      return
    }

    setIsGenerating(true)

    try {
      const data = await makeAuthenticatedRequest("/api/ai-tools/ad-copy/generate", {
        method: "POST",
        body: JSON.stringify({ 
          input: formData,
          timestamp: Date.now() // Add timestamp to prevent caching
        }),
      })

      if (data.output && data.output.error) {
        alert(`Ad copy generation failed: ${data.output.error}`)
        return
      }

      if (data.output && data.output.variations && Array.isArray(data.output.variations)) {
        setResult(data.output)
      } else {
        alert("Invalid ad copy data received. Please try again.")
      }
    } catch (error) {
      console.error("Ad copy generation error:", error)
      alert(error instanceof Error ? error.message : "Network error. Please check your connection and try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const generateHeadline = (product: string, usp: string, format: string) => {
    const headlines = [
      `Transform Your ${product} Experience Today`,
      `${usp || "Revolutionary"} ${product} Solution`,
      `Get Results with Premium ${product}`,
      `${product} That Actually Works`,
      `Boost Your Success with ${product}`,
      `The Future of ${product} is Here`,
    ]

    if (format.includes("Search")) {
      return headlines[0] + " - Free Trial"
    }

    return headlines[Math.floor(Math.random() * headlines.length)]
  }

  const generateDescription = (product: string, audience: string, usp: string, format: string) => {
    const descriptions = [
      `Discover how ${audience || "thousands of professionals"} are using our ${product} to achieve remarkable results. ${usp || "Proven solution"} with 24/7 support.`,
      `Join ${audience || "successful businesses"} who trust our ${product}. Get started with a free trial and see the difference in just 30 days.`,
      `Stop struggling with outdated ${product}. Our solution helps ${audience || "teams"} save time and increase productivity by up to 40%.`,
      `${usp || "Award-winning"} ${product} designed for ${audience || "modern businesses"}. Easy setup, powerful features, guaranteed results.`,
    ]

    return descriptions[Math.floor(Math.random() * descriptions.length)]
  }

  const generateCTA = (objective: string, format: string) => {
    const ctas = {
      "lead-generation": ["Get Free Quote", "Download Guide", "Start Free Trial", "Request Demo"],
      sales: ["Buy Now", "Shop Today", "Order Now", "Get Yours"],
      traffic: ["Learn More", "Discover How", "See Details", "Find Out More"],
      awareness: ["Explore Now", "See How", "Watch Video", "Learn More"],
    }

    const objectiveCTAs = ctas[objective as keyof typeof ctas] || ctas["traffic"]
    return objectiveCTAs[Math.floor(Math.random() * objectiveCTAs.length)]
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied((prev) => ({ ...prev, [id]: true }))
    setTimeout(() => setCopied((prev) => ({ ...prev, [id]: false })), 2000)
  }

  const handleExportToCSV = () => {
    if (!result || !result.variations || result.variations.length === 0) {
      alert("No ad copy to export!");
      return;
    }

    setIsExporting(true);

    try {
      // Create CSV content for ad platform import
      const headers = [
        "Platform", "Format", "Headline", "Description", "CTA", "Headline Characters", "Description Characters",
        "Compliance Passed", "Compliance Issues", "Expected CTR", "Expected CPC", "Expected Conversion Rate",
        "Quality Score", "Primary Keywords", "Secondary Keywords"
      ];
      
      const rows = result.variations.map((variation) => [
        variation.platform,
        variation.format,
        variation.headline.replace(/\n/g, " ").replace(/\r/g, " "),
        variation.description.replace(/\n/g, " ").replace(/\r/g, " "),
        variation.cta,
        variation.character_count.headline,
        variation.character_count.description,
        variation.compliance_check.passed ? "Yes" : "No",
        variation.compliance_check.issues.join("; "),
        result.performance_predictions?.expected_ctr || "N/A",
        result.performance_predictions?.expected_cpc || "N/A",
        result.performance_predictions?.expected_conversion_rate || "N/A",
        result.performance_predictions?.quality_score || "N/A",
        result.keyword_integration?.primary_keywords?.join(", ") || "N/A",
        result.keyword_integration?.secondary_keywords?.join(", ") || "N/A"
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
      ].join("\r\n");

      // Create a Blob and trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "ad-copy-variations.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Also create a JSON export for advanced ad platforms
      const jsonExport = {
        variations: result.variations,
        performance_predictions: result.performance_predictions,
        optimization_tips: result.optimization_tips,
        a_b_test_suggestions: result.a_b_test_suggestions,
        keyword_integration: result.keyword_integration,
        exportDate: new Date().toISOString(),
        platform: "AI Marketing Agents"
      };
      
      const jsonBlob = new Blob([JSON.stringify(jsonExport, null, 2)], { type: "application/json" });
      const jsonUrl = URL.createObjectURL(jsonBlob);
      const jsonLink = document.createElement("a");
      jsonLink.href = jsonUrl;
      jsonLink.setAttribute("download", "ad-copy-data.json");
      document.body.appendChild(jsonLink);
      jsonLink.click();
      document.body.removeChild(jsonLink);
      URL.revokeObjectURL(jsonUrl);

      setTimeout(() => {
        setIsExporting(false);
        alert("Ad copy exported successfully! You can now import the CSV file into your ad platform.");
      }, 1000);
    } catch (error) {
      console.error("Export error:", error);
      setIsExporting(false);
      alert("Export failed. Please try again.");
    }
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
              <div className="w-10 h-10 bg-gradient-to-r from-red-400 to-pink-600 rounded-xl flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Ad Copy Generator</h1>
              {hasAccess ? (
                <Badge className="bg-green-100 text-green-800">Available</Badge>
              ) : (
                <Badge className="bg-orange-100 text-orange-800">Pro Required</Badge>
              )}
            </div>
            <p className="text-gray-600">High-converting ad copy for Google, Facebook, LinkedIn and more platforms</p>
          </div>
        </div>

        {!hasAccess && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <Lock className="h-4 w-4" />
            <AlertDescription className="text-orange-800">
              This tool requires a Pro plan or higher.
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
                <CardTitle>Ad Campaign Setup</CardTitle>
                <CardDescription>Configure your ad copy parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product">Product/Service *</Label>
                  <Input
                    id="product"
                    placeholder="AI marketing software, consulting services"
                    value={formData.product}
                    onChange={(e) => handleInputChange("product", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Input
                    id="audience"
                    placeholder="Small business owners, marketing managers"
                    value={formData.audience}
                    onChange={(e) => handleInputChange("audience", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Select Platforms *</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {platforms.map((platform) => (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => handlePlatformToggle(platform.id)}
                        disabled={!hasAccess}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                          formData.platforms.includes(platform.id)
                            ? "border-red-500 bg-red-50 text-red-700"
                            : "border-gray-200 hover:border-red-300"
                        } ${!hasAccess ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <span className="font-medium">{platform.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {platform.formats.length} formats
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objective">Campaign Objective</Label>
                  <select
                    id="objective"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={formData.objective}
                    onChange={(e) => handleInputChange("objective", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select objective</option>
                    <option value="lead-generation">Lead Generation</option>
                    <option value="sales">Drive Sales</option>
                    <option value="traffic">Website Traffic</option>
                    <option value="awareness">Brand Awareness</option>
                    <option value="engagement">Engagement</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone">Ad Tone</Label>
                  <select
                    id="tone"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={formData.tone}
                    onChange={(e) => handleInputChange("tone", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select tone</option>
                    <option value="professional">Professional</option>
                    <option value="casual">Casual & Friendly</option>
                    <option value="urgent">Urgent & Direct</option>
                    <option value="luxury">Premium & Luxury</option>
                    <option value="playful">Fun & Playful</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">Target Keywords</Label>
                  <Textarea
                    id="keywords"
                    placeholder="marketing automation, CRM software, lead generation"
                    value={formData.keywords}
                    onChange={(e) => handleInputChange("keywords", e.target.value)}
                    disabled={!hasAccess}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usp">Unique Selling Proposition</Label>
                  <Input
                    id="usp"
                    placeholder="30% faster results, AI-powered, award-winning"
                    value={formData.usp}
                    onChange={(e) => handleInputChange("usp", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Monthly Ad Budget</Label>
                  <select
                    id="budget"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={formData.budget}
                    onChange={(e) => handleInputChange("budget", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select budget range</option>
                    <option value="under-1k">Under $1,000</option>
                    <option value="1k-5k">$1,000 - $5,000</option>
                    <option value="5k-10k">$5,000 - $10,000</option>
                    <option value="10k-25k">$10,000 - $25,000</option>
                    <option value="over-25k">Over $25,000</option>
                  </select>
                </div>

                <div className="space-y-3 pt-4">
                  <Button
                    onClick={handleGenerate}
                    disabled={!hasAccess || isGenerating || !formData.product || formData.platforms.length === 0}
                    className="w-full bg-gradient-to-r from-red-400 to-pink-600 hover:opacity-90 text-white font-semibold py-3"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Ad Copy...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Generate Ad Copy
                      </>
                    )}
                  </Button>

                  {!hasAccess && (
                    <div className="space-y-2">
                      <Link href="/upgrade">
                        <Button variant="outline" className="w-full bg-transparent">
                          <Crown className="w-4 h-4 mr-2" />
                          Upgrade to Pro Plan
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
            {!result ? (
              <Card>
                <CardContent className="text-center py-20">
                  <Megaphone className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Create</h3>
                  <p className="text-gray-600">
                    {hasAccess
                      ? "Enter your product details, select platforms, and generate high-converting ad copy"
                      : "Upgrade to Pro plan to access the ad copy generator"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Performance Predictions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      Performance Predictions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {result.performance_predictions && result.performance_predictions.expected_ctr !== undefined
                            ? result.performance_predictions.expected_ctr
                            : "N/A"}
                        </div>
                        <div className="text-sm text-gray-600">Expected CTR</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {result.performance_predictions && result.performance_predictions.expected_cpc !== undefined
                            ? result.performance_predictions.expected_cpc
                            : "N/A"}
                        </div>
                        <div className="text-sm text-gray-600">Expected CPC</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {result.performance_predictions && result.performance_predictions.expected_conversion_rate !== undefined
                            ? result.performance_predictions.expected_conversion_rate
                            : "N/A"}
                        </div>
                        <div className="text-sm text-gray-600">Conversion Rate</div>
                      </div>

                    </div>
                  </CardContent>
                </Card>

                {/* Generated Ad Variations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-red-500" />
                      Generated Ad Variations ({result.variations ? result.variations.length : 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {result.variations && Array.isArray(result.variations) && result.variations.length > 0 ? (
                      result.variations.map((variation, index) => (
                        <div key={index} className="border rounded-lg p-6 bg-white">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{variation.platform}</Badge>
                              <Badge variant="outline">{variation.format}</Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  copyToClipboard(
                                    `${variation.headline}\n\n${variation.description}\n\n${variation.cta}`,
                                    `ad-${index}`,
                                  )
                                }
                              >
                                {copied[`ad-${index}`] ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                              {variation.compliance_check.passed ? (
                                <Badge className="bg-green-100 text-green-800">✓ Compliant</Badge>
                              ) : (
                                <Badge className="bg-yellow-100 text-yellow-800">⚠ Review</Badge>
                              )}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Headline:</h4>
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="font-medium text-blue-900">{variation.headline}</p>
                                <p className="text-xs text-blue-600 mt-1">
                                  {variation.character_count.headline} characters
                                </p>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Description:</h4>
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-gray-700">{variation.description}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {variation.character_count.description} characters
                                </p>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Call-to-Action:</h4>
                              <div className="bg-green-50 p-3 rounded-lg">
                                <p className="font-medium text-green-800">{variation.cta}</p>
                              </div>
                            </div>

                            {!variation.compliance_check.passed && variation.compliance_check.issues.length > 0 && (
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Compliance Issues:</h4>
                                <ul className="space-y-1">
                                  {variation.compliance_check.issues.map((issue, idx) => (
                                    <li key={idx} className="text-sm text-yellow-700 flex items-center gap-2">
                                      <span className="w-1 h-1 bg-yellow-500 rounded-full"></span>
                                      {issue}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-400">No ad variations found.</div>
                    )}
                  </CardContent>
                </Card>

                {/* Keyword Integration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-500" />
                      Keyword Integration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {result.keyword_integration && result.keyword_integration.primary_keywords !== undefined
                            ? result.keyword_integration.primary_keywords.length
                            : "N/A"}
                        </div>
                        <div className="text-sm text-gray-600">Primary Keywords</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {result.keyword_integration && result.keyword_integration.secondary_keywords !== undefined
                            ? result.keyword_integration.secondary_keywords.length
                            : "N/A"}
                        </div>
                        <div className="text-sm text-gray-600">Secondary Keywords</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {result.keyword_integration && result.keyword_integration.keyword_density !== undefined
                            ? result.keyword_integration.keyword_density
                            : "N/A"}%
                        </div>
                        <div className="text-sm text-gray-600">Keyword Density</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Primary Keywords:</h4>
                        <div className="flex flex-wrap gap-2">
                          {result.keyword_integration && result.keyword_integration.primary_keywords !== undefined
                            ? result.keyword_integration.primary_keywords.map((keyword, index) => (
                                <Badge key={index} className="bg-blue-100 text-blue-800">
                                  {keyword}
                                </Badge>
                              ))
                            : "N/A"}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Secondary Keywords:</h4>
                        <div className="flex flex-wrap gap-2">
                          {result.keyword_integration && result.keyword_integration.secondary_keywords !== undefined
                            ? result.keyword_integration.secondary_keywords.map((keyword, index) => (
                                <Badge key={index} variant="secondary">
                                  {keyword}
                                </Badge>
                              ))
                            : "N/A"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* A/B Test Suggestions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MousePointer className="w-5 h-5 text-purple-500" />
                      A/B Test Suggestions ({result.a_b_test_suggestions ? result.a_b_test_suggestions.length : 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.a_b_test_suggestions && Array.isArray(result.a_b_test_suggestions) && result.a_b_test_suggestions.length > 0 ? (
                      result.a_b_test_suggestions.map((test, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">{test.element} Test</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <h5 className="text-sm font-medium text-blue-700 mb-1">Variation A:</h5>
                              <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded">{test.variation_a}</p>
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-green-700 mb-1">Variation B:</h5>
                              <p className="text-sm text-gray-600 bg-green-50 p-2 rounded">{test.variation_b}</p>
                            </div>
                          </div>
                          <div className="bg-purple-50 p-3 rounded">
                            <h5 className="text-sm font-medium text-purple-700 mb-1">Test Hypothesis:</h5>
                            <p className="text-sm text-purple-600">{test.test_hypothesis}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-400">No A/B test suggestions found.</div>
                    )}
                  </CardContent>
                </Card>

                {/* Optimization Tips */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-orange-500" />
                      Optimization Tips ({result.optimization_tips ? result.optimization_tips.length : 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.optimization_tips && Array.isArray(result.optimization_tips) && result.optimization_tips.length > 0 ? (
                      result.optimization_tips.map((tip, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="mb-2">
                            <h4 className="font-medium text-gray-900">{tip.category}</h4>
                          </div>
                          <p className="text-sm text-gray-600">{tip.tip}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-400">No optimization tips found.</div>
                    )}
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(JSON.stringify(result, null, 2), "all-ads")}
                    className="flex-1"
                  >
                    {copied["all-ads"] ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied["all-ads"] ? "Copied!" : "Copy All Ad Copy"}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 bg-transparent" 
                    onClick={handleExportToCSV}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    {isExporting ? "Exporting..." : "Export to CSV"}
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
