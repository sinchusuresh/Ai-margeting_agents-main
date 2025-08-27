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
import { ArrowLeft, Play, Download, Copy, CheckCircle, Loader2, Lock, Crown } from "lucide-react"
import { useParams } from "next/navigation"
import { useUserStore } from "@/lib/user-store"
import { generateContent } from "@/lib/openai-client"
import jsPDF from "jspdf";

interface ToolInput {
  name: string
  label: string
  type: string
  placeholder?: string
  required?: boolean
  options?: string[]
}

interface ToolData {
  title: string
  description: string
  color: string
  inputs: ToolInput[]
  available: boolean
  plan?: string
}

interface FormData {
  [key: string]: string
}

interface SEOAuditResult {
  score: number
  issues: string[]
  recommendations: string[]
  report: string
}

interface SocialMediaPost {
  platform: string
  content: string
  hashtags: string[]
}

interface SocialMediaResult {
  posts: SocialMediaPost[]
}

interface BlogWritingResult {
  title: string
  content: string
  wordCount: number
  seoScore: number
}

interface EmailMarketingResult {
  subject: string
  content: string
  openRate: string
  clickRate: string
}

type ToolResult = SEOAuditResult | SocialMediaResult | BlogWritingResult | EmailMarketingResult

const toolsData: Record<string, ToolData> = {
  "seo-audit": {
    title: "SEO Audit Tool",
    description: "Comprehensive website SEO analysis with actionable insights",
    color: "from-green-400 to-emerald-600",
    inputs: [
      { name: "url", label: "Website URL", type: "url", placeholder: "https://example.com", required: true },
      { name: "keywords", label: "Target Keywords", type: "text", placeholder: "marketing, SEO, digital" },
      {
        name: "competitors",
        label: "Competitor URLs",
        type: "textarea",
        placeholder: "https://competitor1.com\nhttps://competitor2.com",
      },
    ],
    available: true,
  },
  "social-media": {
    title: "Social Media Content Generator",
    description: "Generate engaging social media posts for all platforms",
    color: "from-pink-400 to-rose-600",
    inputs: [
      { name: "topic", label: "Content Topic", type: "text", placeholder: "AI marketing tools", required: true },
      {
        name: "platform",
        label: "Platform",
        type: "select",
        options: ["Instagram", "LinkedIn", "Twitter", "Facebook", "TikTok"],
        required: true,
      },
      {
        name: "tone",
        label: "Tone",
        type: "select",
        options: ["Professional", "Casual", "Funny", "Inspirational", "Educational"],
      },
      { name: "audience", label: "Target Audience", type: "text", placeholder: "Small business owners, marketers" },
    ],
    available: true,
  },
  "blog-writing": {
    title: "Blog Writing & Optimization",
    description: "AI-powered long-form content creation optimized for search engines",
    color: "from-blue-400 to-cyan-600",
    inputs: [
      {
        name: "title",
        label: "Blog Title",
        type: "text",
        placeholder: "The Ultimate Guide to AI Marketing",
        required: true,
      },
      { name: "keywords", label: "SEO Keywords", type: "text", placeholder: "AI marketing, automation, tools" },
      { name: "length", label: "Word Count", type: "select", options: ["500-800", "800-1200", "1200-2000", "2000+"] },
      { name: "audience", label: "Target Audience", type: "text", placeholder: "Marketing professionals" },
    ],
    available: false,
    plan: "Pro",
  },
  "email-marketing": {
    title: "Email Marketing Agent",
    description: "Create compelling email campaigns and automated sequences",
    color: "from-purple-400 to-violet-600",
    inputs: [
      {
        name: "subject",
        label: "Email Subject",
        type: "text",
        placeholder: "Boost Your Marketing ROI",
        required: true,
      },
      { name: "audience", label: "Target Audience", type: "text", placeholder: "Small business owners" },
      {
        name: "goal",
        label: "Campaign Goal",
        type: "select",
        options: ["Lead Generation", "Sales", "Engagement", "Newsletter", "Welcome Series"],
      },
      {
        name: "tone",
        label: "Email Tone",
        type: "select",
        options: ["Professional", "Friendly", "Urgent", "Educational"],
      },
    ],
    available: false,
    plan: "Pro",
  },
  "client-reporting": {
    title: "Client Reporting Agent",
    description: "Automated monthly reports with KPI analysis and visual charts",
    color: "from-orange-400 to-red-600",
    inputs: [
      { name: "client", label: "Client Name", type: "text", placeholder: "ABC Company", required: true },
      { name: "period", label: "Reporting Period", type: "select", options: ["Weekly", "Monthly", "Quarterly"] },
      { name: "metrics", label: "Key Metrics", type: "text", placeholder: "Traffic, Conversions, ROI" },
      { name: "goals", label: "Campaign Goals", type: "textarea", placeholder: "Increase website traffic by 25%" },
    ],
    available: false,
    plan: "Pro",
  },
  "ad-copy": {
    title: "Ad Copy Generator",
    description: "High-converting ad creatives for Google, Meta, and LinkedIn platforms",
    color: "from-yellow-400 to-orange-600",
    inputs: [
      { name: "product", label: "Product/Service", type: "text", placeholder: "AI Marketing Software", required: true },
      {
        name: "platform",
        label: "Ad Platform",
        type: "select",
        options: ["Google Ads", "Facebook", "Instagram", "LinkedIn", "Twitter"],
      },
      {
        name: "objective",
        label: "Campaign Objective",
        type: "select",
        options: ["Lead Generation", "Sales", "Brand Awareness", "Traffic"],
      },
      { name: "audience", label: "Target Audience", type: "text", placeholder: "Marketing managers, 25-45 years old" },
    ],
    available: false,
    plan: "Pro",
  },
  "landing-page": {
    title: "Landing Page Builder Assistant",
    description: "Auto-generate compelling landing page copy that converts",
    color: "from-teal-400 to-green-600",
    inputs: [
      { name: "product", label: "Product/Service", type: "text", placeholder: "AI Marketing Course", required: true },
      { name: "audience", label: "Target Audience", type: "text", placeholder: "Small business owners" },
      {
        name: "goal",
        label: "Page Goal",
        type: "select",
        options: ["Lead Generation", "Sales", "Sign-up", "Download"],
      },
      {
        name: "benefits",
        label: "Key Benefits",
        type: "textarea",
        placeholder: "Save time, increase ROI, automate marketing",
      },
    ],
    available: false,
    plan: "Pro",
  },
  "competitor-analysis": {
    title: "Competitor Analysis Agent",
    description: "Deep competitor insights and SWOT analysis for strategic advantage",
    color: "from-indigo-400 to-purple-600",
    inputs: [
      { name: "company", label: "Your Company", type: "text", placeholder: "Your Business Name", required: true },
      {
        name: "competitors",
        label: "Competitor URLs",
        type: "textarea",
        placeholder: "https://competitor1.com\nhttps://competitor2.com",
      },
      { name: "industry", label: "Industry", type: "text", placeholder: "Digital Marketing" },
      {
        name: "focus",
        label: "Analysis Focus",
        type: "select",
        options: ["Overall Strategy", "Content Marketing", "SEO", "Social Media", "Pricing"],
      },
    ],
    available: false,
    plan: "Pro",
  },
  "cold-outreach": {
    title: "Cold Outreach Personalization",
    description: "Personalized outreach messages based on prospect research",
    color: "from-rose-400 to-pink-600",
    inputs: [
      { name: "prospect", label: "Prospect Name", type: "text", placeholder: "John Smith", required: true },
      { name: "company", label: "Prospect Company", type: "text", placeholder: "ABC Corp" },
      {
        name: "platform",
        label: "Outreach Platform",
        type: "select",
        options: ["Email", "LinkedIn", "Twitter", "Cold Call Script"],
      },
      {
        name: "goal",
        label: "Outreach Goal",
        type: "select",
        options: ["Meeting Request", "Demo", "Partnership", "Sales"],
      },
    ],
    available: false,
    plan: "Pro",
  },
  "reels-scripts": {
    title: "Reels/Shorts Scriptwriter",
    description: "Engaging short-form video scripts with visual suggestions",
    color: "from-cyan-400 to-blue-600",
    inputs: [
      { name: "topic", label: "Video Topic", type: "text", placeholder: "5 AI Marketing Tips", required: true },
      {
        name: "platform",
        label: "Platform",
        type: "select",
        options: ["Instagram Reels", "YouTube Shorts", "TikTok", "Facebook Reels"],
      },
      {
        name: "duration",
        label: "Video Length",
        type: "select",
        options: ["15 seconds", "30 seconds", "60 seconds", "90 seconds"],
      },
      {
        name: "style",
        label: "Video Style",
        type: "select",
        options: ["Educational", "Entertainment", "Behind-the-scenes", "Tutorial"],
      },
    ],
    available: false,
    plan: "Pro",
  },
  "product-launch": {
    title: "Product Launch Agent",
    description: "Complete launch campaign with emails, posts, and content calendar",
    color: "from-violet-400 to-purple-600",
    inputs: [
      { name: "product", label: "Product Name", type: "text", placeholder: "AI Marketing Suite", required: true },
      { name: "launch_date", label: "Launch Date", type: "date", required: true },
      { name: "audience", label: "Target Audience", type: "text", placeholder: "Marketing professionals" },
      { name: "channels", label: "Marketing Channels", type: "text", placeholder: "Email, Social Media, PR" },
    ],
    available: false,
    plan: "Agency",
  },
  "blog-to-video": {
    title: "Blog-to-Video Agent",
    description: "Convert blog content into engaging video scripts and storyboards",
    color: "from-emerald-400 to-teal-600",
    inputs: [
      {
        name: "blog_url",
        label: "Blog Post URL",
        type: "url",
        placeholder: "https://yourblog.com/post",
        required: true,
      },
      {
        name: "video_type",
        label: "Video Type",
        type: "select",
        options: ["Explainer Video", "Tutorial", "Summary", "Animated"],
      },
      {
        name: "duration",
        label: "Target Duration",
        type: "select",
        options: ["1-2 minutes", "3-5 minutes", "5-10 minutes", "10+ minutes"],
      },
      {
        name: "style",
        label: "Video Style",
        type: "select",
        options: ["Professional", "Casual", "Educational", "Entertainment"],
      },
    ],
    available: false,
    plan: "Agency",
  },
  "local-seo": {
    title: "Local SEO Booster",
    description: "Optimize local search visibility and Google Business Profile",
    color: "from-amber-400 to-yellow-600",
    inputs: [
      { name: "business", label: "Business Name", type: "text", placeholder: "Your Local Business", required: true },
      { name: "location", label: "Business Location", type: "text", placeholder: "New York, NY" },
      { name: "category", label: "Business Category", type: "text", placeholder: "Restaurant, Dentist, etc." },
      { name: "keywords", label: "Local Keywords", type: "text", placeholder: "best pizza near me, dentist NYC" },
    ],
    available: false,
    plan: "Agency",
  },
}

export default function ToolPage() {
  const params = useParams()
  const toolId = params.toolId as string
  const { user } = useUserStore()
  const [formData, setFormData] = useState<FormData>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<ToolResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const tool = toolsData[toolId]

  if (!tool) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Tool Not Found</h1>
            <p className="text-gray-600 mb-6">The tool you're looking for doesn't exist or may have been moved.</p>
            <div className="space-y-3">
              <Link href="/tools">
                <Button className="w-full">Browse All Tools</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full bg-transparent">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Check if user can access this tool based on their plan
  const canAccess = () => {
    if (tool.available) return true // Free trial tools
    if (user.plan === "Free Trial") return false
    if (user.plan === "Starter") return tool.plan !== "Agency"
    return true // Pro and Agency have access to all
  }

  const hasAccess = canAccess()

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleGenerate = async () => {
    if (!hasAccess) {
      alert("Please upgrade your plan to use this tool.")
      return
    }

    setIsGenerating(true)
    setResult(null)
    setError(null)

    try {
      // Create a dynamic prompt based on the tool type
      let prompt = `Generate content for the ${tool.title} tool with the following inputs:\n\n`;
      
      // Add form data to the prompt
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          prompt += `${key}: ${value}\n`;
        }
      });

      // Add tool-specific instructions
      switch (toolId) {
        case "seo-audit":
          prompt += `\nPlease provide a comprehensive SEO audit including:
1. Overall score (0-100)
2. Key issues found
3. Specific recommendations
4. Detailed report summary

Format as JSON with: score, issues[], recommendations[], report`;
          break;
        case "social-media":
          prompt += `\nPlease provide engaging social media content including:
1. Platform-specific posts with content and hashtags
2. Content optimized for the selected platform
3. Relevant hashtags and engagement tips

Format as JSON with: posts[{platform, content, hashtags[]}]`;
          break;
        case "blog-writing":
          prompt += `\nPlease provide a comprehensive blog post including:
1. Engaging title
2. Full content with proper structure
3. Word count
4. SEO optimization score

Format as JSON with: title, content, wordCount, seoScore`;
          break;
        case "email-marketing":
          prompt += `\nPlease provide email marketing content including:
1. Compelling subject line
2. Full email content
3. Expected open rate
4. Expected click rate

Format as JSON with: subject, content, openRate, clickRate`;
          break;
        default:
          prompt += `\nPlease provide comprehensive results for this tool in JSON format.`;
      }

      // Use the shared OpenAI client
      const result = await generateContent(prompt, {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 4000
      });

      if (!result.success || !result.content) {
        throw new Error(result.error || 'Failed to generate content');
      }

      // Parse the AI response
      let aiOutput;
      try {
        aiOutput = JSON.parse(result.content);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        // Try to extract JSON from the response if it's wrapped in markdown
        const jsonMatch = result.content.match(/```json\s*([\s\S]*?)\s*```/) ||
                         result.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiOutput = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          throw new Error('AI response could not be parsed as valid JSON');
        }
      }

      console.log('Generated content:', aiOutput);
      setResult(aiOutput);

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
      } else {
        setError(`Failed to generate content: ${errorMessage}`);
      }

      // No fallback data - show empty state
      setResult(null);
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Tool Report", 10, 15);
    doc.setFontSize(12);
    doc.text(`Tool: ${toolId || "N/A"}`, 10, 25);
    doc.text("Results:", 10, 35);
    doc.text(JSON.stringify(result, null, 2), 12, 45);
    doc.save("tool-report.pdf");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/tools" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tools
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{tool.title}</h1>
              {hasAccess ? (
                <Badge className="bg-green-100 text-green-800">Available</Badge>
              ) : (
                <Badge className="bg-orange-100 text-orange-800">{tool.plan} Required</Badge>
              )}
            </div>
            <p className="text-gray-600">{tool.description}</p>
          </div>
        </div>

        {!hasAccess && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <Lock className="h-4 w-4" />
            <AlertDescription className="text-orange-800">
              This tool requires a {tool.plan} plan or higher.
              <Link href="/upgrade" className="font-semibold underline ml-1">
                Upgrade now
              </Link>{" "}
              to access this feature.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle>Tool Configuration</CardTitle>
              <CardDescription>Enter the details for your {tool.title.toLowerCase()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tool.inputs.map((input: ToolInput) => (
                <div key={input.name} className="space-y-2">
                  <Label htmlFor={input.name}>
                    {input.label}
                    {input.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>

                  {input.type === "select" ? (
                    <select
                      id={input.name}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      onChange={(e) => handleInputChange(input.name, e.target.value)}
                      disabled={!hasAccess}
                    >
                      <option value="">Select {input.label}</option>
                      {input.options?.map((option: string) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : input.type === "textarea" ? (
                    <Textarea
                      id={input.name}
                      placeholder={input.placeholder}
                      onChange={(e) => handleInputChange(input.name, e.target.value)}
                      disabled={!hasAccess}
                      className="min-h-[100px]"
                    />
                  ) : (
                    <Input
                      id={input.name}
                      type={input.type}
                      placeholder={input.placeholder}
                      onChange={(e) => handleInputChange(input.name, e.target.value)}
                      disabled={!hasAccess}
                    />
                  )}
                </div>
              ))}

              <div className="space-y-3 pt-4">
                <Button
                  onClick={handleGenerate}
                  disabled={!hasAccess || isGenerating}
                  className={`w-full bg-gradient-to-r ${tool.color} hover:opacity-90 text-white font-semibold py-3`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>

                {!hasAccess && (
                  <div className="space-y-2">
                    <Link href="/upgrade">
                      <Button variant="outline" className="w-full bg-transparent">
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to Use This Tool
                      </Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button variant="outline" className="w-full bg-transparent">
                        Start Free Trial
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Results</CardTitle>
              <CardDescription>Your AI-generated content will appear here</CardDescription>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="text-center py-12 text-red-500">
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">
                      {error}
                    </AlertDescription>
                  </Alert>
                </div>
              ) : !result ? (
                <div className="text-center py-12 text-gray-500">
                  <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Click "Generate Content" to see results</p>
                  {!hasAccess && <p className="text-sm mt-2">Upgrade your plan to use this tool</p>}
                </div>
              ) : (
                <div className="space-y-4">
                  {toolId === "seo-audit" && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">SEO Score</h3>
                        <Badge className="bg-green-100 text-green-800">{(result as SEOAuditResult).score}/100</Badge>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-red-600">Issues Found:</h4>
                          <ul className="list-disc list-inside text-sm text-gray-600">
                            {(result as SEOAuditResult).issues.map((issue: string, index: number) => (
                              <li key={index}>{issue}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-medium text-green-600">Recommendations:</h4>
                          <ul className="list-disc list-inside text-sm text-gray-600">
                            {(result as SEOAuditResult).recommendations.map((rec: string, index: number) => (
                              <li key={index}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {toolId === "social-media" && (
                    <div>
                      {(result as SocialMediaResult).posts.map((post: SocialMediaPost, index: number) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge>{post.platform}</Badge>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(post.content)}>
                              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                          <p className="text-sm mb-2">{post.content}</p>
                          <div className="flex flex-wrap gap-1">
                            {post.hashtags.map((tag: string, tagIndex: number) => (
                              <span key={tagIndex} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Results
                    </Button>
                    <Button variant="outline" onClick={handleDownloadPDF}>
                      <Download className="w-4 h-4 mr-2" />
                      Download Report
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}