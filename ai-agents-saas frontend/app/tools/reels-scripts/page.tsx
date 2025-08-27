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
  FileText,
  Share2,
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
  // New backend structure
  scriptVariations?: {
    hook: string
    mainContent: string
    callToAction: string
    visualCues: string[]
    audioNotes: string[]
  }[]
  platformSpecific?: {
    instagramReels?: {
      script: string
      hashtags: string[]
      trendingSounds: string[]
      engagementTips: string[]
    }
    tiktok?: {
      script: string
      hashtags: string[]
      trendingSounds: string[]
      engagementTips: string[]
    }
    youtubeShorts?: {
      script: string
      hashtags: string[]
      engagementTips: string[]
    }
  }
  visualElements?: {
    transitions: string[]
    effects: string[]
    textOverlays: string[]
  }
  audioGuidance?: {
    backgroundMusic: string
    voiceoverStyle: string
    soundEffects: string[]
  }
  optimization?: {
    titleSuggestions: string[]
    descriptionTemplates: string[]
    thumbnailIdeas: string[]
  }
  exportOptions?: {
    pdfReady: boolean
    copyableText: string
    descriptCompatible: string
    canvaTemplate: string
  }
  
  // Old frontend structure (for backward compatibility)
  scripts?: ReelScript[]
  hooks?: {
    category: string
    examples: string[]
  }[]
  trends?: {
    trending: string[]
    sounds: string[]
    effects: string[]
  }
  optimization?: {
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

  const generatePDFContent = (result: ReelsResult, formData: any) => {
    // Handle both old and new data structures
    const hasNewStructure = result?.scriptVariations && result?.platformSpecific;
    const hasOldStructure = result?.scripts && result?.trends;
    
    let pdfContent = `
REELS/SHORTS SCRIPTWRITER AGENT
Generated on: ${new Date().toLocaleDateString()}
Topic: ${formData.topic}
Target Audience: ${formData.targetAudience}
Duration: ${formData.duration}
Style: ${formData.tone}

`;

    if (hasNewStructure) {
      // New backend structure
      pdfContent += `SCRIPT VARIATIONS
================
${result.scriptVariations?.map((script, index) => `
SCRIPT VARIATION ${index + 1}
===============================================

HOOK: ${script.hook || 'N/A'}

MAIN CONTENT: ${script.mainContent || 'N/A'}

CALL TO ACTION: ${script.callToAction || 'N/A'}

VISUAL CUES: ${script.visualCues?.join(', ') || 'N/A'}
AUDIO NOTES: ${script.audioNotes?.join(', ') || 'N/A'}

`).join('\n') || 'No script variations available'}

PLATFORM SPECIFIC CONTENT
========================
${result.platformSpecific ? Object.entries(result.platformSpecific).map(([platform, data]: [string, any]) => `
${platform.toUpperCase()}:
- Script: ${data.script || 'N/A'}
- Hashtags: ${data.hashtags?.join(', ') || 'N/A'}
- Trending Sounds: ${data.trendingSounds?.join(', ') || 'N/A'}
- Engagement Tips: ${data.engagementTips?.join(', ') || 'N/A'}
`).join('\n') : 'No platform-specific content available'}

VISUAL ELEMENTS
==============
Transitions: ${result.visualElements?.transitions?.join(', ') || 'N/A'}
Effects: ${result.visualElements?.effects?.join(', ') || 'N/A'}
Text Overlays: ${result.visualElements?.textOverlays?.join(', ') || 'N/A'}

AUDIO GUIDANCE
==============
Background Music: ${result.audioGuidance?.backgroundMusic || 'N/A'}
Voiceover Style: ${result.audioGuidance?.voiceoverStyle || 'N/A'}
Sound Effects: ${result.soundEffects?.join(', ') || 'N/A'}

OPTIMIZATION
===========
Title Suggestions: ${result.optimization?.titleSuggestions?.join(', ') || 'N/A'}
Description Templates: ${result.optimization?.descriptionTemplates?.join(', ') || 'N/A'}
Thumbnail Ideas: ${result.optimization?.thumbnailIdeas?.join(', ') || 'N/A'}

EXPORT OPTIONS
==============
${result.exportOptions ? `
Copyable Text: ${result.exportOptions.copyableText || 'N/A'}

Descript Compatible: ${result.exportOptions.descriptCompatible || 'N/A'}

Canva Template: ${result.exportOptions.canvaTemplate || 'N/A'}
` : 'No export options available'}

`;

    } else if (hasOldStructure) {
      // Old frontend structure
      pdfContent += `${result.scripts?.map((script, index) => `
SCRIPT VARIATION ${index + 1} - ${script.platform}
===============================================

HOOK: ${script.hook}

CONTENT: ${script.content}

CALL TO ACTION: ${script.cta}

HASHTAGS: ${script.hashtags?.join(', ')}
DURATION: ${script.duration}
EXPECTED ENGAGEMENT: ${script.engagement}

`).join('\n') || 'No scripts available'}

TRENDING ELEMENTS
================
Trending Topics: ${result.trends?.trending?.join(', ') || 'N/A'}
Trending Sounds: ${result.trends?.sounds?.join(', ') || 'N/A'}
Trending Effects: ${result.trends?.effects?.join(', ') || 'N/A'}

OPTIMIZATION TIPS
================
Best Posting Times: ${result.optimization?.bestTimes?.join(', ') || 'N/A'}
Caption Tips: ${result.optimization?.captionTips?.join(', ') || 'N/A'}
Engagement Tactics: ${result.optimization?.engagementTactics?.join(', ') || 'N/A'}

`;

    } else {
      // Fallback for unknown structure
      pdfContent += `No script data available in the expected format.

Available data structure:
${JSON.stringify(result, null, 2)}

`;
    }

    pdfContent += `Generated by AI Marketing Agents - Reels/Shorts Scriptwriter`;
    
    return pdfContent;
  };

  const exportToPDF = () => {
    if (!result) return;
    
    const pdfContent = generatePDFContent(result, formData);
    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reels-script-${formData.topic}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
                  {/* New Backend Structure */}
                  {result?.scriptVariations?.map((script, index) => (
                    <Card key={`new-${index}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-purple-100 text-purple-800">Script Variation {index + 1}</Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formData.duration || '30s'}
                            </Badge>
                            <Badge className="bg-green-100 text-green-800">High Engagement</Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(script.mainContent, `script-new-${index}`)}
                          >
                            {copied[`script-new-${index}`] ? (
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
                            <h4 className="font-medium text-gray-900 mb-2">Main Content:</h4>
                            <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                                {script?.mainContent || 'No content available'}
                              </pre>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Call to Action:</h4>
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-blue-800 text-sm">{script?.callToAction || 'No CTA available'}</p>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Visual Cues:</h4>
                              <div className="flex flex-wrap gap-1">
                                {script?.visualCues?.map((cue, hIndex) => (
                                  <Badge key={hIndex} variant="secondary" className="text-xs">
                                    {cue}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Audio Notes:</h4>
                            <div className="flex flex-wrap gap-1">
                              {script?.audioNotes?.map((note, nIndex) => (
                                <Badge key={nIndex} variant="outline" className="text-xs">
                                  {note}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Old Frontend Structure (for backward compatibility) */}
                  {result?.scripts?.map((script, index) => (
                    <Card key={`old-${index}`}>
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
                            onClick={() => copyToClipboard(script.content, `script-old-${index}`)}
                          >
                            {copied[`script-old-${index}`] ? (
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

                  {/* Show message if no scripts available */}
                  {!result?.scriptVariations && !result?.scripts && (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <p className="text-gray-500">No scripts generated yet. Please generate scripts first.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Hook Ideas & Platform Specific Content */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-orange-500" />
                      Hook Ideas & Platform Content
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* New Backend Structure - Platform Specific Content */}
                      {result?.platformSpecific && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Platform-Specific Scripts:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Object.entries(result.platformSpecific).map(([platform, data]: [string, any]) => (
                              <div key={platform} className="border rounded-lg p-3">
                                <h5 className="font-medium text-gray-800 mb-2 capitalize">{platform.replace(/([A-Z])/g, ' $1').trim()}</h5>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <strong>Script:</strong>
                                    <p className="text-gray-600 mt-1">{data.script || 'No script available'}</p>
                                  </div>
                                  <div>
                                    <strong>Hashtags:</strong>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {data.hashtags?.map((tag: string, index: number) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                          {tag}
                                        </Badge>
                                      )) || <span className="text-gray-400">No hashtags</span>}
                                    </div>
                                  </div>
                                  {data.trendingSounds && (
                                    <div>
                                      <strong>Trending Sounds:</strong>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {data.trendingSounds.map((sound: string, index: number) => (
                                          <Badge key={index} variant="outline" className="text-xs">
                                            {sound}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  <div>
                                    <strong>Engagement Tips:</strong>
                                    <ul className="text-gray-600 mt-1">
                                      {data.engagementTips?.map((tip: string, index: number) => (
                                        <li key={index} className="text-xs">• {tip}</li>
                                      )) || <li className="text-xs text-gray-400">No tips available</li>}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Old Frontend Structure (for backward compatibility) */}
                      {result?.hooks && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Hook Ideas Library:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {result.hooks.map((hookCategory, index) => (
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
                        </div>
                      )}

                      {/* Show message if no data available */}
                      {!result?.platformSpecific && !result?.hooks && (
                        <div className="text-center text-gray-500">
                          <p>No hook ideas or platform content available yet.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Trending Elements & Visual Elements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-pink-500" />
                      Current Trends & Visual Elements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* New Backend Structure */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Visual Elements:</h4>
                        <div className="space-y-2">
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Transitions:</h5>
                            <ul className="space-y-1">
                              {result?.visualElements?.transitions?.map((transition, index) => (
                                <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                                  <Video className="w-4 h-4 text-purple-500" />
                                  {transition}
                                </li>
                              )) || <li className="text-sm text-gray-400">No transitions available</li>}
                            </ul>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Effects:</h5>
                            <ul className="space-y-1">
                              {result?.visualElements?.effects?.map((effect, index) => (
                                <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                                  <Video className="w-4 h-4 text-purple-500" />
                                  {effect}
                                </li>
                              )) || <li className="text-sm text-gray-400">No effects available</li>}
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Audio Guidance:</h4>
                        <div className="space-y-2">
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Background Music:</h5>
                            <p className="text-sm text-gray-600">{result?.audioGuidance?.backgroundMusic || 'No music guidance available'}</p>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Voiceover Style:</h5>
                            <p className="text-sm text-gray-600">{result?.audioGuidance?.voiceoverStyle || 'No voiceover guidance available'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Old Frontend Structure (for backward compatibility) */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Trending Topics:</h4>
                        <ul className="space-y-1">
                          {result?.trends?.trending?.map((trend, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-pink-500" />
                              {trend}
                            </li>
                          )) || <li className="text-sm text-gray-400">No trending topics available</li>}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Export & Integration Options */}
                {result?.exportOptions && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-blue-500" />
                        Export & Platform Integration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">📱 Descript Integration:</h4>
                          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                            <pre className="whitespace-pre-wrap">{result.exportOptions.descriptCompatible}</pre>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">🎨 Canva Template:</h4>
                          <div className="text-sm text-gray-600 bg-green-50 p-3 rounded">
                            <pre className="whitespace-pre-wrap">{result.exportOptions.canvaTemplate}</pre>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">📄 Copyable Text:</h4>
                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          <pre className="whitespace-pre-wrap">{result.exportOptions.copyableText}</pre>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Optimization Tips */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      Optimization & Best Practices
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* New Backend Structure */}
                    {result?.optimization?.titleSuggestions && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Title Suggestions:</h4>
                        <div className="space-y-1">
                          {result.optimization.titleSuggestions.map((title, index) => (
                            <div key={index} className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                              {title}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* New Backend Structure */}
                      {result?.optimization?.descriptionTemplates && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Description Templates:</h4>
                          <ul className="space-y-1">
                            {result.optimization.descriptionTemplates.map((template, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                                {template}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* New Backend Structure */}
                      {result?.optimization?.thumbnailIdeas && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Thumbnail Ideas:</h4>
                          <ul className="space-y-1">
                            {result.optimization.thumbnailIdeas.map((idea, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                                {idea}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Old Frontend Structure (for backward compatibility) */}
                      {result?.optimization?.bestTimes && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Best Posting Times:</h4>
                          <ul className="space-y-1">
                            {result.optimization.bestTimes.map((time, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                                {time}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Old Frontend Structure (for backward compatibility) */}
                      {result?.optimization?.captionTips && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Caption Tips:</h4>
                          <ul className="space-y-1">
                            {result.optimization.captionTips.map((tip, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Show message if no optimization data available */}
                    {!result?.optimization?.titleSuggestions && !result?.optimization?.bestTimes && (
                      <div className="text-center text-gray-500">
                        <p>No optimization data available yet.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    onClick={exportToPDF}
                    disabled={!result}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Export as PDF
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

