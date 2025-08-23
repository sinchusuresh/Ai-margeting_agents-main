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
import { ArrowLeft, Play, Download, Copy, CheckCircle, Loader2, Share2, TrendingUp, Hash } from "lucide-react"
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
      // Create a comprehensive social media content prompt
      const prompt = `Generate a comprehensive social media content strategy for the following business:

Business: ${formData.business}
Industry: ${formData.industry || 'Not specified'}
Target Audience: ${formData.targetAudience}
Platforms: ${formData.platforms.join(', ')}
Content Goals: ${formData.contentGoals || 'Not specified'}
Brand Voice: ${formData.brandVoice || 'Not specified'}
Post Frequency: ${formData.postFrequency || 'Not specified'}

Please provide a complete social media content strategy including:
1. 10-15 platform-specific posts with content, hashtags, best posting times, and engagement expectations
2. Content mix strategy with percentages and descriptions for different content types
3. Posting schedule with days, times, and content types for each platform
4. Hashtag strategy with trending, niche, and branded hashtags
5. Analytics expectations (reach, engagement rate, best performing content, growth projection)

Format the response as a structured JSON object that can be parsed by the frontend.`;

      // Use the shared OpenAI client
      const result = await generateContent(prompt, {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 4000
      });

      if (!result.success || !result.content) {
        throw new Error(result.error || 'Failed to generate social media content');
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

      // Log social media content details
      console.log('Social Media Content Response:', aiOutput);
      console.log('Business:', formData.business);
      console.log('Platforms:', formData.platforms);

      // Set the result directly from AI output
      setResult(aiOutput);

      // Trigger dashboard refresh to show in recent activity
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
      } else {
        setError(`Failed to generate social media content: ${errorMessage}`);
      }

      // No fallback data - show empty state
      setResult(null);
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied((prev) => ({ ...prev, [id]: true }))
    setTimeout(() => setCopied((prev) => ({ ...prev, [id]: false })), 2000)
  }

  const handleExportCalendar = () => {
    if (!result || !result.posts || result.posts.length === 0) {
      alert("No content to export!");
      return;
    }
    // Prepare CSV header
    const headers = [
      "Platform",
      "Content",
      "Hashtags",
      "Best Time",
      "Engagement"
    ];
    // Prepare CSV rows
    const rows = result.posts.map(post => [
      post.platform,
      post.content.replace(/\n/g, " ").replace(/\r/g, " "),
      post.hashtags.join(" "),
      post.bestTime,
      post.engagement
    ]);
    // Combine header and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
    ].join("\r\n");
    // Create a Blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "content-calendar.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-rose-600 rounded-xl flex items-center justify-center">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Social Media Content Generator</h1>
              <Badge className="bg-green-100 text-green-800">Free</Badge>
            </div>
            <p className="text-gray-600">Generate engaging social media content for all platforms</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Content Setup</CardTitle>
                <CardDescription>Configure your social media content generation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="business">Business Name *</Label>
                  <Input
                    id="business"
                    placeholder="Enter your business name"
                    value={formData.business}
                    onChange={(e) => handleInputChange("business", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    placeholder="e.g., Marketing, Healthcare, E-commerce"
                    value={formData.industry}
                    onChange={(e) => handleInputChange("industry", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Target Audience *</Label>
                  <Input
                    id="targetAudience"
                    placeholder="e.g., Small business owners, Young professionals"
                    value={formData.targetAudience}
                    onChange={(e) => handleInputChange("targetAudience", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Platforms *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Instagram", "LinkedIn", "Twitter", "Facebook", "TikTok", "YouTube"].map((platform) => (
                      <label key={platform} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.platforms.includes(platform)}
                          onChange={(e) => handlePlatformChange(platform, e.target.checked)}
                          className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
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
                    placeholder="What do you want to achieve? (e.g., brand awareness, lead generation)"
                    value={formData.contentGoals}
                    onChange={(e) => handleInputChange("contentGoals", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brandVoice">Brand Voice</Label>
                  <select
                    id="brandVoice"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    value={formData.brandVoice}
                    onChange={(e) => handleInputChange("brandVoice", e.target.value)}
                  >
                    <option value="">Select brand voice</option>
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="casual">Casual</option>
                    <option value="authoritative">Authoritative</option>
                    <option value="playful">Playful</option>
                    <option value="inspirational">Inspirational</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postFrequency">Posting Frequency</Label>
                  <select
                    id="postFrequency"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    value={formData.postFrequency}
                    onChange={(e) => handleInputChange("postFrequency", e.target.value)}
                  >
                    <option value="">Select frequency</option>
                    <option value="daily">Daily</option>
                    <option value="5-times-week">5 times per week</option>
                    <option value="3-times-week">3 times per week</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={
                    isGenerating || !formData.business || !formData.targetAudience || formData.platforms.length === 0
                  }
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
                      Generate Social Content
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {error && (
              <Card className="mb-6">
                <CardContent className="text-center py-10">
                  <p className="text-red-500 text-lg font-semibold mb-2">{error}</p>
                  <Button onClick={() => setError(null)} className="bg-red-500 hover:bg-red-600 text-white">
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}
            {!result ? (
              <Card>
                <CardContent className="text-center py-20">
                  <Share2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Create</h3>
                  <p className="text-gray-600">
                    Fill in your business details and generate engaging social media content for all platforms
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Analytics Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      Performance Projections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">{result.analytics?.expectedReach || "N/A"}</div>
                        <div className="text-xs text-gray-600">Expected Reach</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">{result.analytics?.engagementRate || "N/A"}</div>
                        <div className="text-xs text-gray-600">Engagement Rate</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-base font-bold text-purple-600">{result.analytics?.growthProjection || "N/A"}</div>
                        <div className="text-xs text-gray-600">Growth Projection</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-sm font-bold text-yellow-600">{result.analytics?.bestPerformingContent || "N/A"}</div>
                        <div className="text-sm text-gray-600">Top Content Type</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Tabs defaultValue="posts" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="posts">Generated Posts</TabsTrigger>
                    <TabsTrigger value="strategy">Content Strategy</TabsTrigger>
                    <TabsTrigger value="hashtags">Hashtag Research</TabsTrigger>
                  </TabsList>

                  <TabsContent value="posts" className="space-y-4">
                    {(result.posts ?? []).map((post, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-pink-100 text-pink-800">{post.platform}</Badge>
                              <Badge variant="outline">{post.bestTime}</Badge>
                              <Badge className="bg-green-100 text-green-800">{post.engagement}</Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(post.content, `post-${index}`)}
                            >
                              {copied[`post-${index}`] ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{post.content}</pre>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-2">Recommended Hashtags:</p>
                              <div className="flex flex-wrap gap-1">
                                {(post.hashtags ?? []).map((hashtag, hIndex) => (
                                  <Badge key={hIndex} variant="secondary" className="text-xs">
                                    {hashtag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="strategy" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Content Mix Strategy</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {result.strategy?.contentMix?.map((mix, index) => (
                            <div key={index} className="flex items-center gap-4">
                              <div className="w-16 text-center">
                                <div className="text-lg font-bold text-pink-600">{mix.percentage}%</div>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{mix.type}</h4>
                                <p className="text-xs text-gray-600">{mix.description}</p>
                              </div>
                              <div className="w-32">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-pink-500 h-2 rounded-full"
                                    style={{ width: `${mix.percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Optimal Posting Schedule</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {result.strategy?.postingSchedule?.map((schedule, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="font-medium text-sm">{schedule.day}</div>
                              <div className="flex gap-2">
                                {schedule.times.map((time, tIndex) => (
                                  <Badge key={tIndex} variant="outline" className="text-xs">
                                    {time}
                                  </Badge>
                                ))}
                              </div>
                              <div className="text-xs text-gray-600">{schedule.contentType}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="hashtags" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Hash className="w-4 h-4 text-blue-500" />
                            Trending
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {result.strategy?.hashtagStrategy?.trending?.map((hashtag, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <Badge className="bg-blue-100 text-blue-800">{hashtag}</Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(hashtag, `trending-${index}`)}
                                >
                                  {copied[`trending-${index}`] ? (
                                    <CheckCircle className="w-3 h-3" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Hash className="w-4 h-4 text-green-500" />
                            Niche
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {result.strategy?.hashtagStrategy?.niche?.map((hashtag, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <Badge className="bg-green-100 text-green-800">{hashtag}</Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(hashtag, `niche-${index}`)}
                                >
                                  {copied[`niche-${index}`] ? (
                                    <CheckCircle className="w-3 h-3" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Hash className="w-4 h-4 text-purple-500" />
                            Branded
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {result.strategy?.hashtagStrategy?.branded?.map((hashtag, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <Badge className="bg-purple-100 text-purple-800">{hashtag}</Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(hashtag, `branded-${index}`)}
                                >
                                  {copied[`branded-${index}`] ? (
                                    <CheckCircle className="w-3 h-3" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(JSON.stringify(result, null, 2), "all-content")}
                    className="flex-1"
                  >
                    {copied["all-content"] ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    {copied["all-content"] ? "Copied!" : "Copy All Content"}
                  </Button>
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={handleExportCalendar}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Content Calendar
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
