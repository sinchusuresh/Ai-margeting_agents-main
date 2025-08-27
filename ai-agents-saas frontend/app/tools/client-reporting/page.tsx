"use client"

import { useState, useEffect } from "react"
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
  BarChart3,
  Lock,
  Crown,
  TrendingUp,
  Target,
  Calendar,
  DollarSign,
  Activity,
  Users,
  MousePointer,
  Zap,
  TrendingDown,
  Eye,
  Share2,
  MessageCircle
} from "lucide-react"
import { useUserStore } from "@/lib/user-store"
import { generateProfessionalPDF } from "@/utils/pdfGenerator";
import { makeAuthenticatedRequest } from "@/lib/auth-utils"
import { 
  LineChart, 
  Line, 
  BarChart as RechartsBarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface ReportMetric {
  name: string
  current: number
  previous: number
  change: number
  unit: string
  trend: "up" | "down" | "stable"
}

interface RealDataMetrics {
  totalUsers: number
  sessions: number
  pageViews: number
  bounceRate: number
  avgSessionDuration: number
  conversions: number
  revenue: number
  trafficSources: Record<string, { users: number; sessions: number; pageViews: number }>
  dailyData: Array<{ date: string; users: number; sessions: number; pageViews: number }>
}

interface SocialMediaData {
  campaigns: {
    campaigns: Array<{
    name: string
    impressions: number
    clicks: number
      spend: number
      reach: number
      frequency: number
    conversions: number
      ctr: number
      cpc: number
      cpm: number
    }>
    summary: {
      totalImpressions: number
      totalClicks: number
      totalSpend: number
      totalReach: number
      overallCtr: number
      overallCpc: number
      overallCpm: number
    }
  }
  pageInsights: {
    pageImpressions?: number
    pageEngagedUsers?: number
    pagePostEngagements?: number
    pageFollowers?: number
    totalShares?: number
    totalEngagements?: number
    followerCount?: number
  }
}

interface AdvertisingData {
  campaigns: {
    campaigns: Array<{
      id: string
      name: string
      status: string
      impressions: number
      clicks: number
      spend: number
      conversions: number
      cpc: number
      ctr: number
      cpm: number
    roi: number
  }>
    summary: {
      totalImpressions: number
      totalClicks: number
      totalSpend: number
      totalConversions: number
      overallCtr: number
      overallCpc: number
      overallCpm: number
      overallRoi: number
    }
  }
  keywords?: Array<{
    keyword: string
    impressions: number
    clicks: number
    cost: number
    conversions: number
    cpc: number
    ctr: number
    qualityScore: number
  }>
}

interface ReportResult {
  clientInfo: {
    name: string
    industry: string
    reportingPeriod: string
    services: string
    generatedAt: string
  }
  dataSources: {
    googleAnalytics: boolean
    facebookMarketing: boolean
    linkedinMarketing: boolean
    googleAds: boolean
  }
  realData: {
    analytics: {
      googleAnalytics?: RealDataMetrics
    }
    socialMedia: {
      facebook?: SocialMediaData
      linkedin?: SocialMediaData
    }
    advertising: {
      googleAds?: AdvertisingData
    }
    summary: {
      totalTraffic: number
      totalConversions: number
      totalSpend: number
      totalRevenue: number
      overallROI: number
      topPerformingChannels: Array<{
        name: string
        type: string
        metric: number
        performance: string
      }>
      keyInsights: string[]
  recommendations: Array<{
        priority: string
    category: string
    title: string
    description: string
        expectedImpact: string
      }>
    }
  }
  aiInsights: {
    executiveSummary: {
      overview: string
      keyAchievements: string[]
      challenges: string[]
      recommendations: string[]
    }
    performanceAnalysis: {
      trafficAnalysis: string
      conversionAnalysis: string
      roiAnalysis: string
      channelPerformance: string
    }
    strategicRecommendations: {
      immediateActions: string[]
      longTermStrategy: string
      budgetAllocation: string
      expectedOutcomes: string
    }
  }
}

export default function ClientReportingPage() {
  const { user } = useUserStore()
  const [formData, setFormData] = useState({
    clientName: "",
    reportPeriod: "monthly",
    campaigns: "",
    goals: "",
    budget: "",
    industry: "",
    kpis: "",
    challenges: "",
    // Platform IDs
    googleAnalyticsPropertyId: "",
    facebookAdAccountId: "",
    facebookPageId: "",
    linkedinAdAccountId: "",
    linkedinCompanyId: "",
    googleAdsCustomerId: ""
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<ReportResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasAccess = user.plan !== "Free Trial"

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const fillTestData = () => {
    setFormData({
      clientName: "TechStart Solutions",
      reportPeriod: "monthly",
      industry: "Technology",
      campaigns: "Google Ads, Facebook Ads, LinkedIn Ads, Email Marketing, Content Marketing",
      goals: "Increase leads, Improve conversion rate, Reduce cost per acquisition, Boost brand awareness",
      budget: "$25,000",
      kpis: "Traffic, Conversions, ROI, Cost per Lead, Engagement Rate",
      challenges: "Market competition, Budget constraints, Audience targeting",
      googleAnalyticsPropertyId: "123456789",
      facebookAdAccountId: "act_123456789",
      facebookPageId: "123456789",
      linkedinAdAccountId: "123456789",
      linkedinCompanyId: "123456789",
      googleAdsCustomerId: "123456789"
    });
  };

  const generateDemoData = (formData: any) => {
    return {
      clientInfo: {
        name: formData.clientName,
        industry: formData.industry || "Technology",
        reportingPeriod: formData.reportPeriod,
        services: formData.campaigns || "Digital Marketing Services",
        generatedAt: new Date().toISOString()
      },
      dataSources: {
        googleAnalytics: true,
        facebookMarketing: true,
        linkedinMarketing: true,
        googleAds: true
      },
      realData: {
        summary: {
          totalTraffic: 15420,
          totalConversions: 234,
          totalSpend: 15600,
          totalRevenue: 45678.90,
          overallROI: 43.7,
          topPerformingChannels: [
            { name: 'Google Organic', type: 'Traffic', metric: 8900, performance: 'excellent' },
            { name: 'Facebook Ads', type: 'Social Media', metric: 7.12, performance: 'good' }
          ],
          keyInsights: [
            "Strong organic traffic performance with 57.7% of total traffic",
            "Facebook campaigns showing above-average CTR of 7.12%",
            "Overall ROI of 43.7% indicates profitable marketing operations"
          ],
          recommendations: [
            {
              priority: 'high',
              category: 'Conversion Optimization',
              title: 'Optimize LinkedIn Campaigns',
              description: 'Focus on improving conversion rates for LinkedIn advertising',
              expectedImpact: '15-20% improvement in LinkedIn conversion rates'
            }
          ]
        },
        analytics: {
          googleAnalytics: {
            totalUsers: 15420,
            sessions: 23450,
            pageViews: 67890,
            bounceRate: 42.5,
            avgSessionDuration: 185,
            conversions: 234,
            revenue: 45678.90,
            trafficSources: {
              'google/organic': { users: 8900, sessions: 12300, pageViews: 34500 },
              'google/cpc': { users: 4200, sessions: 6800, pageViews: 18900 },
              'facebook/cpc': { users: 1800, sessions: 3200, pageViews: 8900 },
              'linkedin/cpc': { users: 520, sessions: 1150, pageViews: 5590 }
            },
            dailyData: [
              { date: '20241201', users: 512, sessions: 789, pageViews: 2341 },
              { date: '20241202', users: 498, sessions: 756, pageViews: 2189 },
              { date: '20241203', users: 534, sessions: 812, pageViews: 2456 }
            ]
          }
        },
        socialMedia: {
          facebook: {
            campaigns: {
              campaigns: [
                {
                  name: 'Brand Awareness Campaign',
                  impressions: 125000,
                  clicks: 8900,
                  spend: 4500.00,
                  reach: 89000,
                  frequency: 1.4,
                  conversions: 234,
                  ctr: 7.12,
                  cpc: 0.51,
                  cpm: 36.00
                }
              ],
              summary: {
                totalImpressions: 125000,
                totalClicks: 8900,
                totalSpend: 4500.00,
                totalReach: 89000,
                overallCtr: 7.12,
                overallCpc: 0.51,
                overallCpm: 36.00
              }
            },
            pageInsights: {
              pageImpressions: 456000,
              pageEngagedUsers: 23400,
              pagePostEngagements: 8900,
              pageFollowers: 12300
            }
          }
        },
        advertising: {
          googleAds: {
            campaigns: {
              campaigns: [
                {
                  id: '123456789',
                  name: 'Search Campaign - Brand Terms',
                  status: 'ENABLED',
                  impressions: 89000,
                  clicks: 12300,
                  spend: 8900.00,
                  conversions: 234,
                  cpc: 0.72,
                  ctr: 13.82,
                  cpm: 100.00,
                  roi: 38.03
                }
              ],
              summary: {
                totalImpressions: 89000,
                totalClicks: 12300,
                totalSpend: 8900.00,
                totalConversions: 234,
                overallCtr: 13.82,
                overallCpc: 0.72,
                overallCpm: 100.00,
                overallRoi: 38.03
              }
            }
          }
        }
      },
      aiInsights: {
        executiveSummary: {
          overview: "TechStart Solutions has shown strong performance in digital marketing with a 43.7% ROI. The company is effectively leveraging multiple channels including Google Ads, Facebook Ads, and LinkedIn campaigns.",
          keyAchievements: [
            "Achieved 43.7% overall ROI on marketing spend",
            "Generated 234 qualified leads through multi-channel campaigns",
            "Maintained strong organic traffic with 8,900 users from Google",
            "Facebook campaigns showing 7.12% CTR above industry average"
          ],
          challenges: [
            "LinkedIn campaigns need optimization for better conversion rates",
            "Bounce rate at 42.5% indicates room for landing page improvements",
            "Average session duration could be increased through better content engagement"
          ],
          recommendations: [
            "Focus on LinkedIn campaign optimization",
            "Implement landing page improvements",
            "Enhance content engagement strategies"
          ]
        },
        performanceAnalysis: {
          trafficAnalysis: "Traffic is well-distributed across organic and paid channels, with Google organic leading at 57.7% of total traffic. Paid campaigns are effectively complementing organic efforts.",
          conversionAnalysis: "Conversion rate is at 1.5% which is above industry average. Facebook campaigns are particularly effective with strong CTR and reasonable CPC.",
          roiAnalysis: "Overall ROI of 43.7% indicates profitable marketing operations. Google Ads campaigns are driving the highest ROI followed by Facebook campaigns.",
          channelPerformance: "Multi-channel approach is working well with each platform contributing to different stages of the customer journey."
        },
        strategicRecommendations: {
          immediateActions: [
            "Optimize LinkedIn campaigns to improve conversion rates",
            "Implement A/B testing for landing pages to reduce bounce rate",
            "Increase content marketing efforts to improve session duration"
          ],
          longTermStrategy: "Focus on building stronger organic presence while maintaining paid campaign performance. Develop content strategy to improve user engagement metrics.",
          budgetAllocation: "Allocate 60% to high-performing Google and Facebook campaigns, 25% to LinkedIn optimization, and 15% to content marketing and SEO improvements.",
          expectedOutcomes: "Expected 15-20% improvement in conversion rates and 25-30% increase in organic traffic within 3 months of implementing recommendations."
        }
      }
    };
  };

  const handleGenerate = async () => {
    if (!hasAccess) {
      alert("Please upgrade to Pro or Agency plan to use this tool.")
      return
    }

    if (!formData.clientName || !formData.reportPeriod) {
      alert("Please enter client name and report period")
      return
    }

    setIsGenerating(true)
    setResult(null)
    setError(null)

    try {
      // Prepare input data for the backend
      const inputData = {
        clientName: formData.clientName,
        reportingPeriod: formData.reportPeriod,
        services: formData.campaigns || "Google Ads, Facebook Ads, LinkedIn Ads, Email Marketing, Content Marketing",
        industry: formData.industry || "technology",
        goals: formData.goals || "Increase leads, Improve conversion rate, Reduce cost per acquisition, Boost brand awareness",
        budget: formData.budget || "$10,000",
        kpis: formData.kpis || "Traffic, Conversions, ROI, Cost per Lead, Engagement Rate",
        challenges: formData.challenges || "Market competition, Budget constraints, Audience targeting",
        // Platform IDs
        googleAnalyticsPropertyId: formData.googleAnalyticsPropertyId || "123456789",
        facebookAdAccountId: formData.facebookAdAccountId || "act_123456789",
        facebookPageId: formData.facebookPageId || "123456789",
        linkedinAdAccountId: formData.linkedinAdAccountId || "123456789",
        linkedinCompanyId: formData.linkedinCompanyId || "123456789",
        googleAdsCustomerId: formData.googleAdsCustomerId || "123456789"
      }

      // Call the backend API
      const data = await makeAuthenticatedRequest('/api/ai-tools/client-reporting/generate', {
        method: 'POST',
        body: JSON.stringify({ 
          input: inputData,
          timestamp: Date.now() // Add timestamp to prevent caching
        })
      })
      
      if (data.error) {
        throw new Error(data.error)
      }

      // Log report details
      console.log('Client Report Response:', data.output);
      console.log('Client Name:', formData.clientName);
      console.log('Report Period:', formData.reportPeriod);

      setResult(data.output);

    } catch (error: unknown) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      
      // Generate demo data when API fails (for testing without keys)
      console.log('Generating demo data for testing...');
      const demoResult = generateDemoData(formData);
      setResult(demoResult);
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }

  const handleDownloadPDF = async () => {
    if (!result) return;
    
    setIsExportingPDF(true);
    try {
      // Prepare PDFOptions from result and formData
      if (!result) throw new Error('No report data to export');
      const pdfOptions = {
        title: formData?.clientName
          ? `Client Report - ${formData.clientName}`
          : 'Client Report',
        toolName: 'Client Reporting',
        content: result,
      };
      generateProfessionalPDF(pdfOptions);
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setIsExportingPDF(false);
    }
  }

  // Chart data preparation
  const prepareTrafficChartData = () => {
    if (!result?.realData?.analytics?.googleAnalytics?.dailyData) return [];
    
    return result.realData.analytics.googleAnalytics.dailyData.map(item => ({
      date: new Date(item.date).toLocaleDateString(),
      users: item.users,
      sessions: item.sessions,
      pageViews: item.pageViews
    }));
  }

  const prepareTrafficSourceData = () => {
    if (!result?.realData?.analytics?.googleAnalytics?.trafficSources) return [];
    
    return Object.entries(result.realData.analytics.googleAnalytics.trafficSources).map(([source, data]) => ({
      source,
      users: data.users,
      sessions: data.sessions,
      pageViews: data.pageViews
    }));
  }

  const prepareCampaignPerformanceData = () => {
    const campaigns = [];
    
    if (result?.realData?.socialMedia?.facebook?.campaigns?.campaigns) {
      campaigns.push(...result.realData.socialMedia.facebook.campaigns.campaigns.map(c => ({
        name: c.name,
        impressions: c.impressions,
        clicks: c.clicks,
        spend: c.spend,
        platform: 'Facebook'
      })));
    }
    
    if (result?.realData?.socialMedia?.linkedin?.campaigns?.campaigns) {
      campaigns.push(...result.realData.socialMedia.linkedin.campaigns.campaigns.map(c => ({
        name: c.name,
        impressions: c.impressions,
        clicks: c.clicks,
        spend: c.spend,
        platform: 'LinkedIn'
      })));
    }
    
    if (result?.realData?.advertising?.googleAds?.campaigns?.campaigns) {
      campaigns.push(...result.realData.advertising.googleAds.campaigns.campaigns.map(c => ({
        name: c.name,
        impressions: c.impressions,
        clicks: c.clicks,
        spend: c.spend,
        platform: 'Google Ads'
      })));
    }
    
    return campaigns.slice(0, 10); // Top 10 campaigns
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/tools" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tools
          </Link>
          
                            <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">Client Reporting Agent</h1>
                      <p className="text-gray-600">Generate comprehensive marketing reports with real data from all platforms</p>
              </div>
                    
                    {!hasAccess && (
                      <div className="flex items-center space-x-2 text-amber-600">
                        <Lock className="w-5 h-5" />
                        <span className="font-medium">Pro or Agency Plan Required</span>
                      </div>
                    )}
          </div>
        </div>

          {/* Input Form */}
        <Card className="mb-8">
              <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Report Configuration
            </CardTitle>
            <CardDescription>
              Configure your client report with platform integrations and reporting parameters
            </CardDescription>
              </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Quick Test Data Buttons */}
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={fillTestData}
                className="flex items-center"
              >
                <Play className="w-4 h-4 mr-2" />
                Fill Test Data
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => {
                  const demoResult = generateDemoData(formData);
                  setResult(demoResult);
                }}
                className="flex items-center"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Generate Demo Report
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => handleInputChange("clientName", e.target.value)}
                  placeholder="Enter client name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reportPeriod">Report Period *</Label>
                  <select
                    id="reportPeriod"
                    value={formData.reportPeriod}
                    onChange={(e) => handleInputChange("reportPeriod", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  </select>
                </div>

                <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => handleInputChange("industry", e.target.value)}
                  placeholder="e.g., Technology, Healthcare, E-commerce"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Monthly Budget</Label>
                  <Input
                    id="budget"
                    value={formData.budget}
                    onChange={(e) => handleInputChange("budget", e.target.value)}
                  placeholder="e.g., $10,000"
                  />
              </div>
                </div>

            {/* Platform Integration Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Platform Integrations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="googleAnalyticsPropertyId">Google Analytics Property ID</Label>
                  <Input
                    id="googleAnalyticsPropertyId"
                    value={formData.googleAnalyticsPropertyId}
                    onChange={(e) => handleInputChange("googleAnalyticsPropertyId", e.target.value)}
                    placeholder="e.g., 123456789"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebookAdAccountId">Facebook Ad Account ID</Label>
                  <Input
                    id="facebookAdAccountId"
                    value={formData.facebookAdAccountId}
                    onChange={(e) => handleInputChange("facebookAdAccountId", e.target.value)}
                    placeholder="e.g., act_123456789"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="facebookPageId">Facebook Page ID</Label>
                  <Input
                    id="facebookPageId"
                    value={formData.facebookPageId}
                    onChange={(e) => handleInputChange("facebookPageId", e.target.value)}
                    placeholder="e.g., 123456789"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="linkedinAdAccountId">LinkedIn Ad Account ID</Label>
                  <Input
                    id="linkedinAdAccountId"
                    value={formData.linkedinAdAccountId}
                    onChange={(e) => handleInputChange("linkedinAdAccountId", e.target.value)}
                    placeholder="e.g., 123456789"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="linkedinCompanyId">LinkedIn Company ID</Label>
                  <Input
                    id="linkedinCompanyId"
                    value={formData.linkedinCompanyId}
                    onChange={(e) => handleInputChange("linkedinCompanyId", e.target.value)}
                    placeholder="e.g., 123456789"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="googleAdsCustomerId">Google Ads Customer ID</Label>
                  <Input
                    id="googleAdsCustomerId"
                    value={formData.googleAdsCustomerId}
                    onChange={(e) => handleInputChange("googleAdsCustomerId", e.target.value)}
                    placeholder="e.g., 123456789"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaigns">Marketing Campaigns</Label>
              <Textarea
                id="campaigns"
                value={formData.campaigns}
                onChange={(e) => handleInputChange("campaigns", e.target.value)}
                placeholder="List the marketing campaigns and services you're using..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goals">Marketing Goals</Label>
              <Textarea
                id="goals"
                value={formData.goals}
                onChange={(e) => handleInputChange("goals", e.target.value)}
                placeholder="Describe the main marketing goals and objectives..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kpis">Key Performance Indicators</Label>
              <Textarea
                    id="kpis"
                    value={formData.kpis}
                    onChange={(e) => handleInputChange("kpis", e.target.value)}
                placeholder="List the key metrics you want to track..."
                rows={3}
                  />
                </div>

            <div className="space-y-2">
              <Label htmlFor="challenges">Current Challenges</Label>
              <Textarea
                id="challenges"
                value={formData.challenges}
                onChange={(e) => handleInputChange("challenges", e.target.value)}
                placeholder="Describe any current marketing challenges..."
                rows={3}
              />
            </div>

                  <Button
                    onClick={handleGenerate}
              disabled={!hasAccess || isGenerating}
              className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                  Generate Comprehensive Report
                      </>
                    )}
                  </Button>
              </CardContent>
            </Card>

        {/* Error Display */}
        {error && (
          <Alert className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results Display */}
        {result && (
          <div className="space-y-8">
            {/* Report Header */}
                <Card>
                  <CardHeader>
                                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">
                        {result.clientInfo?.name || formData.clientName} - {result.clientInfo?.reportingPeriod || formData.reportPeriod} Report
                      </CardTitle>
                      <CardDescription>
                        Generated on {result.clientInfo?.generatedAt ? new Date(result.clientInfo.generatedAt).toLocaleDateString() : new Date().toLocaleDateString()}
                      </CardDescription>
                      </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                      variant="outline"
                      size="sm"
                    >
                        {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied!" : "Copy Data"}
                      </Button>
                    <Button
                      onClick={handleDownloadPDF}
                      disabled={isExportingPDF}
                      size="sm"
                    >
                      {isExportingPDF ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {isExportingPDF ? "Generating..." : "Download PDF"}
                    </Button>
                    </div>
                </div>
              </CardHeader>
                </Card>

            {/* Data Sources Status */}
                <Card>
                  <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Data Sources Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      <div className={`flex items-center space-x-2 p-3 rounded-lg ${result.dataSources?.googleAnalytics ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                      <div className={`w-3 h-3 rounded-full ${result.dataSources?.googleAnalytics ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className="text-sm font-medium">Google Analytics</span>
                          </div>
                    
                    <div className={`flex items-center space-x-2 p-3 rounded-lg ${result.dataSources?.facebookMarketing ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                      <div className={`w-3 h-3 rounded-full ${result.dataSources?.facebookMarketing ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className="text-sm font-medium">Facebook Marketing</span>
                            </div>
                    
                    <div className={`flex items-center space-x-2 p-3 rounded-lg ${result.dataSources?.linkedinMarketing ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                      <div className={`w-3 h-3 rounded-full ${result.dataSources?.linkedinMarketing ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className="text-sm font-medium">LinkedIn Marketing</span>
                            </div>
                    
                    <div className={`flex items-center space-x-2 p-3 rounded-lg ${result.dataSources?.googleAds ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                      <div className={`w-3 h-3 rounded-full ${result.dataSources?.googleAds ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className="text-sm font-medium">Google Ads</span>
                            </div>
                    </div>
                  </CardContent>
                </Card>

            {/* Key Metrics Overview */}
                <Card>
                  <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Key Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {result.realData?.summary?.totalTraffic?.toLocaleString() || '0'}
                              </div>
                      <div className="text-sm text-gray-600">Total Traffic</div>
                            </div>
                    
                            <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {result.realData?.summary?.totalConversions?.toLocaleString() || '0'}
                            </div>
                      <div className="text-sm text-gray-600">Total Conversions</div>
                            </div>
                    
                            <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        ${result.realData?.summary?.totalSpend?.toLocaleString() || '0'}
                            </div>
                      <div className="text-sm text-gray-600">Total Ad Spend</div>
                    </div>
                    
                            <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-2">
                        {result.realData?.summary?.overallROI?.toFixed(1) || '0.0'}%
                            </div>
                      <div className="text-sm text-gray-600">Overall ROI</div>
                          </div>
                    </div>
                  </CardContent>
                </Card>

            {/* Traffic Analytics Charts */}
            {result.realData?.analytics?.googleAnalytics && (
                <Card>
                  <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Traffic Analytics
                    </CardTitle>
                  </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Daily Traffic Trend */}
                    <div>
                      <h4 className="text-lg font-semibold mb-4">Daily Traffic Trend</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={prepareTrafficChartData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={2} />
                          <Line type="monotone" dataKey="sessions" stroke="#82ca9d" strokeWidth={2} />
                          <Line type="monotone" dataKey="pageViews" stroke="#ffc658" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                          </div>
                    
                    {/* Traffic Sources */}
                    <div>
                      <h4 className="text-lg font-semibold mb-4">Traffic Sources</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={prepareTrafficSourceData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ source, users }) => `${source}: ${users.toLocaleString()}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="users"
                          >
                            {prepareTrafficSourceData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                        </div>
                        </div>
                  </CardContent>
                </Card>
            )}

            {/* Campaign Performance */}
            {prepareCampaignPerformanceData().length > 0 && (
                <Card>
                  <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Campaign Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RechartsBarChart data={prepareCampaignPerformanceData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="impressions" fill="#8884d8" name="Impressions" />
                      <Bar dataKey="clicks" fill="#82ca9d" name="Clicks" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                  </CardContent>
                </Card>
            )}

            {/* AI Insights */}
                <Card>
                  <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  AI-Generated Insights & Recommendations
                    </CardTitle>
                  </CardHeader>
              <CardContent className="space-y-6">
                {/* Fallback when no AI insights available */}
                {!result.aiInsights && (
                  <div className="text-center py-8">
                    <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-600 mb-2">AI Insights Loading</h4>
                    <p className="text-gray-500">AI-powered insights and recommendations are being generated based on your data...</p>
                          </div>
                )}
                
                {/* Executive Summary */}
                {result.aiInsights?.executiveSummary && (
                  <div>
                    <h4 className="text-lg font-semibold mb-3">Executive Summary</h4>
                    <p className="text-gray-700 mb-4">{result.aiInsights.executiveSummary.overview || 'Executive summary analysis based on real data.'}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-green-700 mb-2">Key Achievements</h5>
                        <ul className="space-y-1">
                          {result.aiInsights.executiveSummary.keyAchievements?.map((achievement, index) => (
                            <li key={index} className="flex items-start">
                              <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-600">{achievement}</span>
                            </li>
                          )) || <li className="text-sm text-gray-500">Performance analysis in progress...</li>}
                        </ul>
                        </div>
                      
                      <div>
                        <h5 className="font-medium text-amber-700 mb-2">Challenges</h5>
                        <ul className="space-y-1">
                          {result.aiInsights.executiveSummary.challenges?.map((challenge, index) => (
                            <li key={index} className="flex items-start">
                              <TrendingDown className="w-4 h-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-600">{challenge}</span>
                            </li>
                          )) || <li className="text-sm text-gray-500">Challenge assessment in progress...</li>}
                        </ul>
                    </div>
                    </div>
                  </div>
                )}

                {/* Performance Analysis */}
                {result.aiInsights?.performanceAnalysis && (
                  <div>
                    <h4 className="text-lg font-semibold mb-3">Performance Analysis</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-blue-700 mb-2">Traffic Analysis</h5>
                        <p className="text-sm text-gray-600">{result.aiInsights.performanceAnalysis.trafficAnalysis || 'Traffic analysis based on real data.'}</p>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-purple-700 mb-2">Conversion Analysis</h5>
                        <p className="text-sm text-gray-600">{result.aiInsights.performanceAnalysis.conversionAnalysis || 'Conversion analysis based on real data.'}</p>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-green-700 mb-2">ROI Analysis</h5>
                        <p className="text-sm text-gray-600">{result.aiInsights.performanceAnalysis.roiAnalysis || 'ROI analysis based on real data.'}</p>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-orange-700 mb-2">Channel Performance</h5>
                        <p className="text-sm text-gray-600">{result.aiInsights.performanceAnalysis.channelPerformance || 'Channel performance analysis based on real data.'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Strategic Recommendations */}
                {result.aiInsights?.strategicRecommendations && (
                  <div>
                    <h4 className="text-lg font-semibold mb-3">Strategic Recommendations</h4>
                    
                    <div className="mb-4">
                      <h5 className="font-medium text-red-700 mb-2">Immediate Actions</h5>
                      <ul className="space-y-2">
                        {result.aiInsights.strategicRecommendations.immediateActions?.map((action, index) => (
                          <li key={index} className="flex items-start p-3 bg-red-50 rounded-lg">
                            <Target className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{action}</span>
                          </li>
                        )) || <li className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">Strategic recommendations in progress...</li>}
                      </ul>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-blue-700 mb-2">Long-term Strategy</h5>
                        <p className="text-sm text-gray-600">{result.aiInsights.strategicRecommendations.longTermStrategy || 'Long-term strategic planning based on data analysis.'}</p>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-green-700 mb-2">Budget Allocation</h5>
                        <p className="text-sm text-gray-600">{result.aiInsights.strategicRecommendations.budgetAllocation || 'Budget optimization recommendations based on performance data.'}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h5 className="font-medium text-purple-700 mb-2">Expected Outcomes</h5>
                      <p className="text-sm text-gray-600">{result.aiInsights.strategicRecommendations.expectedOutcomes || 'Expected results from implementing recommendations.'}</p>
                    </div>
                  </div>
                )}
                  </CardContent>
                </Card>

            {/* Top Performing Channels */}
            {result.realData?.summary?.topPerformingChannels && result.realData.summary.topPerformingChannels.length > 0 && (
                <Card>
                  <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Top Performing Channels
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {result.realData.summary.topPerformingChannels.map((channel, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{channel.name}</span>
                          <Badge variant={channel.performance === 'excellent' ? 'default' : 'secondary'}>
                            {channel.performance}
                          </Badge>
                          </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {channel.metric.toLocaleString()}
                            </div>
                        <div className="text-sm text-gray-500">{channel.type}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
            )}
              </div>
            )}
      </div>
    </div>
  )
}
