const express = require("express")
const User = require("../models/User")
const AIToolUsage = require("../models/AIToolUsage")
const auth = require("../middleware/auth")
const rateLimit = require("express-rate-limit")
const axios = require('axios');
const cheerio = require('cheerio');
const NotificationService = require("../services/notificationService");
const { generateContent, isOpenAIConfigured } = require('../utils/openai-client');
require('dotenv').config();

const router = express.Router()

// Rate limiting for AI tool usage
const toolLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each user to 10 requests per minute
  message: { message: "Too many requests, please try again later." },
})

// AI Tools configuration
const AI_TOOLS = {

  "seo-audit": {
    name: "SEO Audit Tool",
    description: "Single page SEO analysis",
    category: "SEO",
    freeInTrial: true,
  },
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
    name: "Landing Page Builder Assistant",
    description: "Auto-generate compelling landing page copy",
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
router.post("/:toolId/generate", auth, toolLimiter, checkToolAccess, async (req, res) => {
  const startTime = Date.now()
  const { toolId } = req.params
  const { input } = req.body

  try {
    console.log(`Generating content for tool: ${toolId}`)
    console.log("Input:", input)

    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Generate content using AI
    const output = await simulateAIGeneration(toolId, input)

    // Log usage with debug output
    console.log("Tool usage attempt:", {
      userId: user._id,
      toolId,
      toolName: AI_TOOLS[toolId].name,
      input,
      output,
      processingTime: Date.now() - startTime,
      status: "success",
    });
    
    try {
      await AIToolUsage.create({
        userId: user._id,
        toolId,
        toolName: AI_TOOLS[toolId].name,
        input,
        output,
        processingTime: Date.now() - startTime,
        status: "success",
      });
      console.log("Tool usage successfully logged!");
    } catch (err) {
      console.error("Error saving tool usage:", err);
    }

    // Update user usage stats
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
        toolName: AI_TOOLS[toolId].name,
        usageCount: 1,
        lastUsed: new Date(),
      })
    }

    await user.save()

    // Generate notifications after successful tool usage
    try {
      await NotificationService.generateAllNotifications(user._id);
    } catch (notificationError) {
      console.error('Error generating notifications:', notificationError);
    }

    res.json({
      success: true,
      output,
      processingTime: Date.now() - startTime,
      usage: {
        totalGenerations: user.usage.totalGenerations,
        monthlyGenerations: user.usage.monthlyGenerations,
      },
    })
  } catch (error) {
    console.error("AI tool generation error:", error)

    // Log failed usage
    await AIToolUsage.create({
      userId: req.user.userId,
      toolId: req.params.toolId,
      toolName: AI_TOOLS[req.params.toolId]?.name || "Unknown",
      input: req.body.input,
      output: null,
      processingTime: Date.now() - startTime,
      status: "error",
      errorMessage: error.message,
    })

    res.status(500).json({ message: "AI generation failed", error: error.message })
  }
})

// AI Generation function with OpenAI API integration
async function simulateAIGeneration(toolId, input) {
  // Check if OpenAI API key is available
  if (!isOpenAIConfigured()) {
    console.log('OpenAI API key not found, using fallback mock data');
    return getFallbackData(toolId, input);
  }

  try {
    if (toolId === 'seo-audit') {
      return await generateSEOAudit(input);
    } else if (toolId === 'product-launch') {
      return await generateProductLaunchPlan(input);
    } else if (toolId === 'blog-to-video') {
      return await generateBlogToVideoScript(input);
    } else {
      // For other tools, use fallback for now
      return getFallbackData(toolId, input);
    }
  } catch (error) {
    console.error(`AI generation failed for ${toolId}:`, error);
    return getFallbackData(toolId, input);
  }
}

// Generate Product Launch Plan using OpenAI
async function generateProductLaunchPlan(input) {
  const prompt = `Generate a comprehensive product launch campaign in JSON format for the following requirements:

Product Name: ${input.productName || 'Product'}
Product Type: ${input.productType || 'SaaS'}
Target Audience: ${input.targetAudience || 'Business users'}
Launch Date: ${input.launchDate || 'Q1 2024'}
Key Features: ${input.keyFeatures || 'Feature 1, Feature 2, Feature 3'}
Pricing: ${input.pricing || '$99/month'}
Competitors: ${input.competitors || 'Competitor A, Competitor B'}
Launch Goals: ${input.launchGoals || 'Increase market share'}
Budget: ${input.budget || '$50,000'}

Generate a JSON object with this EXACT structure:

{
  "timeline": [
    {
      "phase": "Pre-Launch (8 weeks before)",
      "timeline": "Week -8 to -6",
      "activities": ["Activity 1", "Activity 2", "Activity 3"],
      "deliverables": ["Deliverable 1", "Deliverable 2", "Deliverable 3"],
      "kpis": ["KPI 1", "KPI 2", "KPI 3"]
    },
    {
      "phase": "Soft Launch (4 weeks before)",
      "timeline": "Week -4 to -2",
      "activities": ["Activity 1", "Activity 2", "Activity 3"],
      "deliverables": ["Deliverable 1", "Deliverable 2", "Deliverable 3"],
      "kpis": ["KPI 1", "KPI 2", "KPI 3"]
    },
    {
      "phase": "Launch Week",
      "timeline": "Week 0",
      "activities": ["Activity 1", "Activity 2", "Activity 3"],
      "deliverables": ["Deliverable 1", "Deliverable 2", "Deliverable 3"],
      "kpis": ["KPI 1", "KPI 2", "KPI 3"]
    },
    {
      "phase": "Post-Launch (4 weeks after)",
      "timeline": "Week +1 to +4",
      "activities": ["Activity 1", "Activity 2", "Activity 3"],
      "deliverables": ["Deliverable 1", "Deliverable 2", "Deliverable 3"],
      "kpis": ["KPI 1", "KPI 2", "KPI 3"]
    }
  ],
  "emailCampaigns": {
    "prelaunch": "Email content for prelaunch",
    "launch": "Email content for launch",
    "postlaunch": "Email content for postlaunch"
  },
  "socialMediaPosts": {
    "announcement": "Social media announcement post",
    "countdown": "Social media countdown post",
    "launch": "Social media launch post",
    "testimonial": "Social media testimonial post"
  },
  "pressRelease": "Press release content",
  "contentCalendar": [
    {
      "week": "Launch Week",
      "content": [
        {
          "date": "Monday",
          "platform": "LinkedIn",
          "content": "Content description",
          "type": "Announcement"
        }
      ]
    }
  ],
  "analytics": {
    "expectedReach": "50,000-100,000",
    "projectedSignups": "2,500-5,000",
    "estimatedRevenue": "$100K-200K",
    "conversionRate": "5-10%"
  }
}

Create a comprehensive, strategic launch plan that is specific to the product and target audience. Include realistic timelines, activities, and projections. Return ONLY valid JSON, no explanation.`;

  const text = await generateContent(prompt, {
    model: 'gpt-4',
    maxTokens: 3000,
    temperature: 0.7
  });
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
  const prompt = `Generate a comprehensive blog-to-video script in JSON format for the following requirements:

Blog Title: ${input.blogTitle || 'Blog Post Title'}
Blog Content: ${input.blogContent || 'Blog content here...'}
Video Style: ${input.videoStyle || 'Educational'}
Target Platform: ${input.targetPlatform || 'YouTube'}
Duration: ${input.duration || '5-7 minutes'}
Audience: ${input.audience || 'General audience'}
Call to Action: ${input.callToAction || 'Subscribe for more content'}

Generate a JSON object with this EXACT structure:

{
  "scripts": [
    {
      "section": "Introduction (0-30s)",
      "duration": "30 seconds",
      "script": "Detailed script content with visual directions",
      "visualCues": ["Visual cue 1", "Visual cue 2"],
      "audioNotes": ["Audio note 1", "Audio note 2"]
    },
    {
      "section": "Main Content (1:30-4:30s)",
      "duration": "3 minutes",
      "script": "Detailed script content with visual directions",
      "visualCues": ["Visual cue 1", "Visual cue 2"],
      "audioNotes": ["Audio note 1", "Audio note 2"]
    },
    {
      "section": "Conclusion (4:30-5:00s)",
      "duration": "30 seconds",
      "script": "Detailed script content with visual directions",
      "visualCues": ["Visual cue 1", "Visual cue 2"],
      "audioNotes": ["Audio note 1", "Audio note 2"]
    }
  ],
  "storyboard": [
    {
      "scene": 1,
      "timestamp": "0:00-0:30",
      "visual": "Visual description",
      "text": "Text overlay",
      "transition": "Transition type"
    }
  ],
  "production": {
    "equipment": ["Equipment 1", "Equipment 2"],
    "locations": ["Location 1", "Location 2"],
    "props": ["Prop 1", "Prop 2"],
    "timeline": "2-3 hours for recording and editing"
  },
  "optimization": {
    "title": "Optimized video title",
    "description": "Video description",
    "tags": ["#tag1", "#tag2"],
    "thumbnail": "Thumbnail concept",
    "chapters": [
      {
        "time": "0:00",
        "title": "Chapter title"
      }
    ]
  },
  "analytics": {
    "estimatedLength": "5-7 minutes",
    "targetAudience": "Target audience description",
    "engagementPrediction": "High (15-25% engagement rate)",
    "platformRecommendations": ["YouTube", "LinkedIn", "Instagram Reels"]
  },
  "platformStrategy": [
    "YouTube: Full 5-7 minute video with detailed chapters",
    "LinkedIn: 2-3 minute professional version",
    "Instagram Reels: 30-60 second highlights"
  ],
  "thumbnailConcept": "Thumbnail concept description"
}

Create engaging, platform-specific video scripts that are tailored to the blog content and target audience. Include detailed scene breakdowns, visual directions, and production requirements. Return ONLY valid JSON, no explanation.`;

  const text = await generateContent(prompt, {
    model: 'gpt-4',
    maxTokens: 3000,
    temperature: 0.7
  });
  let output;
  try {
    output = JSON.parse(text);
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}/);
    output = match ? JSON.parse(match[0]) : getFallbackData('blog-to-video', input);
  }
  return output;
}

// Fallback data for when AI generation fails
function getFallbackData(toolId, input) {
  if (toolId === 'product-launch') {
    return {
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
        prelaunch: `Subject: 🚀 Exclusive: ${input.productName || 'Product'} Launch - You're Invited!\n\nHi [First Name],\n\nWe're thrilled to share something revolutionary with you! After months of development, ${input.productName || 'Product'} is finally ready to launch.\n\nWhat makes ${input.productName || 'Product'} special:\n✨ ${input.keyFeatures || 'Key Feature 1'}\n✨ ${input.keyFeatures || 'Key Feature 2'}\n✨ ${input.keyFeatures || 'Key Feature 3'}\n\nBuilt specifically for ${input.targetAudience || 'business users'}, this solution will transform how you work.\n\nEarly Bird Pricing: ${input.pricing || '$99/month'} (Limited Time)\nLaunch Date: ${input.launchDate || 'Q1 2024'}\n\nBe among the first to experience ${input.productName || 'Product'}!\n\nBest regards,\nThe ${input.productName || 'Product'} Team`,
        launch: `Subject: 🎉 ${input.productName || 'Product'} is LIVE! Don't Miss Out\n\nHi [First Name],\n\nThe moment is here! ${input.productName || 'Product'} is officially live and ready to revolutionize your experience.\n\nOur mission: ${input.launchGoals || 'Transform your workflow'}\n\nKey Features:\n✅ ${input.keyFeatures || 'Feature 1'}\n✅ ${input.keyFeatures || 'Feature 2'}\n✅ ${input.keyFeatures || 'Feature 3'}\n\nSpecial Launch Pricing: ${input.pricing || '$99/month'}\n\nPerfect for ${input.targetAudience || 'business users'} like you!\n\nGet started now: [Link]\n\nBest regards,\nThe ${input.productName || 'Product'} Team`,
        postlaunch: `Subject: How's ${input.productName || 'Product'} working for you?\n\nHi [First Name],\n\nWe hope you're loving ${input.productName || 'Product'}! We'd love to hear about your experience.\n\nAs a ${input.targetAudience || 'business user'}, your feedback is invaluable to us.\n\nWe're constantly improving ${input.productName || 'Product'} to stay ahead of competitors.\n\nShare your thoughts: [Feedback Link]\n\nBest regards,\nThe ${input.productName || 'Product'} Team`
      },
      socialMediaPosts: {
        announcement: `🚨 BREAKING: ${input.productName || 'Product'} is launching!\n\nThe future of ${input.productType || 'SaaS'} is here!\n\nKey features:\n🔥 ${input.keyFeatures || 'Feature 1'}\n🔥 ${input.keyFeatures || 'Feature 2'}\n🔥 ${input.keyFeatures || 'Feature 3'}\n\nPerfect for: ${input.targetAudience || 'Business users'}\nPricing: ${input.pricing || '$99/month'}\n\n#${input.productName?.replace(/\s+/g, '') || 'Product'} #Launch #Innovation`,
        countdown: `⏰ 3 DAYS until ${input.productName || 'Product'} launches!\n\nReady to transform your ${input.productType || 'SaaS'} experience?\n\nWhat to expect:\n⚡ ${input.keyFeatures || 'Feature 1'}\n⚡ ${input.keyFeatures || 'Feature 2'}\n\nSet your reminder! 📅\n\n#${input.productName?.replace(/\s+/g, '') || 'Product'} #Countdown`,
        launch: `🎉 ${input.productName || 'Product'} IS LIVE! 🎉\n\nExperience the future of ${input.productType || 'SaaS'} today!\n\nLaunch Special: ${input.pricing || '$99/month'}\n\nGet started: [Link]\n\n#${input.productName?.replace(/\s+/g, '') || 'Product'} #LiveNow`,
        testimonial: `💬 "${input.productName || 'Product'} changed everything!"\n\n"As a ${input.targetAudience || 'business user'}, this is exactly what I needed."\n\n- Happy Customer\n\n#${input.productName?.replace(/\s+/g, '') || 'Product'} #Success`
      },
      pressRelease: `FOR IMMEDIATE RELEASE\n\n${input.productName?.toUpperCase() || 'PRODUCT'} REVOLUTIONIZES ${input.productType?.toUpperCase() || 'SAAS'} WITH INNOVATIVE SOLUTION\n\nGroundbreaking platform designed specifically for ${input.targetAudience || 'business users'}\n\n[City, Date] - [Company Name] today announced the launch of ${input.productName || 'Product'}, a revolutionary ${input.productType || 'SaaS platform'} that addresses critical market needs.\n\n"${input.launchGoals || 'Transform the industry'}" said [Company Spokesperson]. "This launch represents a significant milestone in our mission."\n\nKey innovations include:\n• ${input.keyFeatures || 'Innovation 1'}\n• ${input.keyFeatures || 'Innovation 2'}\n• ${input.keyFeatures || 'Innovation 3'}\n\nThe platform differentiates itself from existing solutions by offering unique value propositions that competitors cannot match.\n\nAvailable starting ${input.launchDate || 'Q1 2024'} with pricing from ${input.pricing || '$99/month'}.\n\nAbout [Company Name]\n[Company description]\n\nMedia Contact:\n[Name]\n[Email]\n[Phone]\n\n###`,
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
  } else if (toolId === 'blog-to-video') {
    return {
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
  }

  // Default fallback for other tools
  return {
    message: "Tool not implemented yet",
    toolId,
    input
  };
}

// Generate SEO Audit for single page using OpenAI
async function generateSEOAudit(input) {
  const pageUrl = input.url || input.pageUrl || 'example.com';
  const context = input.context || 'business website';

  const prompt = `You are an expert SEO analyst. Analyze the SEO quality of this single page: ${pageUrl}

Context: ${context}

Generate a comprehensive but focused SEO audit report for this single page in JSON format. Focus on:
- Page title and meta description optimization
- Heading structure (H1, H2, H3)
- Content quality and keyword usage
- Image optimization
- Internal linking opportunities
- Page speed considerations
- Mobile-friendliness factors

Return a JSON object with this structure:
{
  "overallScore": [number between 45-95],
  "summary": {
    "score": [same as overallScore],
    "failed": [number between 1-5],
    "warnings": [number between 2-8],
    "passed": [number between 5-15]
  },
  "pageAnalysis": {
    "title": {
      "status": "pass|warning|fail",
      "score": [percentage],
      "current": "[current title if provided]",
      "recommendation": "[specific recommendation]"
    },
    "metaDescription": {
      "status": "pass|warning|fail", 
      "score": [percentage],
      "current": "[current description if provided]",
      "recommendation": "[specific recommendation]"
    },
    "headings": {
      "status": "pass|warning|fail",
      "score": [percentage],
      "current": "[current heading structure]",
      "recommendation": "[specific recommendation]"
    },
    "content": {
      "status": "pass|warning|fail",
      "score": [percentage],
      "current": "[content quality assessment]",
      "recommendation": "[specific recommendation]"
    }
  },
  "recommendations": [
    {
      "priority": "high|medium|low",
      "category": "[category]",
      "action": "[specific action item]",
      "impact": "high|medium|low",
      "effort": "high|medium|low"
    }
  ],
  "quickWins": [
    "[specific quick win 1]",
    "[specific quick win 2]",
    "[specific quick win 3]"
  ]
}

IMPORTANT: Generate REAL, UNIQUE content for every field. Do NOT use templates or placeholders. Make everything specific to ${pageUrl} and the ${context} context. Return ONLY valid JSON, no explanation.`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert SEO analyst that generates focused, single-page SEO audit reports in JSON format. Focus on analyzing one page, not entire websites. Return ONLY valid JSON.' 
          },
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
      console.log('✅ SEO Audit AI generation successful');
    } catch (e) {
      console.log('❌ SEO Audit AI generation failed, using fallback');
      output = {
        _warning: "AI generation failed - using fallback data",
        overallScore: 75,
        summary: { score: 75, failed: 3, warnings: 5, passed: 10 },
        pageAnalysis: {
          title: { status: "warning", score: "70%", current: "Page title", recommendation: "Optimize title with target keywords" },
          metaDescription: { status: "warning", score: "65%", current: "Meta description", recommendation: "Add compelling description with call-to-action" },
          headings: { status: "pass", score: "85%", current: "Good heading structure", recommendation: "Maintain current structure" },
          content: { status: "pass", score: "80%", current: "Quality content present", recommendation: "Add more relevant keywords naturally" }
        },
        recommendations: [
          { priority: "high", category: "Title", action: "Optimize page title with target keywords", impact: "high", effort: "low" },
          { priority: "medium", category: "Meta Description", action: "Write compelling meta description", impact: "medium", effort: "low" }
        ],
        quickWins: [
          "Optimize page title with target keywords",
          "Add compelling meta description",
          "Ensure proper heading hierarchy"
        ]
      };
    }
    
    return output;
  } catch (error) {
    console.error('SEO Audit generation error:', error);
    return {
      _warning: "OpenAI API error - using fallback data",
      overallScore: 75,
      summary: { score: 75, failed: 3, warnings: 5, passed: 10 },
      pageAnalysis: {
        title: { status: "warning", score: "70%", current: "Page title", recommendation: "Optimize title with target keywords" },
        metaDescription: { status: "warning", score: "65%", current: "Meta description", recommendation: "Add compelling description with call-to-action" },
        headings: { status: "pass", score: "85%", current: "Good heading structure", recommendation: "Maintain current structure" },
        content: { status: "pass", score: "80%", current: "Quality content present", recommendation: "Add more relevant keywords naturally" }
        },
      recommendations: [
        { priority: "high", category: "Title", action: "Optimize page title with target keywords", impact: "high", effort: "low" },
        { priority: "medium", category: "Meta Description", action: "Write compelling meta description", impact: "medium", effort: "low" }
      ],
      quickWins: [
        "Optimize page title with target keywords",
        "Add compelling meta description",
        "Ensure proper heading hierarchy"
      ]
    };
  }
}

module.exports = router 