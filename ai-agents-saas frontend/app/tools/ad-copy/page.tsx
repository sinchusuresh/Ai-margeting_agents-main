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
  cta_variations?: string[]
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
    quality_score?: string
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

  const getCTAActionText = (cta: string) => {
    const ctaLower = cta.toLowerCase();
    if (ctaLower.includes('get started') || ctaLower.includes('start') || ctaLower.includes('begin')) {
      return 'Start onboarding';
    } else if (ctaLower.includes('learn more') || ctaLower.includes('learn') || ctaLower.includes('discover')) {
      return 'View details';
    } else if (ctaLower.includes('try now') || ctaLower.includes('try') || ctaLower.includes('demo')) {
      return 'Start trial';
    } else if (ctaLower.includes('shop now') || ctaLower.includes('buy') || ctaLower.includes('purchase')) {
      return 'Go to checkout';
    } else if (ctaLower.includes('contact') || ctaLower.includes('reach')) {
      return 'Contact sales';
    } else {
      return 'Take action';
    }
  };

  const handleCTAAction = (cta: string, platform: string) => {
    const ctaLower = cta.toLowerCase();
    
    // Show action modal with platform-specific options
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 12px;
      max-width: 500px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    `;
    
    let actionContent = '';
    let actionButtons = '';
    
    // Get platform-specific URLs
    const getPlatformUrls = (platform: string, action: string) => {
      const platformLower = platform.toLowerCase();
      
      if (platformLower.includes('google') || platformLower.includes('ads')) {
        return {
          main: 'https://ads.google.com',
          help: 'https://support.google.com/ads',
          docs: 'https://developers.google.com/google-ads/api/docs',
          demo: 'https://ads.google.com/um/Welcome/Home',
          business: 'https://ads.google.com/um/Welcome/Home'
        };
      } else if (platformLower.includes('facebook') || platformLower.includes('meta')) {
        return {
          main: 'https://business.facebook.com',
          help: 'https://www.facebook.com/business/help',
          docs: 'https://developers.facebook.com/docs/marketing-api',
          demo: 'https://business.facebook.com/overview',
          business: 'https://business.facebook.com/overview'
        };
      } else if (platformLower.includes('instagram')) {
        return {
          main: 'https://business.instagram.com',
          help: 'https://help.instagram.com',
          docs: 'https://developers.facebook.com/docs/instagram-api',
          demo: 'https://business.instagram.com/overview',
          business: 'https://business.instagram.com/overview'
        };
      } else if (platformLower.includes('linkedin')) {
        return {
          main: 'https://business.linkedin.com',
          help: 'https://www.linkedin.com/help/linkedin',
          docs: 'https://developer.linkedin.com/docs',
          demo: 'https://business.linkedin.com/marketing-solutions',
          business: 'https://business.linkedin.com/marketing-solutions'
        };
      } else if (platformLower.includes('twitter')) {
        return {
          main: 'https://ads.twitter.com',
          help: 'https://help.twitter.com/en/using-twitter/twitter-ads',
          docs: 'https://developer.twitter.com/en/docs/ads',
          demo: 'https://ads.twitter.com/onboarding',
          business: 'https://ads.twitter.com/onboarding'
        };
      } else if (platformLower.includes('youtube')) {
        return {
          main: 'https://ads.youtube.com',
          help: 'https://support.google.com/youtube/answer/9002584',
          docs: 'https://developers.google.com/youtube/v3/docs',
          demo: 'https://ads.youtube.com/onboarding',
          business: 'https://ads.youtube.com/onboarding'
        };
      } else {
        // Default fallback
        return {
          main: 'https://ads.google.com',
          help: 'https://support.google.com/ads',
          docs: 'https://developers.google.com/google-ads/api/docs',
          demo: 'https://ads.google.com/um/Welcome/Home',
          business: 'https://ads.google.com/um/Welcome/Home'
        };
      }
    };

    const urls = getPlatformUrls(platform, cta);
    
    if (ctaLower.includes('get started') || ctaLower.includes('start') || ctaLower.includes('begin')) {
      actionContent = `
        <h3 style="font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #1f2937;">🚀 Get Started with ${platform}</h3>
        <p style="color: #6b7280; margin-bottom: 24px;">Ready to launch your ${platform} campaign? Choose your next step:</p>
      `;
      actionButtons = `
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <button onclick="window.open('${urls.main}', '_blank')" style="background: #4285f4; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">Open ${platform}</button>
          <button onclick="window.open('${urls.help}', '_blank')" style="background: #34a853; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">View Tutorial</button>
          <button onclick="this.closest('.modal-overlay').remove()" style="background: #6b7280; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">Close</button>
        </div>
      `;
    } else if (ctaLower.includes('learn more') || ctaLower.includes('learn') || ctaLower.includes('discover')) {
      actionContent = `
        <h3 style="font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #1f2937;">📚 Learn More About ${platform}</h3>
        <p style="color: #6b7280; margin-bottom: 24px;">Discover best practices and strategies for ${platform} advertising:</p>
      `;
      actionButtons = `
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <button onclick="window.open('${urls.docs}', '_blank')" style="background: #1877f2; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">${platform} Docs</button>
          <button onclick="window.open('${urls.help}', '_blank')" style="background: #42a5f5; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">Help Center</button>
          <button onclick="this.closest('.modal-overlay').remove()" style="background: #6b7280; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">Close</button>
        </div>
      `;
    } else if (ctaLower.includes('try now') || ctaLower.includes('try') || ctaLower.includes('demo')) {
      actionContent = `
        <h3 style="font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #1f2937;">🎯 Try ${platform} Now</h3>
        <p style="color: #6b7280; margin-bottom: 24px;">Experience ${platform} advertising with our interactive demo:</p>
      `;
      actionButtons = `
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <button onclick="window.open('${urls.demo}', '_blank')" style="background: #0077b5; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">Live Demo</button>
          <button onclick="window.open('${urls.help}', '_blank')" style="background: #00a0dc; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">Free Course</button>
          <button onclick="this.closest('.modal-overlay').remove()" style="background: #6b7280; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">Close</button>
        </div>
      `;
    } else if (ctaLower.includes('shop now') || ctaLower.includes('buy') || ctaLower.includes('purchase')) {
      actionContent = `
        <h3 style="font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #1f2937;">🛒 Shop Now on ${platform}</h3>
        <p style="color: #6b7280; margin-bottom: 24px;">Ready to purchase? Complete your ${platform} campaign setup:</p>
      `;
      actionButtons = `
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <button onclick="window.open('${urls.demo}', '_blank')" style="background: #ea4335; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">Create Campaign</button>
          <button onclick="window.open('${urls.business}', '_blank')" style="background: #1877f2; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">Business Manager</button>
          <button onclick="this.closest('.modal-overlay').remove()" style="background: #6b7280; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">Close</button>
        </div>
      `;
    } else {
      actionContent = `
        <h3 style="font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #1f2937;">🎯 ${cta} Action</h3>
        <p style="color: #6b7280; margin-bottom: 24px;">Take action with your ${platform} campaign:</p>
      `;
      actionButtons = `
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <button onclick="window.open('${urls.main}', '_blank')" style="background: #4285f4; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">Open ${platform}</button>
          <button onclick="this.closest('.modal-overlay').remove()" style="background: #6b7280; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">Close</button>
        </div>
      `;
    }
    
    modalContent.innerHTML = actionContent + actionButtons;
    modal.appendChild(modalContent);
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    // Log the action
    console.log(`CTA Action: ${cta} clicked for ${platform}`);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        console.log('Text copied via clipboard API:', text);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          console.log('Text copied via execCommand:', text);
        } catch (err) {
          console.error('execCommand failed:', err);
          // Last resort - show alert with text
          alert(`Copy this text: ${text}`);
        }
        
        document.body.removeChild(textArea);
      }
      
      // Show success feedback
      setCopied((prev) => ({ ...prev, [id]: true }));
      
      // Show what was copied
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 9999;
        font-family: system-ui, sans-serif;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 300px;
        word-wrap: break-word;
      `;
      toast.textContent = `Copied: ${text}`;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 3000);
      
      setTimeout(() => setCopied((prev) => ({ ...prev, [id]: false })), 2000);
      
    } catch (error) {
      console.error('Clipboard copy failed:', error);
      // Show alert as fallback
      alert(`Copy this text: ${text}`);
    }
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
        "Platform", "Format", "Headline", "Description", "CTA", "CTA Variations", "Headline Characters", "Description Characters",
        "Compliance Passed", "Compliance Issues", "Expected CTR", "Expected CPC", "Expected Conversion Rate",
        "Quality Score", "Primary Keywords", "Secondary Keywords"
      ];
      
      const rows = result.variations.map((variation) => [
        variation.platform,
        variation.format,
        variation.headline.replace(/\n/g, " ").replace(/\r/g, " "),
        variation.description.replace(/\n/g, " ").replace(/\r/g, " "),
        variation.cta,
        variation.cta_variations ? variation.cta_variations.join(" | ") : "N/A",
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
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {result.performance_predictions && result.performance_predictions.quality_score !== undefined
                            ? result.performance_predictions.quality_score
                            : "N/A"}
                        </div>
                        <div className="text-sm text-gray-600">Quality Score</div>
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

                            {variation.cta_variations && variation.cta_variations.length > 0 && (
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">CTA Variations for A/B Testing:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                  {variation.cta_variations.map((cta, idx) => (
                                    <div key={idx} className="flex flex-col gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCTAAction(cta, variation.platform)}
                                        className="bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-800 h-auto p-2 relative group"
                                        title={`Click to ${getCTAActionText(cta)}`}
                                      >
                                        <span className="text-sm font-medium">{cta}</span>
                                        
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                          {getCTAActionText(cta)}
                                        </div>
                                      </Button>
                                      
                                      {/* Copy button below each CTA */}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(cta, `cta-${index}-${idx}`)}
                                        className="h-8 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                                      >
                                        {copied[`cta-${index}-${idx}`] ? (
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                        ) : (
                                          <Copy className="w-3 h-3 mr-1" />
                                        )}
                                        Copy
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

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
