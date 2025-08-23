"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/header"
import Link from "next/link"
import { ArrowLeft, Play, Download, Copy, CheckCircle, Loader2, Share2, TrendingUp, Hash, FileText } from "lucide-react"
import { useUserStore } from "@/lib/user-store"
import { useRouter } from "next/navigation"
import { generateContent } from "@/lib/openai-client"

interface SocialMediaResult {
  posts: {
    platform: string
    content: string
    hashtags: string[]
    bestTime: string
    engagement: string
  }[]
  strategy: {
    contentMix: Array<{
      type: string
      percentage: number
      description: string
    }>
    postingSchedule: Array<{
      day: string
      times: string[]
      contentType: string
    }>
    hashtagStrategy: {
      trending: string[]
      niche: string[]
      branded: string[]
    }
  }
  analytics: {
    expectedReach: string
    engagementRate: string
    bestPerformingContent: string
    growthProjection: string
  }
  // New API integration fields
  apiIntegrations?: {
    autoSchedule: boolean
    platform: string
    generateImages: boolean
    imageStyle: string
    exportFormats: string[]
    scheduleType: string
    postingTimes: string[]
  }
  visualContent?: {
    imageIdeas: string[]
    brandColors: string[]
    visualStyle: string
  }
}

export default function SocialMediaContentPage() {
  const { user } = useUserStore()
  const router = useRouter();
  const [formData, setFormData] = useState({
    business: "",
    industry: "",
    targetAudience: "",
    platforms: [] as string[],
    contentGoals: "",
    brandVoice: "",
    postFrequency: "",
    // New API integration fields
    autoSchedule: false,
    schedulingPlatform: "publer",
    generateImages: false,
    imageStyle: "modern",
    exportFormats: ["csv"] as string[],
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<SocialMediaResult | null>(null)
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({})
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const parsed = JSON.parse(user);
        setUserPlan(parsed.subscription?.plan || parsed.plan || null);
      } catch {}
    }
  }, []);

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePlatformChange = (platform: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      platforms: checked ? [...prev.platforms, platform] : prev.platforms.filter((p) => p !== platform),
    }))
  }

  const handleGenerate = async () => {
    if (!formData.business || !formData.targetAudience || formData.platforms.length === 0) {
      alert("Please fill in business name, target audience, and select at least one platform")
      return
    }

    setIsGenerating(true)
    setResult(null)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('http://localhost:5000/api/ai-tools/social-media/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          input: formData
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else if (data.output) {
        setResult(data.output);
      } else {
        console.error('Invalid response:', data);
        setError('Invalid response format from server');
      }
    } catch (error: unknown) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Failed to fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else if (errorMessage.includes('500')) {
        setError('Server error. Please try again in a moment.');
      } else {
        setError(`Failed to generate social media content: ${errorMessage}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(prev => ({ ...prev, [key]: true }))
    setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 2000)
  }

  const downloadPDF = () => {
    if (!result) return;
    
    // Create HTML content for download

  // New API integration handler functions
  const handleAutoSchedule = async () => {
    if (!result?.posts || !result.apiIntegrations) return;
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Please log in to use this feature')
        return
      }

      const response = await fetch('http://localhost:5000/api/ai-tools/social-media/auto-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contentArray: result.posts,
          platform: result.apiIntegrations.platform,
          scheduleType: 'weekly'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json();
      if (data.success) {
        alert(`Successfully scheduled ${data.result.successfulPosts} posts with ${result.apiIntegrations.platform}!`)
      } else {
        alert('Failed to schedule posts. Please check your API credentials.')
      }
    } catch (error) {
      console.error('Auto-scheduling error:', error);
      alert('Failed to auto-schedule posts. Please check your API configuration.')
    }
  };

  const handleGenerateImages = async () => {
    if (!result?.posts || !result.apiIntegrations) return;
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Please log in to use this feature')
        return
      }

      const response = await fetch('http://localhost:5000/api/ai-tools/social-media/generate-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: result.posts[0], // Use first post as example
          platform: result.posts[0].platform,
          style: result.apiIntegrations.imageStyle
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json();
      if (data.success) {
        alert('Images generated successfully! Check your Canva account.')
      } else {
        alert('Failed to generate images. Please check your Canva API credentials.')
      }
    } catch (error) {
      console.error('Image generation error:', error);
      alert('Failed to generate images. Please check your Canva configuration.')
    }
  };

  const handleExport = async () => {
    if (!result?.posts || !result.apiIntegrations) return;
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Please log in to use this feature')
        return
      }

      const response = await fetch('http://localhost:5000/api/ai-tools/social-media/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: result.posts,
          format: result.apiIntegrations.exportFormats[0] || 'csv',
          platform: result.apiIntegrations.platform
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json();
      if (data.success) {
        if (data.result.format === 'csv') {
          // Download CSV
          const blob = new Blob([data.result.data], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = data.result.filename;
          a.click();
          window.URL.revokeObjectURL(url);
        } else {
          alert(`Content exported successfully in ${data.result.format} format!`)
        }
      } else {
        alert('Failed to export content.')
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export content. Please try again.')
    }
  };

  const handleValidateCredentials = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Please log in to use this feature')
        return
      }

      const response = await fetch('http://localhost:5000/api/ai-tools/social-media/validate-credentials?platform=all', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json();
      if (data.success) {
        let statusMessage = 'API Status:\n';
        if (data.result.publer) {
          statusMessage += `Publer: ${data.result.publer.valid ? '✅ Connected' : '❌ Failed'}\n`;
        }
        if (data.result.buffer) {
          statusMessage += `Buffer: ${data.result.buffer.valid ? '✅ Connected' : '❌ Failed'}\n`;
        }
        if (data.result.canva) {
          statusMessage += `Canva: ${data.result.canva.valid ? '✅ Connected' : '❌ Failed'}\n`;
        }
        alert(statusMessage);
      } else {
        alert('Failed to check API status.')
      }
    } catch (error) {
      console.error('Credential validation error:', error);
      alert('Failed to check API status. Please try again.')
    }
  };
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Social Media Content Strategy - ${formData.business}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: #ffffff;
          }
          
          .header {
            background: linear-gradient(135deg, #ec4899 0%, #e11d48 100%);
            color: white;
            padding: 40px 0;
            text-align: center;
            margin-bottom: 40px;
          }
          
          .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 10px;
          }
          
          .header p {
            font-size: 1.1rem;
            opacity: 0.9;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 20px;
          }
          
          .section {
            margin-bottom: 40px;
            page-break-inside: avoid;
          }
          
          .section-title {
            font-size: 1.8rem;
            font-weight: 600;
            color: #ec4899;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #fce7f3;
          }
          
          .card {
            background: #f8fafc;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 20px;
            border-left: 4px solid #ec4899;
          }
          
          .post-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
          }
          
          .platform-badge {
            display: inline-block;
            background: #ec4899;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 500;
            margin-bottom: 10px;
          }
          
          .content-text {
            font-size: 1rem;
            line-height: 1.7;
            margin-bottom: 15px;
            color: #374151;
          }
          
          .hashtags {
            margin-bottom: 15px;
          }
          
          .hashtag {
            display: inline-block;
            background: #f3f4f6;
            color: #6b7280;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            margin-right: 5px;
            margin-bottom: 5px;
          }
          
          .post-meta {
            font-size: 0.9rem;
            color: #6b7280;
            display: flex;
            gap: 20px;
          }
          
          .analytics-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }
          
          .analytics-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            border: 1px solid #e5e7eb;
          }
          
          .analytics-value {
            font-size: 1.8rem;
            font-weight: 700;
            color: #ec4899;
            margin-bottom: 5px;
          }
          
          .analytics-label {
            font-size: 0.9rem;
            color: #6b7280;
            font-weight: 500;
          }
          
          .strategy-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          
          .strategy-item {
            background: white;
            border-radius: 6px;
            padding: 15px;
            border: 1px solid #e5e7eb;
          }
          
          .strategy-type {
            font-weight: 600;
            color: #374151;
            margin-bottom: 5px;
          }
          
          .strategy-percentage {
            font-size: 1.2rem;
            font-weight: 700;
            color: #ec4899;
          }
          
          .footer {
            background: #f8fafc;
            padding: 30px 0;
            text-align: center;
            margin-top: 40px;
            border-top: 1px solid #e5e7eb;
          }
          
          .footer p {
            color: #6b7280;
            font-size: 0.9rem;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Social Media Content Strategy</h1>
          <p>${formData.business || 'Business'} - ${formData.industry || 'Industry'}</p>
        </div>
        
        <div class="container">
          <!-- Performance Analytics -->
          <div class="section">
            <h2 class="section-title">Performance Analytics</h2>
            <div class="analytics-grid">
              <div class="analytics-card">
                <div class="analytics-value">${result.analytics?.expectedReach || 'N/A'}</div>
                <div class="analytics-label">Expected Reach</div>
              </div>
              <div class="analytics-card">
                <div class="analytics-value">${result.analytics?.engagementRate || 'N/A'}</div>
                <div class="analytics-label">Engagement Rate</div>
              </div>
            </div>
            <div class="card">
              <div class="analytics-label">Best Performing Content</div>
              <div class="analytics-value" style="font-size: 1.2rem; text-align: left;">${result.analytics?.bestPerformingContent || 'N/A'}</div>
            </div>
            <div class="card">
              <div class="analytics-label">Growth Projection</div>
              <div class="analytics-value" style="font-size: 1.2rem; text-align: left;">${result.analytics?.growthProjection || 'N/A'}</div>
            </div>
          </div>
          
          <!-- Generated Posts -->
          <div class="section">
            <h2 class="section-title">Generated Posts</h2>
            ${result.posts?.map((post, index) => `
              <div class="post-card">
                <div class="platform-badge">${post.platform}</div>
                <div class="post-content">${post.content}</div>
                <div class="hashtags">
                  ${post.hashtags?.map(tag => `<span class="hashtag">#${tag}</span>`).join('') || ''}
                </div>
                <div class="post-meta">
                  <span><strong>Best Time:</strong> ${post.bestTime}</span>
                  <span><strong>Expected Engagement:</strong> ${post.engagement}</span>
                </div>
              </div>
            `).join('') || ''}
          </div>
          
          <!-- Content Strategy -->
          <div class="section">
            <h2 class="section-title">Content Strategy</h2>
            <div class="strategy-grid">
              ${result.strategy?.contentMix?.map((item, index) => `
                <div class="strategy-item">
                  <div class="strategy-type">${item.type}</div>
                  <div class="strategy-percentage">${item.percentage}%</div>
                </div>
              `).join('') || ''}
            </div>
          </div>
          
          <!-- Posting Schedule -->
          <div class="section">
            <h2 class="section-title">Posting Schedule</h2>
            ${result.strategy?.postingSchedule?.map((schedule, index) => `
              <div class="card">
                <div style="font-weight: 600; margin-bottom: 5px;">${schedule.day}</div>
                <div style="color: #6b7280;">
                  ${schedule.times?.join(', ') || 'TBD'} - ${schedule.contentType || 'Mixed Content'}
                </div>
              </div>
            `).join('') || ''}
          </div>
          
          <!-- Hashtag Strategy -->
          <div class="section">
            <div class="section-title">Hashtag Strategy</div>
            <div class="card">
              <div style="margin-bottom: 15px;">
                <div style="font-weight: 600; margin-bottom: 8px;">Trending Hashtags</div>
                <div>${result.strategy?.hashtagStrategy?.trending?.map(tag => `<span class="hashtag">#${tag}</span>`).join('') || 'None'}</div>
              </div>
              <div style="margin-bottom: 15px;">
                <div style="font-weight: 600; margin-bottom: 8px;">Niche Hashtags</div>
                <div>${result.strategy?.hashtagStrategy?.niche?.map(tag => `<span class="hashtag">#${tag}</span>`).join('') || 'None'}</div>
              </div>
              <div>
                <div style="font-weight: 600; margin-bottom: 8px;">Branded Hashtags</div>
                <div>${result.strategy?.hashtagStrategy?.branded?.map(tag => `<span class="hashtag">#${tag}</span>`).join('') || 'None'}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>Generated by AI Marketing Agents - ${new Date().toLocaleDateString()}</p>
          <p>Business: ${formData.business || 'N/A'} | Industry: ${formData.industry || 'N/A'} | Target Audience: ${formData.targetAudience || 'N/A'}</p>
        </div>
      </body>
      </html>
    `;
    
    // Create blob and download as HTML file (can be opened in browser and saved as PDF)
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `social-media-strategy-${formData.business || 'business'}-${new Date().toISOString().split('T')[0]}.html`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-pink-400 to-rose-600 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Social Media Content Generator</h1>
              <p className="text-gray-600">Generate engaging social media posts for all platforms</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle>Content Requirements</CardTitle>
              <CardDescription>Tell us about your business and content goals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business">Business Name *</Label>
                <Input
                  id="business"
                  placeholder="Your Business Name"
                  value={formData.business}
                  onChange={(e) => handleInputChange("business", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  placeholder="e.g., Technology, Healthcare, E-commerce"
                  value={formData.industry}
                  onChange={(e) => handleInputChange("industry", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience *</Label>
                <Input
                  id="targetAudience"
                  placeholder="e.g., Young professionals, Small business owners"
                  value={formData.targetAudience}
                  onChange={(e) => handleInputChange("targetAudience", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Social Media Platforms *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["LinkedIn", "Instagram", "Twitter", "Facebook", "TikTok", "YouTube"].map((platform) => (
                    <label key={platform} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.platforms.includes(platform)}
                        onChange={(e) => handlePlatformChange(platform, e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contentGoals">Content Goals</Label>
                <Textarea
                  id="contentGoals"
                  placeholder="e.g., Increase brand awareness, generate leads, drive engagement"
                  value={formData.contentGoals}
                  onChange={(e) => handleInputChange("contentGoals", e.target.value)}
                />
              </div>

                             <div className="space-y-2">
                 <Label htmlFor="brandVoice">Brand Voice</Label>
                 <select
                   id="brandVoice"
                   value={formData.brandVoice}
                   onChange={(e) => handleInputChange("brandVoice", e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                 >
                   <option value="">Select Brand Voice</option>
                   <option value="Professional">Professional</option>
                   <option value="Friendly">Friendly</option>
                   <option value="Authoritative">Authoritative</option>
                   <option value="Casual">Casual</option>
                   <option value="Humorous">Humorous</option>
                   <option value="Inspirational">Inspirational</option>
                   <option value="Educational">Educational</option>
                 </select>
               </div>

                             <div className="space-y-2">
                <Label htmlFor="postFrequency">Posting Frequency</Label>
                <select
                  id="postFrequency"
                  value={formData.postFrequency}
                  onChange={(e) => handleInputChange("postFrequency", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Select Posting Frequency</option>
                  <option value="Daily">Daily</option>
                  <option value="3x per week">3x per week</option>
                  <option value="Weekly">Weekly</option>
                  <option value="2x per week">2x per week</option>
                  <option value="Bi-weekly">Bi-weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>

              {/* API Integration Options */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div className="space-y-2">
                  <Label className="text-lg font-semibold text-gray-800">🚀 API Integrations</Label>
                  <p className="text-sm text-gray-600">Enhance your workflow with automated scheduling and visual content</p>
                  
                  {/* API Status Indicator */}
                  <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                    <span>⚠️</span>
                    <span>API keys not configured yet. Features will work with fallback data.</span>
                  </div>
                </div>

                {/* Auto-scheduling Options */}
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.autoSchedule || false}
                      onChange={(e) => handleInputChange("autoSchedule", e.target.checked)}
                      className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                    <span className="font-medium">Auto-schedule posts</span>
                  </label>
                  
                  {formData.autoSchedule && (
                    <div className="ml-6 space-y-2">
                      <Label htmlFor="schedulingPlatform">Scheduling Platform</Label>
                      <select
                        id="schedulingPlatform"
                        value={formData.schedulingPlatform || 'publer'}
                        onChange={(e) => handleInputChange("schedulingPlatform", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      >
                        <option value="publer">Publer - Multi-platform scheduling</option>
                        <option value="buffer">Buffer - Professional social media management</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Visual Content Generation */}
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.generateImages || false}
                      onChange={(e) => handleInputChange("generateImages", e.target.checked)}
                      className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                    <span className="font-medium">Generate Canva images</span>
                  </label>
                  
                  {formData.generateImages && (
                    <div className="ml-6 space-y-2">
                      <Label htmlFor="imageStyle">Visual Style</Label>
                      <select
                        id="imageStyle"
                        value={formData.imageStyle || 'modern'}
                        onChange={(e) => handleInputChange("imageStyle", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      >
                        <option value="modern">Modern & Clean</option>
                        <option value="minimal">Minimal & Simple</option>
                        <option value="bold">Bold & Dynamic</option>
                        <option value="professional">Professional & Corporate</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Export Options */}
                <div className="space-y-3">
                  <Label className="font-medium">Export Formats</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["csv", "google_sheets", "publer", "buffer"].map((format) => (
                      <label key={format} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={(formData.exportFormats || ['csv']).includes(format)}
                          onChange={(e) => {
                            const currentFormats = formData.exportFormats || ['csv'];
                            if (e.target.checked) {
                              handleInputChange("exportFormats", [...currentFormats, format]);
                            } else {
                              handleInputChange("exportFormats", currentFormats.filter(f => f !== format));
                            }
                          }}
                          className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                        />
                        <span className="text-sm capitalize">{format.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-pink-400 to-rose-600 hover:opacity-90 text-white font-semibold py-3"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Content...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Generate Social Media Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-6">
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <p className="text-red-600">{error}</p>
                </CardContent>
              </Card>
            )}

            {result && (
              <>
                {/* Analytics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Performance Analytics
                      <Button
                        onClick={() => downloadPDF()}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Download PDF
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded">
                        <div className="text-2xl font-bold text-blue-600">
                          {result.analytics?.expectedReach}
                        </div>
                        <div className="text-sm text-blue-600">Expected Reach</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded">
                        <div className="text-2xl font-bold text-green-600">
                          {result.analytics?.engagementRate}
                        </div>
                        <div className="text-sm text-green-600">Engagement Rate</div>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="font-medium mb-1">Best Performing Content</div>
                      <div className="text-sm text-gray-600">{result.analytics?.bestPerformingContent}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="font-medium mb-1">Growth Projection</div>
                      <div className="text-sm text-gray-600">{result.analytics?.growthProjection}</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Posts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Share2 className="w-5 h-5" />
                      Generated Posts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.posts?.map((post, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary">{post.platform}</Badge>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(post.content, `post-${index}`)}
                            >
                              {copied[`post-${index}`] ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-3">{post.content}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {post.hashtags?.map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="text-xs text-gray-500">
                          <span className="mr-4">Best time: {post.bestTime}</span>
                          <span>Expected engagement: {post.engagement}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Strategy */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Content Strategy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="content-mix" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="content-mix">Content Mix</TabsTrigger>
                        <TabsTrigger value="schedule">Posting Schedule</TabsTrigger>
                        <TabsTrigger value="hashtags">Hashtag Strategy</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="content-mix" className="space-y-3">
                        {result.strategy?.contentMix?.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <span className="font-medium">{item.type}</span>
                            <span className="text-sm text-gray-600">{item.percentage}%</span>
                          </div>
                        ))}
                      </TabsContent>
                      
                      <TabsContent value="schedule" className="space-y-3">
                        {result.strategy?.postingSchedule?.map((schedule, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded">
                            <div className="font-medium">{schedule.day}</div>
                            <div className="text-sm text-gray-600">
                              {schedule.times.join(', ')} - {schedule.contentType}
                            </div>
                          </div>
                        ))}
                      </TabsContent>
                      
                      <TabsContent value="hashtags" className="space-y-3">
                        <div>
                          <h4 className="font-medium mb-2">Trending Hashtags</h4>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {result.strategy?.hashtagStrategy?.trending?.map((tag, index) => (
                              <Badge key={index} variant="outline">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Niche Hashtags</h4>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {result.strategy?.hashtagStrategy?.niche?.map((tag, index) => (
                              <Badge key={index} variant="outline">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Branded Hashtags</h4>
                          <div className="flex flex-wrap gap-1">
                            {result.strategy?.hashtagStrategy?.branded?.map((tag, index) => (
                              <Badge key={index} variant="outline">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* API Integration Results */}
                {(result.apiIntegrations || result.visualContent) && (
                  <>
                    {/* API Integration Status */}
                    {result.apiIntegrations && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            🚀 API Integrations
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-blue-50 rounded">
                              <div className="font-medium mb-1">Auto-scheduling</div>
                              <div className="text-sm text-blue-600">
                                {result.apiIntegrations.autoSchedule ? 'Enabled' : 'Disabled'}
                              </div>
                            </div>
                            <div className="p-3 bg-green-50 rounded">
                              <div className="font-medium mb-1">Platform</div>
                              <div className="text-sm text-green-600 capitalize">
                                {result.apiIntegrations.platform}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-purple-50 rounded">
                              <div className="font-medium mb-1">Image Generation</div>
                              <div className="text-sm text-purple-600">
                                {result.apiIntegrations.generateImages ? 'Enabled' : 'Disabled'}
                              </div>
                            </div>
                            <div className="p-3 bg-orange-50 rounded">
                              <div className="font-medium mb-1">Export Formats</div>
                              <div className="text-sm text-orange-600">
                                {result.apiIntegrations.exportFormats?.join(', ')}
                              </div>
                            </div>
                          </div>
                          {result.apiIntegrations.postingTimes && (
                            <div className="p-3 bg-gray-50 rounded">
                              <div className="font-medium mb-1">Optimal Posting Times</div>
                              <div className="text-sm text-gray-600">
                                {result.apiIntegrations.postingTimes.join(', ')}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Visual Content Results */}
                    {result.visualContent && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            🎨 Visual Content
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded">
                            <div className="font-medium mb-2">Visual Style</div>
                            <div className="text-sm text-gray-700">{result.visualContent.visualStyle}</div>
                          </div>
                          
                          {result.visualContent.imageIdeas && (
                            <div>
                              <div className="font-medium mb-2">Image Ideas</div>
                              <div className="space-y-2">
                                {result.visualContent.imageIdeas.map((idea, index) => (
                                  <div key={index} className="text-sm text-gray-600 bg-white p-2 rounded border">
                                    💡 {idea}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {result.visualContent.brandColors && (
                            <div>
                              <div className="font-medium mb-2">Brand Colors</div>
                              <div className="flex gap-2">
                                {result.visualContent.brandColors.map((color, index) => (
                                  <div key={index} className="flex items-center gap-2">
                                    <div 
                                      className="w-6 h-6 rounded border"
                                      style={{ backgroundColor: color }}
                                    ></div>
                                    <span className="text-sm text-gray-600">{color}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Action Buttons */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          ⚡ Take Action
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {result.apiIntegrations?.autoSchedule && (
                            <Button 
                              onClick={() => handleAutoSchedule()}
                              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:opacity-90 text-white"
                            >
                              📅 Schedule with {result.apiIntegrations.platform}
                            </Button>
                          )}
                          
                          {result.apiIntegrations?.generateImages && (
                            <Button 
                              onClick={() => handleGenerateImages()}
                              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:opacity-90 text-white"
                            >
                              🎨 Generate Canva Images
                            </Button>
                          )}
                          
                          <Button 
                            onClick={() => handleExport()}
                            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:opacity-90 text-white"
                          >
                            📤 Export Content
                          </Button>
                          
                          <Button 
                            onClick={() => handleValidateCredentials()}
                            variant="outline"
                            className="w-full"
                          >
                            🔑 Check API Status
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
