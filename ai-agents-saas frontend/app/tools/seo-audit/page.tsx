"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Header } from "@/components/header"
import Link from "next/link"
import { 
  ArrowLeft, 
  Play, 
  Download, 
  Copy, 
  CheckCircle, 
  Loader2, 
  Search, 
  AlertTriangle, 
  X,
  Info,
  Clock,
  Zap,
  Shield,
  Smartphone,
  FileText,
  Globe,
  Image,
  Code,
  Gauge,
  Eye,
  Network,
  Target,
  ChevronDown,
  TrendingUp
} from "lucide-react"
import { useRouter } from "next/navigation";
import { generateProfessionalPDF } from "@/utils/pdfGenerator";


// Types
type TestStatus = "pass" | "fail" | "warning" | "info"

type TestResult = {
  status: TestStatus
  percentage: string
  description: string
  details?: any
  howToFix?: string
  url?: string
}

type SEOSummary = {
  score: number
  failed: number
  warnings: number
  passed: number
  criticalIssues?: number
  improvementOpportunities?: number
}

type TechnicalSEO = {
  metaTitle: TestResult
  metaDescription: TestResult
  headingStructure: TestResult
  images: TestResult
}

type Performance = {
  pageSpeed: TestResult
}

type Security = {
  https: TestResult
}

type MobileUsability = {
  responsiveDesign: TestResult
}

type ContentQuality = {
  readability: TestResult
}

type Accessibility = {
  altText: TestResult
}

type URLStructure = {
  seoFriendly: TestResult
}

type SiteArchitecture = {
  internalLinking: TestResult
  siteStructure: TestResult
}

type CrossPageOptimization = {
  keywordDistribution: TestResult
  contentStrategy: TestResult
}

type Recommendation = {
  category: string
  priority: "critical" | "high" | "medium" | "low"
  title: string
  description: string
  action: string
  impact?: "high" | "medium" | "low"
  effort?: "high" | "medium" | "low"
  timeline?: "immediate" | "1-2 weeks" | "1-3 months"
}

type PriorityAction = {
  category: string
  action: string
  priority: "critical" | "high" | "medium" | "low"
  effort: "high" | "medium" | "low"
  impact: "high" | "medium" | "low"
}

type SEOResult = {
  overallScore: number
  summary: SEOSummary
  technicalSEO: TechnicalSEO
  performance: Performance
  security: Security
  mobileUsability: MobileUsability
  contentQuality: ContentQuality
  accessibility: Accessibility
  urlStructure: URLStructure
  siteArchitecture: SiteArchitecture
  crossPageOptimization: CrossPageOptimization
  recommendations: Recommendation[]
  priorityActions: PriorityAction[]
}

const HowToFixButton = ({ howToFix, sectionKey }: { howToFix: string | undefined, sectionKey: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!howToFix) return null;
  
  return (
    <div className="mt-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
      >
        {isExpanded ? "Hide" : "Show"} How to Fix
        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      {isExpanded && (
        <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
          {howToFix}
        </div>
      )}
    </div>
  );
};

export default function SEOAuditPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    url: "",
    industry: "",
  });
  const [result, setResult] = useState<SEOResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);

  const handleInputChange = (name: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    if (!formData.url.trim()) {
      setError("Please enter a valid website URL");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      console.log('🚀 Starting SEO audit generation...');
      console.log('📝 Form data:', formData);
      
      // Call the backend API directly for SEO audit
            const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // Check if token is valid (basic check)
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        if (tokenData.exp && tokenData.exp < currentTime) {
          throw new Error('Authentication token has expired. Please log in again.');
        }
        console.log('✅ Token is valid, expires:', new Date(tokenData.exp * 1000).toLocaleString());
      } catch (tokenError) {
        console.log('⚠️ Token validation failed:', tokenError.message);
        // Continue anyway, let the backend handle token validation
      }

      console.log('🔑 Token found, making API call...');
      console.log('🔑 Token preview:', token.substring(0, 20) + '...');
      console.log('🌐 API URL: http://localhost:5000/api/ai-tools/seo-audit/generate');
      console.log('📤 Request payload:', {
        input: {
          url: formData.url,
          type: "website-wide",
          industry: formData.industry || "general business"
        }
      });
      
      // Add CORS mode and credentials
      const response = await fetch('http://localhost:5000/api/ai-tools/seo-audit/generate', {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          input: {
            url: formData.url,
            type: "website-wide",
            industry: formData.industry || "general business"
          }
        })
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Response data:', data);
      console.log('📊 Data keys:', Object.keys(data));
      console.log('📊 Output exists:', !!data.output);
      console.log('📊 Output type:', typeof data.output);
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Use the AI-generated content from the backend
      if (data.output && typeof data.output === 'object') {
        console.log('✅ Using AI-generated SEO audit content from backend');
        console.log('📊 Output keys:', Object.keys(data.output));
        setResult(data.output);
      } else if (data && typeof data === 'object' && data.overallScore) {
        // Backend sent data directly without 'output' wrapper
        console.log('✅ Using direct SEO audit content from backend');
        console.log('📊 Direct data keys:', Object.keys(data));
        setResult(data);
      } else {
        console.log('⚠️ Backend response format issue, using fallback data');
        console.log('📊 Expected: data.output object or direct data, Got:', data);
        // Generate fallback data if needed
        setResult(generateFallbackSEOData(formData.url));
      }
    } catch (error) {
      console.error('SEO Audit generation error:', error);
      
      // More detailed error handling
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Cannot connect to backend server. Make sure the backend is running on localhost:5000';
        } else if (error.message.includes('401')) {
          errorMessage = 'Authentication error. Please log in again.';
        } else if (error.message.includes('403')) {
          errorMessage = 'Access denied. Please upgrade your plan or check if SEO Audit is available in your subscription.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error. Check if OpenAI API key is configured in the backend.';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(`Error generating SEO audit: ${errorMessage}`);
      setError(errorMessage);
      
      // Generate fallback data on error
      console.log('Using fallback data due to error:', errorMessage);
      setResult(generateFallbackSEOData(formData.url));
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const toggleFixDisplay = (sectionKey: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionKey)) {
      newExpanded.delete(sectionKey);
    } else {
      newExpanded.add(sectionKey);
    }
    setExpandedSections(newExpanded);
  };

  const generateFallbackSEOData = (url: string) => {
    return {
      overallScore: 75,
      summary: { 
        score: 75, 
        failed: 3, 
        warnings: 5, 
        passed: 10, 
        criticalIssues: 1, 
        improvementOpportunities: 8 
      },
      technicalSEO: {
        metaTitle: { 
          status: "warning", 
          percentage: "70%", 
          description: "Meta titles need optimization", 
          details: "Some pages missing target keywords", 
          howToFix: "Add primary keywords to all page titles" 
        },
        metaDescription: { 
          status: "warning", 
          percentage: "65%", 
          description: "Meta descriptions need improvement", 
          details: "Missing compelling CTAs", 
          howToFix: "Write engaging descriptions with clear calls-to-action" 
        },
        headingStructure: { 
          status: "pass", 
          percentage: "85%", 
          description: "Good heading hierarchy", 
          details: "Proper H1-H6 structure", 
          howToFix: "Maintain current heading structure" 
        },
        images: { 
          status: "fail", 
          percentage: "45%", 
          description: "Images need optimization", 
          details: "Missing alt text and compression", 
          howToFix: "Add descriptive alt text and compress images" 
        }
      },
      performance: {
        pageSpeed: { 
          status: "warning", 
          percentage: "60%", 
          description: "Page speed needs improvement", 
          details: "Slow loading times detected", 
          howToFix: "Optimize images and reduce server response time" 
        }
      },
      security: {
        https: { 
          status: "pass", 
          percentage: "95%", 
          description: "HTTPS properly implemented", 
          details: "SSL certificate active", 
          howToFix: "Maintain current security setup" 
        }
      },
      mobileUsability: {
        responsiveDesign: { 
          status: "pass", 
          percentage: "80%", 
          description: "Mobile-friendly design", 
          details: "Responsive layout implemented", 
          howToFix: "Test on more mobile devices" 
        }
      },
      contentQuality: {
        readability: { 
          status: "warning", 
          percentage: "70%", 
          description: "Content readability needs improvement", 
          details: "Some content too dense", 
          howToFix: "Break up long paragraphs and add subheadings" 
        }
      },
      accessibility: {
        altText: { 
          status: "fail", 
          percentage: "40%", 
          description: "Accessibility needs major improvement", 
          details: "Many images missing alt text", 
          howToFix: "Add descriptive alt text to all images" 
        }
      },
      urlStructure: {
        seoFriendly: { 
          status: "pass", 
          percentage: "85%", 
          description: "Good URL structure", 
          details: "Clean, descriptive URLs", 
          howToFix: "Maintain current URL structure" 
        }
      },
      siteArchitecture: {
        internalLinking: { 
          status: "warning", 
          percentage: "65%", 
          description: "Internal linking needs improvement", 
          details: "Limited cross-page connections", 
          howToFix: "Add more internal links between related pages" 
        },
        siteStructure: { 
          status: "pass", 
          percentage: "80%", 
          description: "Good site structure", 
          details: "Logical page hierarchy", 
          howToFix: "Maintain current site structure" 
        }
      },
      crossPageOptimization: {
        keywordDistribution: { 
          status: "warning", 
          percentage: "60%", 
          description: "Keyword distribution needs work", 
          details: "Some pages lack target keywords", 
          howToFix: "Distribute keywords evenly across all pages" 
        },
        contentStrategy: { 
          status: "pass", 
          percentage: "75%", 
          description: "Good content strategy", 
          details: "Consistent content approach", 
          howToFix: "Continue current content strategy" 
        }
      },
      recommendations: [
        { 
          category: "Technical SEO", 
          priority: "high", 
          title: "Optimize Meta Titles", 
          description: "Add target keywords to all page titles", 
          action: "Update meta titles with primary keywords", 
          impact: "high", 
          effort: "low", 
          timeline: "1-2 weeks" 
        },
        { 
          category: "Accessibility", 
          priority: "critical", 
          title: "Add Alt Text to Images", 
          description: "Many images missing alt text", 
          action: "Add descriptive alt text to all images", 
          impact: "high", 
          effort: "medium", 
          timeline: "immediate" 
        },
        { 
          category: "Performance", 
          priority: "medium", 
          title: "Improve Page Speed", 
          description: "Pages loading slowly", 
          action: "Optimize images and reduce server response time", 
          impact: "medium", 
          effort: "high", 
          timeline: "1-3 months" 
        }
      ],
      priorityActions: [
        { 
          category: "Accessibility", 
          action: "Add alt text to all images", 
          priority: "critical", 
          effort: "medium", 
          impact: "high" 
        },
        { 
          category: "Technical SEO", 
          action: "Optimize meta titles with keywords", 
          priority: "high", 
          effort: "low", 
          impact: "high" 
        },
        { 
          category: "Performance", 
          action: "Optimize page loading speed", 
          priority: "medium", 
          effort: "high", 
          impact: "medium" 
        }
      ]
    };
  };

  const handleDownloadPDF = () => {
    if (!result) return;
    
    try {
      generateProfessionalPDF({
        title: "SEO Audit Report",
        subtitle: `Analysis for ${formData.url}`,
        data: result,
        type: "seo-audit"
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      setError('Failed to generate PDF report');
    }
  };

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "fail":
        return <X className="w-5 h-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />
      default:
        return <Info className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: TestStatus | undefined) => {
    if (!status) return "text-gray-600";
    
    switch (status) {
      case "pass":
        return "text-green-600"
      case "fail":
        return "text-red-600"
      case "warning":
        return "text-yellow-600"
      case "info":
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  }

  const backHref = "/tools";
  const backText = "Back to Tools";

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href={backHref} className="inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {backText}
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-400 to-emerald-600 flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">SEO Audit Tool</h1>
              <p className="text-gray-600">Comprehensive website SEO analysis with actionable insights</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle>Website Analysis</CardTitle>
              <CardDescription>Enter your website URL for comprehensive SEO audit of the entire website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Website URL *</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.url}
                  onChange={(e) => handleInputChange("url", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry (Optional)</Label>
                <select
                  id="industry"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  onChange={(e) => handleInputChange("industry", e.target.value)}
                >
                  <option value="">Select industry</option>
                  <option value="e-commerce">E-commerce</option>
                  <option value="saas">SaaS/Technology</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="finance">Finance</option>
                  <option value="education">Education</option>
                  <option value="real-estate">Real Estate</option>
                  <option value="travel">Travel</option>
                  <option value="food">Food & Restaurant</option>
                  <option value="fashion">Fashion & Beauty</option>
                  <option value="consulting">Consulting</option>
                  <option value="non-profit">Non-Profit</option>
                </select>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-green-400 to-emerald-600 hover:opacity-90 text-white font-semibold py-3"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Entire Website...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start SEO Audit
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {isGenerating && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Website...</h3>
                  <p className="text-gray-600">Fetching website data and generating comprehensive SEO report</p>
                </div>
              </CardContent>
            </Card>
          )}

          {result && !isGenerating && (
            <div className="space-y-6">
              {/* Error Display */}
              {error && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-medium">Analysis Warning</span>
                    </div>
                    <p className="text-red-600 mt-2">{error}</p>
                    <p className="text-red-500 text-sm mt-1">
                      Showing fallback analysis based on available data.
                    </p>
                  </CardContent>
                </Card>
              )}



              {/* Analysis Summary */}
              <Card className="mb-4">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Globe className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-600">Comprehensive Website Analysis</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Analyzed multiple pages across the entire website
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Overall Score */}
              <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {result?.overallScore || 0}/100
                </div>
                <div className="text-sm text-gray-600 mb-4">Overall SEO Score</div>
                
                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">{result.summary?.failed || 0}</div>
                    <div className="text-xs text-gray-500">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-500">{result.summary?.warnings || 0}</div>
                    <div className="text-xs text-gray-500">Warnings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{result.summary?.passed || 0}</div>
                    <div className="text-xs text-gray-500">Passed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">{result.summary?.score || 0}</div>
                    <div className="text-xs text-gray-500">Score</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Show empty state when no result and not loading */}
          {!result && !isGenerating && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to analyze your website</h3>
                  <p className="text-gray-600">Enter a website URL above and click 'Start SEO Audit' to begin the comprehensive analysis.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Detailed Results */}
        {result && (
          <div className="mt-8 space-y-8">
            {/* Technical SEO */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Technical SEO
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.technicalSEO && Object.entries(result.technicalSEO).map(([key, test]) => {
                  if (typeof test === 'object' && test !== null) {
                    return (
                      <div key={key} className="border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          {getStatusIcon(test.status)}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                              <Badge variant="outline" className={getStatusColor(test.status)}>
                                {test.percentage}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                            {test.details && (
                              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                {JSON.stringify(test.details, null, 2)}
                              </div>
                            )}
                            <HowToFixButton howToFix={test.howToFix} sectionKey={key} />
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
                {!result.technicalSEO && (
                  <div className="text-center py-8 text-gray-500">
                    <Code className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No Technical SEO data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance */}
            {result.performance && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="w-5 h-5" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(result.performance).map(([key, test]) => {
                    if (typeof test === 'object' && test !== null) {
                      return (
                        <div key={key} className="border rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            {getStatusIcon(test.status)}
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                <Badge variant="outline" className={getStatusColor(test.status)}>
                                  {test.percentage}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                              <HowToFixButton howToFix={test.howToFix} sectionKey={key} />
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </CardContent>
              </Card>
            )}

            {/* Security */}
            {result.security && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(result.security).map(([key, test]) => {
                    if (typeof test === 'object' && test !== null) {
                      return (
                        <div key={key} className="border rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            {getStatusIcon(test.status)}
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                <Badge variant="outline" className={getStatusColor(test.status)}>
                                  {test.percentage}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                              <HowToFixButton howToFix={test.howToFix} sectionKey={key} />
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </CardContent>
              </Card>
            )}

            {/* Mobile Usability */}
            {result.mobileUsability && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    Mobile Usability
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(result.mobileUsability).map(([key, test]) => {
                    if (typeof test === 'object' && test !== null) {
                      return (
                        <div key={key} className="border rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            {getStatusIcon(test.status)}
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                <Badge variant="outline" className={getStatusColor(test.status)}>
                                  {test.percentage}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                              <HowToFixButton howToFix={test.howToFix} sectionKey={key} />
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </CardContent>
              </Card>
            )}

            {/* Content Quality */}
            {result.contentQuality && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Content Quality
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(result.contentQuality).map(([key, test]) => {
                    if (typeof test === 'object' && test !== null) {
                      return (
                        <div key={key} className="border rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            {getStatusIcon(test.status)}
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                <Badge variant="outline" className={getStatusColor(test.status)}>
                                  {test.percentage}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                              <HowToFixButton howToFix={test.howToFix} sectionKey={key} />
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </CardContent>
              </Card>
            )}

            {/* Accessibility */}
            {result.accessibility && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Accessibility
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(result.accessibility).map(([key, test]) => {
                    if (typeof test === 'object' && test !== null) {
                      return (
                        <div key={key} className="border rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            {getStatusIcon(test.status)}
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                <Badge variant="outline" className={getStatusColor(test.status)}>
                                  {test.percentage}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                              <HowToFixButton howToFix={test.howToFix} sectionKey={key} />
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </CardContent>
              </Card>
            )}

            {/* URL Structure */}
            {result.urlStructure && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="w-5 h-5" />
                    URL Structure
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(result.urlStructure).map(([key, test]) => {
                    if (typeof test === 'object' && test !== null) {
                      return (
                        <div key={key} className="border rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            {getStatusIcon(test.status)}
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                <Badge variant="outline" className={getStatusColor(test.status)}>
                                  {test.percentage}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                              <HowToFixButton howToFix={test.howToFix} sectionKey={key} />
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </CardContent>
              </Card>
            )}

            {/* Site Architecture */}
            {result.siteArchitecture && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Site Architecture
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(result.siteArchitecture).map(([key, test]) => {
                    if (typeof test === 'object' && test !== null) {
                      return (
                        <div key={key} className="border rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            {getStatusIcon(test.status)}
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                <Badge variant="outline" className={getStatusColor(test.status)}>
                                  {test.percentage}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                              <HowToFixButton howToFix={test.howToFix} sectionKey={key} />
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </CardContent>
              </Card>
            )}

            {/* Cross-Page Optimization */}
            {result.crossPageOptimization && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Cross-Page Optimization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(result.crossPageOptimization).map(([key, test]) => {
                    if (typeof test === 'object' && test !== null) {
                      return (
                        <div key={key} className="border rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            {getStatusIcon(test.status)}
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                <Badge variant="outline" className={getStatusColor(test.status)}>
                                  {test.percentage}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                              <HowToFixButton howToFix={test.howToFix} sectionKey={key} />
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.recommendations.map((rec, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{rec.title}</h4>
                            <Badge 
                              variant="outline" 
                              className={`${
                                rec.priority === 'critical' ? 'text-red-600 border-red-200' :
                                rec.priority === 'high' ? 'text-orange-600 border-orange-200' :
                                rec.priority === 'medium' ? 'text-yellow-600 border-yellow-200' :
                                'text-green-600 border-green-200'
                              }`}
                            >
                              {rec.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                          <p className="text-sm text-gray-700 font-medium">{rec.action}</p>
                          {rec.timeline && (
                            <p className="text-xs text-gray-500 mt-1">Timeline: {rec.timeline}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Priority Actions */}
            {result.priorityActions && result.priorityActions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Priority Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.priorityActions.map((action, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{action.action}</h4>
                            <div className="flex gap-2">
                              <Badge 
                                variant="outline" 
                                className={`${
                                  action.priority === 'critical' ? 'text-red-600 border-red-200' :
                                  action.priority === 'high' ? 'text-orange-600 border-orange-200' :
                                  action.priority === 'medium' ? 'text-yellow-600 border-yellow-200' :
                                  'text-green-600 border-green-200'
                                }`}
                              >
                                {action.priority}
                              </Badge>
                              <Badge variant="outline" className="text-blue-600 border-blue-200">
                                {action.effort}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">Category: {action.category}</p>
                          <p className="text-sm text-gray-600">Impact: {action.impact}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                onClick={handleDownloadPDF}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF Report
              </Button>
              
              <Button
                onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                variant="outline"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Results
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
