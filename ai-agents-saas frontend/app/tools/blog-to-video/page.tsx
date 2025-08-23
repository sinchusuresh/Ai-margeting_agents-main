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
import { ArrowLeft, Play, Download, Copy, CheckCircle, Loader2, Video, Lock, Crown, Clock, Eye, Camera, Mic } from 'lucide-react'
import { useUserStore } from "@/lib/user-store"
import { makeAuthenticatedRequest } from "@/lib/auth-utils"
import jsPDF from "jspdf";

interface VideoScript {
  section: string
  duration: string
  script: string
  visualCues: string[]
  audioNotes: string[]
}

interface VideoResult {
  scripts: VideoScript[]
  storyboard: {
    scene: number
    timestamp: string
    visual: string
    text: string
    transition: string
  }[]
  production: {
    equipment: string[]
    locations: string[]
    props: string[]
    timeline: string
  }
  optimization: {
    title: string
    description: string
    tags: string[]
    thumbnail: string
    chapters: Array<{
      time: string
      title: string
    }>
  }
  analytics: {
    estimatedLength: string
    targetAudience: string
    engagementPrediction: string
    platformRecommendations: string[]
  }
  platformStrategy?: string[];
  thumbnailConcept?: string;
}

export default function BlogToVideoPage() {
  const { user } = useUserStore()
  const [formData, setFormData] = useState({
    blogTitle: "",
    blogContent: "",
    videoStyle: "",
    targetPlatform: "",
    duration: "",
    audience: "",
    callToAction: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<VideoResult | null>(null)
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

    if (!formData.blogTitle || !formData.blogContent) {
      alert("Please enter blog title and content")
      return
    }

    setIsGenerating(true)

    try {
      const data = await makeAuthenticatedRequest("/api/ai-tools/blog-to-video/generate", {
        method: "POST",
        body: JSON.stringify({
          input: {
            blogTitle: formData.blogTitle,
            blogContent: formData.blogContent,
            videoStyle: formData.videoStyle,
            targetPlatform: formData.targetPlatform,
            duration: formData.duration,
            audience: formData.audience,
            callToAction: formData.callToAction,
          },
        }),
      })
      
      console.log('Backend response:', data)
      setResult(data.output)
      
      // Trigger dashboard refresh to show new activity
      localStorage.setItem('lastProfileUpdate', Date.now().toString())
      
    } catch (error) {
      console.error('Error generating video script:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate video script. Please try again.'
      
      // No fallback data - show empty state
      setResult(null)
      setError(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateComprehensiveVideoData = (formData: any) => {
    const { blogTitle, blogContent, videoStyle, targetPlatform, duration, audience, callToAction } = formData
    
    const mockResult: VideoResult = {
      scripts: [
        {
          section: "Introduction (0-30s)",
          duration: "30 seconds",
          script: `🎬 OPENING HOOK
"${blogTitle} - but what if I told you there's a better way?"

[Eye-catching visual: Text overlay with dramatic music]

🎯 PROBLEM SETUP (30s-1:30s)
"Most people think [common misconception about the topic]"
"But here's what they're missing..."

[Show relatable problem/scenario]`,
          visualCues: ["Text overlay with blog title", "Dramatic music", "Problem visualization"],
          audioNotes: ["Upbeat background music", "Clear voiceover", "Sound effects for transitions"]
        },
        {
          section: "Main Content (1:30-4:30s)",
          duration: "3 minutes",
          script: `📝 MAIN CONTENT BREAKDOWN

🎬 SCENE 1: Key Point 1 (1:30-2:30s)
"${blogContent.split('.')[0] || 'First key insight'}"

[Visual demonstration or explanation]

🎬 SCENE 2: Key Point 2 (2:30-3:30s)
"${blogContent.split('.')[1] || 'Second important concept'}"

[Show practical example or case study]

🎬 SCENE 3: Key Point 3 (3:30-4:30s)
"${blogContent.split('.')[2] || 'Final actionable tip'}"

[Step-by-step demonstration]`,
          visualCues: ["Screen recordings", "Graphics and charts", "Real examples"],
          audioNotes: ["Background music continues", "Clear narration", "Transition sounds"]
        },
        {
          section: "Conclusion (4:30-5:00s)",
          duration: "30 seconds",
          script: `🎯 WRAP-UP & CTA

"Now you know the complete picture about ${blogTitle}"

[Show summary of key points]

💡 CALL TO ACTION
"${callToAction || 'Subscribe for more tips like this!'}"

[Display subscribe button or next video preview]`,
          visualCues: ["Summary graphics", "CTA button", "Channel branding"],
          audioNotes: ["Music fades", "Clear CTA voiceover", "End with brand sound"]
        }
      ],
      storyboard: [
        {
          scene: 1,
          timestamp: "0:00-0:30",
          visual: "Hook with blog title overlay",
          text: `${blogTitle} - but what if I told you there's a better way?`,
          transition: "Fade in from black"
        },
        {
          scene: 2,
          timestamp: "0:30-1:30",
          visual: "Problem setup with relatable scenario",
          text: "Most people think [common misconception]",
          transition: "Slide transition"
        },
        {
          scene: 3,
          timestamp: "1:30-2:30",
          visual: "Key point 1 demonstration",
          text: `${blogContent.split('.')[0] || 'First key insight'}`,
          transition: "Zoom transition"
        },
        {
          scene: 4,
          timestamp: "2:30-3:30",
          visual: "Key point 2 with examples",
          text: `${blogContent.split('.')[1] || 'Second important concept'}`,
          transition: "Slide transition"
        },
        {
          scene: 5,
          timestamp: "3:30-4:30",
          visual: "Key point 3 step-by-step",
          text: `${blogContent.split('.')[2] || 'Final actionable tip'}`,
          transition: "Zoom transition"
        },
        {
          scene: 6,
          timestamp: "4:30-5:00",
          visual: "Conclusion with CTA",
          text: `${callToAction || 'Subscribe for more tips!'}`,
          transition: "Fade to brand"
        }
      ],
      production: {
        equipment: ["Camera or screen recording software", "Microphone for voiceover", "Video editing software", "Graphics creation tools"],
        locations: ["Home office setup", "Clean background", "Good lighting"],
        props: ["Computer for screen recording", "Notebook for notes", "Props related to topic"],
        timeline: "2-3 hours for recording and editing"
      },
      optimization: {
        title: `${blogTitle} - Complete Guide (2024)`,
        description: `Learn everything about ${blogTitle} in this comprehensive guide. ${blogContent.substring(0, 100)}...`,
        tags: [`#${blogTitle.replace(/\s+/g, '')}`, "#guide", "#tutorial", "#tips", "#howto"],
        thumbnail: "Eye-catching thumbnail with blog title and key visual",
        chapters: [
          { time: "0:00", title: "Introduction" },
          { time: "0:30", title: "Problem Setup" },
          { time: "1:30", title: "Key Point 1" },
          { time: "2:30", title: "Key Point 2" },
          { time: "3:30", title: "Key Point 3" },
          { time: "4:30", title: "Conclusion & CTA" }
        ]
      },
      analytics: {
        estimatedLength: "5 min",
        targetAudience: audience || "General audience interested in the topic",
        engagementPrediction: "High engagement",
        platformRecommendations: ["YouTube", "LinkedIn", "Instagram Reels", "TikTok"]
      },
      platformStrategy: [
        `YouTube: Full ${duration || '5 minute'} video`,
        `LinkedIn: Professional version`,
        `Instagram: Highlights & visuals`,
        `TikTok: Short viral clips`
      ],
      thumbnailConcept: `${blogTitle} with bold text and colors`
    }
    
    return mockResult
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied((prev) => ({ ...prev, [id]: true }))
    setTimeout(() => setCopied((prev) => ({ ...prev, [id]: false })), 2000)
  }

  const handleDownloadPDF = () => {
    if (!result) return;
    
    const doc = new jsPDF();
    let yPosition = 20;
    
    // Title
    doc.setFontSize(20);
    doc.text("Blog to Video Production Guide", 10, yPosition);
    yPosition += 15;
    
    // Video Overview
    doc.setFontSize(16);
    doc.text("Video Overview", 10, yPosition);
    yPosition += 10;
    doc.setFontSize(12);
    doc.text(`Duration: ${result.analytics?.estimatedLength || '5-7 minutes'}`, 10, yPosition);
    yPosition += 7;
    doc.text(`Target Audience: ${result.analytics?.targetAudience || 'General audience'}`, 10, yPosition);
    yPosition += 7;
    doc.text(`Engagement Prediction: ${result.analytics?.engagementPrediction || 'High'}`, 10, yPosition);
    yPosition += 15;
    
    // Video Scripts
    doc.setFontSize(16);
    doc.text("Video Scripts", 10, yPosition);
    yPosition += 10;
    doc.setFontSize(12);
    
    result.scripts?.forEach((section, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.text(`${section.section} (${section.duration})`, 10, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      const scriptLines = doc.splitTextToSize(section.script, 180);
      scriptLines.forEach(line => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 10, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
      
      // Visual Cues
      if (section.visualCues?.length > 0) {
        doc.setFontSize(11);
        doc.text("Visual Cues:", 10, yPosition);
        yPosition += 5;
        doc.setFontSize(10);
        section.visualCues.forEach(cue => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(`• ${cue}`, 15, yPosition);
          yPosition += 5;
        });
        yPosition += 5;
      }
      
      // Audio Notes
      if (section.audioNotes?.length > 0) {
        doc.setFontSize(11);
        doc.text("Audio Notes:", 10, yPosition);
        yPosition += 5;
        doc.setFontSize(10);
        section.audioNotes.forEach(note => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(`• ${note}`, 15, yPosition);
          yPosition += 5;
        });
        yPosition += 10;
      }
    });
    
    // Storyboard
    if (result.storyboard?.length > 0) {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(16);
      doc.text("Visual Storyboard", 10, yPosition);
      yPosition += 10;
      doc.setFontSize(12);
      
      result.storyboard.forEach((scene, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.text(`Scene ${scene.scene} (${scene.timestamp})`, 10, yPosition);
        yPosition += 5;
        doc.setFontSize(10);
        doc.text(`Visual: ${scene.visual}`, 15, yPosition);
        yPosition += 5;
        doc.text(`Text: ${scene.text}`, 15, yPosition);
        yPosition += 5;
        doc.text(`Transition: ${scene.transition}`, 15, yPosition);
        yPosition += 8;
      });
    }
    
    // Production Requirements
    if (result.production) {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(16);
      doc.text("Production Requirements", 10, yPosition);
      yPosition += 10;
      doc.setFontSize(12);
      
      if (result.production.equipment?.length > 0) {
        doc.text("Equipment Needed:", 10, yPosition);
        yPosition += 5;
        doc.setFontSize(10);
        result.production.equipment.forEach(item => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(`• ${item}`, 15, yPosition);
          yPosition += 5;
        });
        yPosition += 5;
      }
      
      if (result.production.locations?.length > 0) {
        doc.setFontSize(12);
        doc.text("Locations:", 10, yPosition);
        yPosition += 5;
        doc.setFontSize(10);
        result.production.locations.forEach(location => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(`• ${location}`, 15, yPosition);
          yPosition += 5;
        });
        yPosition += 5;
      }
      
      if (result.production.timeline) {
        doc.setFontSize(12);
        doc.text(`Timeline: ${result.production.timeline}`, 10, yPosition);
        yPosition += 10;
      }
    }
    
    // Video Optimization
    if (result.optimization) {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(16);
      doc.text("Video Optimization", 10, yPosition);
      yPosition += 10;
      doc.setFontSize(12);
      
      if (result.optimization.title) {
        doc.text(`Title: ${result.optimization.title}`, 10, yPosition);
        yPosition += 7;
      }
      
      if (result.optimization.description) {
        doc.text("Description:", 10, yPosition);
        yPosition += 5;
        doc.setFontSize(10);
        const descLines = doc.splitTextToSize(result.optimization.description, 180);
        descLines.forEach(line => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, 10, yPosition);
          yPosition += 5;
        });
        yPosition += 5;
      }
      
      if (result.optimization.tags?.length > 0) {
        doc.setFontSize(12);
        doc.text("Tags:", 10, yPosition);
        yPosition += 5;
        doc.setFontSize(10);
        doc.text(result.optimization.tags.join(', '), 10, yPosition);
        yPosition += 10;
      }
    }
    
    // Platform Strategy
    if (result.platformStrategy?.length > 0) {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(16);
      doc.text("Platform Strategy", 10, yPosition);
      yPosition += 10;
      doc.setFontSize(12);
      
      result.platformStrategy.forEach(platform => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(`• ${platform}`, 10, yPosition);
        yPosition += 7;
      });
    }
    
    // Thumbnail Concept
    if (result.thumbnailConcept) {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(16);
      doc.text("Thumbnail Concept", 10, yPosition);
      yPosition += 10;
      doc.setFontSize(12);
      doc.text(result.thumbnailConcept, 10, yPosition);
    }
    
    // Footer
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, 280);
    doc.text("Generated by: AI Marketing Agents", 10, 285);
    
    doc.save(`${formData.blogTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Video_Production_Guide.pdf`);
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
              <div className="w-10 h-10 bg-gradient-to-r from-red-400 to-pink-600 rounded-xl flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Blog to Video Script</h1>
              {hasAccess ? (
                <Badge className="bg-green-100 text-green-800">Available</Badge>
              ) : (
                <Badge className="bg-orange-100 text-orange-800">Pro Required</Badge>
              )}
            </div>
            <p className="text-gray-600">Transform your blog posts into engaging video scripts with storyboards</p>
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
                <CardTitle>Video Setup</CardTitle>
                <CardDescription>Configure your blog-to-video conversion</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="blogTitle">Blog Title *</Label>
                  <Input
                    id="blogTitle"
                    placeholder="Enter your blog post title"
                    value={formData.blogTitle}
                    onChange={(e) => handleInputChange("blogTitle", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="blogContent">Blog Content *</Label>
                  <Textarea
                    id="blogContent"
                    placeholder="Paste your blog post content here..."
                    value={formData.blogContent}
                    onChange={(e) => handleInputChange("blogContent", e.target.value)}
                    disabled={!hasAccess}
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="videoStyle">Video Style</Label>
                  <select
                    id="videoStyle"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={formData.videoStyle}
                    onChange={(e) => handleInputChange("videoStyle", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select video style</option>
                    <option value="talking-head">Talking Head</option>
                    <option value="screen-recording">Screen Recording</option>
                    <option value="animated">Animated Explainer</option>
                    <option value="mixed">Mixed Format</option>
                    <option value="presentation">Presentation Style</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetPlatform">Target Platform</Label>
                  <select
                    id="targetPlatform"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={formData.targetPlatform}
                    onChange={(e) => handleInputChange("targetPlatform", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select platform</option>
                    <option value="youtube">YouTube</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="facebook">Facebook</option>
                    <option value="twitter">Twitter</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Target Duration</Label>
                  <select
                    id="duration"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={formData.duration}
                    onChange={(e) => handleInputChange("duration", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select duration</option>
                    <option value="1-2 minutes">1-2 minutes (Short)</option>
                    <option value="3-5 minutes">3-5 minutes (Medium)</option>
                    <option value="5-10 minutes">5-10 minutes (Long)</option>
                    <option value="10+ minutes">10+ minutes (Deep Dive)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Input
                    id="audience"
                    placeholder="Beginners, professionals, students, etc."
                    value={formData.audience}
                    onChange={(e) => handleInputChange("audience", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="callToAction">Call to Action</Label>
                  <Textarea
                    id="callToAction"
                    placeholder="What do you want viewers to do after watching?"
                    value={formData.callToAction}
                    onChange={(e) => handleInputChange("callToAction", e.target.value)}
                    disabled={!hasAccess}
                    rows={3}
                  />
                </div>

                <div className="space-y-3 pt-4">
                  <Button
                    onClick={handleGenerate}
                    disabled={!hasAccess || isGenerating || !formData.blogTitle || !formData.blogContent}
                    className="w-full bg-gradient-to-r from-red-400 to-pink-600 hover:opacity-90 text-white font-semibold py-3"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Video Script...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Generate Video Script
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
                  <Video className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Create</h3>
                  <p className="text-gray-600">
                    {hasAccess
                      ? "Enter your blog content and generate a complete video script with storyboard"
                      : "Upgrade to Pro plan to access the blog-to-video tool"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Video Analytics */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Eye className="w-5 h-5 text-blue-500" />
                      Video Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl h-32 flex flex-col justify-center items-center border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-lg font-bold text-blue-700 mb-1 truncate w-full px-1 max-w-[90px]">{result.analytics?.estimatedLength || '5-7 min'}</div>
                        <div className="text-xs text-blue-600 font-medium">Duration</div>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl h-32 flex flex-col justify-center items-center border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-xs font-bold text-green-700 mb-1 leading-tight px-1 max-w-[90px] break-words">
                          {result.analytics?.engagementPrediction || 'High'}
                        </div>
                        <div className="text-xs text-green-600 font-medium">Engagement</div>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl h-32 flex flex-col justify-center items-center border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-lg font-bold text-purple-700 mb-1">{result.scripts?.length || 0}</div>
                        <div className="text-xs text-purple-600 font-medium">Sections</div>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl h-32 flex flex-col justify-center items-center border border-amber-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-lg font-bold text-amber-700 mb-1">{result.storyboard?.length || 0}</div>
                        <div className="text-xs text-amber-600 font-medium">Scenes</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Error Display */}
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Video Script */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mic className="w-5 h-5 text-red-500" />
                      Complete Video Script
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                                          {result.scripts?.map((section, index) => (
                      <div key={index} className="border rounded-lg p-6 bg-white">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                              {section.section}
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {section.duration}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(section.script, `script-${index}`)}
                          >
                            {copied[`script-${index}`] ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Script:</h4>
                            <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                                {section.script}
                              </pre>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Visual Cues:</h4>
                              <ul className="space-y-1">
                                {section.visualCues.map((cue, cueIndex) => (
                                  <li key={cueIndex} className="text-sm text-gray-600 flex items-start gap-2">
                                    <Camera className="w-4 h-4 text-blue-500 mt-0.5" />
                                    {cue}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Audio Notes:</h4>
                              <ul className="space-y-1">
                                {section.audioNotes.map((note, noteIndex) => (
                                  <li key={noteIndex} className="text-sm text-gray-600 flex items-start gap-2">
                                    <Mic className="w-4 h-4 text-green-500 mt-0.5" />
                                    {note}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Storyboard */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="w-5 h-5 text-purple-500" />
                      Visual Storyboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                                              {result.storyboard?.map((scene, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 border rounded-lg bg-white">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                              <span className="text-purple-600 font-bold">{scene.scene}</span>
                            </div>
                          </div>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Timestamp</div>
                              <div className="text-sm font-medium">{scene.timestamp}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Visual</div>
                              <div className="text-sm">{scene.visual}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Text/Graphics</div>
                              <div className="text-sm">{scene.text}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Transition</div>
                              <div className="text-sm">{scene.transition}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Production Guide */}
                <Card>
                  <CardHeader>
                    <CardTitle>Production Requirements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Equipment Needed:</h4>
                        <ul className="space-y-1">
                                                      {result.production?.equipment?.map((item, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Locations:</h4>
                        <ul className="space-y-1">
                                                      {result.production?.locations?.map((location, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-blue-500" />
                              {location}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Props & Materials:</h4>
                        <ul className="space-y-1">
                                                      {result.production?.props?.map((prop, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-purple-500" />
                              {prop}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Timeline:</h4>
                        <div className="bg-yellow-50 p-3 rounded-lg">
                                                      <p className="text-yellow-800 font-medium">{result.production?.timeline || '2-3 days'}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* SEO Optimization */}
                <Card>
                  <CardHeader>
                    <CardTitle>Video Optimization</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Optimized Title:</h4>
                      <div className="bg-blue-50 p-3 rounded-lg">
                                                  <p className="font-medium">{result.optimization?.title || 'Video Title'}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Description:</h4>
                      <div className="bg-gray-50 p-4 rounded-lg max-h-48 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                                                      {result.optimization?.description || 'Video description'}
                        </pre>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Tags:</h4>
                        <div className="flex flex-wrap gap-2">
                                                      {result.optimization?.tags?.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Chapters:</h4>
                        <div className="space-y-1">
                                                      {result.optimization?.chapters?.map((chapter, index) => (
                            <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {chapter.time}
                              </Badge>
                              {chapter.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Thumbnail Concept:</h4>
                      <div className="bg-green-50 p-3 rounded-lg">
                                                  <p className="text-green-800 text-sm">{result.optimization?.thumbnail || 'Thumbnail concept'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Platform Strategy */}
                <Card>
                  <CardHeader>
                    <CardTitle>Platform Strategy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {result.platformStrategy?.map((strategy, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm leading-relaxed">{strategy}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(JSON.stringify(result, null, 2), "all-video")}
                    className="flex-1"
                  >
                    {copied["all-video"] ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    {copied["all-video"] ? "Copied!" : "Copy Full Script"}
                  </Button>
                  <Button variant="outline" onClick={handleDownloadPDF}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Production Guide
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
