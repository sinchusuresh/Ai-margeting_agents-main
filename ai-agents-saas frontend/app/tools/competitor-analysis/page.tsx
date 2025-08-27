"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Header } from "@/components/header"
import Link from "next/link"
import { ArrowLeft, Download, Copy, CheckCircle, Loader2, TrendingUp, Target, BarChart3, Users, Globe, AlertTriangle, Lightbulb, Zap, Shield, Clock, DollarSign, Eye, Play, Star, Lock, Crown, FileText } from 'lucide-react'
import { useUserStore } from "@/lib/user-store"
import { makeAuthenticatedRequest } from "@/lib/auth-utils"
import { generateProfessionalPDF } from "@/utils/pdfGenerator"

interface CompetitorAnalysisData {
  analysisDate: string
  yourBusiness: string
  industry: string
  competitorUrls: string[]
  scrapedData: any[]
  trafficIntelligence: any[]
  seoAnalysis: any[]
  adIntelligence: any[]
  aiAnalysis: {
    executiveSummary: string
    competitorProfiles: Array<{
      domain: string
      scrapedData: string
      trafficInsights: string
      seoStrengths: string
      adStrategy: string
      marketPosition: string
    }>
    swotAnalysis: {
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  threats: string[]
    }
    strategicRecommendations: string[]
    marketGaps: string[]
    competitiveAdvantages: string[]
  }
  summary: {
    totalCompetitors: number
    dataSources: string[]
    keyFindings: string
  }
}

interface CompetitorResult {
  analysisDate: string
  yourBusiness: string
  industry: string
  competitorUrls: string[]
  scrapedData: any[]
  trafficIntelligence: any[]
  seoAnalysis: any[]
  adIntelligence: any[]
  aiAnalysis: {
    executiveSummary: string
    competitorProfiles: Array<{
      domain: string
      scrapedData: string
      trafficInsights: string
      seoStrengths: string
      adStrategy: string
      marketPosition: string
    }>
    swotAnalysis: {
      strengths: string[]
      weaknesses: string[]
      opportunities: string[]
      threats: string[]
    }
    strategicRecommendations: string[]
    marketGaps: string[]
    competitiveAdvantages: string[]
  }
  summary: {
    totalCompetitors: number
    dataSources: string[]
    keyFindings: string
  }
}

export default function CompetitorAnalysisPage() {
  const { user } = useUserStore()
  const [formData, setFormData] = useState({
    yourCompany: "",
    competitors: "",
    industry: "",
    location: "",
    analysisType: "comprehensive",
    focusAreas: "",
    yourWebsite: "",
    budget: ""
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<CompetitorResult | null>(null)
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({})
  const [error, setError] = useState<string | null>(null)

  const hasAccess = user.plan !== "Free Trial"

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleGenerate = async () => {
    if (!hasAccess) {
      alert("Please upgrade to Pro or Agency plan to use this tool.")
      return
    }

    if (!formData.yourCompany || !formData.competitors) {
      alert("Please enter your company name and competitor URLs")
      return
    }

    // Validate that at least one valid URL is provided
    const competitorUrls = formData.competitors
      .split('\n')
      .map(url => url.trim())
      .filter(url => url && url.startsWith('http'));

    if (competitorUrls.length === 0) {
      alert("Please enter valid competitor URLs (starting with http:// or https://)")
      return
    }

    setIsGenerating(true)
    setResult(null)
    setError(null)

    try {
      // Parse competitor URLs from textarea
      const competitorUrls = formData.competitors
        .split('\n')
        .map(url => url.trim())
        .filter(url => url && url.startsWith('http'))
        .slice(0, 3); // Limit to 3 URLs

      if (competitorUrls.length === 0) {
        alert("Please enter valid competitor URLs (starting with http:// or https://)");
        return;
      }

      // Prepare input data for the backend
      const inputData = {
        yourBusiness: formData.yourCompany,
        industry: formData.industry || 'Not specified',
        competitorUrls: competitorUrls,
        analysisFocus: formData.analysisType || 'comprehensive',
        location: formData.location || 'Not specified',
        focusAreas: formData.focusAreas || 'Not specified',
        yourWebsite: formData.yourWebsite || 'Not specified',
        budget: formData.budget || 'Not specified'
      }

      // Call the backend API
      console.log('🚀 Calling backend API with input:', inputData);
      
      const data = await makeAuthenticatedRequest('/api/ai-tools/competitor-analysis/generate', {
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

      // Log competitor analysis details
      console.log('Competitor Analysis Response:', data.output);
      console.log('Your Company:', formData.yourCompany);
      console.log('Competitors:', formData.competitors);

      // Transform AI response to match frontend structure
      const transformedResult = transformAIResponseToFrontendFormat(data.output, formData);
      setResult(transformedResult);

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
        setError(`Failed to generate competitor analysis: ${errorMessage}`);
      }

      // No fallback data - show empty state
      setResult(null);
    } finally {
      setIsGenerating(false)
    }
  }

  // Transform AI response to match frontend structure
  const transformAIResponseToFrontendFormat = (aiOutput: any, inputData: any) => {
    console.log('Transforming AI response:', aiOutput);
    
    // Transform backend data to match frontend expectations
    const transformedResult = {
      summary: {
        totalCompetitors: aiOutput?.competitorProfiles?.length || 0,
        dataSources: ['Website Analysis', 'Social Media', 'SEO Tools', 'Market Research', 'Traffic Analysis', 'Backlink Analysis'],
        keyMetrics: {
          totalCompetitors: aiOutput?.competitorProfiles?.length || 0,
          marketGaps: aiOutput?.strategicInsights?.marketGaps?.length || 0,
          recommendations: aiOutput?.strategicInsights?.strategicRecommendations?.length || 0
        }
      },
      aiAnalysis: {
        executiveSummary: `Comprehensive analysis of ${inputData?.yourCompany || 'your business'} in the ${inputData?.industry || 'industry'} sector, identifying key competitive advantages and strategic opportunities.`,
        swotAnalysis: {
          strengths: aiOutput?.swotAnalysis?.yourStrengths || [],
          weaknesses: aiOutput?.swotAnalysis?.yourWeaknesses || [],
          opportunities: aiOutput?.swotAnalysis?.opportunities || [],
          threats: aiOutput?.swotAnalysis?.threats || []
        },
        strategicRecommendations: aiOutput?.strategicInsights?.strategicRecommendations || [],
        marketGaps: aiOutput?.strategicInsights?.marketGaps || [],
        competitiveAdvantages: aiOutput?.strategicInsights?.competitiveAdvantages || {},
        performanceMetrics: aiOutput?.strategicInsights?.performanceMetrics || {}
      },
      competitorProfiles: aiOutput?.competitorProfiles || [],
      detailedAnalysis: {
        marketPosition: 'Analyzing market position...',
        competitiveLandscape: 'Mapping competitive landscape...',
        growthOpportunities: 'Identifying growth opportunities...'
      }
    };
    
    console.log('Transformed result:', transformedResult);
    return transformedResult;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }



    const handleDownloadPDF = () => {
    if (!result) return;
    
    try {
      const doc = generateProfessionalPDF({
        title: "Competitor Analysis Report",
        subtitle: "Market Intelligence & Strategic Insights",
        toolName: "Competitor Analysis",
        clientName: formData.yourCompany,
        reportPeriod: formData.industry,
        generatedDate: new Date().toLocaleDateString(),
        content: result,
        formData: formData
      });
      
      const fileName = `competitor-analysis-${formData.yourCompany?.replace(/[^a-zA-Z0-9]/g, '-') || 'company'}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      alert("Professional competitor analysis PDF generated successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const handleExportToNotion = () => {
    if (!result) return;
    
    try {
      // Generate Notion-compatible markdown
      const notionContent = generateNotionExport(result, formData);
      
      // Create and download markdown file
      const blob = new Blob([notionContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `competitor-analysis-${formData.yourCompany?.replace(/[^a-zA-Z0-9]/g, '-') || 'company'}-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert("Competitor analysis exported to Notion-compatible markdown successfully!");
    } catch (error) {
      console.error("Notion export error:", error);
      alert("Failed to export to Notion. Please try again.");
    }
  };

  const generateNotionExport = (analysisData: any, formData: any) => {
    let markdown = `# Competitor Analysis Report: ${formData.yourCompany || 'Your Business'}\n\n`;
    markdown += `**Industry:** ${formData.industry || 'Business'}\n`;
    markdown += `**Analysis Date:** ${new Date().toLocaleDateString()}\n\n`;
    
    // Executive Summary
    markdown += `## Executive Summary\n\n`;
    markdown += `${analysisData.aiAnalysis?.executiveSummary || 'Comprehensive competitor analysis completed.'}\n\n`;
    
    // Competitor Profiles
    markdown += `## Competitor Profiles\n\n`;
    analysisData.competitorProfiles?.forEach((competitor: any, index: number) => {
      markdown += `### ${competitor.competitorName || `Competitor ${index + 1}`}\n\n`;
      markdown += `**Website:** ${competitor.website || 'N/A'}\n`;
      markdown += `**SEO Score:** ${competitor.websiteAnalysis?.seoScore || 'N/A'}/100\n`;
      markdown += `**Domain Authority:** ${competitor.seoAnalysis?.domainAuthority || 'N/A'}\n`;
      markdown += `**Estimated Traffic:** ${competitor.trafficAnalysis?.totalVisits || 'N/A'}\n\n`;
      
      if (competitor.contentAnalysis?.blogTopics?.length > 0) {
        markdown += `**Recent Blog Topics:**\n`;
        competitor.contentAnalysis.blogTopics.slice(0, 3).forEach((topic: any) => {
          markdown += `- ${topic.title}\n`;
        });
        markdown += `\n`;
      }
    });
    
    // SWOT Analysis
    markdown += `## SWOT Analysis\n\n`;
    const swot = analysisData.aiAnalysis?.swotAnalysis;
    if (swot) {
      markdown += `### Strengths\n`;
      swot.strengths?.forEach((strength: string) => markdown += `- ${strength}\n`);
      markdown += `\n### Weaknesses\n`;
      swot.weaknesses?.forEach((weakness: string) => markdown += `- ${weakness}\n`);
      markdown += `\n### Opportunities\n`;
      swot.opportunities?.forEach((opportunity: string) => markdown += `- ${opportunity}\n`);
      markdown += `\n### Threats\n`;
      swot.threats?.forEach((threat: string) => markdown += `- ${threat}\n`);
      markdown += `\n`;
    }
    
    // Strategic Recommendations
    markdown += `## Strategic Recommendations\n\n`;
    analysisData.aiAnalysis?.strategicRecommendations?.forEach((rec: any) => {
      markdown += `### ${rec.recommendation}\n\n`;
      markdown += `**Impact:** ${rec.impact}\n`;
      markdown += `**Effort:** ${rec.effort}\n`;
      markdown += `**Timeline:** ${rec.timeline}\n\n`;
    });
    
    // Market Gaps
    if (analysisData.aiAnalysis?.marketGaps?.length > 0) {
      markdown += `## Market Gaps & Opportunities\n\n`;
      analysisData.aiAnalysis.marketGaps.forEach((gap: string) => markdown += `- ${gap}\n`);
      markdown += `\n`;
    }
    
    return markdown;
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
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-400 to-purple-600 rounded-xl flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Competitor Analysis Agent</h1>
              {hasAccess ? (
                <Badge className="bg-green-100 text-green-800">Available</Badge>
              ) : (
                <Badge className="bg-orange-100 text-orange-800">Pro Required</Badge>
              )}
            </div>
            <p className="text-gray-600">Deep competitive intelligence with SWOT analysis and market positioning</p>
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
                <CardTitle>Analysis Setup</CardTitle>
                <CardDescription>Configure your competitive analysis parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="yourCompany">Your Company Name *</Label>
                  <Input
                    id="yourCompany"
                    placeholder="e.g., Your Company Inc., TechCorp, StartupXYZ"
                    value={formData.yourCompany}
                    onChange={(e) => handleInputChange("yourCompany", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="competitors">Competitor URLs * (Up to 3)</Label>
                  <Textarea
                    id="competitors"
                    placeholder="Enter competitor website URLs (one per line):&#10;https://competitor1.com&#10;https://competitor2.com&#10;https://competitor3.com"
                    value={formData.competitors}
                    onChange={(e) => handleInputChange("competitors", e.target.value)}
                    disabled={!hasAccess}
                    className="min-h-[80px]"
                  />
                  <p className="text-sm text-gray-600">
                    🔍 We'll scrape these websites and analyze their meta tags, content, ads, and SEO data
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <select
                    id="industry"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={formData.industry}
                    onChange={(e) => handleInputChange("industry", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select industry</option>
                    <option value="technology">Technology</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="finance">Finance</option>
                    <option value="retail">Retail</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="services">Professional Services</option>
                    <option value="education">Education</option>
                    <option value="real-estate">Real Estate</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Target Market</Label>
                  <select
                    id="location"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select market</option>
                    <option value="global">Global</option>
                    <option value="north-america">North America</option>
                    <option value="europe">Europe</option>
                    <option value="asia-pacific">Asia Pacific</option>
                    <option value="local">Local/Regional</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="analysisType">Analysis Type</Label>
                  <select
                    id="analysisType"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={formData.analysisType}
                    onChange={(e) => handleInputChange("analysisType", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select type</option>
                    <option value="comprehensive">Comprehensive Analysis</option>
                    <option value="digital-marketing">Digital Marketing Focus</option>
                    <option value="product-features">Product Features</option>
                    <option value="pricing-strategy">Pricing Strategy</option>
                    <option value="content-marketing">Content Marketing</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="focusAreas">Focus Areas</Label>
                  <Textarea
                    id="focusAreas"
                    placeholder="e.g., SEO, Social Media, Content Marketing&#10;Pricing, Product Features, Customer Service"
                    value={formData.focusAreas}
                    onChange={(e) => handleInputChange("focusAreas", e.target.value)}
                    disabled={!hasAccess}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yourWebsite">Your Website (Optional)</Label>
                  <Input
                    id="yourWebsite"
                    placeholder="e.g., https://yourcompany.com"
                    value={formData.yourWebsite}
                    onChange={(e) => handleInputChange("yourWebsite", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-3 pt-4">
                  <Button
                    onClick={handleGenerate}
                    disabled={!hasAccess || isGenerating || !formData.yourCompany || !formData.competitors || !formData.competitors.split('\n').some(url => url.trim().startsWith('http'))}
                    className="w-full bg-gradient-to-r from-indigo-400 to-purple-600 hover:opacity-90 text-white font-semibold py-3"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing Competitors...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start Analysis
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
                  <Eye className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Analyze</h3>
                  <p className="text-gray-600">
                    {hasAccess
                      ? "Enter your company details and competitor list to start comprehensive analysis"
                      : "Upgrade to Pro plan to access the competitor analysis tool"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Analysis Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-500" />
                      Analysis Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{result?.summary?.totalCompetitors || 0}</div>
                        <div className="text-sm text-gray-600">Competitors Analyzed</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{result?.aiAnalysis?.swotAnalysis?.opportunities?.length || 0}</div>
                        <div className="text-sm text-gray-600">Opportunities</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{result?.aiAnalysis?.strategicRecommendations?.length || 0}</div>
                        <div className="text-sm text-gray-600">Recommendations</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {result?.summary?.dataSources?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Data Sources</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Key Findings:</h4>
                      <p className="text-sm text-gray-600">{result?.aiAnalysis?.executiveSummary || 'Analysis completed successfully'}</p>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Data Sources Used:</h4>
                      <div className="flex flex-wrap gap-2">
                        {result?.summary?.dataSources?.map((source, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {source}
                          </Badge>
                        )) || []}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* SWOT Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-green-500" />
                      SWOT Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                        <h4 className="font-medium text-green-700 mb-3 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Strengths
                        </h4>
                        <ul className="space-y-2">
                          {result?.aiAnalysis?.swotAnalysis?.strengths?.map((strength, index) => (
                            <li key={index} className="text-sm text-gray-700 bg-green-50 p-2 rounded">
                              {strength}
                            </li>
                          )) || []}
                        </ul>
                          </div>

                          <div>
                        <h4 className="font-medium text-red-700 mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Weaknesses
                        </h4>
                        <ul className="space-y-2">
                          {result?.aiAnalysis?.swotAnalysis?.weaknesses?.map((weakness, index) => (
                            <li key={index} className="text-sm text-gray-700 bg-red-50 p-2 rounded">
                              {weakness}
                            </li>
                          )) || []}
                        </ul>
                        </div>

                            <div>
                        <h4 className="font-medium text-blue-700 mb-3 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4" />
                          Opportunities
                        </h4>
                        <ul className="space-y-2">
                          {result?.aiAnalysis?.swotAnalysis?.opportunities?.map((opportunity, index) => (
                            <li key={index} className="text-sm text-gray-700 bg-blue-50 p-2 rounded">
                              {opportunity}
                                  </li>
                          )) || []}
                              </ul>
                            </div>
                      
                            <div>
                        <h4 className="font-medium text-orange-700 mb-3 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Threats
                        </h4>
                        <ul className="space-y-2">
                          {result?.aiAnalysis?.swotAnalysis?.threats?.map((threat, index) => (
                            <li key={index} className="text-sm text-gray-700 bg-orange-50 p-2 rounded">
                              {threat}
                                  </li>
                          )) || []}
                              </ul>
                            </div>
                          </div>
                  </CardContent>
                </Card>

                {/* Competitor Profiles */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-500" />
                      Competitor Profiles ({result?.competitorProfiles?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {result?.competitorProfiles?.map((competitor, index) => (
                      <div key={index} className="border rounded-lg p-6 bg-white">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-gray-900">{competitor?.competitorName || competitor?.domain || 'Unknown Competitor'}</h3>
                          <Badge variant="secondary">{competitor?.domain || 'N/A'}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Website Analysis */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Website Analysis</h4>
                            <div className="space-y-2 text-sm">
                              <p className="text-gray-600 font-medium">{competitor?.websiteAnalysis?.title || 'Title unavailable'}</p>
                              <p className="text-gray-600 text-xs">{competitor?.websiteAnalysis?.description || 'Description unavailable'}</p>
                              <p className="text-gray-600 text-xs">SEO Score: {competitor?.websiteAnalysis?.seoScore || 'N/A'}/100</p>
                              <p className="text-gray-600 text-xs">Page Speed: {competitor?.websiteAnalysis?.pageSpeed || 'N/A'}s</p>
                            </div>
                          </div>

                          {/* Content Analysis */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Content Strategy</h4>
                            <div className="space-y-2 text-sm">
                              <p className="text-gray-600 text-xs">Frequency: {competitor?.contentAnalysis?.contentFrequency || 'Unknown'}</p>
                              <p className="text-gray-600 text-xs">Quality: {competitor?.contentAnalysis?.contentQuality || 'Unknown'}</p>
                              <p className="text-gray-600 text-xs">Categories: {competitor?.contentAnalysis?.contentCategories?.join(', ') || 'General'}</p>
                              <p className="text-gray-600 text-xs">Blog Posts: {competitor?.contentAnalysis?.totalBlogPosts || 0}</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                          {/* Marketing Analysis */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Marketing Strategy</h4>
                            <div className="space-y-2 text-sm">
                              <p className="text-gray-600 text-xs">Total Ads: {competitor?.marketingAnalysis?.adCreatives?.totalAds || 'N/A'}</p>
                              <p className="text-gray-600 text-xs">Est. Spend: {competitor?.marketingAnalysis?.estimatedAdSpend || 'N/A'}</p>
                              <p className="text-gray-600 text-xs">Targeting: {competitor?.marketingAnalysis?.targetingStrategy?.join(', ') || 'N/A'}</p>
                              <p className="text-gray-600 text-xs">Themes: {competitor?.marketingAnalysis?.creativeThemes?.join(', ') || 'N/A'}</p>
                            </div>
                          </div>
                          
                          {/* SEO Analysis */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">SEO Profile</h4>
                            <div className="space-y-2 text-sm">
                              <p className="text-gray-600 text-xs">Backlinks: {competitor?.seoAnalysis?.backlinks?.totalBacklinks || 'N/A'}</p>
                              <p className="text-gray-600 text-xs">Domain Authority: {competitor?.seoAnalysis?.domainAuthority || 'N/A'}</p>
                              <p className="text-gray-600 text-xs">Link Quality: {competitor?.seoAnalysis?.backlinks?.linkQuality || 'N/A'}</p>
                              <p className="text-gray-600 text-xs">Referring Domains: {competitor?.seoAnalysis?.backlinks?.referringDomains || 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                          {/* Traffic Analysis */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Traffic Overview</h4>
                            <div className="space-y-2 text-sm">
                              <p className="text-gray-600 text-xs">Total Visits: {competitor?.trafficAnalysis?.totalVisits || 'N/A'}</p>
                              <p className="text-gray-600 text-xs">Unique Visitors: {competitor?.trafficAnalysis?.uniqueVisitors || 'N/A'}</p>
                              <p className="text-gray-600 text-xs">Page Views: {competitor?.trafficAnalysis?.pageViews || 'N/A'}</p>
                              <p className="text-gray-600 text-xs">Search Traffic: {competitor?.trafficAnalysis?.trafficSources?.search || 0}%</p>
                            </div>
                          </div>

                          {/* Competitive Position */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Market Position</h4>
                            <div className="space-y-2 text-sm">
                              <p className="text-gray-600 text-xs">Market Share: {competitor?.competitivePosition?.marketShare || 'N/A'}</p>
                              <p className="text-gray-600 text-xs">Brand Strength: {competitor?.competitivePosition?.brandStrength || 'N/A'}</p>
                              <p className="text-gray-600 text-xs">Innovation Score: {competitor?.competitivePosition?.innovationScore || 'N/A'}</p>
                              <p className="text-gray-600 text-xs">Customer Engagement: {competitor?.competitivePosition?.customerEngagement || 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Blog Topics Preview */}
                        {competitor?.contentAnalysis?.blogTopics && competitor.contentAnalysis.blogTopics.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium text-gray-900 mb-2">Recent Blog Topics</h4>
                            <div className="space-y-2">
                              {competitor.contentAnalysis.blogTopics.slice(0, 3).map((topic, i) => (
                                <div key={i} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                  <p className="font-medium">{topic.title}</p>
                                  <p className="text-xs text-gray-500">{topic.excerpt}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )) || []}
                  </CardContent>
                </Card>

                {/* Strategic Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      Strategic Recommendations ({result?.aiAnalysis?.strategicRecommendations?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result?.aiAnalysis?.strategicRecommendations?.map((recommendation, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-blue-50">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="flex-1">
                              <h4 className="font-medium text-blue-700 mb-1">{recommendation.recommendation}</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-600">
                                <div>
                                  <span className="font-medium">Impact:</span> {recommendation.impact}
                                </div>
                                <div>
                                  <span className="font-medium">Effort:</span> {recommendation.effort}
                                </div>
                                <div>
                                  <span className="font-medium">Timeline:</span> {recommendation.timeline}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )) || []}
                  </CardContent>
                </Card>

                {/* Market Gaps */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-green-500" />
                      Market Gaps & Opportunities ({result?.aiAnalysis?.marketGaps?.length || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    {result?.aiAnalysis?.marketGaps?.map((gap, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-green-50">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-sm text-gray-700">{gap}</p>
                        </div>
                        </div>
                    )) || []}
                    </CardContent>
                  </Card>

                {/* Competitive Advantages */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-purple-500" />
                      Competitive Advantages
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {result?.aiAnalysis?.competitiveAdvantages?.priceAdvantage && (
                        <div className="border rounded-lg p-4 bg-purple-50">
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <h4 className="font-medium text-purple-700 mb-1">Price Advantage</h4>
                              <p className="text-sm text-gray-700">{result.aiAnalysis.competitiveAdvantages.priceAdvantage}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {result?.aiAnalysis?.competitiveAdvantages?.qualityAdvantage && (
                        <div className="border rounded-lg p-4 bg-purple-50">
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <h4 className="font-medium text-purple-700 mb-1">Quality Advantage</h4>
                              <p className="text-sm text-gray-700">{result.aiAnalysis.competitiveAdvantages.qualityAdvantage}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {result?.aiAnalysis?.competitiveAdvantages?.serviceAdvantage && (
                        <div className="border rounded-lg p-4 bg-purple-50">
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <h4 className="font-medium text-purple-700 mb-1">Service Advantage</h4>
                              <p className="text-sm text-gray-700">{result.aiAnalysis.competitiveAdvantages.serviceAdvantage}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {result?.aiAnalysis?.competitiveAdvantages?.innovationAdvantage && (
                        <div className="border rounded-lg p-4 bg-purple-50">
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <h4 className="font-medium text-purple-700 mb-1">Innovation Advantage</h4>
                              <p className="text-sm text-gray-700">{result.aiAnalysis.competitiveAdvantages.innovationAdvantage}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>











                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                    className="flex-1"
                  >
                    {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? "Copied!" : "Copy Full Analysis"}
                  </Button>
                  <Button variant="outline" onClick={handleDownloadPDF}>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button variant="outline" onClick={handleExportToNotion}>
                    <FileText className="w-4 h-4 mr-2" />
                    Export to Notion
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
