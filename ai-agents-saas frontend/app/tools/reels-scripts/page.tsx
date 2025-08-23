"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Video,
  Lock,
  Crown,
  Clock,
  Eye,
  TrendingUp,
  Hash,
} from "lucide-react"
import { useUserStore } from "@/lib/user-store"

interface ReelScript {
  platform: string
  hook: string
  content: string
  cta: string
  hashtags: string[]
  duration: string
  engagement: string
}

interface ReelsResult {
  scripts: ReelScript[]
  hooks: {
    category: string
    examples: string[]
  }[]
  trends: {
    trending: string[]
    sounds: string[]
    effects: string[]
  }
  optimization: {
    bestTimes: string[]
    captionTips: string[]
    engagementTactics: string[]
  }
}

export default function ReelsScriptsPage() {
  const { user } = useUserStore()
  const [formData, setFormData] = useState({
    topic: "",
    niche: "",
    targetAudience: "",
    contentType: "",
    duration: "",
    goal: "",
    tone: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<ReelsResult | null>(null)
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({})

  const hasAccess = user.plan !== "Free Trial"

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleGenerate = async () => {
    if (!hasAccess) {
      alert("Please upgrade to Pro or Agency plan to use this tool.")
      return
    }

    if (!formData.topic || !formData.targetAudience) {
      alert("Please enter topic and target audience")
      return
    }

    setIsGenerating(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('http://localhost:5000/api/ai-tools/reels-scripts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          input: {
            topic: formData.topic,
            niche: formData.niche,
            targetAudience: formData.targetAudience,
            contentType: formData.contentType,
            duration: formData.duration,
            goal: formData.goal,
            tone: formData.tone
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      // Use the AI-generated content from the backend
      if (data.output && typeof data.output === 'object') {
        console.log('Using AI-generated content from backend')
        setResult(data.output)
      } else {
        console.log('Backend response format issue, using enhanced fallback data')
        setResult(generateComprehensiveReelsData(formData))
      }
    } catch (error) {
      console.error('Error generating reels scripts:', error)
      
      // More detailed error handling
      let errorMessage = 'Unknown error occurred'
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to backend server. Make sure the backend is running on localhost:5000'
      } else if (error.message.includes('401')) {
        errorMessage = 'Authentication error. Please log in again.'
      } else if (error.message.includes('403')) {
        errorMessage = 'Access denied. Please upgrade your plan.'
      } else if (error.message.includes('500')) {
        errorMessage = 'Server error. Check if OpenAI API key is configured.'
      } else {
        errorMessage = error.message
      }
      
      alert(`Error generating scripts: ${errorMessage}`)
      
      // Generate comprehensive fallback data with all sections
      console.log('Using fallback data due to error:', errorMessage)
      setResult(generateComprehensiveReelsData(formData))
    } finally {
      setIsGenerating(false)
    }
  }

  const generateComprehensiveReelsData = (formData: any) => {
    const { topic, targetAudience, niche, contentType, duration, goal, tone } = formData
    
    // Generate comprehensive scripts
    const scripts = [
      {
        platform: "Instagram Reels",
        hook: `POV: You just discovered the ${topic} hack that changes everything 👀`,
        content: `🎬 SCENE 1 (0-3s): Hook
"Stop scrolling! This ${topic} tip will blow your mind"
[Show dramatic before/after or surprising statistic]

🎬 SCENE 2 (3-8s): Problem
"Most ${targetAudience} struggle with [common problem]"
[Show relatable struggle/pain point]

🎬 SCENE 3 (8-20s): Solution
"Here's the game-changer:"
• Step 1: [Quick action]
• Step 2: [Simple technique]  
• Step 3: [Final result]
[Show each step visually]

🎬 SCENE 4 (20-25s): Proof
"This worked for [example/testimonial]"
[Show results or social proof]

🎬 SCENE 5 (25-30s): CTA
"Save this for later and follow for more ${topic} tips!"`,
        cta: "Save this post and follow @youraccount for more tips!",
        hashtags: ["#" + topic.replace(/\s+/g, ""), "#tips", "#viral", "#fyp", "#trending"],
        duration: duration || "30 seconds",
        engagement: "High (12-18%)",
      },
      {
        platform: "TikTok",
        hook: `Things ${targetAudience} don't know about ${topic} 🤯`,
        content: `🎵 Trending Sound: [Current viral sound]

📱 VISUAL SEQUENCE:
0-2s: "Things you didn't know about ${topic}"
[Text overlay with eye-catching transition]

2-8s: Fact #1
"Most people think [common misconception]"
[Show wrong way vs right way]

8-15s: Fact #2  
"But actually [surprising truth]"
[Demonstrate with quick example]

15-22s: Fact #3
"The secret ${targetAudience} use is [insider tip]"
[Show advanced technique]

22-30s: Bonus Tip
"Pro tip: [extra value]"
[Quick demonstration]

30s: "Follow for more ${topic} secrets!"`,
        cta: "Which tip surprised you most? Comment below! 👇",
        hashtags: ["#" + topic.replace(/\s+/g, ""), "#LearnOnTikTok", "#DidYouKnow", "#fyp", "#viral"],
        duration: duration || "30 seconds",
        engagement: "Very High (15-25%)",
      },
      {
        platform: "YouTube Shorts",
        hook: `The ${topic} mistake 99% of ${targetAudience} make`,
        content: `🎥 YOUTUBE SHORTS SCRIPT:

📺 VISUAL BREAKDOWN:
0-3s: "The ${topic} mistake 99% of ${targetAudience} make"
[Eye-catching text overlay with dramatic music]

3-8s: "Here's what most people do wrong:"
[Show common mistake/ineffective approach]

8-15s: "The correct way:"
[Demonstrate proper technique with step-by-step visuals]

15-22s: "Why this works:"
[Show results/comparison with data or examples]

22-30s: "Try this today and let me know your results!"
[Encouraging CTA with subscribe prompt]`,
        cta: "Subscribe for more ${topic} tips! 🔔",
        hashtags: ["#" + topic.replace(/\s+/g, ""), "#shorts", "#tips", "#viral", "#youtube"],
        duration: duration || "30 seconds",
        engagement: "High (8-15%)",
      }
    ]

    // Generate comprehensive hooks library
    const hooks = [
      {
        category: "Question Hooks",
        examples: [
          `"What if I told you there's a ${topic} secret that could change everything?"`,
          `"Why do ${targetAudience} keep making this ${topic} mistake?"`,
          `"Have you ever wondered why some ${targetAudience} succeed while others fail?"`,
          `"What's the one ${topic} rule that 90% of people break?"`,
          `"How do top ${targetAudience} actually approach ${topic}?"`
        ]
      },
      {
        category: "POV Hooks",
        examples: [
          `"POV: You just discovered the ${topic} hack that changes everything"`,
          `"POV: You're a ${targetAudience} who finally figured out ${topic}"`,
          `"POV: You just learned the ${topic} secret from a pro"`,
          `"POV: You're about to see the ${topic} transformation"`,
          `"POV: You just found the ${topic} shortcut everyone needs"`
        ]
      },
      {
        category: "Number Hooks",
        examples: [
          `"3 ${topic} secrets that will blow your mind"`,
          `"5 ${topic} mistakes you're probably making"`,
          `"7 ${topic} tips that actually work"`,
          `"10 ${topic} hacks for ${targetAudience}"`,
          `"1 ${topic} rule that changed everything"`
        ]
      },
      {
        category: "Controversy Hooks",
        examples: [
          `"Stop doing ${topic} the wrong way"`,
          `"The ${topic} truth nobody wants to hear"`,
          `"Why your ${topic} approach is completely wrong"`,
          `"The ${topic} lie that's holding you back"`,
          `"What they don't tell you about ${topic}"`
        ]
      }
    ]

    // Generate comprehensive trends data
    const trends = {
      trending: [
        "Before/After transformations",
        "Day in the life content",
        "Myth busting videos",
        "Quick tips and hacks",
        "Behind the scenes",
        "Reaction videos",
        "Tutorial content",
        "Story time videos",
        "Challenge videos",
        "Educational content"
      ],
      sounds: [
        "Trending audio clips",
        "Popular music snippets",
        "Sound effects",
        "Voice-over narration",
        "Background music",
        "ASMR sounds",
        "Nature sounds",
        "Upbeat tracks",
        "Dramatic music",
        "Comedy sound effects"
      ],
      effects: [
        "Text overlays",
        "Transitions",
        "Filters and effects",
        "Green screen",
        "Split screen",
        "Zoom effects",
        "Color grading",
        "Motion graphics",
        "Particle effects",
        "3D elements"
      ]
    }

    // Generate comprehensive optimization data
    const optimization = {
      bestTimes: [
        "7-9 AM (Morning commute)",
        "12-2 PM (Lunch break)",
        "5-7 PM (After work)",
        "8-10 PM (Evening relaxation)",
        "Weekends: 10 AM - 2 PM",
        "Tuesday-Thursday: Peak engagement",
        "Friday: Highest share rates",
        "Sunday: Best for educational content"
      ],
      captionTips: [
        "Start with a hook question",
        "Use emojis strategically",
        "Include a clear call-to-action",
        "Keep first 3 lines engaging",
        "Use relevant hashtags (3-5)",
        "Ask questions to encourage comments",
        "Share personal stories",
        "Include statistics or facts",
        "Use trending hashtags",
        "End with engagement prompt"
      ],
      engagementTactics: [
        "Ask viewers to comment their thoughts",
        "Encourage saves and shares",
        "Create series content",
        "Respond to comments quickly",
        "Use polls and questions",
        "Collaborate with other creators",
        "Cross-promote on other platforms",
        "Create user-generated content",
        "Host live sessions",
        "Use trending challenges"
      ]
    }

    return {
      scripts,
      hooks,
      trends,
      optimization
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied((prev) => ({ ...prev, [id]: true }))
    setTimeout(() => setCopied((prev) => ({ ...prev, [id]: false })), 2000)
  }

  const exportScriptPackage = () => {
    if (!result) return

    // Create comprehensive script package data
    const scriptPackage = {
      campaign: {
        name: `Reels Script - ${formData.topic} for ${formData.targetAudience}`,
        topic: formData.topic,
        niche: formData.niche,
        targetAudience: formData.targetAudience,
        contentType: formData.contentType,
        duration: formData.duration,
        goal: formData.goal,
        tone: formData.tone,
        createdDate: new Date().toISOString(),
      },
      scripts: result?.scripts?.map(script => ({
        platform: script?.platform || '',
        hook: script?.hook || '',
        content: script?.content || '',
        cta: script?.cta || '',
        hashtags: script?.hashtags || [],
        duration: script?.duration || '',
        engagement: script?.engagement || '',
      })) || [],
      hooks: result?.hooks?.map(hook => ({
        category: hook?.category || '',
        examples: hook?.examples || [],
      })) || [],
      trends: {
        trending: result?.trends?.trending || [],
        sounds: result?.trends?.sounds || [],
        effects: result?.trends?.effects || [],
      },
      optimization: {
        bestTimes: result?.optimization?.bestTimes || [],
        captionTips: result?.optimization?.captionTips || [],
        engagementTactics: result?.optimization?.engagementTactics || [],
      }
    }

    // Create and download JSON file
    const dataStr = JSON.stringify(scriptPackage, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reels-script-package-${formData.topic}-${formData.targetAudience}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    // Also create a TXT version for easy reading
    const txtData = createTXTExport(scriptPackage)
    const txtBlob = new Blob([txtData], { type: 'text/plain' })
    const txtUrl = URL.createObjectURL(txtBlob)
    const txtLink = document.createElement('a')
    txtLink.href = txtUrl
    txtLink.download = `reels-script-package-${formData.topic}-${formData.targetAudience}.txt`
    document.body.appendChild(txtLink)
    txtLink.click()
    document.body.removeChild(txtLink)
    URL.revokeObjectURL(txtUrl)
  }

  const createTXTExport = (data: any) => {
    let txt = `REELS SCRIPT PACKAGE\n`
    txt += `========================\n\n`
    txt += `Campaign: ${data.campaign.name}\n`
    txt += `Topic: ${data.campaign.topic}\n`
    txt += `Niche: ${data.campaign.niche}\n`
    txt += `Target Audience: ${data.campaign.targetAudience}\n`
    txt += `Content Type: ${data.campaign.contentType}\n`
    txt += `Duration: ${data.campaign.duration}\n`
    txt += `Created: ${new Date(data.campaign.createdDate).toLocaleDateString()}\n\n`
    
    txt += `SCRIPTS\n`
    txt += `=======\n\n`
    
    data.scripts.forEach((script: any, index: number) => {
      txt += `${index + 1}. ${script.platform}\n`
      txt += `Duration: ${script.duration}\n`
      txt += `Engagement: ${script.engagement}\n\n`
      txt += `HOOK:\n${script.hook}\n\n`
      txt += `CONTENT:\n${script.content}\n\n`
      txt += `CALL TO ACTION:\n${script.cta}\n\n`
      txt += `HASHTAGS:\n${script.hashtags.join(' ')}\n\n`
      txt += `---\n\n`
    })
    
    txt += `OPTIMIZATION TIPS\n`
    txt += `=================\n\n`
    
    txt += `Best Posting Times:\n`
    data.optimization.bestTimes.forEach((time: string) => {
      txt += `• ${time}\n`
    })
    txt += `\n`
    
    txt += `Caption Tips:\n`
    data.optimization.captionTips.forEach((tip: string) => {
      txt += `• ${tip}\n`
    })
    txt += `\n`
    
    txt += `Engagement Tactics:\n`
    data.optimization.engagementTactics.forEach((tactic: string) => {
      txt += `• ${tactic}\n`
    })
    txt += `\n`
    
    txt += `TRENDING ELEMENTS\n`
    txt += `==================\n\n`
    
    txt += `Trending Hashtags:\n`
    data.trends.trending.forEach((trend: string) => {
      txt += `• ${trend}\n`
    })
    txt += `\n`
    
    txt += `Popular Sounds:\n`
    data.trends.sounds.forEach((sound: string) => {
      txt += `• ${sound}\n`
    })
    txt += `\n`
    
    txt += `Visual Effects:\n`
    data.trends.effects.forEach((effect: string) => {
      txt += `• ${effect}\n`
    })
    
    return txt
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
              <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-600 rounded-xl flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Reels/Shorts Script Writer</h1>
              {hasAccess ? (
                <Badge className="bg-green-100 text-green-800">Available</Badge>
              ) : (
                <Badge className="bg-orange-100 text-orange-800">Pro Required</Badge>
              )}
            </div>
            <p className="text-gray-600">Create viral short-form video scripts for Instagram, TikTok & YouTube</p>
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
                <CardTitle>Script Setup</CardTitle>
                <CardDescription>Configure your short-form video script</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic/Subject *</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., productivity tips, cooking hacks, fitness"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="niche">Niche/Industry</Label>
                  <select
                    id="niche"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={formData.niche}
                    onChange={(e) => handleInputChange("niche", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select niche</option>
                    <option value="business">Business/Entrepreneurship</option>
                    <option value="lifestyle">Lifestyle</option>
                    <option value="fitness">Health & Fitness</option>
                    <option value="education">Education/Learning</option>
                    <option value="technology">Technology</option>
                    <option value="food">Food & Cooking</option>
                    <option value="travel">Travel</option>
                    <option value="fashion">Fashion & Beauty</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Target Audience *</Label>
                  <Input
                    id="targetAudience"
                    placeholder="e.g., young professionals, students, parents"
                    value={formData.targetAudience}
                    onChange={(e) => handleInputChange("targetAudience", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contentType">Content Type</Label>
                  <select
                    id="contentType"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={formData.contentType}
                    onChange={(e) => handleInputChange("contentType", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select content type</option>
                    <option value="educational">Educational/Tutorial</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="behind-scenes">Behind the Scenes</option>
                    <option value="before-after">Before/After</option>
                    <option value="day-in-life">Day in the Life</option>
                    <option value="tips-hacks">Tips & Hacks</option>
                    <option value="storytelling">Storytelling</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Video Duration</Label>
                  <select
                    id="duration"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={formData.duration}
                    onChange={(e) => handleInputChange("duration", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select duration</option>
                    <option value="15s">15 seconds</option>
                    <option value="30s">30 seconds</option>
                    <option value="60s">60 seconds</option>
                    <option value="90s">90 seconds</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal">Content Goal</Label>
                  <select
                    id="goal"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={formData.goal}
                    onChange={(e) => handleInputChange("goal", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select goal</option>
                    <option value="viral">Go Viral</option>
                    <option value="education">Educate Audience</option>
                    <option value="engagement">Boost Engagement</option>
                    <option value="followers">Gain Followers</option>
                    <option value="brand-awareness">Brand Awareness</option>
                    <option value="sales">Drive Sales</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone">Content Tone</Label>
                  <select
                    id="tone"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={formData.tone}
                    onChange={(e) => handleInputChange("tone", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select tone</option>
                    <option value="energetic">Energetic</option>
                    <option value="casual">Casual</option>
                    <option value="professional">Professional</option>
                    <option value="funny">Funny/Humorous</option>
                    <option value="inspiring">Inspiring</option>
                    <option value="dramatic">Dramatic</option>
                  </select>
                </div>

                <div className="space-y-3 pt-4">
                  <Button
                    onClick={handleGenerate}
                    disabled={!hasAccess || isGenerating || !formData.topic || !formData.targetAudience}
                    className="w-full bg-gradient-to-r from-purple-400 to-pink-600 hover:opacity-90 text-white font-semibold py-3"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Scripts...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Generate Video Scripts
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
                      ? "Enter your video details and generate viral short-form video scripts"
                      : "Upgrade to Pro plan to access the reels script writer"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Generated Scripts */}
                <div className="space-y-4">
                  {result?.scripts?.map((script, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-purple-100 text-purple-800">{script?.platform || 'Unknown Platform'}</Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {script?.duration || 'N/A'}
                            </Badge>
                            <Badge className="bg-green-100 text-green-800">{script?.engagement || 'N/A'}</Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(script.content, `script-${index}`)}
                          >
                            {copied[`script-${index}`] ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Hook:</h4>
                            <div className="bg-yellow-50 p-3 rounded-lg">
                              <p className="font-medium text-yellow-900">{script?.hook || 'No hook available'}</p>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Full Script:</h4>
                            <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                                {script?.content || 'No script content available'}
                              </pre>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Call to Action:</h4>
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-blue-800 text-sm">{script?.cta || 'No CTA available'}</p>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Hashtags:</h4>
                              <div className="flex flex-wrap gap-1">
                                {script?.hashtags?.map((hashtag, hIndex) => (
                                  <Badge key={hIndex} variant="secondary" className="text-xs">
                                    {hashtag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Hook Ideas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-orange-500" />
                      Hook Ideas Library
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {result?.hooks?.map((hookCategory, index) => (
                        <div key={index}>
                          <h4 className="font-medium text-gray-900 mb-3">{hookCategory.category}</h4>
                          <div className="space-y-2">
                            {hookCategory.examples.map((hook, hIndex) => (
                              <div key={hIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm">{hook}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(hook, `hook-${index}-${hIndex}`)}
                                >
                                  {copied[`hook-${index}-${hIndex}`] ? (
                                    <CheckCircle className="w-3 h-3" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Trending Elements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-pink-500" />
                      Current Trends & Elements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Trending Content Types:</h4>
                        <ul className="space-y-1">
                          {result?.trends?.trending?.map((trend, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-pink-500" />
                              {trend}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Popular Sounds:</h4>
                        <ul className="space-y-1">
                          {result?.trends?.sounds?.map((sound, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                              <Hash className="w-4 h-4 text-blue-500" />
                              {sound}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Visual Effects:</h4>
                        <ul className="space-y-1">
                          {result?.trends?.effects?.map((effect, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                              <Video className="w-4 h-4 text-purple-500" />
                              {effect}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Optimization Tips */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      Optimization & Best Practices
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Best Posting Times:</h4>
                      <div className="space-y-1">
                        {result?.optimization?.bestTimes?.map((time, index) => (
                          <div key={index} className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                            {time}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Caption Tips:</h4>
                        <ul className="space-y-1">
                          {result?.optimization?.captionTips?.map((tip, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Engagement Tactics:</h4>
                        <ul className="space-y-1">
                          {result?.optimization?.engagementTactics?.map((tactic, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                              {tactic}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(JSON.stringify(result, null, 2), "all-scripts")}
                    className="flex-1"
                  >
                    {copied["all-scripts"] ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    {copied["all-scripts"] ? "Copied!" : "Copy All Scripts"}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 bg-transparent"
                    onClick={exportScriptPackage}
                    disabled={!result}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Script Package
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
