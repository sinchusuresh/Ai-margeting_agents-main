const express = require("express")
const User = require("../models/User")
const AIToolUsage = require("../models/AIToolUsage")
const auth = require("../middleware/auth")
const rateLimit = require("express-rate-limit")
const axios = require('axios');
const cheerio = require('cheerio');
const NotificationService = require("../services/notificationService");

// Import Local SEO services
const LocalSEOService = require("../services/localSEOService");
const CitationBuildingService = require("../services/citationBuildingService");
const LocalSEOAnalyticsService = require("../services/localSEOAnalyticsService");

// Import Competitor Analysis service
const CompetitorAnalysisService = require("../services/competitorAnalysisService");

require('dotenv').config();

const router = express.Router()

// Rate limiting for AI tool usage
const toolLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // limit each user to 3 requests per minute (reduced from 10)
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req) => {
    // Use user ID for rate limiting if authenticated, otherwise IP
    return req.user ? req.user.id : req.ip;
  }
})

// Global OpenAI API rate limiter to prevent hitting OpenAI's limits
const openaiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit to 10 OpenAI API calls per minute globally
  message: { message: "OpenAI API rate limit reached, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: () => 'openai-global' // Global key for all OpenAI calls
})

// AI Tools configuration
const AI_TOOLS = {

  "social-media": {
    name: "Social Media Content Generator",
    description: "Generate engaging social media posts",
    category: "Content",
    freeInTrial: true,
  },
  "blog-writing": {
    name: "Blog Writing & Optimization",
    description: "AI-powered long-form content creation",
    category: "Content",
    freeInTrial: false,
  },
  "email-marketing": {
    name: "Email Marketing Agent",
    description: "Create compelling email campaigns",
    category: "Email",
    freeInTrial: false,
  },
  "client-reporting": {
    name: "Client Reporting Agent",
    description: "Automated monthly reports with KPI analysis",
    category: "Analytics",
    freeInTrial: false,
  },
  "ad-copy": {
    name: "Ad Copy Generator",
    description: "High-converting ad creatives",
    category: "Advertising",
    freeInTrial: false,
  },
  "landing-page": {
    name: "Landing Page Optimization Analyzer",
    description: "Comprehensive landing page analysis and optimization recommendations",
    category: "Conversion",
    freeInTrial: false,
  },
  "competitor-analysis": {
    name: "Competitor Analysis Agent",
    description: "Deep competitor insights and SWOT analysis",
    category: "Research",
    freeInTrial: false,
  },
  "cold-outreach": {
    name: "Cold Outreach Personalization",
    description: "Personalized outreach messages",
    category: "Outreach",
    freeInTrial: false,
  },
  "reels-scripts": {
    name: "Reels/Shorts Scriptwriter",
    description: "Engaging short-form video scripts",
    category: "Video",
    freeInTrial: false,
  },
  "product-launch": {
    name: "Product Launch Agent",
    description: "Complete launch campaign planning",
    category: "Launch",
    freeInTrial: false,
  },
  "blog-to-video": {
    name: "Blog-to-Video Agent",
    description: "Convert blog content into video scripts",
    category: "Video",
    freeInTrial: false,
  },
  "local-seo": {
    name: "Local SEO Booster",
    description: "Optimize local search visibility",
    category: "Local SEO",
    freeInTrial: false,
  },
}

// Middleware to check tool access
const checkToolAccess = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId)
    const toolId = req.params.toolId || req.body.toolId

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const availableTools = user.getAvailableTools()

    if (!availableTools.includes(toolId)) {
      return res.status(403).json({
        message: "Tool not available in your current plan",
        availableTools,
        requiredPlan: AI_TOOLS[toolId]?.freeInTrial ? "free_trial" : "pro",
      })
    }

    // Check if trial expired for trial users
    if (user.subscription.status === "trial" && user.isTrialExpired()) {
      return res.status(403).json({
        message: "Free trial has expired. Please upgrade to continue using AI tools.",
        trialExpired: true,
      })
    }

    req.user.userData = user
    next()
  } catch (error) {
    console.error("Check tool access error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// @route   GET /api/ai-tools/health
// @desc    Health check for AI tools
// @access  Public
router.get("/health", async (req, res) => {
  try {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      tools: Object.keys(AI_TOOLS),
      openaiConfigured: !!process.env.OPENAI_API_KEY
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({ status: "unhealthy", error: error.message });
  }
});

// @route   GET /api/ai-tools/test-email
// @desc    Test email marketing tool with sample data
// @access  Public
router.get("/test-email", async (req, res) => {
  try {
    const testInput = {
      campaignType: "welcome",
      subject: "Test Subject",
      audience: "Test Audience",
      goal: "engagement",
      tone: "professional",
      industry: "marketing",
      productService: "Test Product",
      urgency: "medium"
    };
    
    const result = await generateEmailCampaign(testInput);
    res.json({ 
      status: "success", 
      testInput,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Email marketing test error:", error);
    res.status(500).json({ status: "error", error: error.message });
  }
});

// @route   GET /api/ai-tools/test-client-report
// @desc    Test client reporting tool with sample data
// @access  Public
router.get("/test-client-report", async (req, res) => {
  try {
    const testInput = {
      clientName: "Test Client",
      reportingPeriod: "Monthly",
      services: "Google Ads, Facebook Ads, Email Marketing",
      industry: "technology",
      goals: "Increase leads, Improve conversion rate",
      budget: "$10,000",
      kpis: "Traffic, Conversions, ROI",
      challenges: "Market competition, Budget constraints"
    };
    
    const result = await generateClientReport(testInput);
    res.json({ 
      status: "success", 
      testInput,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Client reporting test error:", error);
    res.status(500).json({ status: "error", error: error.message });
  }
});

// @route   GET /api/ai-tools/test-landing-page
// @desc    Test landing page tool with sample data
// @access  Public
router.get("/test-landing-page", async (req, res) => {
  try {
    const testInput = {
      url: "https://example.com",
      industry: "technology",
      goal: "Lead generation",
      targetAudience: "Business professionals"
    };
    
    const result = await generateLandingPage(testInput);
    res.json({ 
      status: "success", 
      testInput,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Landing page test error:", error);
    res.status(500).json({ status: "error", error: error.message });
  }
});

// @route   GET /api/ai-tools
// @desc    Get available AI tools for user
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const availableTools = user.getAvailableTools()

    const toolsWithAccess = Object.entries(AI_TOOLS).map(([id, tool]) => ({
      id,
      ...tool,
      hasAccess: availableTools.includes(id),
      isTrialTool: tool.freeInTrial,
    }))

    res.json({
      tools: toolsWithAccess,
      subscription: {
        plan: user.subscription.plan,
        status: user.subscription.status,
        trialDaysRemaining:
          user.subscription.status === "trial"
            ? Math.max(0, Math.ceil((user.subscription.trialEndDate - new Date()) / (1000 * 60 * 60 * 24)))
            : 0,
      },
    })
  } catch (error) {
    console.error("Get AI tools error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   POST /api/ai-tools/:toolId/generate
// @desc    Generate content using AI tools
// @access  Private
router.post("/:toolId/generate", auth, toolLimiter, openaiLimiter, checkToolAccess, async (req, res) => {
  const startTime = Date.now()
  const { toolId } = req.params
      const { input } = req.body

    try {
      console.log(`Generating content for tool: ${toolId}`)
      console.log("Input:", input)
      console.log("User ID:", req.user?.userId)
      console.log("Request body:", req.body)
      
      // Additional logging for email-marketing tool
      if (toolId === 'email-marketing') {
        console.log("Email marketing specific input:", {
          campaignType: input.campaignType,
          subject: input.subject || input.subjectLine,
          audience: input.audience || input.targetAudience,
          goal: input.goal,
          tone: input.tone,
          industry: input.industry,
          productService: input.productService,
          urgency: input.urgency
        })
      }

      // Additional logging for client-reporting tool
      if (toolId === 'client-reporting') {
        console.log("Client reporting specific input:", {
          clientName: input.clientName,
          reportingPeriod: input.reportingPeriod,
          services: input.services,
          industry: input.industry,
          goals: input.goals,
          budget: input.budget,
          kpis: input.kpis,
          challenges: input.challenges
        })
      }

      // Additional logging for landing-page tool
      if (toolId === 'landing-page') {
        console.log("Landing page specific input:", {
          url: input.url,
          industry: input.industry,
          goal: input.goal,
          targetAudience: input.targetAudience
        })
      }

    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Validate input
    if (!input) {
      return res.status(400).json({ message: "Input data is required" })
    }

    // Additional validation for email-marketing tool
    if (toolId === 'email-marketing') {
      if (!input.subject && !input.subjectLine) {
        return res.status(400).json({ message: "Subject line is required for email campaigns" })
      }
      if (!input.audience && !input.targetAudience) {
        return res.status(400).json({ message: "Target audience is required for email campaigns" })
      }
    }

    // Additional validation for client-reporting tool
    if (toolId === 'client-reporting') {
      if (!input.clientName) {
        return res.status(400).json({ message: "Client name is required for client reports" })
      }
      if (!input.reportingPeriod) {
        return res.status(400).json({ message: "Reporting period is required for client reports" })
      }
    }

    // Additional validation for landing-page tool
    if (toolId === 'landing-page') {
      if (!input.url) {
        return res.status(400).json({ message: "URL is required for landing page analysis" })
      }
    }

    // Generate content using AI
    let output
    try {
      output = await simulateAIGeneration(toolId, input)
    } catch (aiError) {
      console.error(`AI generation failed for ${toolId}:`, aiError)
      output = getFallbackData(toolId, input)
    }

    // Log usage with debug output
    console.log("Tool usage attempt:", {
      userId: user._id,
      toolId,
      toolName: AI_TOOLS[toolId]?.name || "Unknown",
      input,
      output,
      processingTime: Date.now() - startTime,
      status: "success",
    });
    
    try {
      await AIToolUsage.create({
        userId: user._id,
        toolId,
        toolName: AI_TOOLS[toolId]?.name || "Unknown",
        input,
        output: output || null, // Handle null output gracefully
        processingTime: Date.now() - startTime,
        status: output ? "success" : "error",
        errorMessage: output ? undefined : "AI generation failed",
      });
      console.log("Tool usage successfully logged!");
    } catch (err) {
      console.error("Error saving tool usage:", err);
    }

    // Only update usage stats if AI generation was successful
    if (output && Object.keys(output).length > 0) {
      user.usage.totalGenerations += 1
      user.usage.monthlyGenerations += 1

      // Update tool-specific usage
      const toolUsage = user.usage.toolsUsed.find((t) => t.toolId === toolId)
      if (toolUsage) {
        toolUsage.usageCount += 1
        toolUsage.lastUsed = new Date()
      } else {
        user.usage.toolsUsed.push({
          toolId,
          toolName: AI_TOOLS[toolId]?.name || "Unknown",
          usageCount: 1,
          lastUsed: new Date(),
        })
      }
    }

    await user.save()

    // Generate notifications after successful tool usage
    try {
      await NotificationService.generateAllNotifications(user._id);
    } catch (notificationError) {
      console.error('Error generating notifications:', notificationError);
    }

    // Ensure output is valid before sending response
    if (!output || typeof output !== 'object') {
      console.warn(`Invalid output for ${toolId}, using fallback data`);
      output = getFallbackData(toolId, input);
    }

    res.json({
      success: true,
      output,
      processingTime: Date.now() - startTime,
      aiGenerated: true, // Indicates this was generated by AI
      usage: {
        totalGenerations: user.usage.totalGenerations,
        monthlyGenerations: user.usage.monthlyGenerations,
      },
    })
  } catch (error) {
    console.error("AI tool generation error:", error)
    console.error("Error stack:", error.stack)
    console.error("Error details:", {
      toolId: req.params.toolId,
      userId: req.user?.userId,
      input: req.body.input,
      errorType: error.constructor.name,
      errorCode: error.code,
      errorStatus: error.response?.status
    })

    // Log failed usage
    try {
      await AIToolUsage.create({
        userId: req.user?.userId,
        toolId: req.params.toolId,
        toolName: AI_TOOLS[req.params.toolId]?.name || "Unknown",
        input: req.body.input,
        output: null,
        processingTime: Date.now() - startTime,
        status: "error",
        errorMessage: error.message,
      })
    } catch (usageError) {
      console.error("Failed to log usage error:", usageError)
    }

    res.status(500).json({ 
      message: "AI generation failed", 
      error: error.message,
      aiGenerated: false // Indicates this was fallback data
    })
  }
})

// AI Generation function with OpenAI API integration
async function simulateAIGeneration(toolId, input) {
  // Check if OpenAI API key is available
  if (!process.env.OPENAI_API_KEY) {
    console.log('OpenAI API key not found, using fallback mock data');
    return getFallbackData(toolId, input);
  }

  try {
    if (toolId === 'product-launch') {
      return await generateProductLaunchPlan(input);
    } else if (toolId === 'blog-to-video') {
      return await generateBlogToVideoScript(input);
    } else if (toolId === 'social-media') {
      return await generateSocialMediaContent(input);
    } else if (toolId === 'blog-writing') {
      return await generateBlogContent(input);
    } else if (toolId === 'email-marketing') {
      return await generateEmailCampaign(input);
    } else if (toolId === 'client-reporting') {
      return await generateClientReport(input);
    } else if (toolId === 'ad-copy') {
      return await generateAdCopy(input);
    } else if (toolId === 'landing-page') {
      return await generateLandingPage(input);
    } else if (toolId === 'competitor-analysis') {
      return await generateCompetitorAnalysis(input);
    } else if (toolId === 'cold-outreach') {
      return {
        _warning: "⚠️ This is static fallback content. For dynamic AI-generated content, please ensure your OpenAI API key is configured correctly.",
        _aiGenerated: false,
        personalizationElements: {
          researchPoints: [
            "Company size and structure analysis",
            "Industry challenges and pain points",
            "Role responsibilities and decision-making power",
            "Recent company news and developments",
            "Competitive landscape insights"
          ],
          commonGround: [
            "Shared industry challenges and opportunities",
            "Common business goals and objectives",
            "Similar market positioning and strategies",
            "Mutual professional interests and expertise",
            "Common customer pain points and solutions"
          ],
          valuePropositions: [
            "Increase operational efficiency by 40%",
            "Reduce customer acquisition costs by 60%",
            "Improve team productivity and collaboration",
            "Streamline workflow processes and automation",
            "Enhance customer satisfaction and retention"
          ]
        },
        outreachMessages: [
          {
            platform: "LinkedIn",
            message: "Hi [Name], I came across your profile and was impressed by your work in [Industry]. I've been helping companies like [Company] address similar challenges around [Pain Point]. Would love to share some insights that might be relevant to your current initiatives.",
            subjectLine: "Quick thought on your industry approach",
            content: "Hi [Name], I came across your profile and was impressed by your work in [Industry]. I've been helping companies like [Company] address similar challenges around [Pain Point]. Would love to share some insights that might be relevant to your current initiatives.",
            timing: "Tuesday 10 AM or Wednesday 2 PM",
            purpose: "Build authentic connection through shared insights",
            followUpTrigger: "No response after 3 business days"
          },
          {
            platform: "Email",
            message: "Hi [Name], I hope this finds you well. I've been following your work in [Industry] and wanted to reach out about a solution that's helping companies like yours address [Pain Point]. Would you be open to a brief conversation about what we're seeing in the market?",
            subjectLine: "Quick question about your approach to [Challenge]",
            content: "Hi [Name], I hope this finds you well. I've been following your work in [Industry] and wanted to reach out about a solution that's helping companies like yours address [Pain Point]. Would you be open to a brief conversation about what we're seeing in the market?",
            timing: "Tuesday 9 AM or Thursday 3 PM",
            purpose: "Establish thought leadership connection",
            followUpTrigger: "No response after 4 business days"
          },
          {
            platform: "Twitter",
            message: "Hey [Name]! Your recent insights on [Topic] really resonated with me. Been seeing similar patterns in [Industry] and would love to connect. What's your take on [Current Trend]?",
            subjectLine: "Your insights on [Topic] got me thinking",
            content: "Hey [Name]! Your recent insights on [Topic] really resonated with me. Been seeing similar patterns in [Industry] and would love to connect. What's your take on [Current Trend]?",
            timing: "Monday 11 AM or Friday 1 PM",
            purpose: "Engage through shared interests and trends",
            followUpTrigger: "No response after 2 business days"
          },
          {
            platform: "Phone",
            script: "Hi [Name], this is [Your Name] calling. I came across your work at [Company] and was impressed by your approach to [Challenge]. I've been helping similar companies address this and wanted to share some insights. Do you have a moment to chat?",
            subjectLine: "Quick call about [Company] and [Challenge]",
            content: "Hi [Name], this is [Your Name] calling. I came across your work at [Company] and was impressed by your approach to [Challenge]. I've been helping similar companies address this and wanted to share some insights. Do you have a moment to chat?",
            timing: "Tuesday 10 AM or Wednesday 2 PM",
            purpose: "Direct engagement and relationship building",
            followUpTrigger: "No response after 1 business day"
          }
        ],
        personalizationTemplates: [
          {
            templateName: "Value-First Approach",
            hook: "Reference recent company news or achievements",
            personalization: "Mention specific role responsibilities and industry challenges",
            valueProposition: "Focus on measurable outcomes and ROI",
            callToAction: "Request brief conversation or share specific insights"
          },
          {
            templateName: "Industry Expert Connection",
            hook: "Share industry insights or market trends",
            personalization: "Reference mutual connections or professional background",
            valueProposition: "Highlight expertise and proven track record",
            callToAction: "Offer to share case studies or best practices"
          }
        ],
        followUpSequence: [
          {
            followUp1: "Hi [Name], just wanted to follow up on my previous message about [Topic]. I thought you might find this [Resource/Insight] interesting given your work in [Area].",
            timing1: "3-5 business days after initial contact"
          },
          {
            followUp2: "Hi [Name], I understand you're busy, but I wanted to share this quick insight about [Trend/Challenge] that might be relevant to [Company] right now.",
            timing2: "1 week after first follow-up"
          },
          {
            followUp3: "Hi [Name], this will be my final follow-up. I've enjoyed learning about your work at [Company]. If you're interested in [Topic] in the future, feel free to reach out.",
            timing3: "2 weeks after second follow-up"
          }
        ],
        bestPractices: {
          do: [
            "Personalize based on recent company news or achievements",
            "Reference mutual connections or professional background",
            "Focus on value and insights rather than sales pitch",
            "Use appropriate timing and follow-up sequences",
            "Maintain professional and authentic tone"
          ],
          dont: [
            "Don't use generic templates or mass messaging",
            "Don't focus solely on product features",
            "Don't be pushy or aggressive in follow-ups",
            "Don't ignore personalization opportunities",
            "Don't send without proper research and preparation"
          ],
          timing: "Best times: Tuesday 10 AM, Wednesday 2 PM, Thursday 9 AM. Avoid: Monday mornings, Friday afternoons, holidays"
        },
        trackingMetrics: {
          responseRate: "15-25% (vs industry average of 5-8%)",
          conversionRate: "3-5% (vs industry average of 1-2%)",
          successFactors: [
            "Authentic personalization based on research",
            "Value-first messaging approach",
            "Strategic timing and follow-up sequences",
            "Multi-channel touchpoint orchestration",
            "Continuous optimization based on response patterns"
          ]
        },
        optimizationTesting: {
          subjectLineVariations: [
            "Question-based: 'Quick question about your approach to [Challenge]'",
            "Value-focused: 'Thought you'd find this [Insight] interesting'",
            "Industry-specific: 'Your insights on [Topic] got me thinking'",
            "Connection-based: 'Mutual connection and [Company] insights'",
            "Trend-focused: 'Quick thought on [Current Trend] in [Industry]'"
          ],
          abTestingSuggestions: [
            "Test emotional vs logical hooks in subject lines",
            "Experiment with different personalization depths",
            "Vary message length and complexity",
            "Test different call-to-action urgency levels",
            "Compare direct vs indirect value propositions"
          ],
          followUpStrategy: "Multi-touch sequence: Day 1 (initial), Day 3 (value-add), Day 7 (case study), Day 14 (final offer). Vary content and approach in each follow-up."
        }
      };
    } else if (toolId === 'reels-scripts') {
      return {
        _warning: "⚠️ This is static fallback content. For dynamic AI-generated content, please ensure your OpenAI API key is configured correctly.",
        _aiGenerated: false,
        scriptVariations: [
          {
            hook: `POV: You just discovered the ${input.topic || 'topic'} hack that changes everything 👀`,
            mainContent: `🎬 SCENE 1 (0-3s): Hook
"Stop scrolling! This ${input.topic || 'tip'} will blow your mind"
[Show dramatic before/after or surprising statistic]

🎬 SCENE 2 (3-8s): Problem
"Most ${input.targetAudience || 'people'} struggle with [common problem]"
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
"Save this for later and follow for more ${input.topic || 'tips'}!"`,
            callToAction: "Save this post and follow @youraccount for more tips!",
            visualCues: ["Dramatic before/after", "Step-by-step visuals", "Social proof elements"],
            audioNotes: ["Upbeat background music", "Clear voiceover with enthusiasm"]
          },
          {
            hook: `Things ${input.targetAudience || 'people'} don't know about ${input.topic || 'this topic'} 🤯`,
            mainContent: `🎵 Trending Sound: [Current viral sound]

📱 VISUAL SEQUENCE:
0-3s: Hook with surprising fact
3-8s: Problem demonstration
8-20s: Solution breakdown
20-25s: Results showcase
25-30s: Engagement CTA

💡 KEY MESSAGE:
"${input.topic || 'This topic'} is simpler than you think!"`,
            callToAction: "Comment 'YES' if you learned something new!",
            visualCues: ["Surprising statistics", "Problem-solution flow", "Engaging transitions"],
            audioNotes: ["Trending sound integration", "Dynamic voiceover pacing"]
          }
        ],
        platformSpecific: {
          instagramReels: {
            script: `Instagram Reels Script for ${input.topic || 'topic'}:
            
🎬 OPENING (0-3s):
"Stop what you're doing right now!"

🎬 HOOK (3-8s):
"This ${input.topic || 'tip'} changed my life"

🎬 CONTENT (8-25s):
• [Key point 1]
• [Key point 2] 
• [Key point 3]

🎬 CLOSING (25-30s):
"Save this and follow for more!"`,
            hashtags: [`#${input.topic?.replace(/\s+/g, '') || 'tips'}`, "#reels", "#viral", "#fyp", "#trending"],
            trendingSounds: ["Upbeat pop", "Electronic beats", "Motivational"],
            engagementTips: ["Ask questions", "Use trending sounds", "Post at peak times"]
          },
          tiktok: {
            script: `TikTok Script for ${input.topic || 'topic'}:
            
🎵 SOUND: [Trending audio]

📱 VISUAL:
0-3s: Hook with text overlay
3-8s: Problem setup
8-20s: Solution steps
20-25s: Results
25-30s: CTA with duet challenge`,
            hashtags: [`#${input.topic?.replace(/\s+/g, '') || 'tips'}`, "#tiktok", "#fyp", "#viral", "#trending"],
            trendingSounds: ["Viral remixes", "Popular songs", "Sound effects"],
            engagementTips: ["Use trending sounds", "Create duet challenges", "Engage with comments"]
          },
          youtubeShorts: {
            script: `YouTube Shorts Script for ${input.topic || 'topic'}:
            
🎬 INTRO (0-3s):
"Quick ${input.topic || 'tip'} you need to know"

🎬 MAIN (3-25s):
[Detailed explanation with visuals]

🎬 OUTRO (25-30s):
"Subscribe for more ${input.topic || 'tips'}!"`,
            hashtags: [`#${input.topic?.replace(/\s+/g, '') || 'tips'}`, "#shorts", "#youtube", "#trending"],
            engagementTips: ["Optimize for search", "Use end screens", "Cross-promote"]
          }
        },
        visualElements: {
          transitions: ["Quick cuts", "Slide transitions", "Zoom effects"],
          effects: ["Text animations", "Color grading", "Motion graphics"],
          textOverlays: ["Key statistics", "Step numbers", "Call-to-action text"]
        },
        audioGuidance: {
          backgroundMusic: "Upbeat, energetic tracks (120-140 BPM)",
          voiceoverStyle: "Enthusiastic, clear, and engaging",
          soundEffects: ["Success chimes", "Transition swooshes"]
        },
        optimization: {
          titleSuggestions: [
            `${input.topic || 'Topic'} Hack You Need to Know`,
            `The ${input.topic || 'Secret'} That Changes Everything`,
            `${input.topic || 'Tip'} That Will Blow Your Mind`
          ],
          descriptionTemplates: [
            `Learn the ${input.topic || 'secret'} that professionals use!`,
            `This ${input.topic || 'tip'} changed my life - try it now!`,
            `The ${input.topic || 'hack'} you've been missing out on!`
          ],
          thumbnailIdeas: [
            "Before/after comparison",
            "Surprised expression with text",
            "Step-by-step visual guide"
          ]
        },
        exportOptions: {
          pdfReady: true,
          copyableText: `Complete Script for ${input.topic || 'topic'}:

HOOK: ${input.topic || 'Topic'} hack that changes everything

MAIN CONTENT:
• Problem: [Common struggle]
• Solution: [Step-by-step process]
• Proof: [Results and examples]

CALL TO ACTION: Save and follow for more tips!

VISUALS: [Visual elements and transitions]
AUDIO: [Music and voiceover guidance]`,
          descriptCompatible: `Descript Script Format:
[0:00-0:03] Hook: ${input.topic || 'Topic'} hack
[0:03-0:08] Problem setup
[0:08-0:20] Solution breakdown
[0:20-0:25] Results showcase
[0:25-0:30] Call to action`,
          canvaTemplate: `Canva Template Instructions:
1. Use 9:16 aspect ratio
2. Add text overlays for key points
3. Include visual elements for each scene
4. Use consistent color scheme
5. Add engaging transitions between scenes`
        }
      };
    } else if (toolId === 'local-seo') {
      return await generateLocalSEO(input);
    } else {
      // For any new tools, use fallback for now
      return getFallbackData(toolId, input);
    }
  } catch (error) {
    console.error(`AI generation failed for ${toolId}:`, error.message);
    
    // Handle specific OpenAI errors with better logging
    if (error.response) {
      if (error.response.status === 429) {
        console.error('OpenAI API rate limit exceeded - using fallback data');
        console.error('Rate limit details:', error.response.data?.error?.message || 'Unknown rate limit error');
      } else if (error.response.status === 401) {
        console.error('OpenAI API key invalid or expired - using fallback data');
      } else if (error.response.status === 429 && error.response.data?.error?.code === 'insufficient_quota') {
        console.error('OpenAI API quota exceeded - using fallback data');
      } else {
        console.error(`OpenAI API error ${error.response.status}: ${error.response.data?.error?.message || 'Unknown error'}`);
      }
    }
    
    return getFallbackData(toolId, input);
  }
}

// Generate Product Launch Plan using OpenAI
async function generateProductLaunchPlan(input) {
  const prompt = `Generate a COMPLETELY UNIQUE and comprehensive product launch campaign in JSON format for the following requirements:

Product Name: ${input.productName || 'Product'}
Product Type: ${input.productType || 'SaaS'}
Target Audience: ${input.targetAudience || 'Business users'}
Launch Date: ${input.launchDate || 'Q1 2024'}
Key Features: ${input.keyFeatures || 'Feature 1, Feature 2, Feature 3'}
Pricing: ${input.pricing || '$99/month'}
Competitors: ${input.competitors || 'Competitor A, Competitor B'}
Launch Goals: ${input.launchGoals || 'Increase market share'}
Budget: ${input.budget || '$50,000'}

IMPORTANT: Generate COMPLETELY UNIQUE content for every section. Do NOT use generic templates or placeholder text. Create specific, detailed, and creative content that is tailored to this exact product and audience.

Generate a JSON object with this EXACT structure:

{
  "timeline": [
    {
      "phase": "Pre-Launch (8 weeks before)",
      "timeline": "Week -8 to -6",
      "activities": ["Create 6 specific, detailed activities unique to this product"],
      "deliverables": ["Create 6 specific deliverables unique to this product"],
      "kpis": ["Create 4 specific KPIs unique to this product"]
    },
    {
      "phase": "Soft Launch (4 weeks before)",
      "timeline": "Week -4 to -2",
      "activities": ["Create 6 specific, detailed activities unique to this product"],
      "deliverables": ["Create 6 specific deliverables unique to this product"],
      "kpis": ["Create 4 specific KPIs unique to this product"]
    },
    {
      "phase": "Launch Week",
      "timeline": "Week 0",
      "activities": ["Create 6 specific, detailed activities unique to this product"],
      "deliverables": ["Create 6 specific deliverables unique to this product"],
      "kpis": ["Create 4 specific KPIs unique to this product"]
    },
    {
      "phase": "Post-Launch (4 weeks after)",
      "timeline": "Week +1 to +4",
      "activities": ["Create 6 specific, detailed activities unique to this product"],
      "deliverables": ["Create 6 specific deliverables unique to this product"],
      "kpis": ["Create 4 specific KPIs unique to this product"]
    }
  ],
  "emailCampaigns": {
    "prelaunch": "Write a complete, unique prelaunch email with subject line, personalized content, and specific call-to-action for this product",
    "launch": "Write a complete, unique launch day email with subject line, personalized content, and specific call-to-action for this product",
    "postlaunch": "Write a complete, unique post-launch follow-up email with subject line, personalized content, and specific call-to-action for this product"
  },
  "socialMediaPosts": {
    "announcement": "Write a unique, engaging social media announcement post with hashtags and emojis specific to this product",
    "countdown": "Write a unique, engaging countdown post with hashtags and emojis specific to this product",
    "launch": "Write a unique, engaging launch day post with hashtags and emojis specific to this product",
    "testimonial": "Write a unique, engaging testimonial-style post with hashtags and emojis specific to this product"
  },
  "pressRelease": "Write a complete, professional press release with headline, body, and boilerplate specific to this product launch",
  "contentCalendar": [
    {
      "week": "Launch Week",
      "content": [
        {
          "date": "Monday",
          "platform": "LinkedIn",
          "content": "Write unique content description for this specific product",
          "type": "Announcement"
        },
        {
          "date": "Tuesday",
          "platform": "Twitter",
          "content": "Write unique content description for this specific product",
          "type": "Behind-the-scenes"
        },
        {
          "date": "Wednesday",
          "platform": "Instagram",
          "content": "Write unique content description for this specific product",
          "type": "Product showcase"
        },
        {
          "date": "Thursday",
          "platform": "Facebook",
          "content": "Write unique content description for this specific product",
          "type": "Social proof"
        },
        {
          "date": "Friday",
          "platform": "LinkedIn",
          "content": "Write unique content description for this specific product",
          "type": "Results"
        }
      ]
    },
    {
      "week": "Week 2",
      "content": [
        {
          "date": "Monday",
          "platform": "Blog",
          "content": "Write unique content description for this specific product",
          "type": "Educational"
        },
        {
          "date": "Tuesday",
          "platform": "YouTube",
          "content": "Write unique content description for this specific product",
          "type": "Tutorial"
        },
        {
          "date": "Wednesday",
          "platform": "Twitter",
          "content": "Write unique content description for this specific product",
          "type": "Community"
        },
        {
          "date": "Thursday",
          "platform": "Instagram",
          "content": "Write unique content description for this specific product",
          "type": "Celebration"
        },
        {
          "date": "Friday",
          "platform": "LinkedIn",
          "content": "Write unique content description for this specific product",
          "type": "Thought leadership"
        }
      ]
    }
  ],
  "analytics": {
    "expectedReach": "Generate realistic reach numbers based on product type and audience",
    "projectedSignups": "Generate realistic signup projections based on product type and audience",
    "estimatedRevenue": "Generate realistic revenue projections based on pricing and audience size",
    "conversionRate": "Generate realistic conversion rate based on product type and market"
  }
}

CRITICAL REQUIREMENTS:
1. Make EVERY piece of content completely unique and specific to this product
2. Do NOT use generic templates or placeholder text
3. Create detailed, actionable content that would actually work for this specific launch
4. Use the exact product name, features, and audience in all content
5. Make the content creative, engaging, and professional
6. Return ONLY valid JSON, no explanation or additional text`;

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an expert product launch strategist that generates comprehensive launch campaigns in JSON format.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 3000,
      temperature: 0.7
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const text = response.data.choices[0].message.content;
  let output;
  try {
    output = JSON.parse(text);
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}/);
    output = match ? JSON.parse(match[0]) : getFallbackData('product-launch', input);
  }
  return output;
}

// Generate Blog to Video Script using OpenAI
async function generateBlogToVideoScript(input) {
  const prompt = `Generate a COMPLETELY UNIQUE and comprehensive blog-to-video script in JSON format for the following requirements:

Blog Title: ${input.blogTitle || 'Blog Post Title'}
Blog Content: ${input.blogContent || 'Blog content here...'}
Video Style: ${input.videoStyle || 'Educational'}
Target Platform: ${input.targetPlatform || 'YouTube'}
Duration: ${input.duration || '5-7 minutes'}
Audience: ${input.audience || 'General audience'}
Call to Action: ${input.callToAction || 'Subscribe for more content'}

IMPORTANT: Generate COMPLETELY UNIQUE content for every section. Do NOT use generic templates or placeholder text. Create specific, detailed, and creative content that is tailored to this exact blog content and audience.

Generate a JSON object with this EXACT structure:

{
  "scripts": [
    {
      "section": "Hook/Introduction (0-30s)",
      "duration": "30 seconds",
      "script": "Write a unique, engaging hook and introduction script that captures attention and introduces the topic. Include specific visual directions and timing cues.",
      "visualCues": ["Create 4 specific visual cues unique to this content"],
      "audioNotes": ["Create 4 specific audio notes unique to this content"]
    },
    {
      "section": "Problem Setup (0:30-1:30s)",
      "duration": "1 minute",
      "script": "Write a unique script that sets up the problem or context from the blog content. Include specific examples and relatable scenarios.",
      "visualCues": ["Create 4 specific visual cues unique to this content"],
      "audioNotes": ["Create 4 specific audio notes unique to this content"]
    },
    {
      "section": "Main Content - Key Point 1 (1:30-2:30s)",
      "duration": "1 minute",
      "script": "Write a unique script for the first key point from the blog content. Include detailed explanations and demonstrations.",
      "visualCues": ["Create 4 specific visual cues unique to this content"],
      "audioNotes": ["Create 4 specific audio notes unique to this content"]
    },
    {
      "section": "Main Content - Key Point 2 (2:30-3:30s)",
      "duration": "1 minute",
      "script": "Write a unique script for the second key point from the blog content. Include detailed explanations and demonstrations.",
      "visualCues": ["Create 4 specific visual cues unique to this content"],
      "audioNotes": ["Create 4 specific audio notes unique to this content"]
    },
    {
      "section": "Main Content - Key Point 3 (3:30-4:30s)",
      "duration": "1 minute",
      "script": "Write a unique script for the third key point from the blog content. Include detailed explanations and demonstrations.",
      "visualCues": ["Create 4 specific visual cues unique to this content"],
      "audioNotes": ["Create 4 specific audio notes unique to this content"]
    },
    {
      "section": "Conclusion & CTA (4:30-5:00s)",
      "duration": "30 seconds",
      "script": "Write a unique conclusion and call-to-action script that summarizes key points and encourages engagement.",
      "visualCues": ["Create 4 specific visual cues unique to this content"],
      "audioNotes": ["Create 4 specific audio notes unique to this content"]
    }
  ],
  "storyboard": [
    {
      "scene": 1,
      "timestamp": "0:00-0:30",
      "visual": "Write unique visual description for the hook scene",
      "text": "Write unique text overlay for this scene",
      "transition": "Write unique transition type"
    },
    {
      "scene": 2,
      "timestamp": "0:30-1:30",
      "visual": "Write unique visual description for the problem setup scene",
      "text": "Write unique text overlay for this scene",
      "transition": "Write unique transition type"
    },
    {
      "scene": 3,
      "timestamp": "1:30-2:30",
      "visual": "Write unique visual description for key point 1 scene",
      "text": "Write unique text overlay for this scene",
      "transition": "Write unique transition type"
    },
    {
      "scene": 4,
      "timestamp": "2:30-3:30",
      "visual": "Write unique visual description for key point 2 scene",
      "text": "Write unique text overlay for this scene",
      "transition": "Write unique transition type"
    },
    {
      "scene": 5,
      "timestamp": "3:30-4:30",
      "visual": "Write unique visual description for key point 3 scene",
      "text": "Write unique text overlay for this scene",
      "transition": "Write unique transition type"
    },
    {
      "scene": 6,
      "timestamp": "4:30-5:00",
      "visual": "Write unique visual description for the conclusion scene",
      "text": "Write unique text overlay for this scene",
      "transition": "Write unique transition type"
    }
  ],
  "production": {
    "equipment": ["Create 4 specific equipment items needed for this video"],
    "locations": ["Create 3 specific locations for filming"],
    "props": ["Create 4 specific props needed for this video"],
    "timeline": "Write specific timeline estimate for this video production"
  },
  "optimization": {
    "title": "Write a unique, SEO-optimized video title",
    "description": "Write a unique, engaging video description",
    "tags": ["Create 5 specific, relevant hashtags"],
    "thumbnail": "Write unique thumbnail concept description",
    "chapters": [
      {
        "time": "0:00",
        "title": "Write unique chapter title"
      },
      {
        "time": "0:30",
        "title": "Write unique chapter title"
      },
      {
        "time": "1:30",
        "title": "Write unique chapter title"
      },
      {
        "time": "2:30",
        "title": "Write unique chapter title"
      },
      {
        "time": "3:30",
        "title": "Write unique chapter title"
      },
      {
        "time": "4:30",
        "title": "Write unique chapter title"
      }
    ]
  },
  "analytics": {
    "estimatedLength": "Write specific length estimate",
    "targetAudience": "Write detailed target audience description",
    "engagementPrediction": "Write specific engagement prediction with reasoning",
    "platformRecommendations": ["Create 4 specific platform recommendations with reasoning"]
  },
  "platformStrategy": [
    "Write unique strategy for YouTube",
    "Write unique strategy for LinkedIn",
    "Write unique strategy for Instagram Reels",
    "Write unique strategy for TikTok"
  ],
  "thumbnailConcept": "Write unique, detailed thumbnail concept description"
}

CRITICAL REQUIREMENTS:
1. Make EVERY piece of content completely unique and specific to this blog content
2. Do NOT use generic templates or placeholder text
3. Create detailed, actionable content that would actually work for this specific video
4. Use the exact blog title and content in all scripts
5. Make the content creative, engaging, and professional
6. Return ONLY valid JSON, no explanation or additional text`;

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an expert video content creator that generates comprehensive blog-to-video scripts in JSON format.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 3000,
      temperature: 0.7
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const text = response.data.choices[0].message.content;
  let output;
  try {
    output = JSON.parse(text);
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}/);
    output = match ? JSON.parse(match[0]) : getFallbackData('blog-to-video', input);
  }
  return output;
}


// Generate Social Media Content using OpenAI
async function generateSocialMediaContent(input) {
  console.log('ðŸš€ Calling OpenAI API for Social Media Content...');
  console.log('Input received:', JSON.stringify(input, null, 2));
  
  // Determine content mix based on user inputs
  const getContentMix = (contentGoals, brandVoice, postFrequency) => {
    let educational = 40, engaging = 30, promotional = 20, ugc = 10;
    
    // Adjust based on content goals
    if (contentGoals?.toLowerCase().includes('lead')) {
      promotional = 35; educational = 25; engaging = 25; ugc = 15;
    } else if (contentGoals?.toLowerCase().includes('awareness')) {
      educational = 45; engaging = 30; promotional = 15; ugc = 10;
    } else if (contentGoals?.toLowerCase().includes('engagement')) {
      engaging = 40; educational = 25; promotional = 20; ugc = 15;
    } else if (contentGoals?.toLowerCase().includes('sales')) {
      promotional = 40; educational = 20; engaging = 25; ugc = 15;
    }
    
    // Adjust based on brand voice
    if (brandVoice?.toLowerCase().includes('professional')) {
      educational = Math.min(educational + 10, 50);
      promotional = Math.max(promotional - 5, 15);
    } else if (brandVoice?.toLowerCase().includes('casual') || brandVoice?.toLowerCase().includes('fun')) {
      engaging = Math.min(engaging + 10, 45);
      educational = Math.max(educational - 5, 20);
    }
    
    // Adjust based on posting frequency
    if (postFrequency?.toLowerCase().includes('daily') || postFrequency?.toLowerCase().includes('5')) {
      ugc = Math.min(ugc + 5, 20);
      promotional = Math.max(promotional - 5, 15);
    } else if (postFrequency?.toLowerCase().includes('weekly') || postFrequency?.toLowerCase().includes('2')) {
      promotional = Math.min(promotional + 5, 25);
      educational = Math.min(educational + 5, 45);
    }
    
    // Ensure percentages add up to 100
    const total = educational + engaging + promotional + ugc;
    if (total !== 100) {
      const factor = 100 / total;
      educational = Math.round(educational * factor);
      engaging = Math.round(engaging * factor);
      promotional = Math.round(promotional * factor);
      ugc = 100 - educational - engaging - promotional;
    }
    
    return { educational, engaging, promotional, ugc };
  };

  // Determine posting schedule based on frequency and goals
  const getPostingSchedule = (postFrequency, contentGoals) => {
    const schedule = [];
    
    if (postFrequency?.toLowerCase().includes('daily') || postFrequency?.toLowerCase().includes('5')) {
      schedule.push(
        { day: "Monday", times: [], contentType: "" },
        { day: "Tuesday", times: [], contentType: "" },
        { day: "Wednesday", times: [], contentType: "" },
        { day: "Thursday", times: [], contentType: "" },
        { day: "Friday", times: [], contentType: "" }
      );
    } else if (postFrequency?.toLowerCase().includes('weekly') || postFrequency?.toLowerCase().includes('3')) {
      schedule.push(
        { day: "Monday", times: [], contentType: "" },
        { day: "Wednesday", times: [], contentType: "" },
        { day: "Friday", times: [], contentType: "" }
      );
    } else {
      schedule.push(
        { day: "Monday", times: [], contentType: "" },
        { day: "Wednesday", times: [], contentType: "" },
        { day: "Friday", times: [], contentType: "" }
      );
    }
    
    return schedule;
  };

  const contentMix = getContentMix(input.contentGoals, input.brandVoice, input.postFrequency);
  const postingSchedule = getPostingSchedule(input.postFrequency, input.contentGoals);

  // Generate platform-specific posts based on user selection
  const generatePlatformPosts = (platforms) => {
    const selectedPlatforms = platforms && platforms.length > 0 ? platforms : ['LinkedIn', 'Instagram', 'Twitter', 'Facebook'];
    
    return selectedPlatforms.map(platform => {
      return `    {
      "platform": "${platform}",
      "content": "Generate unique content for ${platform}",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
      "bestTime": "9:00 AM",
      "engagement": "High engagement expected"
    }`;
    }).join(',\n');
  };

  const platformPosts = generatePlatformPosts(input.platforms);

  const prompt = `Generate COMPLETELY UNIQUE and engaging social media content in JSON format for the following business (Request ID: ${Date.now()}):


Business Name: ${input.business || 'Business'}
Industry: ${input.industry || 'General business'}
Target Audience: ${input.targetAudience || 'General audience'}
Platforms: ${input.platforms?.join(', ') || 'All platforms'}
Content Goals: ${input.contentGoals || 'Engagement and brand awareness'}
Brand Voice: ${input.brandVoice || 'Professional'}
Post Frequency: ${input.postFrequency || 'Daily'}

CRITICAL: You must create COMPLETELY UNIQUE content for this specific business. Do NOT use any generic templates or placeholder text.

Business Details:
- Business Name: ${input.business || 'Business'}
- Industry: ${input.industry || 'General business'}
- Target Audience: ${input.targetAudience || 'General audience'}
- Content Goals: ${input.contentGoals || 'Engagement and brand awareness'}
- Brand Voice: ${input.brandVoice || 'Professional'}
- Posting Frequency: ${input.postFrequency || 'Daily'}
- Selected Platforms: ${input.platforms?.join(', ') || 'All platforms'}

You MUST create content that is:
1. SPECIFIC to this exact business name, industry, and target audience
2. DIFFERENT from any generic social media advice
3. ACTIONABLE and detailed
4. CREATIVE and engaging

CRITICAL REQUIREMENT: You MUST generate content for ALL selected platforms (${input.platforms?.join(', ') || 'LinkedIn, Instagram, Twitter, Facebook'}). Each platform should have completely different, unique content.

For each platform, create:
1. **posts.content**: Write actual social media posts (not instructions) for each platform - make each one completely different
2. **posts.hashtags**: Create specific hashtags for this business - different hashtags for each platform
3. **posts.bestTime**: Give specific times (e.g., "9:30 AM") not generic advice
4. **posts.engagement**: Create specific engagement tactics for this business

For strategy and analytics:
5. **strategy.contentMix.description**: Write detailed strategies specific to this business
6. **strategy.postingSchedule.times**: Give specific times for each day
7. **strategy.postingSchedule.contentType**: Create specific content types for this business
8. **strategy.hashtagStrategy**: Generate hashtags specific to this business
9. **analytics**: Create realistic projections for this specific business
   - **expectedReach**: Return ONLY a number range like "5,000-8,000" or "10k-15k". NO explanations.
   - **engagementRate**: Return ONLY a percentage range like "8-12%" or "15-20%". NO explanations.
   - **bestPerformingContent**: Return ONLY the content type name (Educational, Engaging, Promotional, or UGC). NO explanations.
   - **growthProjection**: Return ONLY a percentage like "25%" or "15-20% monthly". NO explanations.

EXAMPLE: If the business is "Puma" in "marketing" industry targeting "children", the content should be:
- Educational: "Share Puma's innovative child-friendly marketing campaigns, like our recent collaboration with kids' influencers and educational content about sustainable fashion for families"
- Engaging: "Show behind-the-scenes of Puma's children's photo shoots, share fun facts about our kid-friendly shoe designs, and create interactive polls about favorite colors"
- Promotional: "Highlight Puma's latest children's collection launches, showcase customer testimonials from parents, and promote our family discount programs"

NOT generic content like "educational content that teaches about marketing" or "engaging content with fun facts".

FORBIDDEN PHRASES (DO NOT USE):
- "educational content that teaches about"
- "engaging content that includes"
- "promotional content that highlights"
- "user-generated content that features"
- "content will focus on"
- "content will be"
- "content will include"

Instead, write specific, actionable content like:
- "Share Puma's behind-the-scenes videos of children's fashion shoots"
- "Create interactive polls about kids' favorite shoe colors"
- "Showcase Puma's latest children's collection launches"
- "Feature customer testimonials from parents about Puma's kid-friendly designs"

Generate a JSON object with this EXACT structure:

{
  "posts": [
${platformPosts}
  ],
  "strategy": {
    "contentMix": [
      {
        "type": "Educational Content",
        "percentage": ${contentMix.educational},
        "description": ""
      },
      {
        "type": "Engaging Content",
        "percentage": ${contentMix.engaging},
        "description": ""
      },
      {
        "type": "Promotional Content",
        "percentage": ${contentMix.promotional},
        "description": ""
      },
      {
        "type": "User-Generated Content",
        "percentage": ${contentMix.ugc},
        "description": ""
      }
    ],
    "postingSchedule": ${JSON.stringify(postingSchedule)},
    "hashtagStrategy": {
      "trending": [],
      "niche": [],
      "branded": []
    }
  },
  "analytics": {
    "expectedReach": "",
    "engagementRate": "",
    "bestPerformingContent": "",
    "growthProjection": ""
  }
}

CRITICAL REQUIREMENTS:
1. Make EVERY piece of content completely unique and specific to this business
2. Do NOT use generic templates or placeholder text
3. Create detailed, actionable content that would actually work for this specific business
4. Use the exact business name, industry, and audience in all content
5. Make the content creative, engaging, and professional
6. Return ONLY valid JSON, no explanation or additional text
7. If you generate generic content like "educational content that teaches about" or "engaging content that includes", you are FAILING
8. You MUST create content that is SPECIFIC to ${input.business || 'this business'} and would NOT work for any other business
9. Every description must mention the actual business name and be specific to their industry and target audience
10. For ALL analytics fields (expectedReach, engagementRate, bestPerformingContent, growthProjection), return ONLY numbers/percentages/content type names. NO explanations or additional text.`;

  try {
    console.log('ðŸ"¤ Making OpenAI API request...');
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an expert social media content creator. You MUST create COMPLETELY UNIQUE content for each business. NEVER use generic templates or placeholder text. Every piece of content must be specific to the exact business, industry, and target audience provided. CRITICAL: You MUST generate content for ALL selected platforms - each platform should have completely different, unique posts. If you generate generic content or only one post, you are failing at your task.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.9
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('âœ… OpenAI API response received');
    const text = response.data.choices[0].message.content;
    console.log('ðŸ" Raw response length:', text.length);
    
    let output;
    try {
      output = JSON.parse(text);
      console.log('âœ… JSON parsed successfully');
      return output;
    } catch (parseError) {
      console.log('âš ï¸ JSON parsing failed, trying to extract JSON...');
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        output = JSON.parse(match[0]);
        console.log('âœ… JSON extracted and parsed successfully');
        return output;
      } else {
        console.log('âŒ Could not extract JSON, using fallback data');
        return getFallbackData('social-media', input);
      }
    }
  } catch (error) {
    console.error('âŒ OpenAI API call failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    console.log('ðŸ"„ Falling back to static data');
    return getFallbackData('social-media', input);
  }
}

// Generate Blog Content using OpenAI
async function generateBlogContent(input) {
  try {
    // Validate input
    if (!input || typeof input !== 'object') {
      console.warn('Invalid input for blog generation, using fallback data');
      return getFallbackData('blog-writing', input);
    }

    const prompt = `You are an expert content writer. Generate a comprehensive, SEO-optimized blog post for this specific topic and audience.

BLOG REQUIREMENTS:
- Topic/Keywords: ${input.topic || input.keywords || 'General topic'}
- Target Audience: ${input.targetAudience || 'General audience'}
- Word Count: ${input.blogLength || input.wordCount || '1500 words'}
- Writing Tone: ${input.tone || 'Professional'}
- Content Purpose: ${input.contentPurpose || 'Informative'}
- Custom Outline: ${input.customOutline || 'None provided'}

CRITICAL REQUIREMENTS:
1. Generate COMPLETE, detailed content for each section
2. Create content that is SPECIFIC to the topic and audience
3. Include actionable insights, examples, and practical tips
4. Write engaging, valuable content that provides real value
5. Use the exact word count specified
6. Make the content unique and not generic

Generate a JSON object with this EXACT structure:

{
  "title": "Create a compelling, SEO-optimized title that includes the main keyword",
  "metaDescription": "Write a meta description (150-160 characters) that includes the main keyword and is compelling",
  "introduction": "Write a detailed, engaging introduction (200-300 words) that hooks the reader and introduces the topic",
  "outline": [
    {
      "heading": "Create a specific, relevant heading for this topic",
      "subheadings": ["Create 3-4 specific subheadings", "That are relevant to this topic", "And provide value to the audience"]
    },
    {
      "heading": "Create another specific heading", 
      "subheadings": ["Create 3-4 specific subheadings", "That build on the previous section", "And provide actionable insights"]
    },
    {
      "heading": "Create a third specific heading",
      "subheadings": ["Create 3-4 specific subheadings", "That provide practical tips", "And help the audience succeed"]
    }
  ],
  "content": {
    "section1": "Write COMPLETE, detailed content for section 1 (400-600 words) with specific examples, actionable tips, and valuable insights. Make it engaging and informative.",
    "section2": "Write COMPLETE, detailed content for section 2 (400-600 words) with specific examples, actionable tips, and valuable insights. Build on section 1 and provide deeper value.",
    "section3": "Write COMPLETE, detailed content for section 3 (400-600 words) with specific examples, actionable tips, and valuable insights. Provide practical takeaways and next steps."
  },
  "conclusion": "Write a compelling conclusion (200-300 words) that summarizes key points, provides a call-to-action, and leaves the reader with valuable takeaways",
  "seoOptimization": {
    "targetKeywords": ["Primary keyword", "Secondary keyword", "Long-tail keyword", "Related keyword"],
    "internalLinks": ["Specific internal link suggestion 1", "Specific internal link suggestion 2"],
    "externalLinks": ["Specific external link suggestion 1", "Specific external link suggestion 2"]
  },
  "contentMarketing": {
    "socialMediaSnippets": ["Create engaging snippet for LinkedIn", "Create engaging snippet for Twitter", "Create engaging snippet for Facebook"],
    "emailNewsletter": "Create an email newsletter version (200-300 words) that summarizes the key points and encourages clicks",
    "infographicIdeas": ["Specific infographic idea 1", "Specific infographic idea 2"]
  },
  "suggestions": {
    "improvements": [
      "Analyze the content and suggest a specific improvement (e.g., 'Add case studies from successful companies in the industry', 'Include recent statistics from 2024', 'Add a step-by-step implementation guide')",
      "Analyze the content and suggest a specific improvement (e.g., 'Include expert quotes from industry leaders', 'Add a troubleshooting section for common challenges', 'Include a comparison table of different approaches')",
      "Analyze the content and suggest a specific improvement (e.g., 'Add a ROI calculation section', 'Include a timeline for implementation', 'Add a risk assessment section')"
    ],
    "additionalSections": [
      "Analyze the content and suggest a specific additional section (e.g., 'FAQ section addressing common questions about the topic', 'Resources and tools section with specific recommendations', 'Expert interviews section with industry leaders')",
      "Analyze the content and suggest a specific additional section (e.g., 'Case study section with real examples', 'Implementation checklist for readers', 'Advanced techniques for experienced users')",
      "Analyze the content and suggest a specific additional section (e.g., 'Future trends and predictions section', 'Common mistakes to avoid section', 'Success metrics and KPIs section')"
    ]
  }
}

FORBIDDEN: Do NOT use generic phrases like "Write COMPLETE content" or "Create engaging content" in the actual output. Fill in ALL fields with real, specific, actionable content.

EXAMPLE OF GOOD CONTENT:
- Title: "10 Proven Strategies to Master Digital Marketing in 2024"
- Introduction: "In today's fast-paced digital landscape, mastering marketing strategies is crucial for business success. With over 4.9 billion active internet users worldwide, the opportunity to reach your target audience has never been greater..."

EXAMPLE OF BAD CONTENT:
- Title: "Create a compelling, SEO-optimized title"
- Introduction: "Write a detailed, engaging introduction"

Return ONLY valid JSON with actual content filled in, no explanations.`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an expert content writer. Generate comprehensive, detailed, and valuable blog posts. NEVER use generic phrases or placeholder text in your output. Fill in ALL fields with real, specific, actionable content that provides genuine value to readers.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 6000,
        temperature: 0.8
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const text = response.data.choices[0].message.content;
    let output;
    try {
      output = JSON.parse(text);
    } catch (e) {
      console.warn('Failed to parse OpenAI response as JSON, using fallback data');
      const match = text.match(/\{[\s\S]*\}/);
      output = match ? JSON.parse(match[0]) : getFallbackData('blog-writing', input);
    }
    return output;
  } catch (error) {
    console.error('Blog content generation failed:', error.message);
    
    // Handle specific OpenAI errors
    if (error.response) {
      if (error.response.status === 429) {
        console.error('Rate limit exceeded - using fallback data');
      } else if (error.response.status === 401) {
        console.error('OpenAI API key invalid or expired - using fallback data');
      } else if (error.response.status === 429 && error.response.data?.error?.code === 'insufficient_quota') {
        console.error('OpenAI API quota exceeded - using fallback data');
      } else {
        console.error(`OpenAI API error ${error.response.status}: ${error.response.data?.error?.message || 'Unknown error'}`);
      }
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('Network error - using fallback data');
    } else {
      console.error('Unknown error in blog generation:', error.message);
    }
    
    // Return fallback data instead of crashing
    return getFallbackData('blog-writing', input);
  }
}

// Generate Email Campaign using OpenAI
async function generateEmailCampaign(input) {
  try {
    // Validate input
    if (!input || typeof input !== 'object') {
      console.warn('Invalid input for email campaign generation, using fallback data');
      return getFallbackData('email-marketing', input);
    }

    const prompt = `You are an expert email marketing strategist. Generate a comprehensive, personalized email marketing campaign for this specific business.

BUSINESS DETAILS:
- Campaign Type: ${input.campaignType || input.campaignType || 'Newsletter'}
- Subject Line: ${input.subjectLine || input.subject || 'Newsletter subject'}
- Target Audience: ${input.targetAudience || input.audience || 'General audience'}
- Campaign Goal: ${input.campaignGoal || input.goal || 'Engagement'}
- Email Tone: ${input.tone || 'Professional'}
- Industry: ${input.industry || 'Business'}
- Product/Service: ${input.productService || ''}
- Urgency Level: ${input.urgency || 'Medium'}

CRITICAL REQUIREMENTS:
1. Generate content that is SPECIFIC to this business and audience
2. Create unique subject lines that are NOT just variations of the input subject
3. Generate realistic, data-driven performance metrics based on the audience and industry
4. Create personalized segmentation strategies for this specific audience
5. Generate actual email content, not templates or instructions
6. Every piece of content must be unique and actionable

Generate a JSON object with this EXACT structure:

{
  "campaigns": [
    {
      "type": "Welcome Email",
      "subject": "Generate a compelling, unique subject line for this specific business",
      "preheader": "Generate a preheader that complements the subject line",
      "content": "Generate complete email content with HTML formatting, specific to this business",
      "cta": "Generate a specific call-to-action button text",
      "personalizations": ["Generate 3-4 specific personalization tokens for this audience"]
    },
    {
      "type": "Follow-up Email", 
      "subject": "Generate a follow-up subject line that builds on the first email",
      "preheader": "Generate a follow-up preheader",
      "content": "Generate follow-up email content that provides value",
      "cta": "Generate a follow-up call-to-action",
      "personalizations": ["Generate 3-4 specific personalization tokens"]
    },
    {
      "type": "Promotional Email",
      "subject": "Generate a promotional subject line with urgency or benefit focus",
      "preheader": "Generate a promotional preheader",
      "content": "Generate promotional email content with compelling offers",
      "cta": "Generate a promotional call-to-action",
      "personalizations": ["Generate 3-4 specific personalization tokens"]
    }
  ],
  "sequence": {
    "name": "Generate a specific sequence name for this campaign",
    "emails": [
      {
        "day": 1,
        "subject": "Generate day 1 subject line",
        "purpose": "Generate specific purpose for this email",
        "content": "Generate brief description of email content"
      },
      {
        "day": 3,
        "subject": "Generate day 3 subject line",
        "purpose": "Generate specific purpose for this email", 
        "content": "Generate brief description of email content"
      },
      {
        "day": 7,
        "subject": "Generate day 7 subject line",
        "purpose": "Generate specific purpose for this email",
        "content": "Generate brief description of email content"
      }
    ]
  },
  "analytics": {
    "expectedOpenRate": "Generate realistic open rate percentage based on audience and industry",
    "expectedClickRate": "Generate realistic click-through rate percentage",
    "expectedConversionRate": "Generate realistic conversion rate percentage",
    "bestSendTime": "Generate optimal send time based on audience behavior"
  },
  "optimization": {
    "subjectLineVariations": [
      "Generate 4 unique subject line variations (not just template changes)",
      "Generate 4 unique subject line variations (not just template changes)",
      "Generate 4 unique subject line variations (not just template changes)",
      "Generate 4 unique subject line variations (not just template changes)"
    ],
    "segmentationTips": [
      "Generate specific segmentation tip for this audience",
      "Generate specific segmentation tip for this audience", 
      "Generate specific segmentation tip for this audience"
    ],
    "testingRecommendations": [
      "Generate specific A/B testing recommendation for this campaign",
      "Generate specific A/B testing recommendation for this campaign",
      "Generate specific A/B testing recommendation for this campaign",
      "Generate specific A/B testing recommendation for this campaign"
    ]
  }
}

FORBIDDEN: Do NOT use generic phrases like "Generate a..." or "Create..." in the actual output. Fill in the content with real, specific, actionable information.

EXAMPLE OF GOOD CONTENT:
- Subject: "Your MERN Stack Journey Starts Here - 3 Free Resources Inside"
- Analytics: "28.5%" (not "Generate realistic open rate...")

EXAMPLE OF BAD CONTENT:
- Subject: "Generate a compelling subject line"
- Analytics: "Generate realistic open rate percentage"

Return ONLY valid JSON with actual content filled in, no explanations.`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an expert email marketing strategist. Generate unique, specific, and actionable email campaigns. NEVER use generic phrases or template instructions in your output. Fill in ALL fields with real, specific content that would only work for the given business and audience.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.9
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const text = response.data.choices[0].message.content;
    let output;
    try {
      output = JSON.parse(text);
    } catch (e) {
      console.warn('Failed to parse OpenAI response as JSON, using fallback data');
      const match = text.match(/\{[\s\S]*\}/);
      output = match ? JSON.parse(match[0]) : getFallbackData('email-marketing', input);
    }
    return output;
  } catch (error) {
    console.error('Email campaign generation failed:', error.message);
    
    // Handle specific OpenAI errors
    if (error.response) {
      if (error.response.status === 429) {
        console.error('Rate limit exceeded - using fallback data');
      } else if (error.response.status === 401) {
        console.error('OpenAI API key invalid or expired - using fallback data');
      } else if (error.response.status === 429 && error.response.data?.error?.code === 'insufficient_quota') {
        console.error('OpenAI API quota exceeded - using fallback data');
      } else {
        console.error(`OpenAI API error ${error.response.status}: ${error.response.data?.error?.message || 'Unknown error'}`);
      }
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('Network error - using fallback data');
    } else {
      console.error('Unknown error in email campaign generation:', error.message);
    }
    
    // Return fallback data instead of crashing
    return getFallbackData('email-marketing', input);
  }
}

// Generate Client Report using OpenAI
async function generateClientReport(input) {
  try {
    // Validate input
    if (!input || typeof input !== 'object') {
      console.warn('Invalid input for client report generation, using fallback data');
      return getFallbackData('client-reporting', input);
    }

    const prompt = `Generate a COMPLETELY UNIQUE and comprehensive client reporting dashboard in JSON format for the following requirements:

Request ID: ${Date.now()}

BUSINESS DETAILS:
Client Name: ${input.clientName || 'Client'}
Industry: ${input.industry || 'Business'}
Reporting Period: ${input.reportingPeriod || 'Monthly'}
Services: ${input.services || 'Marketing services'}

CRITICAL REQUIREMENTS FOR DYNAMIC CONTENT:
1. You MUST generate COMPLETELY UNIQUE content for this specific client and industry
2. Every single field must contain specific, detailed information - NO generic text
3. Use the exact client name, industry, and services provided in your content
4. Generate realistic performance metrics that make sense for this industry
5. Create specific campaign names and objectives based on the industry
6. Include actual numbers, percentages, and data points throughout
7. Make all content actionable and specific to this client's business
8. Do NOT use any template text or placeholder content
9. Executive summary overview MUST be at least 3-4 sentences with detailed analysis
10. Recommendations MUST include specific expected impact with numbers and percentages
11. All content must be comprehensive and detailed, not brief or generic

FAILURE CONDITIONS - If you generate any of these, the response is invalid:
- Generic phrases like "performance summary" or "campaign objectives"
- Placeholder text like "Achievement 1" or "Challenge 1"
- Template content that doesn't reference the specific client/industry
- Empty or incomplete sections
- Brief or one-line executive summaries
- Generic recommendations without specific impact metrics

Generate a JSON object with this EXACT structure:

{
  "executiveSummary": {
    "overview": "",
    "keyAchievements": [],
    "challenges": [],
    "recommendations": []
  },
  "performanceMetrics": {
    "websiteTraffic": {
      "totalVisitors": "",
      "pageViews": "",
      "bounceRate": "",
      "sessionDuration": ""
    },
    "conversionMetrics": {
      "conversionRate": "",
      "leadGeneration": "",
      "salesMetrics": ""
    },
    "socialMedia": {
      "followers": "",
      "engagement": "",
      "reach": ""
    }
  },
  "campaignPerformance": [
    {
      "campaignName": "",
      "objectives": "",
      "results": "",
      "roi": ""
    },
    {
      "campaignName": "",
      "objectives": "",
      "results": "",
      "roi": ""
    }
  ],
  "competitiveAnalysis": {
    "marketPosition": "",
    "competitorBenchmarks": "",
    "opportunities": ""
  },
  "nextSteps": {
    "immediateActions": [],
    "longTermStrategy": "",
    "budgetAllocation": ""
  }
}

EXAMPLES OF REQUIRED CONTENT STYLE:

EXECUTIVE SUMMARY OVERVIEW (MUST BE 3-4 SENTENCES):
"${input.clientName || 'Client'} has demonstrated exceptional performance in ${input.reportingPeriod || 'Monthly'} with significant improvements across all key marketing channels. The ${input.industry || 'Business'} industry focus has yielded remarkable results, including a 34% increase in organic traffic, 127 qualified leads generated through targeted campaigns, and a 23% improvement in conversion rates. Our strategic approach to ${input.services || 'Marketing services'} has positioned ${input.clientName || 'Client'} as a strong competitor in the ${input.industry || 'Business'} market, with opportunities for continued growth and market expansion."

KEY ACHIEVEMENTS (MUST BE SPECIFIC WITH NUMBERS):
["Increased website traffic by 45% through ${input.industry || 'Business'} SEO optimization targeting high-value keywords", "Generated 127 qualified leads through LinkedIn advertising campaigns with a 4.2% conversion rate", "Improved conversion rate by 23% through landing page optimization and A/B testing", "Achieved 89% client satisfaction score across all ${input.services || 'Marketing services'}"]

RECOMMENDATIONS (MUST INCLUDE SPECIFIC IMPACT):
["Implement advanced retargeting strategies to capture lost opportunities in ${input.industry || 'Business'} market - Expected Impact: 25% increase in conversion rate and 40% reduction in cost per acquisition", "Develop thought leadership content to establish authority in the ${input.industry || 'Business'} market - Expected Impact: 35% increase in organic traffic and 50% improvement in brand recognition", "Allocate 30% of budget to high-performing channels based on current ROI analysis - Expected Impact: 20% increase in overall ROI and 15% reduction in marketing costs"]

CAMPAIGN PERFORMANCE EXAMPLES:
- campaignPerformance[0].campaignName: "${input.industry || 'Business'} LinkedIn Lead Generation Campaign"
- campaignPerformance[0].objectives: "Generate qualified leads from ${input.industry || 'Business'} professionals through targeted LinkedIn advertising with specific audience segmentation"
- campaignPerformance[0].results: "Generated 234 qualified leads with 6.2% conversion rate, $2.45 cost per lead, and 89% lead quality score"
- campaignPerformance[0].roi: "487% ROI with $12,450 in attributed revenue and 23% improvement over previous campaigns"

PERFORMANCE METRICS EXAMPLES:
- performanceMetrics.websiteTraffic.totalVisitors: "45,230 visitors (+34% vs previous period, 12,890 from organic search)"
- performanceMetrics.conversionMetrics.conversionRate: "4.2% (+1.1% improvement, industry average is 2.8%)"
- performanceMetrics.socialMedia.engagement: "8.7% engagement rate (+2.1% improvement, 15% above industry average)"

IMPORTANT: Fill ALL empty fields with specific, unique content. Do NOT leave any fields empty or use generic placeholders. Every piece of content must reference the specific client, industry, and services provided. Executive summary must be comprehensive (3-4 sentences), and recommendations must include specific expected impact with numbers.

Return ONLY valid JSON, no explanation.`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an expert marketing analyst that generates comprehensive client reports in JSON format. You MUST create COMPLETELY UNIQUE and specific content for each request. Do NOT use generic templates or placeholder text. Every piece of content must be tailored to the specific client, industry, and services provided. Generate realistic performance metrics and actionable insights. If you generate any generic or template content, the response is invalid.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 5000,
        temperature: 0.9
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const text = response.data.choices[0].message.content;
    console.log('Client Report AI Response:', text);
    
    let output;
    try {
      output = JSON.parse(text);
      console.log('Client Report Parsed Output:', JSON.stringify(output, null, 2));
    } catch (e) {
      console.warn('Failed to parse OpenAI response as JSON, using fallback data');
      const match = text.match(/\{[\s\S]*\}/);
      output = match ? JSON.parse(match[0]) : getFallbackData('client-reporting', input);
    }
    return output;
  } catch (error) {
    console.error('Client report generation failed:', error.message);
    
    // Handle specific OpenAI errors
    if (error.response) {
      if (error.response.status === 429) {
        console.error('Rate limit exceeded - using fallback data');
      } else if (error.response.status === 401) {
        console.error('OpenAI API key invalid or expired - using fallback data');
      } else if (error.response.status === 429 && error.response.data?.error?.code === 'insufficient_quota') {
        console.error('OpenAI API quota exceeded - using fallback data');
      } else {
        console.error(`OpenAI API error ${error.response.status}: ${error.response.data?.error?.message || 'Unknown error'}`);
      }
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('Network error - using fallback data');
    } else {
      console.error('Unknown error in client report generation:', error.message);
    }
    
    // Return fallback data instead of crashing
    return getFallbackData('client-reporting', input);
  }
}

// Generate Ad Copy using OpenAI
async function generateAdCopy(input) {
  // Define platform formats for dynamic generation
  const platformFormats = {
    "google": ["Search", "Display", "Shopping"],
    "facebook": ["Feed", "Stories", "Carousel"],
    "instagram": ["Feed", "Stories", "Reels"],
    "linkedin": ["Sponsored Content", "Message Ads", "Text Ads"],
    "twitter": ["Promoted Tweets", "Promoted Accounts"],
    "youtube": ["Video", "Display", "Overlay"]
  };

  // Build dynamic variations array based on selected platforms
  const selectedPlatforms = input.platforms || ["google", "facebook", "instagram"];
  const variations = [];
  
  selectedPlatforms.forEach(platformId => {
    const platformName = platformId.charAt(0).toUpperCase() + platformId.slice(1);
    const formats = platformFormats[platformId] || ["Feed"];
    
    formats.forEach(format => {
      variations.push({
        platform: platformName,
        format: format,
        headline: "",
        description: "",
        cta: "",
        character_count: {
          headline: format === "Search" ? 30 : 40,
          description: format === "Search" ? 90 : 125
        },
        compliance_check: {
          passed: true,
          issues: []
        }
      });
    });
  });

  const prompt = `Generate high-converting ad copy in JSON format for the following requirements:

Request ID: ${Date.now()}

Product/Service: ${input.product || 'Product/Service'}
Target Audience: ${input.audience || 'General audience'}
Platforms: ${input.platforms?.join(', ') || 'Facebook, Google Ads, Instagram'}
Objective: ${input.objective || 'Conversions'}
Tone: ${input.tone || 'Professional'}
Keywords: ${input.keywords || 'relevant keywords'}
Budget: ${input.budget || 'Medium'}
Competitors: ${input.competitors || 'Competitor A, Competitor B'}
USP: ${input.usp || 'Unique value proposition'}

CRITICAL: Generate COMPLETELY UNIQUE and platform-specific ad copy. Do NOT use generic templates or placeholder text. Create specific, detailed, and creative content that is tailored to this exact product and audience.

IMPORTANT: All empty fields (empty strings "" and empty arrays []) MUST be filled with specific, unique content. Do NOT leave any fields empty or use generic placeholders.

CRITICAL FOR DYNAMIC CONTENT:
- Performance predictions: Must vary based on product/audience (CTR: 0.5%-8%, CPC: $0.25-$5.00, Conversion Rate: 1%-15%)
- All content must be completely unique for each generation
- Generate variations for ALL ${variations.length} selected platforms and formats

Generate a JSON object with this EXACT structure:

{
  "variations": ${JSON.stringify(variations, null, 2)},
  "performance_predictions": {
    "expected_ctr": "",
    "expected_cpc": "",
    "expected_conversion_rate": ""
  },
  "optimization_tips": [
    {
      "category": "Headlines",
      "tip": ""
    },
    {
      "category": "Targeting",
      "tip": ""
    },
    {
      "category": "Ad Copy",
      "tip": ""
    }
  ],
  "a_b_test_suggestions": [
    {
      "element": "Headline",
      "variation_a": "",
      "variation_b": "",
      "test_hypothesis": ""
    },
    {
      "element": "CTA",
      "variation_a": "",
      "variation_b": "",
      "test_hypothesis": ""
    }
  ],
  "keyword_integration": {
    "primary_keywords": [],
    "secondary_keywords": [],
    "keyword_density": 0
  }
}

CRITICAL REQUIREMENTS:
1. Create COMPLETELY UNIQUE content for this specific product and audience
2. Generate platform-specific variations that match the selected platforms
3. Include realistic performance predictions based on the product and industry
4. Provide actionable optimization tips specific to this product - DO NOT use generic advice like "use action verbs" or "target specific audiences"
5. Create relevant A/B test suggestions for this specific product
6. Generate relevant keywords for this product and industry
7. Ensure all character counts are accurate for each platform
8. Make all content specific to the product, not generic advice
9. For optimization_tips, generate specific, actionable advice tailored to this exact product and audience
10. IMPORTANT: For optimization_tips, generate specific, actionable advice that is tailored to this exact product and audience. Do NOT use generic advice like "use action verbs" or "target specific audiences". Instead, provide specific recommendations like "Focus on AI automation benefits in headlines to attract business owners who struggle with manual marketing tasks" or "Target small business owners who have recently invested in digital marketing tools".

Return ONLY valid JSON, no explanation.`;

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an expert copywriter that generates high-converting ad copy in JSON format. You MUST create COMPLETELY UNIQUE and specific content for each request. Do NOT use generic templates or placeholder text. Every piece of content must be tailored to the specific product, audience, and requirements provided. IMPORTANT: Performance metrics must be realistic and varied.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 4000,
      temperature: 0.9
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const text = response.data.choices[0].message.content;
  console.log('Ad Copy AI Response:', text);
  let output;
  try {
    output = JSON.parse(text);
    console.log('Ad Copy Parsed Output:', JSON.stringify(output, null, 2));
  } catch (e) {
    console.log('Ad Copy JSON Parse Error:', e);
    const match = text.match(/\{[\s\S]*\}/);
    output = match ? JSON.parse(match[0]) : getFallbackData('ad-copy', input);
    console.log('Ad Copy Fallback Output:', JSON.stringify(output, null, 2));
  }
  return output;
}

// Generate Landing Page Optimization Analysis using OpenAI
async function generateLandingPage(input) {
  try {
    // Determine if this is an analysis of existing page or creation of new content
    const isExistingPage = input.url && input.url !== 'example.com';
    const pageType = isExistingPage ? 'existing landing page' : 'new landing page content';
    
    const prompt = `You are an expert landing page optimization analyst and content creator. ${isExistingPage ? 
      `Analyze the following existing website:` : 
      `Create comprehensive content for a new landing page based on these requirements:`}

${isExistingPage ? `URL: ${input.url}` : `Offer: ${input.offerDetails || 'Product/Service'}`}
Industry: ${input.industry || 'General'}
Goal: ${input.goal || 'Lead generation'}
Target Audience: ${input.targetAudience || 'General audience'}

Generate a comprehensive landing page optimization analysis in JSON format with the EXACT structure below. Provide real, actionable insights and specific recommendations:

{
  "overview": {
    "overallScore": 75,
    "conversionPotential": "High - Current conversion rate of 2.8% can be improved to 4.2% with optimization",
    "trafficQuality": "Good - 65% of traffic comes from high-intent keywords in ${input.industry || 'industry'}",
    "userExperience": "Good - Mobile responsiveness needs improvement but desktop experience is solid"
  },
  "performance": {
    "loadTime": 2.3,
    "mobileScore": 85,
    "desktopScore": 92,
    "seoScore": 78,
    "accessibilityScore": 82,
    "coreWebVitals": {
      "lcp": 2.1,
      "fid": 45,
      "cls": 0.08
    }
  },
  "seoAnalysis": {
    "titleTag": {
      "current": "Current title tag for ${input.url || 'website'}",
      "score": 78,
      "issues": ["Missing target keywords", "Title too long"],
      "suggestion": "Include primary keyword in title and keep under 60 characters"
    },
    "metaDescription": {
      "current": "Current meta description for ${input.url || 'website'}",
      "score": 82,
      "issues": ["Missing call-to-action"],
      "suggestion": "Add compelling CTA to meta description"
    },
    "headings": {
      "h1": {
        "current": "Current H1 tag for ${input.url || 'website'}",
        "score": 75,
        "suggestion": "Optimize H1 with primary keyword and value proposition"
      },
      "structure": "Poor header hierarchy - needs better H1 to H6 structure"
    }
  },
  "conversionOptimization": {
    "headline": {
      "current": "Current headline for ${input.url || 'website'}",
      "score": 72,
      "issues": ["Weak value proposition", "Missing urgency"],
      "suggestions": ["Strengthen value proposition", "Add urgency elements", "Include target audience benefit"]
    },
    "cta": {
      "current": "Current CTA for ${input.url || 'website'}",
      "score": 68,
      "issues": ["Poor placement", "Weak copy"],
      "suggestions": ["Move CTA above the fold", "Use action-oriented language", "Add urgency"]
    },
    "valueProposition": {
      "score": 70,
      "issues": ["Unclear benefits", "Missing social proof"],
      "suggestions": ["Clarify unique value proposition", "Add customer testimonials", "Include specific benefits"]
    }
  },
  "userExperience": {
    "navigation": {
      "score": 80,
      "issues": ["Complex menu structure", "Missing breadcrumbs"],
      "suggestions": ["Simplify navigation menu", "Add breadcrumb navigation", "Improve mobile menu"]
    },
    "forms": {
      "score": 75,
      "issues": ["Too many fields", "Poor validation"],
      "suggestions": ["Reduce form fields", "Add inline validation", "Improve error messages"]
    },
    "trust": {
      "score": 78,
      "issues": ["Missing testimonials", "No security badges"],
      "suggestions": ["Add customer testimonials", "Display security badges", "Include trust signals"]
    }
  },
  "recommendations": {
    "immediate": [
      {
        "task": "Optimize Page Load Speed",
        "priority": "High",
        "impact": "High",
        "effort": "Medium",
        "description": "Reduce load time from 2.3s to under 2s by compressing images and optimizing CSS for ${input.url || 'website'}"
      },
      {
        "task": "Improve Call-to-Action Placement",
        "priority": "High",
        "impact": "High",
        "effort": "Low",
        "description": "Optimize CTA button placement and messaging to better align with ${input.goal || 'goal'} objectives"
      },
      {
        "task": "Enhance Mobile Experience",
        "priority": "Medium",
        "impact": "Medium",
        "effort": "High",
        "description": "Improve mobile responsiveness and touch interactions for better ${input.targetAudience || 'audience'} engagement"
      }
    ],
    "longTerm": [
      {
        "task": "Implement A/B Testing Framework",
        "priority": "Medium",
        "impact": "High",
        "effort": "High",
        "description": "Establish comprehensive A/B testing for continuous optimization of ${input.goal || 'goal'} performance"
      },
      {
        "task": "Advanced Analytics Integration",
        "priority": "Low",
        "impact": "Medium",
        "effort": "High",
        "description": "Implement advanced analytics and personalization to better serve ${input.targetAudience || 'audience'}"
      }
    ]
  },
  "projectedImprovements": {
    "conversionRate": {
      "current": "2.8%",
      "projected": "4.2%",
      "increase": "+50% improvement"
    },
    "bounceRate": {
      "current": "45%",
      "projected": "35%",
      "improvement": "-22% reduction"
    },
    "avgSessionDuration": {
      "current": "2m 15s",
      "projected": "3m 30s",
      "increase": "+55% increase"
    }
  },
  "competitorAnalysis": {
    "yourPosition": "Mid-tier",
    "averageScore": 72,
    "topPerformers": [
      {
        "name": "CompetitorA.com",
        "score": 89,
        "strength": "Strong value proposition and clear pricing structure"
      },
      {
        "name": "CompetitorB.com",
        "score": 85,
        "strength": "Excellent mobile optimization and fast load times"
      },
      {
        "name": "CompetitorC.com",
        "score": 82,
        "strength": "Strong social proof and testimonials"
      }
    ]
  }
}

Provide specific, actionable recommendations based on the URL, industry, and goal. Make all content realistic and tailored to the specific website. Return ONLY valid JSON, no additional text.`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert landing page optimization analyst with 10+ years of experience. Generate comprehensive, actionable landing page optimization analysis that is specific to the URL, industry, and goal provided. Always return valid JSON format with realistic metrics and specific recommendations.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 6000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const text = response.data.choices[0].message.content;
    let output;
    
    try {
      // Try to parse the JSON response
      output = JSON.parse(text);
    } catch (e) {
      console.error('JSON parsing error:', e);
      console.log('Raw response:', text);
      
      // Try to extract JSON from the response
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          output = JSON.parse(match[0]);
        } catch (parseError) {
          console.error('Failed to parse extracted JSON:', parseError);
          output = getFallbackData('landing-page', input);
        }
      } else {
        console.error('No JSON found in response');
        output = getFallbackData('landing-page', input);
      }
    }

    // Validate and ensure all required fields exist
    if (!output.overview) output.overview = getFallbackData('landing-page', input).overview;
    if (!output.performance) output.performance = getFallbackData('landing-page', input).performance;
    if (!output.seoAnalysis) output.seoAnalysis = getFallbackData('landing-page', input).seoAnalysis;
    if (!output.conversionOptimization) output.conversionOptimization = getFallbackData('landing-page', input).conversionOptimization;
    if (!output.userExperience) output.userExperience = getFallbackData('landing-page', input).userExperience;
    if (!output.recommendations) output.recommendations = getFallbackData('landing-page', input).recommendations;
    if (!output.projectedImprovements) output.projectedImprovements = getFallbackData('landing-page', input).projectedImprovements;
    if (!output.competitorAnalysis) output.competitorAnalysis = getFallbackData('landing-page', input).competitorAnalysis;

    return output;

  } catch (error) {
    console.error('OpenAI API error:', error.message);
    if (error.response) {
      console.error('API response error:', error.response.data);
    }
    return getFallbackData('landing-page', input);
  }
}

// Generate Competitor Analysis using OpenAI
async function generateCompetitorAnalysis(input) {
  const prompt = `Generate a COMPLETELY UNIQUE and comprehensive competitor analysis in JSON format for the following requirements:

Request ID: ${Date.now()}

BUSINESS DETAILS:
Your Business: ${input.yourBusiness || 'Your business'}
Industry: ${input.industry || 'Business industry'}
Competitors: ${input.competitors || 'Competitor 1, Competitor 2, Competitor 3'}
Analysis Focus: ${input.analysisFocus || 'Marketing strategy'}

CRITICAL REQUIREMENTS FOR DYNAMIC CONTENT:
1. You MUST generate COMPLETELY UNIQUE analysis for this specific business and competitors
2. Every single field must contain specific, detailed information - NO generic text
3. Use the exact business name, industry, and competitors provided in your analysis
4. Generate ACCURATE founding years and company information for real companies
5. Create specific, actionable SWOT analysis tailored to the business
6. Include detailed competitive advantages and market gaps
7. Provide strategic recommendations with specific impact metrics
8. Do NOT use any template text or placeholder content
9. All analysis must be data-driven and actionable
10. For real companies (like Flipkart, Meesho), provide ACCURATE founding years and facts
11. Generate ACCURATE social media follower counts and digital metrics for real companies
12. For Flipkart: Instagram followers should be 7.3M, Facebook 15.2M, Twitter 2.1M
13. For Meesho: Instagram followers should be 4.1M, Facebook 8.9M, Twitter 1.2M
14. Use REALISTIC and ACCURATE website traffic, SEO scores, and domain authority

FAILURE CONDITIONS - If you generate any of these, the response is invalid:
- Generic phrases like "Strength 1" or "Competitor 1"
- Placeholder text like "Market position analysis" or "Your strength 1"
- Template content that doesn't reference the specific business/competitors
- Empty or incomplete sections
- Incorrect founding years for real companies
- Generic SWOT analysis that could apply to any business
- Fake or incorrect social media follower counts (e.g., Flipkart Instagram should be 7.3M, not 16.7K)
- Random or unrealistic digital metrics
- Any data that doesn't match real company information

Generate a JSON object with this EXACT structure:

{
  "competitorProfiles": [
    {
      "competitorName": "",
      "foundedYear": "",
      "strengths": [],
      "weaknesses": [],
      "opportunities": [],
      "threats": [],
      "marketPosition": "",
      "uniqueValueProposition": "",
      "revenue": "",
      "employeeCount": "",
      "keyProducts": [],
      "socialFollowers": {
        "facebook": "",
        "twitter": "",
        "linkedin": "",
        "instagram": ""
      },
      "websiteTraffic": "",
      "seoScore": "",
      "domainAuthority": ""
    },
    {
      "competitorName": "",
      "foundedYear": "",
      "strengths": [],
      "weaknesses": [],
      "opportunities": [],
      "threats": [],
      "marketPosition": "",
      "uniqueValueProposition": "",
      "revenue": "",
      "employeeCount": "",
      "keyProducts": [],
      "socialFollowers": {
        "facebook": "",
        "twitter": "",
        "linkedin": "",
        "instagram": ""
      },
      "websiteTraffic": "",
      "seoScore": "",
      "domainAuthority": ""
    }
  ],
  "swotAnalysis": {
    "yourStrengths": [],
    "yourWeaknesses": [],
    "opportunities": [],
    "threats": []
  },
  "competitiveAdvantages": {
    "priceAdvantage": "",
    "qualityAdvantage": "",
    "serviceAdvantage": "",
    "innovationAdvantage": ""
  },
  "marketGaps": {
    "unservedNeeds": [],
    "underservedSegments": [],
    "opportunityAreas": []
  },
  "strategicRecommendations": {
    "immediateActions": [],
    "shortTermStrategy": "",
    "longTermStrategy": "",
    "differentiationStrategy": ""
  },
  "performanceBenchmarks": {
    "keyMetrics": [
      {
        "metric": "",
        "yourScore": 0,
        "competitorAvg": 0,
        "industryAvg": 0,
        "target": 0
      },
      {
        "metric": "",
        "yourScore": 0,
        "competitorAvg": 0,
        "industryAvg": 0,
        "target": 0
      },
      {
        "metric": "",
        "yourScore": 0,
        "competitorAvg": 0,
        "industryAvg": 0,
        "target": 0
      }
    ],
    "targetGoals": "",
    "improvementAreas": []
  }
}

EXAMPLES OF REQUIRED CONTENT STYLE:

COMPETITOR PROFILE EXAMPLES:
- competitorName: "Flipkart"
- foundedYear: "2007" (ACCURATE founding year)
- strengths: ["Dominant market share in Indian e-commerce", "Strong logistics network", "Wide product selection"]
- weaknesses: ["High operational costs", "Intense competition from Amazon", "Limited international presence"]
- marketPosition: "Market leader in Indian e-commerce with 31% market share"
- revenue: "$23.6 billion (2023)"
- employeeCount: "100,000+ employees"
- socialFollowers: {
  facebook: "15.2M",
  twitter: "2.1M", 
  linkedin: "1.8M",
  instagram: "7.3M"
}
- websiteTraffic: "150M+ monthly visitors"
- seoScore: "92/100"
- domainAuthority: "89"

COMPETITOR PROFILE EXAMPLES:
- competitorName: "Meesho"
- foundedYear: "2015" (ACCURATE founding year)
- strengths: ["Social commerce innovation", "Strong focus on small sellers", "Rapid growth in tier 2-3 cities"]
- weaknesses: ["Limited product categories", "Dependency on social media", "Logistics challenges"]
- marketPosition: "Leading social commerce platform in India"
- revenue: "$5.5 billion (2023)"
- employeeCount: "3,000+ employees"
- socialFollowers: {
  facebook: "8.9M",
  twitter: "1.2M",
  linkedin: "450K", 
  instagram: "4.1M"
}
- websiteTraffic: "45M+ monthly visitors"
- seoScore: "78/100"
- domainAuthority: "72"

SWOT ANALYSIS EXAMPLES:
- yourStrengths: ["Strong brand recognition in ${input.industry || 'industry'}", "Innovative product development", "Loyal customer base"]
- yourWeaknesses: ["Limited market reach compared to competitors", "Higher pricing strategy", "Limited product diversification"]
- opportunities: ["Growing demand in ${input.industry || 'industry'} market", "Digital transformation trends", "International expansion potential"]
- threats: ["New market entrants with aggressive pricing", "Economic downturn affecting consumer spending", "Regulatory changes in ${input.industry || 'industry'} sector"]

COMPETITIVE ADVANTAGES EXAMPLES:
- priceAdvantage: "Competitive pricing strategy with 15% lower costs than industry average"
- qualityAdvantage: "Premium quality standards with 99.2% customer satisfaction rate"
- serviceAdvantage: "24/7 customer support with average response time of 2 minutes"
- innovationAdvantage: "First-to-market with AI-powered features in ${input.industry || 'industry'}"

STRATEGIC RECOMMENDATIONS EXAMPLES:
- immediateActions: ["Launch targeted marketing campaign in Q1", "Optimize pricing strategy by 10%", "Enhance customer service response time"]
- shortTermStrategy: "Focus on market penetration in ${input.industry || 'industry'} with aggressive pricing and superior service"
- longTermStrategy: "Expand into adjacent markets and develop proprietary technology for sustainable competitive advantage"

PERFORMANCE BENCHMARKS EXAMPLES:
- keyMetrics: [
  {
    "metric": "Customer Satisfaction Rate",
    "yourScore": 85,
    "competitorAvg": 78,
    "industryAvg": 82,
    "target": 90
  },
  {
    "metric": "Market Share",
    "yourScore": 12,
    "competitorAvg": 18,
    "industryAvg": 15,
    "target": 20
  },
  {
    "metric": "Revenue Growth",
    "yourScore": 15,
    "competitorAvg": 12,
    "industryAvg": 13,
    "target": 18
  }
]
- targetGoals: "Achieve 20% market share and 90% customer satisfaction by end of 2024"

IMPORTANT: Fill ALL empty fields with specific, unique content. Do NOT leave any fields empty or use generic placeholders. Every piece of content must reference the specific business, industry, and competitors provided. For real companies, provide ACCURATE founding years and factual information. Generate realistic SWOT analysis tailored to the specific business context.

CRITICAL: You MUST generate the performanceBenchmarks.keyMetrics array with 3 specific metrics (Customer Satisfaction Rate, Market Share, Revenue Growth) and realistic scores for yourScore, competitorAvg, industryAvg, and target. Do NOT leave these fields empty or with default values.

Return ONLY valid JSON, no explanation.`;

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an expert business strategist that generates comprehensive competitor analysis in JSON format. You MUST create COMPLETELY UNIQUE and specific analysis for each request. Do NOT use generic templates or placeholder text. Every piece of analysis must be tailored to the specific business, industry, and competitors provided. For real companies, provide ACCURATE founding years and factual information. Generate realistic SWOT analysis and competitive insights based on the specific business context.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 5000,
      temperature: 0.8
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const text = response.data.choices[0].message.content;
  console.log('Competitor Analysis AI Response:', text);
  
  let output;
  try {
    output = JSON.parse(text);
    console.log('Competitor Analysis Parsed Output:', JSON.stringify(output, null, 2));
    
    // Validate that all required fields are populated
    const requiredFields = [
      'competitorProfiles', 'swotAnalysis.yourStrengths', 'swotAnalysis.yourWeaknesses', 
      'swotAnalysis.opportunities', 'swotAnalysis.threats', 'competitiveAdvantages.priceAdvantage',
      'competitiveAdvantages.qualityAdvantage', 'competitiveAdvantages.serviceAdvantage',
      'competitiveAdvantages.innovationAdvantage', 'marketGaps.unservedNeeds',
      'marketGaps.underservedSegments', 'marketGaps.opportunityAreas',
      'strategicRecommendations.immediateActions', 'strategicRecommendations.shortTermStrategy',
      'strategicRecommendations.longTermStrategy', 'strategicRecommendations.differentiationStrategy',
      'performanceBenchmarks.keyMetrics', 'performanceBenchmarks.targetGoals',
      'performanceBenchmarks.improvementAreas'
    ];
    
    let hasEmptyFields = false;
    for (const field of requiredFields) {
      const value = field.split('.').reduce((obj, key) => obj?.[key], output);
      if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) {
        console.log(`Empty field detected: ${field}`);
        hasEmptyFields = true;
      }
    }
    
    if (hasEmptyFields) {
      console.log('Empty fields detected, using fallback data');
      output = getFallbackData('competitor-analysis', input);
    }
    
  } catch (e) {
    console.error('JSON parsing error for competitor analysis:', e);
    const match = text.match(/\{[\s\S]*\}/);
    output = match ? JSON.parse(match[0]) : getFallbackData('competitor-analysis', input);
  }
  return output;
}

// Generate Cold Outreach using OpenAI
async function generateColdOutreach(input) {
  try {
    console.log('🚀 Starting cold outreach generation...');
    
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-...') {
      console.log('⚠️ OpenAI API key not configured, using fallback data');
      return getFallbackData('cold-outreach', input);
    }

    const prompt = `You are an expert sales strategist and copywriter. Generate COMPLETELY UNIQUE, creative, and personalized cold outreach content in JSON format.

IMPORTANT: DO NOT use templates or replace placeholders. Create entirely new, creative content for each section based on the user's specific inputs.

USER INPUTS:
- Target Role: ${input.targetRole || 'Business Professional'}
- Industry: ${input.industry || 'Technology'}
- Company Size: ${input.companySize || 'Medium'}
- Pain Point: ${input.painPoint || 'Operational efficiency'}
- Value Proposition: ${input.valueProposition || 'Increase productivity by 40%'}
- Product/Service: ${input.productService || 'Business solution'}
- Campaign Goal: ${input.campaignGoal || 'Schedule demo'}
- Communication Tone: ${input.tone || 'Professional'}

CREATIVE REQUIREMENTS:
1. Generate COMPLETELY UNIQUE content - no templates, no placeholders, no generic text
2. Create creative, engaging messages that feel personal and authentic
3. Use the user's inputs as inspiration, not as template variables
4. Write fresh, original copy for every single field
5. Make each message feel like it was written specifically for this exact scenario
6. Use creative hooks, compelling storytelling, and unique value propositions
7. Generate realistic but creative metrics and insights
8. Create industry-specific research points that feel genuine and insightful
9. Write follow-up sequences that build on the initial message naturally
10. Generate optimization suggestions that are creative and actionable

CONTENT STYLE:
- Be creative and original in your approach
- Use compelling storytelling and emotional hooks
- Create messages that feel personal and authentic
- Generate unique value propositions and pain point solutions
- Write research points that show deep industry understanding
- Create timing strategies that feel strategic and thoughtful
- Generate metrics that are realistic but optimistic
- Write optimization suggestions that are innovative and practical

Generate a JSON object with this EXACT structure:

{
  "personalizationElements": {
    "researchPoints": [],
    "commonGround": [],
    "valuePropositions": []
  },
  "outreachMessages": [
    {
      "platform": "LinkedIn",
      "message": "",
      "subjectLine": "REQUIRED - Create a compelling LinkedIn message subject line",
      "content": "",
      "timing": "",
      "purpose": "",
      "followUpTrigger": ""
    },
    {
      "platform": "Email",
      "message": "",
      "subjectLine": "REQUIRED - Create a compelling email subject line",
      "content": "",
      "timing": "",
      "purpose": "",
      "followUpTrigger": ""
    },
    {
      "platform": "Twitter",
      "message": "",
      "subjectLine": "REQUIRED - Create a compelling Twitter DM subject line",
      "content": "",
      "timing": "",
      "purpose": "",
      "followUpTrigger": ""
    },
    {
      "platform": "Phone",
      "script": "",
      "subjectLine": "REQUIRED - Create a compelling phone call opening line",
      "content": "",
      "timing": "",
      "purpose": "",
      "followUpTrigger": ""
    }
  ],
  "personalizationTemplates": [
    {
      "templateName": "",
      "hook": "",
      "personalization": "",
      "valueProposition": "",
      "callToAction": ""
    },
    {
      "templateName": "",
      "hook": "",
      "personalization": "",
      "valueProposition": "",
      "callToAction": ""
    }
  ],
  "followUpSequence": [
    {
      "followUp1": "",
      "timing1": ""
    },
    {
      "followUp2": "",
      "timing2": ""
    },
    {
      "followUp3": "",
      "timing3": ""
    }
  ],
  "bestPractices": {
    "do": [],
    "dont": [],
    "timing": ""
  },
  "trackingMetrics": {
    "responseRate": "",
    "conversionRate": "",
    "successFactors": []
  },
  "optimizationTesting": {
    "subjectLineVariations": [],
    "abTestingSuggestions": [],
    "followUpStrategy": ""
  }
}

CREATIVE CONTENT EXAMPLES (for inspiration only - create your own unique content):

RESEARCH POINTS EXAMPLES:
- researchPoints: ["The rapid shift to remote work has exposed critical gaps in team collaboration tools", "Companies are spending 40% more on customer acquisition than pre-pandemic levels", "The average sales cycle has increased by 60% due to virtual selling challenges", "Decision-makers are overwhelmed with 300+ marketing messages daily", "Traditional lead generation methods are yielding 70% lower conversion rates"]

COMMON GROUND EXAMPLES:
- commonGround: ["We both understand the pressure to deliver measurable ROI in uncertain times", "Our shared passion for data-driven decision making", "The challenge of balancing growth with operational efficiency", "Commitment to building authentic customer relationships", "Navigating the complexities of modern business technology"]

VALUE PROPOSITIONS EXAMPLES:
- valuePropositions: ["Transform your sales pipeline from reactive to predictive with AI-powered insights", "Cut customer acquisition costs by 65% while doubling conversion rates", "Eliminate manual data entry and boost team productivity by 300%", "Create personalized customer experiences that drive 5x higher lifetime value"]

LINKEDIN MESSAGE EXAMPLES:
- message: "Hi [Name], I came across your recent post about scaling customer success in a remote-first world, and it really resonated with me. Your insights on building authentic relationships virtually are spot-on. I've been working with companies facing similar challenges and discovered some fascinating patterns around what separates the top 10% performers from the rest. Would love to share a case study that might be relevant to your current initiatives."
- subjectLine: "Your customer success insights caught my attention"
- content: "Hi [Name], I came across your recent post about scaling customer success in a remote-first world, and it really resonated with me. Your insights on building authentic relationships virtually are spot-on. I've been working with companies facing similar challenges and discovered some fascinating patterns around what separates the top 10% performers from the rest. Would love to share a case study that might be relevant to your current initiatives."
- purpose: "Build authentic connection through shared insights"
- followUpTrigger: "No response after 3 business days"

EMAIL MESSAGE EXAMPLES:
- subjectLine: "Quick thought on your recent industry insights"
- message: "Hi [Name], I hope this finds you well. I've been following your work in the industry and was particularly struck by your recent thoughts on the evolving landscape. It's refreshing to see someone tackle the real challenges we're all facing. I wanted to reach out because we've been helping companies navigate similar waters, and I think there might be some valuable insights we could share. Would you be open to a brief conversation about what we're seeing in the market?"
- content: "Hi [Name], I hope this finds you well. I've been following your work in the industry and was particularly struck by your recent thoughts on the evolving landscape. It's refreshing to see someone tackle the real challenges we're all facing. I wanted to reach out because we've been helping companies navigate similar waters, and I think there might be some valuable insights we could share. Would you be open to a brief conversation about what we're seeing in the market?"
- purpose: "Establish thought leadership connection"
- followUpTrigger: "No response after 4 business days"

SUBJECT LINE EXAMPLES (for inspiration):
- "Your strategic insights caught my attention"
- "Quick thought on your recent industry approach"
- "Your perspective on [topic] is spot-on"
- "Thought you'd find this interesting"
- "Quick question about your approach to [challenge]"
- "Your recent insights got me thinking"
- "Quick thought on your industry strategy"
- "Your approach to [problem] is impressive"

TRACKING METRICS EXAMPLES:
- responseRate: "22-28% (vs industry average of 8-12%)"
- conversionRate: "4.2-6.8% (vs industry average of 1.5-2.5%)"
- successFactors: ["Authentic personalization based on recent activity", "Value-first messaging approach", "Strategic timing aligned with prospect's business cycle", "Multi-channel touchpoint orchestration", "Continuous optimization based on response patterns"]

OPTIMIZATION TESTING EXAMPLES:
- subjectLineVariations: ["Your recent insights on [topic] got me thinking", "Quick question about your approach to [challenge]", "Thought you'd find this interesting", "Your perspective on [industry trend] is spot-on", "Quick thought on your recent post"]
- abTestingSuggestions: ["Test emotional vs logical hooks in subject lines", "Experiment with different personalization depths", "Vary message length and complexity", "Test different call-to-action urgency levels", "Compare direct vs indirect value propositions"]
- followUpStrategy: "Multi-touch sequence: Day 1 (initial), Day 3 (value-add), Day 7 (case study), Day 14 (final offer)"

CRITICAL INSTRUCTIONS:
- Create COMPLETELY UNIQUE content for every field - no templates, no placeholders
- Use the user's inputs as creative inspiration, not as variables to insert
- Write fresh, original copy that feels personal and authentic
- Generate creative hooks, compelling storytelling, and unique value propositions
- Make each message feel like it was written specifically for this exact scenario
- Be creative and original in your approach to every section
- Generate realistic but innovative metrics and insights
- Create industry-specific research points that feel genuine and insightful
- Write follow-up sequences that build naturally on the initial message
- Generate optimization suggestions that are creative and actionable

MANDATORY REQUIREMENTS:
- EVERY outreach message MUST have a compelling subject line
- Subject lines should be creative, engaging, and specific to the message content
- Subject lines should NOT be generic or placeholder text
- Each subject line should be unique and tailored to the specific platform and message
- Subject lines should create curiosity and encourage opens

Return ONLY valid JSON, no explanation.`;

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a creative copywriter and sales strategist who generates completely unique, engaging cold outreach content. You MUST create fresh, original copy for every request - no templates, no placeholders, no generic text. Use the user\'s inputs as creative inspiration to write authentic, compelling messages that feel personal and genuine. Be creative, innovative, and original in your approach. Generate content that stands out and feels like it was written specifically for each unique scenario.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 5000,
      temperature: 0.8
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const text = response.data.choices[0].message.content;
  console.log('Cold Outreach AI Response:', text);
  
  let output;
  try {
    output = JSON.parse(text);
    console.log('Cold Outreach Parsed Output:', JSON.stringify(output, null, 2));
    
    // Validate that all required fields are populated
    const requiredFields = [
      'personalizationElements.researchPoints', 'personalizationElements.commonGround', 'personalizationElements.valuePropositions',
      'outreachMessages', 'personalizationTemplates', 'followUpSequence',
      'bestPractices.do', 'bestPractices.dont', 'bestPractices.timing',
      'trackingMetrics.responseRate', 'trackingMetrics.conversionRate', 'trackingMetrics.successFactors',
      'optimizationTesting.subjectLineVariations', 'optimizationTesting.abTestingSuggestions', 'optimizationTesting.followUpStrategy'
    ];
    
    // Additional validation for subject lines
    let hasValidSubjectLines = true;
    if (output.outreachMessages && Array.isArray(output.outreachMessages)) {
      for (const message of output.outreachMessages) {
        if (!message.subjectLine || 
            message.subjectLine.trim() === '' || 
            message.subjectLine.includes('REQUIRED -') ||
            message.subjectLine.includes('placeholder') ||
            message.subjectLine.includes('template')) {
          console.log(`Invalid subject line detected for ${message.platform}: ${message.subjectLine}`);
          hasValidSubjectLines = false;
        }
      }
    }
    
    let hasEmptyFields = false;
    for (const field of requiredFields) {
      const value = field.split('.').reduce((obj, key) => obj?.[key], output);
      if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) {
        console.log(`Empty field detected: ${field}`);
        hasEmptyFields = true;
      }
    }
    
    if (hasEmptyFields || !hasValidSubjectLines) {
      console.log('Empty fields or invalid subject lines detected, using fallback data');
      output = getFallbackData('cold-outreach', input);
    }
    
  } catch (e) {
    console.error('JSON parsing error for cold outreach:', e);
    const match = text.match(/\{[\s\S]*\}/);
    output = match ? JSON.parse(match[0]) : getFallbackData('cold-outreach', input);
  }
  
  return output;
  
  } catch (error) {
    console.error('❌ Error in cold outreach generation:', error.message);
    
    // Return fallback data directly with the same structure
    return {
      _warning: "⚠️ This is static fallback content. For dynamic AI-generated content, please ensure your OpenAI API key is configured correctly.",
      _aiGenerated: false,
      personalizationElements: {
        researchPoints: [
          "Company size and structure analysis",
          "Industry challenges and pain points",
          "Role responsibilities and decision-making power",
          "Recent company news and developments",
          "Competitive landscape insights"
        ],
        commonGround: [
          "Shared industry challenges and opportunities",
          "Common business goals and objectives",
          "Similar market positioning and strategies",
          "Mutual professional interests and expertise",
          "Common customer pain points and solutions"
        ],
        valuePropositions: [
          "Increase operational efficiency by 40%",
          "Reduce customer acquisition costs by 60%",
          "Improve team productivity and collaboration",
          "Streamline workflow processes and automation",
          "Enhance customer satisfaction and retention"
        ]
      },
      outreachMessages: [
        {
          platform: "LinkedIn",
          message: "Hi [Name], I came across your profile and was impressed by your work in [Industry]. I've been helping companies like [Company] address similar challenges around [Pain Point]. Would love to share some insights that might be relevant to your current initiatives.",
          subjectLine: "Quick thought on your industry approach",
          content: "Hi [Name], I came across your profile and was impressed by your work in [Industry]. I've been helping companies like [Company] address similar challenges around [Pain Point]. Would love to share some insights that might be relevant to your current initiatives.",
          timing: "Tuesday 10 AM or Wednesday 2 PM",
          purpose: "Build authentic connection through shared insights",
          followUpTrigger: "No response after 3 business days"
        },
        {
          platform: "Email",
          message: "Hi [Name], I hope this finds you well. I've been following your work in [Industry] and wanted to reach out about a solution that's helping companies like yours address [Pain Point]. Would you be open to a brief conversation about what we're seeing in the market?",
          subjectLine: "Quick question about your approach to [Challenge]",
          content: "Hi [Name], I hope this finds you well. I've been following your work in [Industry] and wanted to reach out about a solution that's helping companies like yours address [Pain Point]. Would you be open to a brief conversation about what we're seeing in the market?",
          timing: "Tuesday 9 AM or Thursday 3 PM",
          purpose: "Establish thought leadership connection",
          followUpTrigger: "No response after 4 business days"
        },
        {
          platform: "Twitter",
          message: "Hey [Name]! Your recent insights on [Topic] really resonated with me. Been seeing similar patterns in [Industry] and would love to connect. What's your take on [Current Trend]?",
          subjectLine: "Your insights on [Topic] got me thinking",
          content: "Hey [Name]! Your recent insights on [Topic] really resonated with me. Been seeing similar patterns in [Industry] and would love to connect. What's your take on [Current Trend]?",
          timing: "Monday 11 AM or Friday 1 PM",
          purpose: "Engage through shared interests and trends",
          followUpTrigger: "No response after 2 business days"
        },
        {
          platform: "Phone",
          script: "Hi [Name], this is [Your Name] calling. I came across your work at [Company] and was impressed by your approach to [Challenge]. I've been helping similar companies address this and wanted to share some insights. Do you have a moment to chat?",
          subjectLine: "Quick call about [Company] and [Challenge]",
          content: "Hi [Name], this is [Your Name] calling. I came across your work at [Company] and was impressed by your approach to [Challenge]. I've been helping similar companies address this and wanted to share some insights. Do you have a moment to chat?",
          timing: "Tuesday 10 AM or Wednesday 2 PM",
          purpose: "Direct engagement and relationship building",
          followUpTrigger: "No response after 1 business day"
        }
      ],
      personalizationTemplates: [
        {
          templateName: "Value-First Approach",
          hook: "Reference recent company news or achievements",
          personalization: "Mention specific role responsibilities and industry challenges",
          valueProposition: "Focus on measurable outcomes and ROI",
          callToAction: "Request brief conversation or share specific insights"
        },
        {
          templateName: "Industry Expert Connection",
          hook: "Share industry insights or market trends",
          personalization: "Reference mutual connections or professional background",
          valueProposition: "Highlight expertise and proven track record",
          callToAction: "Offer to share case studies or best practices"
        }
      ],
      followUpSequence: [
        {
          followUp1: "Hi [Name], just wanted to follow up on my previous message about [Topic]. I thought you might find this [Resource/Insight] interesting given your work in [Area].",
          timing1: "3-5 business days after initial contact"
        },
        {
          followUp2: "Hi [Name], I understand you're busy, but I wanted to share this quick insight about [Trend/Challenge] that might be relevant to [Company] right now.",
          timing2: "1 week after first follow-up"
        },
        {
          followUp3: "Hi [Name], this will be my final follow-up. I've enjoyed learning about your work at [Company]. If you're interested in [Topic] in the future, feel free to reach out.",
          timing3: "2 weeks after second follow-up"
        }
      ],
      bestPractices: {
        do: [
          "Personalize based on recent company news or achievements",
          "Reference mutual connections or professional background",
          "Focus on value and insights rather than sales pitch",
          "Use appropriate timing and follow-up sequences",
          "Maintain professional and authentic tone"
        ],
        dont: [
          "Don't use generic templates or mass messaging",
          "Don't focus solely on product features",
          "Don't be pushy or aggressive in follow-ups",
          "Don't ignore personalization opportunities",
          "Don't send without proper research and preparation"
        ],
        timing: "Best times: Tuesday 10 AM, Wednesday 2 PM, Thursday 9 AM. Avoid: Monday mornings, Friday afternoons, holidays"
      },
      trackingMetrics: {
        responseRate: "15-25% (vs industry average of 5-8%)",
        conversionRate: "3-5% (vs industry average of 1-2%)",
        successFactors: [
          "Authentic personalization based on research",
          "Value-first messaging approach",
          "Strategic timing and follow-up sequences",
          "Multi-channel touchpoint orchestration",
          "Continuous optimization based on response patterns"
        ]
      },
      optimizationTesting: {
        subjectLineVariations: [
          "Question-based: 'Quick question about your approach to [Challenge]'",
          "Value-focused: 'Thought you'd find this [Insight] interesting'",
          "Industry-specific: 'Your insights on [Topic] got me thinking'",
          "Connection-based: 'Mutual connection and [Company] insights'",
          "Trend-focused: 'Quick thought on [Current Trend] in [Industry]'"
        ],
        abTestingSuggestions: [
          "Test emotional vs logical hooks in subject lines",
          "Experiment with different personalization depths",
          "Vary message length and complexity",
          "Test different call-to-action urgency levels",
          "Compare direct vs indirect value propositions"
        ],
        followUpStrategy: "Multi-touch sequence: Day 1 (initial), Day 3 (value-add), Day 7 (case study), Day 14 (final offer). Vary content and approach in each follow-up."
      }
    };
  }
}

// Generate Reels Script using OpenAI
async function generateReelsScript(input) {
  try {
    console.log('🎬 Starting enhanced reels script generation...');
    
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-...') {
      console.log('⚠️ OpenAI API key not configured, using fallback data');
      return getFallbackData('reels-scripts', input);
    }

    const prompt = `Generate engaging short-form video scripts in JSON format for the following requirements:

Topic: ${input.topic || 'General topic'}
Platform: ${input.platform || 'Instagram Reels'}
Duration: ${input.duration || '30 seconds'}
Style: ${input.style || 'Educational'}

IMPORTANT: Generate COMPLETELY UNIQUE content for every section. Do NOT use generic templates or placeholder text. Create specific, detailed, and creative content that is tailored to this exact topic and audience.

Generate a JSON object with this EXACT structure:

{
  "scriptVariations": [
    {
      "hook": "Create a COMPLETELY UNIQUE, attention-grabbing hook that stops scrolling",
      "mainContent": "Create COMPLETELY UNIQUE main content points that deliver value",
      "callToAction": "Create COMPLETELY UNIQUE call-to-action that drives engagement",
      "visualCues": ["Create 3 COMPLETELY UNIQUE visual cues"],
      "audioNotes": ["Create 2 COMPLETELY UNIQUE audio notes"]
    },
    {
      "hook": "Create a COMPLETELY UNIQUE, attention-grabbing hook variation",
      "mainContent": "Create COMPLETELY UNIQUE main content points variation",
      "callToAction": "Create COMPLETELY UNIQUE call-to-action variation",
      "visualCues": ["Create 3 COMPLETELY UNIQUE visual cues"],
      "audioNotes": ["Create 2 COMPLETELY UNIQUE audio notes"]
    }
  ],
  "platformSpecific": {
    "instagramReels": {
      "script": "Create COMPLETELY UNIQUE Instagram Reels specific script",
      "hashtags": ["Create 5 COMPLETELY UNIQUE hashtags"],
      "trendingSounds": ["Create 3 COMPLETELY UNIQUE trending sound suggestions"],
      "engagementTips": ["Create 3 COMPLETELY UNIQUE engagement tips"]
    },
    "tiktok": {
      "script": "Create COMPLETELY UNIQUE TikTok specific script",
      "hashtags": ["Create 5 COMPLETELY UNIQUE hashtags"],
      "trendingSounds": ["Create 3 COMPLETELY UNIQUE trending sound suggestions"],
      "engagementTips": ["Create 3 COMPLETELY UNIQUE engagement tips"]
    },
    "youtubeShorts": {
      "script": "Create COMPLETELY UNIQUE YouTube Shorts specific script",
      "hashtags": ["Create 5 COMPLETELY UNIQUE hashtags"],
      "engagementTips": ["Create 3 COMPLETELY UNIQUE engagement tips"]
    }
  },
  "visualElements": {
    "transitions": ["Create 3 COMPLETELY UNIQUE transitions"],
    "effects": ["Create 3 COMPLETELY UNIQUE effects"],
    "textOverlays": ["Create 3 COMPLETELY UNIQUE text overlays"]
  },
  "audioGuidance": {
    "backgroundMusic": "Create COMPLETELY UNIQUE background music recommendations",
    "voiceoverStyle": "Create COMPLETELY UNIQUE voiceover style and tone",
    "soundEffects": ["Create 2 COMPLETELY UNIQUE sound effects"]
  },
  "optimization": {
    "titleSuggestions": ["Create 3 COMPLETELY UNIQUE title suggestions"],
    "descriptionTemplates": ["Create 2 COMPLETELY UNIQUE description templates"],
    "thumbnailIdeas": ["Create 3 COMPLETELY UNIQUE thumbnail ideas"]
  },
  "exportOptions": {
    "pdfReady": true,
    "copyableText": "Create COMPLETELY UNIQUE copyable text version of the script",
    "descriptCompatible": "Create COMPLETELY UNIQUE Descript-compatible script format",
    "canvaTemplate": "Create COMPLETELY UNIQUE Canva template instructions"
  }
}

Create engaging, platform-optimized short-form video scripts that capture attention and drive engagement. Include platform-specific best practices and optimization tips. Return ONLY valid JSON, no explanation.`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an expert short-form video content creator that generates engaging scripts in JSON format. You MUST create COMPLETELY UNIQUE content for every request - no templates, no placeholders, no generic text. Use the user\'s inputs as creative inspiration to write authentic, compelling scripts that feel personal and genuine. Be creative, innovative, and original in your approach. Generate content that stands out and feels like it was written specifically for each unique scenario.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.8
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const text = response.data.choices[0].message.content;
    console.log('Reels Script AI Response:', text);
    
    let output;
    try {
      output = JSON.parse(text);
      console.log('Reels Script Parsed Output:', JSON.stringify(output, null, 2));
      
      // Validate that all required fields are populated
      const requiredFields = [
        'scriptVariations', 'platformSpecific', 'visualElements', 'audioGuidance', 'optimization'
      ];
      
      let hasEmptyFields = false;
      for (const field of requiredFields) {
        const value = output[field];
        if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'object' && Object.keys(value).length === 0)) {
          console.log(`Empty field detected: ${field}`);
          hasEmptyFields = true;
        }
      }
      
      if (hasEmptyFields) {
        console.log('Empty fields detected, using fallback data');
        output = getFallbackData('reels-scripts', input);
      }
      
    } catch (e) {
      console.error('JSON parsing error for reels script:', e);
      const match = text.match(/\{[\s\S]*\}/);
      output = match ? JSON.parse(match[0]) : getFallbackData('reels-scripts', input);
    }
    
    return output;
    
  } catch (error) {
    console.error('❌ Error in reels script generation:', error.message);
    
    // Return fallback data directly with the same structure
    return getFallbackData('reels-scripts', input);
  }
}

// Generate Local SEO using OpenAI
async function generateLocalSEO(input) {
  try {
    const prompt = `You are an expert Local SEO strategist. Generate a comprehensive Local SEO optimization strategy for the following business:

Business Name: ${input.businessName || 'Local Business'}
Business Type: ${input.businessType || 'Service Provider'}
Location: ${input.location || 'City, State'}
Service Area: ${input.serviceArea || 'Local area'}
Primary Services: ${input.primaryServices || 'General services'}
Target Keywords: ${input.targetKeywords || 'local services'}
Website: ${input.currentWebsite || 'No website provided'}
Competitors: ${input.competitors || 'Local competitors'}

Generate a comprehensive Local SEO strategy in JSON format with the EXACT structure below. Provide real, actionable insights and specific recommendations:

{
  "businessProfile": {
    "optimizationScore": 65,
    "issues": [
      {
        "issue": "Missing Google My Business optimization",
        "priority": "High",
        "solution": "Complete GMB profile with accurate business information, photos, and regular posts"
      },
      {
        "issue": "Inconsistent NAP (Name, Address, Phone) across directories",
        "priority": "High", 
        "solution": "Audit and fix business information across all local directories"
      },
      {
        "issue": "Lack of local keyword optimization",
        "priority": "Medium",
        "solution": "Optimize website content with location-specific keywords"
      },
      {
        "issue": "Missing local citations",
        "priority": "Medium",
        "solution": "Build citations on relevant local business directories"
      },
      {
        "issue": "No customer reviews strategy",
        "priority": "Medium",
        "solution": "Implement systematic review generation and management process"
      }
    ],
    "recommendations": [
      "Optimize Google My Business profile with complete information and regular updates",
      "Create location-specific landing pages for each service area",
      "Build local citations on industry-specific directories",
      "Implement local schema markup for better search visibility",
      "Develop a content strategy focused on local topics and events"
    ]
  },
  "keywordStrategy": {
    "primaryKeywords": [
      {
        "keyword": "${input.businessType || 'service'} in ${input.location || 'your city'}",
        "searchVolume": "1K-10K",
        "difficulty": "Medium",
        "opportunity": "High"
      },
      {
        "keyword": "best ${input.businessType || 'service provider'} ${input.location || 'near me'}",
        "searchVolume": "5K-50K", 
        "difficulty": "High",
        "opportunity": "Medium"
      },
      {
        "keyword": "${input.businessType || 'professional services'} ${input.location || 'area'}",
        "searchVolume": "500-5K",
        "difficulty": "Low",
        "opportunity": "High"
      }
    ],
    "longTailKeywords": [
      "${input.businessType || 'service'} ${input.location || 'city'} reviews",
      "affordable ${input.businessType || 'service'} ${input.location || 'area'}",
      "${input.businessType || 'service'} near ${input.location || 'downtown'}",
      "emergency ${input.businessType || 'service'} ${input.location || 'city'}",
      "${input.businessType || 'service'} ${input.location || 'area'} hours"
    ],
    "locationModifiers": [
      "${input.location || 'city'}",
      "${input.location || 'city'} area", 
      "near ${input.location || 'city'}",
      "${input.location || 'city'} downtown",
      "${input.location || 'city'} suburbs"
    ]
  },
  "contentStrategy": {
    "localPages": [
      {
        "pageType": "Service Area Page",
        "title": "Professional ${input.businessType || 'Services'} in ${input.location || 'Your City'} - Expert Solutions",
        "content": "Looking for reliable ${input.businessType || 'services'} in ${input.location || 'your area'}? Our experienced team provides comprehensive ${input.businessType || 'solutions'} tailored to your specific needs. With years of experience serving ${input.location || 'the local community'}, we understand the unique challenges and requirements of ${input.location || 'area'} residents and businesses. Our commitment to quality, reliability, and customer satisfaction has made us the trusted choice for ${input.businessType || 'services'} in ${input.location || 'your city'}. Contact us today for a free consultation and discover why local customers choose us for their ${input.businessType || 'service'} needs.",
        "keywords": ["${input.businessType || 'service'}", "${input.location || 'city'}", "local ${input.businessType || 'service'}", "professional ${input.businessType || 'service'}"]
      },
      {
        "pageType": "About Us - Local Focus",
        "title": "About ${input.businessName || 'Our Company'} - Serving ${input.location || 'Your Community'} Since [Year]",
        "content": "At ${input.businessName || 'our company'}, we're proud to be part of the ${input.location || 'local community'}. Our deep roots in ${input.location || 'this area'} have given us invaluable insights into the unique needs of our neighbors and local businesses. We understand that ${input.location || 'your city'} has its own character, challenges, and opportunities, and we've tailored our ${input.businessType || 'services'} to meet these specific requirements. Our team of experienced professionals combines local knowledge with industry expertise to deliver exceptional results. Whether you're a long-time resident or new to ${input.location || 'the area'}, you can trust us to provide reliable, high-quality ${input.businessType || 'services'} that exceed your expectations.",
        "keywords": ["${input.businessName || 'company name'}", "${input.location || 'local'}", "community", "experienced", "trusted"]
      }
    ],
    "blogTopics": [
      "Top 5 ${input.businessType || 'Service'} Trends in ${input.location || 'Your City'} for 2024",
      "How to Choose the Right ${input.businessType || 'Service Provider'} in ${input.location || 'Your Area'}",
      "Local Spotlight: ${input.location || 'City'} Businesses That Excel in ${input.businessType || 'Services'}",
      "Seasonal ${input.businessType || 'Service'} Tips for ${input.location || 'Local'} Residents",
      "The Economic Impact of Quality ${input.businessType || 'Services'} in ${input.location || 'Your Community'}"
    ],
    "faqSuggestions": [
      "What makes your ${input.businessType || 'services'} different from other providers in ${input.location || 'the area'}?",
      "Do you offer emergency ${input.businessType || 'services'} in ${input.location || 'our city'}?",
      "What areas do you serve within ${input.location || 'the region'}?",
      "How quickly can you respond to ${input.businessType || 'service'} requests in ${input.location || 'our area'}?",
      "What certifications and licenses do your ${input.businessType || 'service'} professionals have?"
    ]
  },
  "citationAudit": {
    "currentCitations": 12,
    "missingCitations": [
      {
        "platform": "Google My Business",
        "importance": "Critical",
        "url": "https://business.google.com",
        "description": "Primary local search platform - must be optimized"
      },
      {
        "platform": "Yelp",
        "importance": "High", 
        "url": "https://biz.yelp.com",
        "description": "Popular review platform with high local search visibility"
      },
      {
        "platform": "Facebook Business",
        "importance": "High",
        "url": "https://facebook.com/business",
        "description": "Social media presence essential for local businesses"
      },
      {
        "platform": "Yellow Pages",
        "importance": "Medium",
        "url": "https://yellowpages.com",
        "description": "Traditional directory still used by older demographics"
      },
      {
        "platform": "Angie's List",
        "importance": "Medium",
        "url": "https://angi.com",
        "description": "Service-focused directory with quality leads"
      }
    ],
    "inconsistencies": [
      "Business phone number varies across 3 directories",
      "Business hours inconsistent on Google vs Facebook",
      "Address format differs between Yelp and Google listings",
      "Business description length varies significantly across platforms"
    ]
  },
  "reviewStrategy": {
    "currentRating": 4.2,
    "reviewGoals": [
      "Achieve 4.5+ star average rating across all platforms",
      "Generate 50+ new reviews in the next 90 days",
      "Respond to all reviews within 24 hours",
      "Increase review volume by 200% through systematic outreach"
    ],
    "responseTemplates": [
      {
        "type": "Positive Review Response",
        "template": "Thank you so much for your wonderful review! We're thrilled that you had a great experience with our ${input.businessType || 'services'}. Your satisfaction is our top priority, and we appreciate you taking the time to share your feedback. We look forward to serving you again in the future!"
      },
      {
        "type": "Negative Review Response", 
        "template": "We sincerely apologize for your experience and take your feedback very seriously. This is not the level of service we strive to provide. Please contact us directly at [phone/email] so we can address your concerns and make things right. We value your business and want to ensure your complete satisfaction."
      },
      {
        "type": "Review Request Template",
        "template": "Hi [Customer Name], we hope you're enjoying the ${input.businessType || 'service'} we provided! If you were satisfied with our work, we would greatly appreciate if you could share your experience on Google. Your review helps other ${input.location || 'local'} residents find quality ${input.businessType || 'services'}. Thank you for choosing us!"
      }
    ],
    "acquisitionStrategy": [
      "Send follow-up emails 3-5 days after service completion",
      "Include review links in all customer communications",
      "Offer small incentives for verified reviews",
      "Train staff to request reviews during service delivery",
      "Create social media campaigns encouraging reviews"
    ]
  },
  "competitorAnalysis": {
    "competitors": [
      {
        "name": "Competitor A - ${input.location || 'Local'} ${input.businessType || 'Services'}",
        "ranking": 1,
        "strengths": ["Strong online presence", "High review count", "Comprehensive service offerings"],
        "weaknesses": ["Higher pricing", "Limited availability", "Poor response times"],
        "opportunities": ["Focus on competitive pricing", "Emphasize availability and responsiveness", "Highlight unique service features"]
      },
      {
        "name": "Competitor B - ${input.businessType || 'Professional'} Solutions",
        "ranking": 2,
        "strengths": ["Established reputation", "Good customer service", "Wide service area"],
        "weaknesses": ["Outdated website", "Limited online reviews", "No social media presence"],
        "opportunities": ["Modernize online presence", "Build review portfolio", "Develop social media strategy"]
      },
      {
        "name": "Competitor C - ${input.location || 'City'} ${input.businessType || 'Experts'}",
        "ranking": 3,
        "strengths": ["Local expertise", "Competitive pricing", "Quick response times"],
        "weaknesses": ["Limited service range", "No website", "Poor online visibility"],
        "opportunities": ["Expand service offerings", "Develop online presence", "Improve digital marketing"]
      }
    ],
    "marketGaps": [
      "Lack of 24/7 emergency ${input.businessType || 'services'} in ${input.location || 'the area'}",
      "No specialized ${input.businessType || 'services'} for small businesses",
      "Limited eco-friendly ${input.businessType || 'service'} options",
      "Gap in affordable ${input.businessType || 'services'} for budget-conscious customers",
      "No comprehensive ${input.businessType || 'service'} packages for residential customers"
    ]
  },
  "actionPlan": [
    {
      "phase": "Phase 1: Foundation (Weeks 1-4)",
      "timeline": "Weeks 1-4",
      "tasks": [
        "Complete Google My Business profile optimization",
        "Audit and fix NAP inconsistencies across all directories",
        "Create location-specific landing pages",
        "Implement local schema markup on website",
        "Set up review monitoring and response system"
      ],
      "expectedResults": [
        "Improved local search visibility",
        "Consistent business information across platforms",
        "Better search engine understanding of business location",
        "Increased review response rate",
        "Foundation for local SEO success"
      ]
    },
    {
      "phase": "Phase 2: Content & Citations (Weeks 5-8)", 
      "timeline": "Weeks 5-8",
      "tasks": [
        "Build citations on 20+ relevant directories",
        "Create 5 local-focused blog posts",
        "Develop FAQ page with local keywords",
        "Optimize existing website content for local search",
        "Launch review generation campaign"
      ],
      "expectedResults": [
        "Increased citation count and consistency",
        "Improved local keyword rankings",
        "Enhanced website authority for local terms",
        "Higher review volume and ratings",
        "Better local search presence"
      ]
    },
    {
      "phase": "Phase 3: Optimization & Growth (Weeks 9-12)",
      "timeline": "Weeks 9-12", 
      "tasks": [
        "Analyze competitor strategies and implement improvements",
        "Launch local social media campaigns",
        "Develop partnerships with local businesses",
        "Create local event content and sponsorships",
        "Implement advanced local SEO techniques"
      ],
      "expectedResults": [
        "Competitive advantage over local competitors",
        "Increased social media engagement",
        "Local business partnerships and referrals",
        "Enhanced community presence and reputation",
        "Sustainable local SEO growth"
      ]
    }
  ]
}

Provide specific, actionable recommendations based on the business type and location. Make all content realistic and tailored to the specific business. Return ONLY valid JSON, no additional text.`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert Local SEO strategist with 10+ years of experience. Generate comprehensive, actionable Local SEO strategies that are specific to the business type and location provided. Always return valid JSON format.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const text = response.data.choices[0].message.content;
    let output;
    
    try {
      // Try to parse the JSON response
      output = JSON.parse(text);
    } catch (e) {
      console.error('JSON parsing error:', e);
      console.log('Raw response:', text);
      
      // Try to extract JSON from the response
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          output = JSON.parse(match[0]);
        } catch (parseError) {
          console.error('Failed to parse extracted JSON:', parseError);
          output = getFallbackData('local-seo', input);
        }
      } else {
        console.error('No JSON found in response');
        output = getFallbackData('local-seo', input);
      }
    }

    // Validate and ensure all required fields exist
    if (!output.businessProfile) output.businessProfile = getFallbackData('local-seo', input).businessProfile;
    if (!output.keywordStrategy) output.keywordStrategy = getFallbackData('local-seo', input).keywordStrategy;
    if (!output.contentStrategy) output.contentStrategy = getFallbackData('local-seo', input).contentStrategy;
    if (!output.citationAudit) output.citationAudit = getFallbackData('local-seo', input).citationAudit;
    if (!output.reviewStrategy) output.reviewStrategy = getFallbackData('local-seo', input).reviewStrategy;
    if (!output.competitorAnalysis) output.competitorAnalysis = getFallbackData('local-seo', input).competitorAnalysis;
    if (!output.actionPlan) output.actionPlan = getFallbackData('local-seo', input).actionPlan;

    return output;

  } catch (error) {
    console.error('OpenAI API error:', error.message);
    if (error.response) {
      console.error('API response error:', error.response.data);
    }
    return getFallbackData('local-seo', input);
  }
}

// Fallback data for when AI generation fails
function getFallbackData(toolId, input) {
  console.log(`Using fallback data for ${toolId} - OpenAI API not available or failed`);
  
  // Add a warning to the output
  const fallbackWarning = {
    _warning: "âš ï¸ This is static fallback content. For dynamic AI-generated content, please ensure your OpenAI API key is configured correctly.",
    _aiGenerated: false
  };
  if (toolId === 'product-launch') {
    return {
      ...fallbackWarning,
      timeline: [
        {
          phase: "Pre-Launch (8 weeks before)",
          timeline: "Week -8 to -6",
          activities: [
            "Finalize product development and testing",
            "Create brand assets and marketing materials",
            "Build landing page and capture leads",
            "Develop content marketing strategy",
            "Identify and reach out to influencers",
            "Plan PR and media outreach",
          ],
          deliverables: [
            "Product demo videos",
            "Landing page with email capture",
            "Brand style guide",
            "Content calendar",
            "Influencer partnership agreements",
            "Press kit and media list",
          ],
          kpis: ["Email signups", "Social media followers", "Website traffic", "Demo requests"],
        },
        {
          phase: "Soft Launch (4 weeks before)",
          timeline: "Week -4 to -2",
          activities: [
            "Beta testing with select customers",
            "Gather feedback and testimonials",
            "Create case studies and success stories",
            "Build anticipation with teasers",
            "Prepare customer support materials",
            "Finalize pricing and packaging",
          ],
          deliverables: [
            "Beta user feedback report",
            "Customer testimonials",
            "Case studies",
            "Support documentation",
            "Pricing strategy",
            "Launch day checklist",
          ],
          kpis: ["Beta user satisfaction", "Feature adoption", "Support ticket volume", "Conversion rates"],
        },
        {
          phase: "Launch Week",
          timeline: "Week 0",
          activities: [
            "Execute coordinated launch campaign",
            "Send launch emails to subscribers",
            "Publish across all social channels",
            "Activate PR and media outreach",
            "Monitor and respond to feedback",
            "Track metrics and optimize",
          ],
          deliverables: [
            "Launch announcement",
            "Email campaigns",
            "Social media posts",
            "Press releases",
            "Customer onboarding flow",
            "Real-time analytics dashboard",
          ],
          kpis: ["Launch day signups", "Media coverage", "Social engagement", "Sales conversions"],
        },
        {
          phase: "Post-Launch (4 weeks after)",
          timeline: "Week +1 to +4",
          activities: [
            "Analyze launch performance",
            "Gather customer feedback",
            "Optimize onboarding process",
            "Plan follow-up campaigns",
            "Identify expansion opportunities",
            "Document lessons learned",
          ],
          deliverables: [
            "Launch performance report",
            "Customer feedback analysis",
            "Optimization recommendations",
            "Follow-up campaign plan",
            "Growth strategy",
            "Post-mortem documentation",
          ],
          kpis: ["Customer retention", "Feature usage", "Support satisfaction", "Revenue growth"],
        },
      ],
      emailCampaigns: {
        prelaunch: `Subject: ðŸš€ Exclusive: ${input.productName || 'Product'} Launch - You're Invited!\n\nHi [First Name],\n\nWe're thrilled to share something revolutionary with you! After months of development, ${input.productName || 'Product'} is finally ready to launch.\n\nWhat makes ${input.productName || 'Product'} special:\nâœ¨ ${input.keyFeatures || 'Key Feature 1'}\nâœ¨ ${input.keyFeatures || 'Key Feature 2'}\nâœ¨ ${input.keyFeatures || 'Key Feature 3'}\n\nBuilt specifically for ${input.targetAudience || 'business users'}, this solution will transform how you work.\n\nEarly Bird Pricing: ${input.pricing || '$99/month'} (Limited Time)\nLaunch Date: ${input.launchDate || 'Q1 2024'}\n\nBe among the first to experience ${input.productName || 'Product'}!\n\nBest regards,\nThe ${input.productName || 'Product'} Team`,
        launch: `Subject: ðŸŽ‰ ${input.productName || 'Product'} is LIVE! Don't Miss Out\n\nHi [First Name],\n\nThe moment is here! ${input.productName || 'Product'} is officially live and ready to revolutionize your experience.\n\nOur mission: ${input.launchGoals || 'Transform your workflow'}\n\nKey Features:\nâœ… ${input.keyFeatures || 'Feature 1'}\nâœ… ${input.keyFeatures || 'Feature 2'}\nâœ… ${input.keyFeatures || 'Feature 3'}\n\nSpecial Launch Pricing: ${input.pricing || '$99/month'}\n\nPerfect for ${input.targetAudience || 'business users'} like you!\n\nGet started now: [Link]\n\nBest regards,\nThe ${input.productName || 'Product'} Team`,
        postlaunch: `Subject: How's ${input.productName || 'Product'} working for you?\n\nHi [First Name],\n\nWe hope you're loving ${input.productName || 'Product'}! We'd love to hear about your experience.\n\nAs a ${input.targetAudience || 'business user'}, your feedback is invaluable to us.\n\nWe're constantly improving ${input.productName || 'Product'} to stay ahead of competitors.\n\nShare your thoughts: [Feedback Link]\n\nBest regards,\nThe ${input.productName || 'Product'} Team`
      },
      socialMediaPosts: {
        announcement: `ðŸš¨ BREAKING: ${input.productName || 'Product'} is launching!\n\nThe future of ${input.productType || 'SaaS'} is here!\n\nKey features:\nðŸ"¥ ${input.keyFeatures || 'Feature 1'}\nðŸ"¥ ${input.keyFeatures || 'Feature 2'}\nðŸ"¥ ${input.keyFeatures || 'Feature 3'}\n\nPerfect for: ${input.targetAudience || 'Business users'}\nPricing: ${input.pricing || '$99/month'}\n\n#${input.productName?.replace(/\s+/g, '') || 'Product'} #Launch #Innovation`,
        countdown: `â° 3 DAYS until ${input.productName || 'Product'} launches!\n\nReady to transform your ${input.productType || 'SaaS'} experience?\n\nWhat to expect:\nâš¡ ${input.keyFeatures || 'Feature 1'}\nâš¡ ${input.keyFeatures || 'Feature 2'}\n\nSet your reminder! ðŸ"…\n\n#${input.productName?.replace(/\s+/g, '') || 'Product'} #Countdown`,
        launch: `ðŸŽ‰ ${input.productName || 'Product'} IS LIVE! ðŸŽ‰\n\nExperience the future of ${input.productType || 'SaaS'} today!\n\nLaunch Special: ${input.pricing || '$99/month'}\n\nGet started: [Link]\n\n#${input.productName?.replace(/\s+/g, '') || 'Product'} #LiveNow`,
        testimonial: `ðŸ'¬ "${input.productName || 'Product'} changed everything!"\n\n"As a ${input.targetAudience || 'business user'}, this is exactly what I needed."\n\n- Happy Customer\n\n#${input.productName?.replace(/\s+/g, '') || 'Product'} #Success`
      },
      pressRelease: `FOR IMMEDIATE RELEASE\n\n${input.productName?.toUpperCase() || 'PRODUCT'} REVOLUTIONIZES ${input.productType?.toUpperCase() || 'SAAS'} WITH INNOVATIVE SOLUTION\n\nGroundbreaking platform designed specifically for ${input.targetAudience || 'business users'}\n\n[City, Date] - [Company Name] today announced the launch of ${input.productName || 'Product'}, a revolutionary ${input.productType || 'SaaS platform'} that addresses critical market needs.\n\n"${input.launchGoals || 'Transform the industry'}" said [Company Spokesperson]. "This launch represents a significant milestone in our mission."\n\nKey innovations include:\nâ€¢ ${input.keyFeatures || 'Innovation 1'}\nâ€¢ ${input.keyFeatures || 'Innovation 2'}\nâ€¢ ${input.keyFeatures || 'Innovation 3'}\n\nThe platform differentiates itself from existing solutions by offering unique value propositions that competitors cannot match.\n\nAvailable starting ${input.launchDate || 'Q1 2024'} with pricing from ${input.pricing || '$99/month'}.\n\nAbout [Company Name]\n[Company description]\n\nMedia Contact:\n[Name]\n[Email]\n[Phone]\n\n###`,
      contentCalendar: [
        {
          week: "Launch Week",
          content: [
            {
              date: "Monday",
              platform: "LinkedIn",
              content: `${input.productName || 'Product'} launch announcement with professional focus`,
              type: "Announcement",
            },
            {
              date: "Tuesday",
              platform: "Twitter",
              content: `Behind-the-scenes ${input.productName || 'Product'} launch day thread`,
              type: "Behind-the-scenes",
            },
            {
              date: "Wednesday",
              platform: "Instagram",
              content: `Visual ${input.productName || 'Product'} showcase with key features`,
              type: "Product showcase",
            },
            {
              date: "Thursday",
              platform: "Facebook",
              content: `${input.productName || 'Product'} customer testimonial and social proof`,
              type: "Social proof",
            },
            {
              date: "Friday",
              platform: "LinkedIn",
              content: `${input.productName || 'Product'} week 1 results and metrics sharing`,
              type: "Results",
            },
          ],
        },
      ],
      analytics: {
        expectedReach: "50,000-75,000",
        projectedSignups: "2,500-4,000",
        estimatedRevenue: "$125K-200K",
        conversionRate: "5-8%",
      },
    };
  } else if (toolId === 'social-media') {
    // Generate dynamic content mix for fallback
    const getContentMix = (contentGoals, brandVoice, postFrequency) => {
      let educational = 40, engaging = 30, promotional = 20, ugc = 10;
      
      if (contentGoals?.toLowerCase().includes('lead')) {
        promotional = 35; educational = 25; engaging = 25; ugc = 15;
      } else if (contentGoals?.toLowerCase().includes('awareness')) {
        educational = 45; engaging = 30; promotional = 15; ugc = 10;
      } else if (contentGoals?.toLowerCase().includes('engagement')) {
        engaging = 40; educational = 25; promotional = 20; ugc = 15;
      } else if (contentGoals?.toLowerCase().includes('sales')) {
        promotional = 40; educational = 20; engaging = 25; ugc = 15;
      }
      
      if (brandVoice?.toLowerCase().includes('professional')) {
        educational = Math.min(educational + 10, 50);
        promotional = Math.max(promotional - 5, 15);
      } else if (brandVoice?.toLowerCase().includes('casual') || brandVoice?.toLowerCase().includes('fun')) {
        engaging = Math.min(engaging + 10, 45);
        educational = Math.max(educational - 5, 20);
      }
      
      if (postFrequency?.toLowerCase().includes('daily') || postFrequency?.toLowerCase().includes('5')) {
        ugc = Math.min(ugc + 5, 20);
        promotional = Math.max(promotional - 5, 15);
      } else if (postFrequency?.toLowerCase().includes('weekly') || postFrequency?.toLowerCase().includes('2')) {
        promotional = Math.min(promotional + 5, 25);
        educational = Math.min(educational + 5, 45);
      }
      
      const total = educational + engaging + promotional + ugc;
      if (total !== 100) {
        const factor = 100 / total;
        educational = Math.round(educational * factor);
        engaging = Math.round(engaging * factor);
        promotional = Math.round(promotional * factor);
        ugc = 100 - educational - engaging - promotional;
      }
      
      return { educational, engaging, promotional, ugc };
    };

    const contentMix = getContentMix(input.contentGoals, input.brandVoice, input.postFrequency);
    const selectedPlatforms = input.platforms && input.platforms.length > 0 ? input.platforms : ['LinkedIn', 'Instagram', 'Twitter', 'Facebook'];

    return {
      ...fallbackWarning,
      posts: selectedPlatforms.map(platform => ({
        platform: platform,
        content: "",
        hashtags: [],
        bestTime: "",
        engagement: ""
      })),
      strategy: {
        contentMix: [
          {
            type: "Educational Content",
            percentage: contentMix.educational,
            description: ""
          },
          {
            type: "Engaging Content",
            percentage: contentMix.engaging,
            description: ""
          },
          {
            type: "Promotional Content",
            percentage: contentMix.promotional,
            description: ""
          },
          {
            type: "User-Generated Content",
            percentage: contentMix.ugc,
            description: ""
          }
        ],
        postingSchedule: input.postFrequency?.toLowerCase().includes('daily') || input.postFrequency?.toLowerCase().includes('5') ? [
          { day: "Monday", times: [], contentType: "" },
          { day: "Tuesday", times: [], contentType: "" },
          { day: "Wednesday", times: [], contentType: "" },
          { day: "Thursday", times: [], contentType: "" },
          { day: "Friday", times: [], contentType: "" }
        ] : [
          { day: "Monday", times: [], contentType: "" },
          { day: "Wednesday", times: [], contentType: "" },
          { day: "Friday", times: [], contentType: "" }
        ],
        hashtagStrategy: {
          trending: [`#${input.industry?.replace(/\s+/g, '') || 'Industry'}Trends`, `#${input.contentGoals?.replace(/\s+/g, '') || 'Marketing'}2024`, `#${selectedPlatforms[0] || 'SocialMedia'}`, `#${input.brandVoice?.replace(/\s+/g, '') || 'Professional'}`, `#${input.business?.replace(/\s+/g, '') || 'Business'}`],
          niche: [`#${input.industry?.replace(/\s+/g, '') || 'Industry'}`, `#${input.targetAudience?.replace(/\s+/g, '') || 'Audience'}`, `#${input.contentGoals?.replace(/\s+/g, '') || 'Goals'}`, `#${input.brandVoice?.replace(/\s+/g, '') || 'Brand'}`, `#${input.business?.replace(/\s+/g, '') || 'Business'}`],
          branded: [`#${input.business?.replace(/\s+/g, '') || 'Brand'}`, `#${input.business?.replace(/\s+/g, '') || 'Company'}`, `#${input.business?.replace(/\s+/g, '') || 'Business'}Life`]
        }
      },
              analytics: {
          expectedReach: "",
          engagementRate: "",
          bestPerformingContent: "",
          growthProjection: ""
        }
    };
  } else if (toolId === 'ad-copy') {
    // Define platform formats for dynamic fallback generation
    const platformFormats = {
      "google": ["Search", "Display", "Shopping"],
      "facebook": ["Feed", "Stories", "Carousel"],
      "instagram": ["Feed", "Stories", "Reels"],
      "linkedin": ["Sponsored Content", "Message Ads", "Text Ads"],
      "twitter": ["Promoted Tweets", "Promoted Accounts"],
      "youtube": ["Video", "Display", "Overlay"]
    };

    // Build dynamic variations array based on selected platforms
    const selectedPlatforms = input.platforms || ["google", "facebook", "instagram"];
    const variations = [];
    
    selectedPlatforms.forEach(platformId => {
      const platformName = platformId.charAt(0).toUpperCase() + platformId.slice(1);
      const formats = platformFormats[platformId] || ["Feed"];
      
      formats.forEach(format => {
        variations.push({
          platform: platformName,
          format: format,
          headline: `Transform Your ${input.product || 'Business'} with Our ${platformName} Solution`,
          description: `Discover how ${input.audience || 'thousands of professionals'} are achieving remarkable results with our ${input.product || 'solution'} on ${platformName}. ${input.usp || 'Proven results'} guaranteed.`,
          cta: "Get Started Today",
          character_count: {
            headline: format === "Search" ? 30 : 40,
            description: format === "Search" ? 90 : 125
          },
          compliance_check: {
            passed: true,
            issues: []
          }
        });
      });
    });

    return {
      ...fallbackWarning,
      variations: variations,
      performance_predictions: {
        expected_ctr: "2.5%",
        expected_cpc: "$1.25",
        expected_conversion_rate: "3.2%"
      },
      optimization_tips: [
        {
          category: "Headlines",
          tip: `Test different headline variations for ${input.product || 'your product'} to find what resonates with ${input.audience || 'your audience'}`
        },
        {
          category: "Targeting",
          tip: `Refine your audience targeting based on ${input.audience || 'your target audience'} demographics and interests`
        },
        {
          category: "Ad Copy",
          tip: `Highlight your unique value proposition: ${input.usp || 'your USP'} to differentiate from competitors`
        }
      ],
      a_b_test_suggestions: [
        {
          element: "Headline",
          variation_a: `Transform Your ${input.product || 'Business'} Today`,
          variation_b: `${input.product || 'Solution'} That Actually Works`,
          test_hypothesis: `Testing different headline approaches for ${input.product || 'your product'} to see which drives more clicks`
        },
        {
          element: "CTA",
          variation_a: "Get Started Today",
          variation_b: "Learn More",
          test_hypothesis: `Testing different call-to-action buttons to see which drives more conversions for ${input.product || 'your product'}`
        }
      ],
      keyword_integration: {
        primary_keywords: [`${input.product || 'solution'}`, `${input.audience || 'professional'}`, `${input.usp || 'results'}`],
        secondary_keywords: [`${input.product || 'service'}`, `${input.audience || 'business'}`, `${input.usp || 'quality'}`, `${input.product || 'tool'}`, `${input.audience || 'user'}`],
        keyword_density: 2.5
      }
    };
  } else if (toolId === 'competitor-analysis') {
    // Generate comprehensive competitor analysis fallback data
    const yourBusiness = input.yourBusiness || 'Your Business';
    const industry = input.industry || 'Business Industry';
    const competitors = input.competitors || 'Competitor A, Competitor B, Competitor C';
    const analysisFocus = input.analysisFocus || 'Marketing Strategy';
    
    return {
      ...fallbackWarning,
      competitorProfiles: [
        {
          competitorName: "Competitor A",
          foundedYear: "2018",
          strengths: [
            "Strong brand recognition in the market",
            "Established customer base with high retention",
            "Advanced technology infrastructure",
            "Strategic partnerships with key players"
          ],
          weaknesses: [
            "Limited geographic presence",
            "Higher pricing compared to competitors",
            "Slow response to market changes",
            "Complex product onboarding process"
          ],
          opportunities: [
            "Expand into emerging markets",
            "Develop mobile-first solutions",
            "Partner with complementary services",
            "Launch subscription-based pricing models"
          ],
          threats: [
            "New market entrants with innovative solutions",
            "Economic downturn affecting customer spending",
            "Regulatory changes in the industry",
            "Technology disruption from AI and automation"
          ],
          marketPosition: "Market Challenger",
          uniqueValueProposition: "Premium quality with personalized customer service",
          revenue: "$25M annually",
          employeeCount: "150+ employees",
          keyProducts: ["Core Platform", "Mobile App", "Analytics Dashboard", "API Services"],
          socialFollowers: {
            facebook: "45.2K",
            twitter: "12.8K",
            linkedin: "8.9K",
            instagram: "23.1K"
          },
          websiteTraffic: "125K monthly visitors",
          seoScore: "78/100",
          domainAuthority: "45"
        },
        {
          competitorName: "Competitor B",
          foundedYear: "2020",
          strengths: [
            "Innovative product features",
            "Agile development methodology",
            "Strong social media presence",
            "Competitive pricing strategy"
          ],
          weaknesses: [
            "Limited funding and resources",
            "Small team size affecting scalability",
            "Less established brand recognition",
            "Limited customer support hours"
          ],
          opportunities: [
            "Secure additional funding for growth",
            "Expand product feature set",
            "Build strategic partnerships",
            "Enter untapped market segments"
          ],
          threats: [
            "Larger competitors acquiring market share",
            "Economic challenges affecting growth",
            "Talent acquisition difficulties",
            "Rapid technology changes"
          ],
          marketPosition: "Market Niche",
          uniqueValueProposition: "Affordable innovation with modern UX design",
          revenue: "$8M annually",
          employeeCount: "45 employees",
          keyProducts: ["SaaS Platform", "Mobile Solutions", "Integration Tools"],
          socialFollowers: {
            facebook: "18.7K",
            twitter: "6.3K",
            linkedin: "4.2K",
            instagram: "15.8K"
          },
          websiteTraffic: "67K monthly visitors",
          seoScore: "65/100",
          domainAuthority: "32"
        }
      ],
      swotAnalysis: {
        yourStrengths: [
          "Unique value proposition in the market",
          "Strong customer relationships and loyalty",
          "Innovative product development approach",
          "Experienced team with industry expertise"
        ],
        yourWeaknesses: [
          "Limited marketing budget compared to competitors",
          "Smaller team size affecting development speed",
          "Less brand recognition in the market",
          "Limited geographic presence"
        ],
        opportunities: [
          "Growing market demand for your solutions",
          "Technology advancements enabling new features",
          "Strategic partnerships with complementary services",
          "Untapped market segments and demographics"
        ],
        threats: [
          "Large competitors entering your market space",
          "Economic uncertainty affecting customer decisions",
          "Rapid technology changes requiring adaptation",
          "Regulatory changes impacting business operations"
        ]
      },
      competitiveAdvantages: {
        priceAdvantage: "Competitive pricing with better value for money",
        qualityAdvantage: "Superior product quality and reliability",
        serviceAdvantage: "Exceptional customer service and support",
        innovationAdvantage: "Continuous innovation and feature updates"
      },
      marketGaps: [
        "Underserved customer segments in the market",
        "Gaps in competitor product offerings",
        "Opportunities for improved customer experience",
        "Potential for new product categories"
      ],
      strategicRecommendations: [
        {
          recommendation: "Focus on niche market differentiation",
          impact: "High - Establish unique market position",
          effort: "Medium - Requires strategic planning and execution",
          timeline: "6-12 months"
        },
        {
          recommendation: "Invest in customer success and retention",
          impact: "High - Improve customer lifetime value",
          effort: "Low - Leverage existing relationships",
          timeline: "3-6 months"
        },
        {
          recommendation: "Develop strategic partnerships",
          impact: "Medium - Expand market reach and capabilities",
          effort: "Medium - Requires relationship building",
          timeline: "6-9 months"
        }
      ],
      performanceMetrics: {
        marketShare: "12%",
        customerSatisfaction: "4.6/5",
        retentionRate: "87%",
        growthRate: "23% annually"
      }
    };
  } else if (toolId === 'blog-to-video') {
    return {
      ...fallbackWarning,
      scripts: [
        {
          section: "Hook/Introduction",
          duration: "0:00 - 0:15",
          script: `Hey everyone! Have you ever wondered about ${input.blogTitle?.toLowerCase() || 'this topic'}? 

Well, I just spent time researching this topic, and what I discovered will completely change how you think about it.

In the next ${input.duration || "5 minutes"}, I'm going to share the exact strategies that will help you ${input.blogContent?.substring(0, 50) || 'achieve your goals'}.

So grab a coffee, hit that subscribe button, and let's dive in!`,
          visualCues: [
            "Energetic opening with host on camera",
            "Quick montage of key points to come",
            "Subscribe button animation overlay",
            "Coffee cup or relevant prop in frame",
          ],
          audioNotes: [
            "Upbeat background music (low volume)",
            "Clear, enthusiastic delivery",
            "Slight pause after hook question",
            "Emphasize key numbers/benefits",
          ],
        },
        {
          section: "Problem/Context",
          duration: "0:15 - 1:00",
          script: `So here's the thing - most people struggle with ${input.blogContent?.substring(0, 100) || 'understanding this topic'}.

I see this all the time in my work with ${input.audience || "clients"}. They're doing things the hard way and wondering why they're not getting results.

The truth is, ${input.blogContent?.substring(100, 200) || 'there\'s a better approach'}. And that's exactly what we're going to fix today.

Let me show you the three main challenges everyone faces:
1. ${input.blogContent?.split('.')[0] || 'Challenge 1'}
2. ${input.blogContent?.split('.')[1] || 'Challenge 2'} 
3. ${input.blogContent?.split('.')[2] || 'Challenge 3'}

Sound familiar? Don't worry - I've got solutions for all of these.`,
          visualCues: [
            "Screen recording showing common problems",
            "Animated graphics for statistics",
            "Split screen: problem vs solution preview",
            "Numbered list animation",
          ],
          audioNotes: [
            "Slightly more serious tone",
            "Pause between each challenge",
            "Empathetic delivery for pain points",
            "Build anticipation for solutions",
          ],
        },
        {
          section: "Main Content/Solutions",
          duration: "1:00 - 4:00",
          script: `Alright, let's get into the good stuff. Here's exactly how to ${input.blogTitle?.toLowerCase() || 'solve this problem'}:

**Step 1: ${input.blogContent?.split('.')[3] || 'First major point'}**
${input.blogContent?.substring(200, 400) || 'Detailed explanation adapted for video'}

Let me show you this in action... [demonstrate or show example]

**Step 2: ${input.blogContent?.split('.')[4] || 'Second major point'}**
This is where most people get stuck, but here's the secret: ${input.blogContent?.substring(400, 500) || 'key insight'}

**Step 3: ${input.blogContent?.split('.')[5] || 'Third major point'}**
And finally, the game-changer that ties it all together: ${input.blogContent?.substring(500, 600) || 'final solution'}

Now, I know what you're thinking - "This sounds complicated." But trust me, once you see the results, you'll understand why this approach works so well.

Here's a real example: ${input.blogContent?.substring(600, 700) || 'case study or example'}`,
          visualCues: [
            "Step-by-step screen recordings",
            "Before/after comparisons",
            "Animated diagrams and flowcharts",
            "Real examples and case studies",
            "Host explaining with whiteboard/props",
          ],
          audioNotes: [
            "Clear, instructional tone",
            "Pause between major steps",
            "Emphasize key insights",
            "Use vocal variety to maintain interest",
          ],
        },
        {
          section: "Call to Action/Conclusion",
          duration: "4:00 - 5:00",
          script: `So there you have it - the complete guide to ${input.blogTitle?.toLowerCase() || 'this topic'}.

To recap, remember these three key points:
1. ${input.blogContent?.split('.')[6] || 'Key takeaway 1'}
2. ${input.blogContent?.split('.')[7] || 'Key takeaway 2'}
3. ${input.blogContent?.split('.')[8] || 'Key takeaway 3'}

Now here's what I want you to do: ${input.callToAction || "Try this strategy and let me know how it works for you in the comments below."}

If this video helped you out, smash that like button, subscribe for more content like this, and ring the notification bell so you never miss an update.

And hey, if you want to dive deeper into this topic, I've got a detailed blog post with even more examples - link is in the description below.

What's your biggest challenge with ${input.blogTitle?.toLowerCase() || 'this topic'}? Drop a comment and let me know - I read every single one and often turn them into future videos.

Thanks for watching, and I'll see you in the next one!`,
          visualCues: [
            "Summary graphics",
            "CTA button",
            "Channel branding",
          ],
          audioNotes: [
            "Music fades",
            "Clear CTA voiceover",
            "End with brand sound",
          ],
        },
      ],
      storyboard: [
        {
          scene: 1,
          timestamp: "0:00-0:30",
          visual: "Hook with blog title overlay",
          text: `${input.blogTitle || 'Blog Title'} - but what if I told you there's a better way?`,
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
          text: `${input.blogContent?.split('.')[0] || 'First key insight'}`,
          transition: "Zoom transition"
        },
        {
          scene: 4,
          timestamp: "2:30-3:30",
          visual: "Key point 2 with examples",
          text: `${input.blogContent?.split('.')[1] || 'Second important concept'}`,
          transition: "Slide transition"
        },
        {
          scene: 5,
          timestamp: "3:30-4:30",
          visual: "Key point 3 step-by-step",
          text: `${input.blogContent?.split('.')[2] || 'Final actionable tip'}`,
          transition: "Zoom transition"
        },
        {
          scene: 6,
          timestamp: "4:30-5:00",
          visual: "Conclusion with CTA",
          text: `${input.callToAction || 'Subscribe for more tips!'}`,
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
        title: `${input.blogTitle || 'Blog Title'} - Complete Guide (2024)`,
        description: `Learn everything about ${input.blogTitle || 'this topic'} in this comprehensive guide. ${input.blogContent?.substring(0, 100) || 'Detailed explanation'}...`,
        tags: [`#${input.blogTitle?.replace(/\s+/g, '') || 'BlogTitle'}`, "#guide", "#tutorial", "#tips", "#howto"],
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
        estimatedLength: input.duration || "5-7 minutes",
        targetAudience: input.audience || "General audience interested in the topic",
        engagementPrediction: "High (15-25% engagement rate)",
        platformRecommendations: ["YouTube", "LinkedIn", "Instagram Reels", "TikTok"]
      },
      platformStrategy: [
        "YouTube: Full 5-7 minute video with detailed chapters",
        "LinkedIn: 2-3 minute professional version",
        "Instagram Reels: 30-60 second highlights",
        "TikTok: 15-60 second engaging clips"
      ],
      thumbnailConcept: `${input.blogTitle || 'Blog Title'} with bold text, eye-catching colors, and key visual element`
    };
  } else if (toolId === 'email-marketing') {
    // Generate dynamic email marketing fallback content
    const generateDynamicAnalytics = (input) => {
      const { audience, campaignType, urgency, tone, goal } = input;
      
      // Base rates that vary by audience type
      const audienceFactors = {
        "business owners": { openRate: 0.28, clickRate: 0.042, conversionRate: 0.015 },
        "marketers": { openRate: 0.32, clickRate: 0.048, conversionRate: 0.018 },
        "entrepreneurs": { openRate: 0.26, clickRate: 0.038, conversionRate: 0.012 },
        "professionals": { openRate: 0.30, clickRate: 0.045, conversionRate: 0.016 },
        "students": { openRate: 0.35, clickRate: 0.052, conversionRate: 0.020 },
        "default": { openRate: 0.25, clickRate: 0.035, conversionRate: 0.012 }
      };

      // Find matching audience factor
      const audienceLower = audience?.toLowerCase() || "";
      let factor = audienceFactors.default;
      for (const [key, value] of Object.entries(audienceFactors)) {
        if (audienceLower.includes(key)) {
          factor = value;
          break;
        }
      }

      // Adjust rates based on campaign type
      const campaignMultipliers = {
        "welcome": { open: 1.2, click: 1.3, conversion: 1.4 },
        "nurture": { open: 1.1, click: 1.2, conversion: 1.3 },
        "promotional": { open: 0.9, click: 1.1, conversion: 1.2 },
        "newsletter": { open: 1.0, click: 1.0, conversion: 1.0 },
        "re-engagement": { open: 0.8, click: 0.9, conversion: 1.0 }
      };

      const campaignMultiplier = campaignMultipliers[campaignType] || campaignMultipliers.newsletter;

      // Calculate final rates
      const openRate = (factor.openRate * campaignMultiplier.open * 100).toFixed(1);
      const clickRate = (factor.clickRate * campaignMultiplier.click * 100).toFixed(1);
      const conversionRate = (factor.conversionRate * campaignMultiplier.conversion * 100).toFixed(1);

      // Generate best send time based on audience
      const bestSendTime = generateBestSendTime(audience);

      return {
        expectedOpenRate: `${openRate}%`,
        expectedClickRate: `${clickRate}%`,
        expectedConversionRate: `${conversionRate}%`,
        bestSendTime
      };
    };

    const generateBestSendTime = (audience) => {
      const audienceLower = audience?.toLowerCase() || "";
      const times = {
        "business owners": "10:00 AM Tuesday",
        "marketers": "2:00 PM Wednesday", 
        "entrepreneurs": "9:00 AM Thursday",
        "professionals": "11:00 AM Tuesday",
        "students": "7:00 PM Tuesday",
        "default": "10:00 AM Tuesday"
      };

      for (const [key, time] of Object.entries(times)) {
        if (audienceLower.includes(key)) return time;
      }
      return times.default;
    };

    const generateSubjectVariations = (originalSubject) => {
      const variations = [
        `[First Name], ${originalSubject}`,
        `URGENT: ${originalSubject}`,
        `Re: ${originalSubject}`,
        `${originalSubject} (Limited Time)`,
        `Exclusive: ${originalSubject}`,
        `Your ${originalSubject} is ready`,
        `Don't miss: ${originalSubject}`,
        `${originalSubject} - Action Required`
      ];
      return variations.slice(0, 4);
    };

    const generateSegmentationTips = (audience) => {
      const tips = [
        `Segment by ${audience} experience level (beginner, intermediate, advanced)`,
        `Create separate campaigns for different ${audience} industries`,
        `Target ${audience} based on their engagement history`,
        `Personalize content for ${audience} based on their goals`,
        `Send different content to ${audience} based on their location`
      ];
      return tips.slice(0, 3);
    };

    const generateTestingRecommendations = (input) => {
      const { campaignType, tone, urgency } = input;
      
      const recommendations = [
        "Test different subject line lengths (short vs long)",
        "A/B test send times (morning vs afternoon)",
        "Compare different CTA button colors and text",
        "Test personalization vs generic messaging",
        "Experiment with different email layouts"
      ];

      // Add specific recommendations based on campaign type
      if (campaignType === "promotional") {
        recommendations.push("Test urgency messaging vs benefit-focused content");
      }
      if (tone === "urgent") {
        recommendations.push("Compare urgent vs informative subject lines");
      }

      return recommendations.slice(0, 4);
    };

    const generateEmailSequence = (input) => {
      const { campaignType, subject, audience, goal } = input;
      
      const sequences = {
        "welcome": [
          { day: 1, subject: `Welcome to ${subject}`, purpose: "Introduction and onboarding", content: "Welcome email with next steps" },
          { day: 3, subject: `Getting Started with ${subject}`, purpose: "First value delivery", content: "First actionable tip or resource" },
          { day: 7, subject: `Your ${subject} Success Path`, purpose: "Goal setting and expectations", content: "Setting up for success" }
        ],
        "nurture": [
          { day: 1, subject: `The ${subject} Strategy`, purpose: "Educational content", content: "In-depth strategy explanation" },
          { day: 5, subject: `${subject} Case Study`, purpose: "Social proof", content: "Real results and testimonials" },
          { day: 10, subject: `Advanced ${subject} Techniques`, purpose: "Advanced tips", content: "Next-level strategies" }
        ],
        "promotional": [
          { day: 1, subject: `Special Offer: ${subject}`, purpose: "Announcement", content: "Introducing the offer" },
          { day: 3, subject: `Last Chance: ${subject}`, purpose: "Urgency", content: "Creating urgency" },
          { day: 5, subject: `Final Reminder: ${subject}`, purpose: "Final call", content: "Last opportunity" }
        ]
      };

      return sequences[campaignType] || sequences.welcome;
    };

    return {
      ...fallbackWarning,
      campaigns: [
        {
          type: input.campaignType || "welcome",
          subject: input.subjectLine || input.subject || "Welcome to our community",
          preheader: `Discover how ${input.targetAudience || input.audience || "professionals"} are transforming their results`,
          content: `Hi [First Name],\n\nWelcome to our community! We're thrilled to have you join thousands of ${input.targetAudience || input.audience || "professionals"} who are already transforming their ${input.productService || "business"}.\n\nHere's what you can expect:\nâœ… Weekly insights and tips\nâœ… Exclusive resources and tools\nâœ… Access to our expert community\nâœ… Special offers and early access\n\nReady to dive in? Click the button below to access your welcome resources.\n\nBest regards,\nThe Team`,
          cta: "Get Started",
          personalizations: ["First Name", "Company Name", "Industry", "Location"]
        }
      ],
      sequence: {
        name: `${input.campaignType || "welcome"} Email Sequence`,
        emails: generateEmailSequence(input)
      },
      analytics: generateDynamicAnalytics(input),
      optimization: {
        subjectLineVariations: generateSubjectVariations(input.subjectLine || input.subject),
        segmentationTips: generateSegmentationTips(input.targetAudience || input.audience),
        testingRecommendations: generateTestingRecommendations(input)
      }
    };
  } else if (toolId === 'blog-writing') {
    // Generate dynamic blog content fallback
    const topic = input.topic || input.keywords || 'General topic';
    const audience = input.targetAudience || 'General audience';
    const wordCount = input.blogLength || input.wordCount || '1500 words';
    const tone = input.tone || 'Professional';
    
    return {
      ...fallbackWarning,
      title: `Complete Guide to ${topic} for ${audience}`,
      metaDescription: `Discover everything you need to know about ${topic}. Perfect for ${audience} looking to master this topic.`,
      introduction: `In today's fast-paced world, understanding ${topic} has become essential for ${audience}. Whether you're just starting out or looking to enhance your knowledge, this comprehensive guide will provide you with actionable insights and practical strategies.`,
      outline: [
        {
          heading: `Understanding ${topic}`,
          subheadings: [`What is ${topic}?`, `Why ${topic} matters`, `Key concepts to know`]
        },
        {
          heading: `Practical Applications`,
          subheadings: [`Real-world examples`, `Step-by-step guide`, `Common challenges`]
        },
        {
          heading: `Advanced Strategies`,
          subheadings: [`Pro tips and tricks`, `Best practices`, `Future trends`]
        }
      ],
      content: {
        section1: `This section provides a comprehensive overview of ${topic}. We'll explore the fundamental concepts, key principles, and essential knowledge that every ${audience} should understand.`,
        section2: `Building on the foundation, this section delves into practical applications and real-world scenarios where ${topic} plays a crucial role.`,
        section3: `The final section covers advanced strategies, expert insights, and actionable steps to help you excel in ${topic}.`
      },
      conclusion: `Mastering ${topic} is a journey that requires dedication and continuous learning. By following the strategies outlined in this guide, you'll be well-equipped to succeed.`,
      seoOptimization: {
        targetKeywords: [topic, `${topic} guide`, `${topic} for ${audience}`],
        internalLinks: [`Related ${topic} articles`, `Advanced ${topic} strategies`],
        externalLinks: [`${topic} industry reports`, `${topic} expert resources`]
      },
      contentMarketing: {
        socialMediaSnippets: [
          `Discover the secrets of ${topic} in our latest guide!`,
          `Want to master ${topic}? Here's everything you need to know.`,
          `${topic} made simple - your complete guide to success.`
        ],
        emailNewsletter: `Learn how to master ${topic} with our comprehensive guide. Perfect for ${audience} looking to enhance their skills and knowledge.`,
        infographicIdeas: [`${topic} process flow`, `${topic} key statistics`]
      },
      suggestions: {
        improvements: [
          `Add case studies from successful ${audience} in the ${topic} industry`,
          `Include recent statistics and data points about ${topic}`,
          `Add a step-by-step implementation guide for ${audience}`
        ],
        additionalSections: [
          `FAQ section addressing common questions about ${topic}`,
          `Resources and tools section with specific ${topic} recommendations`,
          `Expert interviews section with ${topic} industry leaders`
        ]
      }
    };
  } else if (toolId === 'client-reporting') {
    // Generate dynamic client report fallback
    const clientName = input.clientName || 'Client';
    const industry = input.industry || 'Business';
    const reportingPeriod = input.reportingPeriod || 'Monthly';
    const services = input.services || 'Marketing services';
    
    return {
      ...fallbackWarning,
      executiveSummary: {
        overview: `${clientName} has demonstrated exceptional performance in ${reportingPeriod.toLowerCase()} with significant improvements across all key marketing channels. The ${industry} industry focus has yielded remarkable results, including a 34% increase in organic traffic, 127 qualified leads generated through targeted campaigns, and a 23% improvement in conversion rates. Our strategic approach to ${services} has positioned ${clientName} as a strong competitor in the ${industry} market, with opportunities for continued growth and market expansion. The comprehensive marketing strategy has successfully addressed market challenges while maintaining cost efficiency and driving measurable ROI improvements.`,
        keyAchievements: [
          `Increased website traffic by 45% through targeted SEO optimization for ${industry} keywords, resulting in 12,890 additional organic visitors`,
          `Generated 127 qualified leads through LinkedIn advertising campaigns with a 4.2% conversion rate and $2.45 cost per lead`,
          `Improved conversion rate by 23% through landing page optimization and A/B testing, exceeding industry average by 15%`,
          `Achieved 89% client satisfaction score across all ${services} with significant improvements in customer retention and lifetime value`
        ],
        challenges: [
          `Seasonal fluctuations in ${industry} market affecting consistent lead generation, particularly during Q3 and Q4 periods`,
          `Competition from established players in the ${industry} space requiring increased investment in brand differentiation`,
          `Limited budget allocation for experimental marketing channels due to focus on proven ROI-generating activities`
        ],
        recommendations: [
          `Implement advanced retargeting strategies to capture lost opportunities in ${industry} market - Expected Impact: 25% increase in conversion rate and 40% reduction in cost per acquisition`,
          `Develop thought leadership content to establish authority in the ${industry} market - Expected Impact: 35% increase in organic traffic and 50% improvement in brand recognition`,
          `Allocate 30% of budget to high-performing channels based on current ROI analysis - Expected Impact: 20% increase in overall ROI and 15% reduction in marketing costs`
        ]
      },
      performanceMetrics: {
        websiteTraffic: {
          totalVisitors: "45,230 visitors (+34% vs previous period)",
          pageViews: "127,890 page views (+28% vs previous period)",
          bounceRate: "42% (-8% improvement)",
          sessionDuration: "3 minutes 45 seconds (+22% improvement)"
        },
        conversionMetrics: {
          conversionRate: "4.2% (+1.1% improvement)",
          leadGeneration: "1,847 leads (+67% vs previous period)",
          salesMetrics: "$127,450 in attributed revenue (+89% growth)"
        },
        socialMedia: {
          followers: "12,450 followers (+23% growth)",
          engagement: "8.7% engagement rate (+2.1% improvement)",
          reach: "89,230 total reach (+45% vs previous period)"
        }
      },
      campaignPerformance: [
        {
          campaignName: `${industry} LinkedIn Lead Generation`,
          objectives: "Generate qualified leads from ${industry} professionals",
          results: "Generated 234 qualified leads with 6.2% conversion rate and $2.45 cost per lead",
          roi: "487% ROI with $12,450 in attributed revenue"
        },
        {
          campaignName: `${industry} Google Ads Search`,
          objectives: "Drive website traffic and conversions from search",
          results: "Generated 1,234 clicks with 3.8% conversion rate and $1.87 cost per click",
          roi: "312% ROI with $8,230 in attributed revenue"
        }
      ],
      competitiveAnalysis: {
        marketPosition: `${clientName} is positioned as a mid-tier player in the ${industry} market, with strong growth potential in underserved segments`,
        competitorBenchmarks: "Performance is 15% above industry average for conversion rates and 23% above average for cost per lead",
        opportunities: "Untapped potential in video marketing, influencer partnerships, and advanced automation for ${industry} audience"
      },
      nextSteps: {
        immediateActions: [
          "Implement advanced retargeting campaigns for high-value ${industry} prospects",
          "Launch thought leadership content series to build authority",
          "Optimize landing pages based on A/B testing results"
        ],
        longTermStrategy: "Focus on building brand authority in the ${industry} space through content marketing and strategic partnerships",
        budgetAllocation: "Allocate 40% to proven channels, 35% to optimization, 15% to experimentation, and 10% to content creation"
      }
    };
  } else if (toolId === 'landing-page') {
    // Generate comprehensive landing page content fallback that matches frontend expectations
    const offerDetails = input.offerDetails || 'Product/Service';
    const targetAudience = input.targetAudience || 'General audience';
    const painPoints = input.painPoints || 'Common challenges';
    const benefits = input.benefits || 'Key advantages';
    
    return {
      ...fallbackWarning,
      headline: {
        main: `Transform Your ${offerDetails} Experience Today`,
        subheadline: `Discover how ${targetAudience} are achieving remarkable results`,
        tagline: `The future of ${offerDetails} is here`
      },
      heroSection: {
        valueProposition: `Join thousands of ${targetAudience} who trust our ${offerDetails} to solve ${painPoints} and unlock ${benefits}`,
        primaryCTA: "Get Started Today",
        secondaryCTA: "Learn More",
        heroImage: "hero-illustration.svg"
      },
      features: [
        {
          title: "Easy Integration",
          description: "Seamlessly integrate with your existing workflow in minutes",
          icon: "🔌"
        },
        {
          title: "Proven Results",
          description: "Trusted by thousands of businesses worldwide",
          icon: "📈"
        },
        {
          title: "24/7 Support",
          description: "Get help whenever you need it with our expert team",
          icon: "🛟"
        },
        {
          title: "Advanced Analytics",
          description: "Track performance and optimize with detailed insights",
          icon: "📊"
        }
      ],
      benefits: [
        {
          benefit: "Save Time & Money",
          explanation: "Automate repetitive tasks and reduce operational costs by up to 40%"
        },
        {
          benefit: "Increase Conversions",
          explanation: "Optimize your funnel and boost conversion rates by 3x"
        },
        {
          benefit: "Scale Effortlessly",
          explanation: "Grow your business without worrying about technical limitations"
        }
      ],
      testimonials: [
        {
          quote: `"This ${offerDetails} completely transformed how we work. The results were immediate and impressive."`,
          author: "Sarah Johnson",
          title: "CEO, TechStart Inc.",
          avatar: "sarah-j.jpg"
        },
        {
          quote: `"Finally, a solution that actually delivers on its promises. Our team loves it!"`,
          author: "Mike Chen",
          title: "Marketing Director",
          avatar: "mike-c.jpg"
        }
      ],
      cta: {
        primary: "Start Your Free Trial",
        secondary: "Schedule a Demo",
        urgency: "Limited Time Offer",
        guarantee: "30-Day Money Back Guarantee"
      },
      formCopy: {
        title: "Get Started Today",
        description: "Join thousands of satisfied customers",
        fields: ["Name", "Email", "Company", "Phone"],
        submitButton: "Start Free Trial",
        privacyNote: "We respect your privacy and will never share your information"
      },
      faqs: [
        {
          question: `How quickly can I see results with ${offerDetails}?`,
          answer: "Most customers see measurable results within the first 30 days of implementation."
        },
        {
          question: "What kind of support do you provide?",
          answer: "We offer 24/7 customer support, comprehensive documentation, and personalized onboarding."
        },
        {
          question: "Can I cancel anytime?",
          answer: "Yes, you can cancel your subscription at any time with no questions asked."
        }
      ],
      socialProof: {
        stats: [
          { number: "10,000+", label: "Happy Customers" },
          { number: "99.9%", label: "Uptime Guarantee" },
          { number: "24/7", label: "Support Available" }
        ],
        logos: ["Company A", "Company B", "Company C"],
        certifications: ["ISO 27001", "SOC 2", "GDPR Compliant"]
      },
      designLayout: {
        template: "Modern Single Page",
        colorScheme: "Professional Blue & White",
        typography: "Clean Sans-serif",
        mobileOptimization: "Fully Responsive"
      },
      seoElements: {
        pageTitle: `${offerDetails} - Transform Your Business Today`,
        metaDescription: `Discover how ${targetAudience} are achieving remarkable results with our ${offerDetails}. ${painPoints} solved, ${benefits} unlocked.`,
        h1Tags: [`Transform Your ${offerDetails} Experience`, `Best ${offerDetails} for ${targetAudience}`],
        keywords: [offerDetails.toLowerCase(), targetAudience.toLowerCase(), painPoints.toLowerCase(), benefits.toLowerCase()]
      }
    };
  } else if (toolId === 'local-seo') {
    // Generate dynamic local SEO fallback
    const businessType = input.businessType || 'Business';
    const location = input.location || 'City';
    const industry = input.industry || 'General';
    
    return {
      ...fallbackWarning,
      overview: {
        currentRanking: Math.floor(Math.random() * 50) + 1,
        targetKeywords: [`${businessType} ${location}`, `${location} ${businessType}`, `${businessType} near me`],
        localVisibility: Math.floor(Math.random() * 40) + 60,
        competitorCount: Math.floor(Math.random() * 20) + 5
      },
      technicalAudit: {
        googleMyBusiness: {
          status: "Optimized",
          score: Math.floor(Math.random() * 20) + 80,
          issues: ["Missing business hours", "Incomplete service descriptions"],
          recommendations: ["Add detailed business hours", "Include all service offerings", "Add high-quality photos"]
        },
        citations: {
          status: "Good",
          score: Math.floor(Math.random() * 30) + 70,
          issues: ["Missing citations on 5 directories", "Inconsistent NAP information"],
          recommendations: ["Build citations on missing directories", "Standardize business information across all platforms"]
        },
        websiteOptimization: {
          status: "Needs Improvement",
          score: Math.floor(Math.random() * 40) + 60,
          issues: ["Missing local schema markup", "No location-specific landing pages"],
          recommendations: ["Implement local schema markup", "Create location-specific content", "Optimize for local keywords"]
        }
      },
      contentStrategy: {
        localKeywords: [
          `${businessType} ${location}`,
          `${location} ${businessType} services`,
          `${businessType} near ${location}`,
          `Best ${businessType} in ${location}`,
          `${location} ${businessType} reviews`
        ],
        contentIdeas: [
          `Complete Guide to ${businessType} in ${location}`,
          `Top 10 ${businessType} Services in ${location}`,
          `${location} ${businessType} Cost Guide`,
          `How to Choose the Best ${businessType} in ${location}`,
          `${businessType} Trends in ${location} for 2024`
        ],
        localLandingPages: [
          {
            page: `${location} ${businessType} Services`,
            keywords: [`${businessType} ${location}`, `${location} ${businessType}`],
            content: `Comprehensive ${businessType} services in ${location}. Expert ${businessType} professionals serving ${location} and surrounding areas.`
          },
          {
            page: `${businessType} Near ${location}`,
            keywords: [`${businessType} near ${location}`, `${businessType} ${location} area`],
            content: `Find reliable ${businessType} services near ${location}. Local ${businessType} experts providing quality service to ${location} residents.`
          }
        ]
      },
      reviewManagement: {
        currentReviews: Math.floor(Math.random() * 50) + 20,
        averageRating: (Math.random() * 2 + 3).toFixed(1),
        reviewResponseRate: Math.floor(Math.random() * 40) + 60,
        strategies: [
          "Implement automated review request system",
          "Train staff on review response best practices",
          "Create review generation campaigns",
          "Monitor and respond to all reviews within 24 hours",
          "Use review management software for tracking"
        ],
        templates: [
          {
            type: "Positive Review Response",
            template: `Thank you for your wonderful review! We're thrilled to hear about your positive experience with our ${businessType} services. Your satisfaction is our top priority, and we look forward to serving you again in the future.`
          },
          {
            type: "Negative Review Response",
            template: `We sincerely apologize for your experience and take your feedback very seriously. This is not the level of service we strive to provide. Please contact us directly at [phone/email] so we can address your concerns and make things right. We value your business and want to ensure your complete satisfaction.`
          },
          {
            type: "Review Request Template",
            template: `Hi [Customer Name], we hope you're enjoying the ${businessType} we provided! If you were satisfied with our work, we would greatly appreciate if you could share your experience on Google. Your review helps other ${location} residents find quality ${businessType}. Thank you for choosing us!`
          }
        ],
        acquisitionStrategy: [
          "Send follow-up emails 3-5 days after service completion",
          "Include review links in all customer communications",
          "Offer small incentives for verified reviews",
          "Train staff to request reviews during service delivery",
          "Create social media campaigns encouraging reviews"
        ]
      },
      competitorAnalysis: {
        competitors: [
          {
            name: `Competitor A - ${location} ${businessType}`,
            ranking: 1,
            strengths: ["Strong online presence", "High review count", "Comprehensive service offerings"],
            weaknesses: ["Higher pricing", "Limited availability", "Poor response times"],
            opportunities: ["Focus on competitive pricing", "Emphasize availability and responsiveness", "Highlight unique service features"]
          },
          {
            name: `Competitor B - ${businessType} Professional Solutions`,
            ranking: 2,
            strengths: ["Established reputation", "Good customer service", "Wide service area"],
            weaknesses: ["Outdated website", "Limited online reviews", "No social media presence"],
            opportunities: ["Modernize online presence", "Build review portfolio", "Develop social media strategy"]
          },
          {
            name: `Competitor C - ${location} ${businessType} Experts`,
            ranking: 3,
            strengths: ["Local expertise", "Competitive pricing", "Quick response times"],
            weaknesses: ["Limited service range", "No website", "Poor online visibility"],
            opportunities: ["Expand service offerings", "Develop online presence", "Improve digital marketing"]
          }
        ],
        marketGaps: [
          `Lack of 24/7 emergency ${businessType} in ${location}`,
          `No specialized ${businessType} for small businesses`,
          `Limited eco-friendly ${businessType} options`,
          `Gap in affordable ${businessType} for budget-conscious customers`,
          `No comprehensive ${businessType} packages for residential customers`
        ]
      },
      actionPlan: [
        {
          phase: "Phase 1: Foundation (Weeks 1-4)",
          timeline: "Weeks 1-4",
          tasks: [
            "Complete Google My Business profile optimization",
            "Audit and fix NAP inconsistencies across all directories",
            "Create location-specific landing pages",
            "Implement local schema markup on website",
            "Set up review monitoring and response system"
          ],
          expectedResults: [
            "Improved local search visibility",
            "Consistent business information across platforms",
            "Better search engine understanding of business location",
            "Increased review response rate",
            "Foundation for local SEO success"
          ]
        },
        {
          phase: "Phase 2: Content & Citations (Weeks 5-8)", 
          timeline: "Weeks 5-8",
          tasks: [
            "Build citations on 20+ relevant directories",
            "Create 5 local-focused blog posts",
            "Develop FAQ page with local keywords",
            "Optimize existing website content for local search",
            "Launch review generation campaign"
          ],
          expectedResults: [
            "Increased citation count and consistency",
            "Improved local keyword rankings",
            "Enhanced website authority for local terms",
            "Higher review volume and ratings",
            "Better local search presence"
          ]
        },
        {
          phase: "Phase 3: Optimization & Growth (Weeks 9-12)",
          timeline: "Weeks 9-12", 
          tasks: [
            "Analyze competitor strategies and implement improvements",
            "Launch local social media campaigns",
            "Develop partnerships with local businesses",
            "Create local event content and sponsorships",
            "Implement advanced local SEO techniques"
          ],
          expectedResults: [
            "Competitive advantage over local competitors",
            "Increased social media engagement",
            "Local business partnerships and referrals",
            "Enhanced community presence and reputation",
            "Sustainable local SEO growth"
          ]
        }
      ]

    }
  }
}

// Import the productivity integration service
const ProductivityIntegrationService = require('../services/productivityIntegrationService');
const productivityService = new ProductivityIntegrationService();

// Product Launch Productivity Integration Routes
router.post('/productivity/calendar', async (req, res) => {
  try {
    const { launchData, calendarType = 'google' } = req.body;
    
    if (!launchData) {
      return res.status(400).json({ error: 'Launch data is required' });
    }

    let result;
    switch (calendarType) {
      case 'google':
        result = await productivityService.createGoogleCalendarEvents(launchData);
        break;
      case 'ical':
        result = productivityService.generateICalFile(launchData);
        break;
      default:
        return res.status(400).json({ error: 'Invalid calendar type. Use "google" or "ical"' });
    }

    res.json(result);
  } catch (error) {
    console.error('Calendar integration error:', error.message);
    res.status(500).json({ 
      error: 'Failed to create calendar events',
      details: error.message 
    });
  }
});

router.post('/productivity/notion', async (req, res) => {
  try {
    const { launchData } = req.body;
    
    if (!launchData) {
      return res.status(400).json({ error: 'Launch data is required' });
    }

    const result = await productivityService.exportToNotion(launchData);
    res.json(result);
  } catch (error) {
    console.error('Notion export error:', error.message);
    res.status(500).json({ 
      error: 'Failed to export to Notion',
      details: error.message 
    });
  }
});

router.post('/productivity/google-sheets', async (req, res) => {
  try {
    const { launchData } = req.body;
    
    if (!launchData) {
      return res.status(400).json({ error: 'Launch data is required' });
    }

    const result = await productivityService.exportToGoogleSheets(launchData);
    res.json(result);
  } catch (error) {
    console.error('Google Sheets export error:', error.message);
    res.status(500).json({ 
      error: 'Failed to export to Google Sheets',
      details: error.message 
    });
  }
});

router.post('/productivity/clickup', async (req, res) => {
  try {
    const { launchData } = req.body;
    
    if (!launchData) {
      return res.status(400).json({ error: 'Launch data is required' });
    }

    const result = await productivityService.exportToClickUp(launchData);
    res.json(result);
  } catch (error) {
    console.error('ClickUp export error:', error.message);
    res.status(500).json({ 
      error: 'Failed to export to ClickUp',
      details: error.message 
    });
  }
});

router.get('/productivity/integrations', (req, res) => {
  try {
    const availableIntegrations = productivityService.getAvailableIntegrations();
    res.json({
      success: true,
      integrations: availableIntegrations,
      setupInstructions: {
        googleCalendar: 'Set GOOGLE_CALENDAR_API_KEY in environment variables',
        googleSheets: 'Set GOOGLE_SHEETS_API_KEY in environment variables',
        notion: 'Set NOTION_API_KEY and NOTION_DATABASE_ID in environment variables',
        clickUp: 'Set CLICKUP_API_KEY and CLICKUP_WORKSPACE_ID in environment variables',
        outlook: 'Set OUTLOOK_CLIENT_ID and OUTLOOK_CLIENT_SECRET in environment variables'
      }
    });
  } catch (error) {
    console.error('Integrations check error:', error.message);
    res.status(500).json({ 
      error: 'Failed to check integrations',
      details: error.message 
    });
  }
});

// Import the video generation service
const VideoGenerationService = require('../services/videoGenerationService');
const videoService = new VideoGenerationService();

// Blog-to-Video Video Generation Routes
router.post('/video/scrape-blog', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'Blog URL is required' });
    }

    const result = await videoService.scrapeBlogContent(url);
    res.json(result);
  } catch (error) {
    console.error('Blog scraping error:', error.message);
    res.status(500).json({ 
      error: 'Failed to scrape blog content',
      details: error.message 
    });
  }
});

router.post('/video/pictory', async (req, res) => {
  try {
    const { scriptData, options = {} } = req.body;
    
    if (!scriptData) {
      return res.status(400).json({ error: 'Script data is required' });
    }

    const result = await videoService.generateVideoWithPictory(scriptData, options);
    res.json(result);
  } catch (error) {
    console.error('Pictory integration error:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate video with Pictory',
      details: error.message 
    });
  }
});

router.post('/video/lumen5', async (req, res) => {
  try {
    const { scriptData, options = {} } = req.body;
    
    if (!scriptData) {
      return res.status(400).json({ error: 'Script data is required' });
    }

    const result = await videoService.generateVideoWithLumen5(scriptData, options);
    res.json(result);
  } catch (error) {
    console.error('Lumen5 integration error:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate video with Lumen5',
      details: error.message 
    });
  }
});

router.post('/video/youtube-upload', async (req, res) => {
  try {
    const { videoFile, metadata } = req.body;
    
    if (!metadata) {
      return res.status(400).json({ error: 'Video metadata is required' });
    }

    const result = await videoService.uploadToYouTube(videoFile, metadata);
    res.json(result);
  } catch (error) {
    console.error('YouTube upload error:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate YouTube upload instructions',
      details: error.message 
    });
  }
});

router.post('/video/export-mp4', async (req, res) => {
  try {
    const { scriptData, options = {} } = req.body;
    
    if (!scriptData) {
      return res.status(400).json({ error: 'Script data is required' });
    }

    const result = await videoService.exportToMP4(scriptData, options);
    res.json(result);
  } catch (error) {
    console.error('MP4 export error:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate MP4 export instructions',
      details: error.message 
    });
  }
});

router.post('/video/production-guide', async (req, res) => {
  try {
    const { scriptData } = req.body;
    
    if (!scriptData) {
      return res.status(400).json({ error: 'Script data is required' });
    }

    const result = videoService.generateVideoProductionGuide(scriptData);
    res.json({
      success: true,
      message: 'Video production guide generated',
      guide: result
    });
  } catch (error) {
    console.error('Production guide error:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate production guide',
      details: error.message 
    });
  }
});

router.get('/video/integrations', (req, res) => {
  try {
    const availableIntegrations = videoService.getAvailableIntegrations();
    res.json({
      success: true,
      integrations: availableIntegrations,
      setupInstructions: {
        pictory: 'Set PICTORY_API_KEY in environment variables',
        lumen5: 'Set LUMEN5_API_KEY in environment variables',
        youtube: 'Set YOUTUBE_API_KEY, YOUTUBE_CLIENT_ID, and YOUTUBE_CLIENT_SECRET in environment variables',
        urlScraping: 'Always available (puppeteer)'
      }
    });
  } catch (error) {
    console.error('Video integrations check error:', error.message);
    res.status(500).json({ 
      error: 'Failed to check video integrations',
      details: error.message 
    });
  }
});

// ===== LOCAL SEO API ROUTES =====

// Initialize Local SEO services
const localSEOService = new LocalSEOService();
const citationBuildingService = new CitationBuildingService();
const localSEOAnalyticsService = new LocalSEOAnalyticsService();

// GMB Profile Audit
router.post('/local-seo/gmb-audit', async (req, res) => {
  try {
    const { businessName, location } = req.body;
    
    if (!businessName || !location) {
      return res.status(400).json({ error: 'Business name and location are required' });
    }

    const auditResult = await localSEOService.auditGoogleMyBusiness(businessName, location);
    res.json({
      success: true,
      message: 'GMB audit completed',
      audit: auditResult
    });
  } catch (error) {
    console.error('GMB audit error:', error.message);
    res.status(500).json({ 
      error: 'Failed to audit GMB profile',
      details: error.message 
    });
  }
});

// Review Analysis
router.post('/local-seo/review-analysis', async (req, res) => {
  try {
    const { businessName, location } = req.body;
    
    if (!businessName || !location) {
      return res.status(400).json({ error: 'Business name and location are required' });
    }

    const reviewData = await localSEOService.analyzeReviews(businessName, location);
    res.json({
      success: true,
      message: 'Review analysis completed',
      reviews: reviewData
    });
  } catch (error) {
    console.error('Review analysis error:', error.message);
    res.status(500).json({ 
      error: 'Failed to analyze reviews',
      details: error.message 
    });
  }
});

// Citation Analysis
router.post('/local-seo/citation-analysis', async (req, res) => {
  try {
    const { businessName, location, phone } = req.body;
    
    if (!businessName || !location) {
      return res.status(400).json({ error: 'Business name and location are required' });
    }

    const citationData = await localSEOService.analyzeCitations(businessName, location, phone);
    res.json({
      success: true,
      message: 'Citation analysis completed',
      citations: citationData
    });
  } catch (error) {
    console.error('Citation analysis error:', error.message);
    res.status(500).json({ 
      error: 'Failed to analyze citations',
      details: error.message 
    });
  }
});

// Citation Building
router.post('/local-seo/build-citations', async (req, res) => {
  try {
    const { businessData, method = 'manual' } = req.body;
    
    if (!businessData || !businessData.businessName || !businessData.location) {
      return res.status(400).json({ error: 'Complete business data is required' });
    }

    let result;
    if (method === 'brightlocal' && process.env.BRIGHTLOCAL_API_KEY) {
      result = await citationBuildingService.buildCitationsWithBrightLocal(businessData);
    } else {
      result = await citationBuildingService.buildCitationsManually(businessData);
    }

    res.json({
      success: true,
      message: 'Citation building initiated',
      result: result
    });
  } catch (error) {
    console.error('Citation building error:', error.message);
    res.status(500).json({ 
      error: 'Failed to build citations',
      details: error.message 
    });
  }
});

// Monitor Citation Progress
router.get('/local-seo/citation-progress/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    if (!campaignId) {
      return res.status(400).json({ error: 'Campaign ID is required' });
    }

    const progress = await citationBuildingService.monitorCitationProgress(campaignId);
    res.json({
      success: true,
      progress: progress
    });
  } catch (error) {
    console.error('Citation progress error:', error.message);
    res.status(500).json({ 
      error: 'Failed to monitor citation progress',
      details: error.message 
    });
  }
});

// Local SEO Performance Tracking
router.post('/local-seo/track-rankings', async (req, res) => {
  try {
    const { businessName, location, keywords } = req.body;
    
    if (!businessName || !location || !keywords || !Array.isArray(keywords)) {
      return res.status(400).json({ error: 'Business name, location, and keywords array are required' });
    }

    const rankingData = await localSEOAnalyticsService.trackLocalRankings(businessName, location, keywords);
    res.json({
      success: true,
      message: 'Ranking tracking completed',
      rankings: rankingData
    });
  } catch (error) {
    console.error('Ranking tracking error:', error.message);
    res.status(500).json({ 
      error: 'Failed to track rankings',
      details: error.message 
    });
  }
});

// GMB Performance Monitoring
router.post('/local-seo/gmb-performance', async (req, res) => {
  try {
    const { businessName, location } = req.body;
    
    if (!businessName || !location) {
      return res.status(400).json({ error: 'Business name and location are required' });
    }

    const performanceData = await localSEOAnalyticsService.monitorGMBPerformance(businessName, location);
    res.json({
      success: true,
      message: 'GMB performance monitoring completed',
      performance: performanceData
    });
  } catch (error) {
    console.error('GMB performance error:', error.message);
    res.status(500).json({ 
      error: 'Failed to monitor GMB performance',
      details: error.message 
    });
  }
});

// Competitor Performance Tracking
router.post('/local-seo/competitor-tracking', async (req, res) => {
  try {
    const { businessName, competitors, location } = req.body;
    
    if (!businessName || !competitors || !Array.isArray(competitors) || !location) {
      return res.status(400).json({ error: 'Business name, competitors array, and location are required' });
    }

    // Use target keywords from the business context if not provided
    const keywords = req.body.keywords || ['local business', 'services', businessName.split(' ')[0]];

    const competitorData = await localSEOAnalyticsService.trackCompetitorPerformance(competitors, location, keywords);
    res.json({
      success: true,
      message: 'Competitor tracking completed',
      tracking: {
        competitors: competitorData,
        metrics: ['ranking', 'reviews', 'response_time', 'content_frequency']
      }
    });
  } catch (error) {
    console.error('Competitor tracking error:', error.message);
    res.status(500).json({ 
      error: 'Failed to track competitors',
      details: error.message 
    });
  }
});

// Generate Performance Report
router.post('/local-seo/performance-report', async (req, res) => {
  try {
    const { businessName, location, keywords, competitors } = req.body;
    
    if (!businessName || !location || !keywords || !Array.isArray(keywords)) {
      return res.status(400).json({ error: 'Business name, location, and keywords array are required' });
    }

    const report = await localSEOAnalyticsService.generatePerformanceReport(
      businessName, 
      location, 
      keywords, 
      competitors || []
    );
    
    res.json({
      success: true,
      message: 'Performance report generated',
      report: report
    });
  } catch (error) {
    console.error('Performance report error:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate performance report',
      details: error.message 
    });
  }
});

// Content Calendar Generation
router.post('/local-seo/content-calendar', async (req, res) => {
  try {
    const { businessName, businessType, location, primaryServices } = req.body;
    
    if (!businessName || !businessType || !location) {
      return res.status(400).json({ error: 'Business name, type, and location are required' });
    }

    const calendar = await localSEOService.generateContentCalendar(businessName, businessType, location);
    
    // Add monthly themes and total posts count to match frontend expectations
    const enhancedCalendar = {
      ...calendar,
      monthlyThemes: calendar.monthlyThemes || ['Local Business Focus', 'Service Highlights', 'Community Engagement'],
      totalPosts: calendar.totalPosts || 30
    };
    
    res.json({
      success: true,
      message: 'Content calendar generated',
      calendar: enhancedCalendar
    });
  } catch (error) {
    console.error('Content calendar error:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate content calendar',
      details: error.message 
    });
  }
});

// GMB Calendar Event Creation
router.post('/local-seo/gmb-calendar', async (req, res) => {
  try {
    const { businessName, location, gmbEmail, businessType } = req.body;
    
    if (!businessName || !location || !gmbEmail) {
      return res.status(400).json({ error: 'Business name, location, and GMB email are required' });
    }

    // Create event data from the request
    const eventData = {
      businessName,
      location,
      gmbEmail,
      businessType,
      eventType: 'content_post',
      scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
    };

    const result = await localSEOService.createGMBCalendarEvent(businessName, eventData);
    
    // Generate a sample calendar structure for the response
    const calendar = {
      events: [result],
      posts: [
        {
          type: 'weekly_update',
          content: `Weekly update for ${businessName}`,
          scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      ]
    };

    res.json({
      success: true,
      message: 'GMB calendar created',
      calendar: calendar
    });
  } catch (error) {
    console.error('GMB calendar error:', error.message);
    res.status(500).json({ 
      error: 'Failed to create GMB calendar event',
      details: error.message 
    });
  }
});

// Local SEO Integrations Check
router.get('/local-seo/integrations', (req, res) => {
  try {
    const availableIntegrations = {
      googleMyBusiness: !!process.env.GOOGLE_CLIENT_ID,
      brightLocal: !!process.env.BRIGHTLOCAL_API_KEY,
      semrush: !!process.env.SEMRUSH_API_KEY,
      moz: !!process.env.MOZ_API_KEY,
      yelp: !!process.env.YELP_API_KEY,
      facebook: !!process.env.FACEBOOK_ACCESS_TOKEN
    };

    res.json({
      success: true,
      integrations: availableIntegrations,
      setupInstructions: {
        googleMyBusiness: 'Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN in environment variables',
        brightLocal: 'Set BRIGHTLOCAL_API_KEY in environment variables',
        semrush: 'Set SEMRUSH_API_KEY in environment variables',
        moz: 'Set MOZ_API_KEY in environment variables',
        yelp: 'Set YELP_API_KEY in environment variables',
        facebook: 'Set FACEBOOK_ACCESS_TOKEN in environment variables'
      }
    });
  } catch (error) {
    console.error('Local SEO integrations check error:', error.message);
    res.status(500).json({ 
      error: 'Failed to check Local SEO integrations',
      details: error.message 
    });
  }
});

module.exports = router;
