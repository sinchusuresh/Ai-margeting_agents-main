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
  PenTool,
  Lock,
  Crown,
  FileText,
  Target,
  TrendingUp,
  Eye,
} from "lucide-react"
import { useUserStore } from "@/lib/user-store"
import { makeAuthenticatedRequest } from "@/lib/auth-utils"
import jsPDF from "jspdf";

interface BlogResult {
  title: string
  metaDescription: string
  content: string
  outline: string[]
  wordCount: number
  readingTime: string
  seoScore: number
  keywords: {
    primary: string
    secondary: string[]
    density: number
  }[]
  suggestions: {
    improvements: string[]
    additionalSections: string[]
  }
}

export default function BlogWritingPage() {
  const { user } = useUserStore()
  const [formData, setFormData] = useState({
    title: "",
    keywords: "",
    audience: "",
    length: "",
    tone: "",
    outline: "",
    industry: "",
    purpose: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<BlogResult | null>(null)
  const [copied, setCopied] = useState(false)

  const hasAccess = user.plan !== "Free Trial"

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleGenerate = async () => {
    if (!hasAccess) {
      alert("Please upgrade to Pro or Agency plan to use this tool.")
      return
    }

    if (!formData.title || !formData.keywords) {
      alert("Please enter a title and keywords")
      return
    }

    setIsGenerating(true)
    try {
      // Prepare the input data for the backend
      const inputData = {
        topic: formData.title,
        keywords: formData.keywords,
        targetAudience: formData.audience || "general audience",
        tone: formData.tone || "professional",
        wordCount: formData.length || "800-1200",
        industry: formData.industry || "marketing",
        goal: formData.purpose || "educational",
        customOutline: formData.outline || ""
      }

      const data = await makeAuthenticatedRequest("/api/ai-tools/blog-writing/generate", {
        method: "POST",
        body: JSON.stringify({ input: inputData }),
      })
      
      if (data.success) {
        // Transform the backend response to match our frontend structure
        const transformedResult = transformBackendResponse(data.output)
        setResult(transformedResult)
      } else {
        alert(data.message || "Failed to generate content")
      }
    } catch (error) {
      console.error("Error generating blog content:", error)
      alert(error instanceof Error ? error.message : "Failed to generate content. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const transformBackendResponse = (backendOutput: any): BlogResult => {
    // Extract content from the backend response
    const title = backendOutput.title || "Untitled Blog"
    const metaDescription = backendOutput.metaDescription || ""
    
    // Build content from the backend structure
    let content = ""
    if (backendOutput.introduction) {
      content += `# ${title}\n\n${backendOutput.introduction}\n\n`
    }
    
    // Handle content sections from backend
    if (backendOutput.content) {
      if (backendOutput.content.section1) {
        content += `## ${backendOutput.outline?.[0]?.heading || 'Section 1'}\n\n${backendOutput.content.section1}\n\n`
      }
      if (backendOutput.content.section2) {
        content += `## ${backendOutput.outline?.[1]?.heading || 'Section 2'}\n\n${backendOutput.content.section2}\n\n`
      }
      if (backendOutput.content.section3) {
        content += `## ${backendOutput.outline?.[2]?.heading || 'Section 3'}\n\n${backendOutput.content.section3}\n\n`
      }
    }
    
    if (backendOutput.conclusion) {
      content += `## Conclusion\n\n${backendOutput.conclusion}\n\n`
    }

    // Calculate word count
    const wordCount = content.split(/\s+/).length

    // Calculate reading time (average 200 words per minute)
    const readingTime = Math.ceil(wordCount / 200)

    // Extract keywords from backend structure
    const keywords = backendOutput.seoOptimization?.targetKeywords ? [{
      primary: backendOutput.seoOptimization.targetKeywords[0] || "",
      secondary: backendOutput.seoOptimization.targetKeywords.slice(1) || [],
      density: Math.round((content.toLowerCase().split((backendOutput.seoOptimization.targetKeywords[0] || "").toLowerCase()).length - 1) / wordCount * 100)
    }] : []

    // Generate outline from backend structure
    const outline = backendOutput.outline ? backendOutput.outline.map((item: any) => item.heading) : []

    // Calculate SEO score based on content quality
    const seoScore = Math.min(100, Math.max(60, 
      (title.length > 0 ? 20 : 0) +
      (metaDescription.length > 0 ? 20 : 0) +
      (keywords.length > 0 ? 20 : 0) +
      (wordCount > 800 ? 20 : wordCount / 40) +
      (outline.length > 3 ? 20 : outline.length * 6)
    ))

    // Use dynamic suggestions from backend or generate fallback
    const suggestions = backendOutput.suggestions || {
      improvements: [
        "Consider adding more internal links to improve SEO",
        "Include more specific examples and case studies",
        "Add relevant statistics and data points"
      ],
      additionalSections: [
        "FAQ section for common questions",
        "Related resources and tools",
        "Expert quotes and testimonials"
      ]
    }

    return {
      title,
      metaDescription,
      content,
      outline,
      wordCount,
      readingTime: `${readingTime} min read`,
      seoScore: Math.round(seoScore),
      keywords,
      suggestions
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100"
    if (score >= 60) return "bg-yellow-100"
    return "bg-red-100"
  }

  const handleDownloadPDF = () => {
    if (!result) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = 20;

    // Set font styles
    const titleFontSize = 18;
    const headingFontSize = 14;
    const subheadingFontSize = 12;
    const bodyFontSize = 10;

    // Add header with logo/icon
    doc.setFillColor(59, 130, 246); // Blue color
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('AI Marketing Agents', margin, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Blog Content Generator', margin, 28);

    // Reset text color and position
    doc.setTextColor(0, 0, 0);
    yPosition = 45;

    // Add blog title
    doc.setFontSize(titleFontSize);
    doc.setFont('helvetica', 'bold');
    const title = result.title || "Untitled Blog";
    const titleLines = doc.splitTextToSize(title, contentWidth);
    doc.text(titleLines, margin, yPosition);
    yPosition += (titleLines.length * 8) + 10;

    // Add meta description
    if (result.metaDescription) {
      doc.setFontSize(bodyFontSize);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      const metaLines = doc.splitTextToSize(result.metaDescription, contentWidth);
      doc.text(metaLines, margin, yPosition);
      yPosition += (metaLines.length * 6) + 15;
    }

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Add content metrics box
    const metricsBoxY = yPosition;
    const metricsBoxHeight = 25;
    
    // Draw metrics box background
    doc.setFillColor(248, 250, 252); // Light gray background
    doc.rect(margin, metricsBoxY, contentWidth, metricsBoxHeight, 'F');
    doc.setDrawColor(226, 232, 240); // Border color
    doc.rect(margin, metricsBoxY, contentWidth, metricsBoxHeight, 'S');

    // Add metrics content
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Content Metrics:', margin + 5, metricsBoxY + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Words: ${result.wordCount}`, margin + 5, metricsBoxY + 15);
    doc.text(`Reading Time: ${result.readingTime}`, margin + 50, metricsBoxY + 15);
    doc.text(`SEO Score: ${result.seoScore}/100`, margin + 100, metricsBoxY + 15);

    yPosition += metricsBoxHeight + 15;

    // Add content outline
    if (result.outline && result.outline.length > 0) {
      doc.setFontSize(headingFontSize);
      doc.setFont('helvetica', 'bold');
      doc.text('Content Outline:', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(bodyFontSize);
      doc.setFont('helvetica', 'normal');
      result.outline.forEach((section, index) => {
        const sectionText = `${index + 1}. ${section}`;
        const sectionLines = doc.splitTextToSize(sectionText, contentWidth - 10);
        doc.text(sectionLines, margin + 5, yPosition);
        yPosition += (sectionLines.length * 5) + 2;
      });
      yPosition += 10;
    }

    // Add main content
    if (result.content) {
      doc.setFontSize(headingFontSize);
      doc.setFont('helvetica', 'bold');
      doc.text('Blog Content:', margin, yPosition);
      yPosition += 10;

      // Process content with proper formatting
      const contentLines = result.content.split('\n');
      
      for (let i = 0; i < contentLines.length; i++) {
        const line = contentLines[i].trim();
        
        // Check if we need a new page
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }

        if (line.startsWith('# ')) {
          // Main title - already handled above
          continue;
        } else if (line.startsWith('## ')) {
          // Section heading
          doc.setFontSize(subheadingFontSize);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(59, 130, 246); // Blue color for headings
          const heading = line.replace('## ', '');
          const headingLines = doc.splitTextToSize(heading, contentWidth);
          doc.text(headingLines, margin, yPosition);
          yPosition += (headingLines.length * 6) + 5;
          doc.setTextColor(0, 0, 0); // Reset text color
        } else if (line.startsWith('### ')) {
          // Subsection heading
          doc.setFontSize(bodyFontSize);
          doc.setFont('helvetica', 'bold');
          const subheading = line.replace('### ', '');
          const subheadingLines = doc.splitTextToSize(subheading, contentWidth);
          doc.text(subheadingLines, margin + 5, yPosition);
          yPosition += (subheadingLines.length * 5) + 3;
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
          // Bullet points
          doc.setFontSize(bodyFontSize);
          doc.setFont('helvetica', 'normal');
          const bulletText = line.replace(/^[-*]\s*/, '• ');
          const bulletLines = doc.splitTextToSize(bulletText, contentWidth - 5);
          doc.text(bulletLines, margin + 5, yPosition);
          yPosition += (bulletLines.length * 5) + 2;
        } else if (line.length > 0) {
          // Regular paragraph
          doc.setFontSize(bodyFontSize);
          doc.setFont('helvetica', 'normal');
          const paragraphLines = doc.splitTextToSize(line, contentWidth);
          doc.text(paragraphLines, margin, yPosition);
          yPosition += (paragraphLines.length * 5) + 3;
        } else {
          // Empty line
          yPosition += 3;
        }
      }
    }

    // Add footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, 280, pageWidth - margin, 280);
      
      // Footer text
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated by AI Marketing Agents - Page ${i} of ${totalPages}`, margin, 290);
      doc.text(new Date().toLocaleDateString(), pageWidth - margin - 30, 290);
    }

    // Save the PDF
    doc.save(`blog-content-${Date.now()}.pdf`);
  };

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
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-600 rounded-xl flex items-center justify-center">
                <PenTool className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Blog Writing & Optimization</h1>
              {hasAccess ? (
                <Badge className="bg-green-100 text-green-800">Available</Badge>
              ) : (
                <Badge className="bg-orange-100 text-orange-800">Pro Required</Badge>
              )}
            </div>
            <p className="text-gray-600">AI-powered long-form content creation optimized for search engines</p>
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
                <CardTitle>Blog Configuration</CardTitle>
                <CardDescription>Set up your blog post parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Blog Title *</Label>
                  <Input
                    id="title"
                    placeholder="The Ultimate Guide to AI Marketing"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">SEO Keywords *</Label>
                  <Input
                    id="keywords"
                    placeholder="AI marketing, automation, digital tools"
                    value={formData.keywords}
                    onChange={(e) => handleInputChange("keywords", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Input
                    id="audience"
                    placeholder="Marketing professionals, business owners"
                    value={formData.audience}
                    onChange={(e) => handleInputChange("audience", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="length">Word Count</Label>
                  <select
                    id="length"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.length}
                    onChange={(e) => handleInputChange("length", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select length</option>
                    <option value="500-800">500-800 words</option>
                    <option value="800-1200">800-1200 words</option>
                    <option value="1200-2000">1200-2000 words</option>
                    <option value="2000+">2000+ words</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone">Writing Tone</Label>
                  <select
                    id="tone"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.tone}
                    onChange={(e) => handleInputChange("tone", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select tone</option>
                    <option value="professional">Professional</option>
                    <option value="conversational">Conversational</option>
                    <option value="authoritative">Authoritative</option>
                    <option value="friendly">Friendly</option>
                    <option value="technical">Technical</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">Content Purpose</Label>
                  <select
                    id="purpose"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.purpose}
                    onChange={(e) => handleInputChange("purpose", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select purpose</option>
                    <option value="educational">Educational</option>
                    <option value="promotional">Promotional</option>
                    <option value="thought-leadership">Thought Leadership</option>
                    <option value="how-to-guide">How-to Guide</option>
                    <option value="case-study">Case Study</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outline">Custom Outline (Optional)</Label>
                  <Textarea
                    id="outline"
                    placeholder="1. Introduction&#10;2. Main Topic&#10;3. Benefits&#10;4. Conclusion"
                    value={formData.outline}
                    onChange={(e) => handleInputChange("outline", e.target.value)}
                    disabled={!hasAccess}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-3 pt-4">
                  <Button
                    onClick={handleGenerate}
                    disabled={!hasAccess || isGenerating || !formData.title || !formData.keywords}
                    className="w-full bg-gradient-to-r from-blue-400 to-cyan-600 hover:opacity-90 text-white font-semibold py-3"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Writing Blog Post...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Generate Blog Post
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
                  <PenTool className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Write</h3>
                  <p className="text-gray-600">
                    {hasAccess
                      ? "Enter your blog details and generate SEO-optimized content"
                      : "Upgrade to Pro plan to access the blog writing tool"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Blog Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-500" />
                      Content Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{result.wordCount}</div>
                        <div className="text-sm text-gray-600">Words</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{result.readingTime}</div>
                        <div className="text-sm text-gray-600">Reading Time</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className={`text-2xl font-bold ${getScoreColor(result.seoScore)}`}>
                          {result.seoScore}/100
                        </div>
                        <div className="text-sm text-gray-600">SEO Score</div>
                      </div>
                      {result.keywords && Array.isArray(result.keywords) && result.keywords.length > 0 && (
                        <div>
                          {result.keywords.map((kw: { primary: string; secondary: string[]; density: number }, idx: number) => (
                            <div key={idx} className="text-center p-3 bg-yellow-50 rounded-lg mb-2">
                              <div className="text-2xl font-bold text-yellow-600">{kw.density}%</div>
                              <div className="text-sm text-gray-600">{kw.primary} Density</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* SEO Optimization */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      SEO Optimization
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Title:</h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="font-medium">{result.title || "Untitled Blog"}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Meta Description:</h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm">{result.metaDescription || "No meta description available."}</p>
                        <div className="text-xs text-gray-500 mt-1">
                          {result.metaDescription ? result.metaDescription.length : 0}/160 characters
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Keywords:</h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600">Primary: </span>
                          <Badge className="bg-blue-100 text-blue-800">{result.keywords && result.keywords[0] ? result.keywords[0].primary : "N/A"}</Badge>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Secondary: </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {result.keywords && result.keywords[0] && Array.isArray(result.keywords[0].secondary) && result.keywords[0].secondary.length > 0 ? (
                              result.keywords[0].secondary.map((keyword: string, index: number) => (
                                <Badge key={index} variant="secondary">
                                  {keyword}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-gray-400">No secondary keywords</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Content Outline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-500" />
                      Content Outline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2">
                      {result.outline && Array.isArray(result.outline) && result.outline.length > 0 ? (
                        result.outline.map((section, index) => (
                          <li key={index} className="flex items-center gap-3">
                            <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </span>
                            <span className="text-gray-700">{section}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-400">No outline available.</li>
                      )}
                    </ol>
                  </CardContent>
                </Card>

                {/* Generated Content */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-green-500" />
                        Generated Content
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(result.content)}>
                        {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{result.content || "No content available."}</pre>
                    </div>
                  </CardContent>
                </Card>

                {/* Suggestions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Content Suggestions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Improvements:</h4>
                      <ul className="space-y-1">
                        {result.suggestions && Array.isArray(result.suggestions.improvements) && result.suggestions.improvements.length > 0 ? (
                          result.suggestions.improvements.map((improvement, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              {improvement}
                            </li>
                          ))
                        ) : (
                          <li className="text-gray-400">No improvements suggested.</li>
                        )}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Additional Sections to Consider:</h4>
                      <ul className="space-y-1">
                        {result.suggestions && Array.isArray(result.suggestions.additionalSections) && result.suggestions.additionalSections.length > 0 ? (
                          result.suggestions.additionalSections.map((section, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-blue-500" />
                              {section}
                            </li>
                          ))
                        ) : (
                          <li className="text-gray-400">No additional sections suggested.</li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => copyToClipboard(result.content)} className="flex-1">
                    {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? "Copied!" : "Copy Content"}
                  </Button>
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={handleDownloadPDF}>
                    <Download className="w-4 h-4 mr-2" />
                    Download as PDF
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
