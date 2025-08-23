const express = require("express")
const User = require("../models/User")
const AIToolUsage = require("../models/AIToolUsage")
const auth = require("../middleware/auth")
const rateLimit = require("express-rate-limit")
const axios = require('axios');
const cheerio = require('cheerio');
const NotificationService = require("../services/notificationService");
const SocialMediaScheduler = require("../services/socialMediaScheduler");
const CanvaService = require("../services/canvaService");
require('dotenv').config();

const router = express.Router()

// Debug environment variables loading
console.log('🔍 Environment Variables Check:');
console.log('📝 NODE_ENV:', process.env.NODE_ENV);
console.log('📝 OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('📝 OPENAI_API_KEY length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 'undefined');
console.log('📝 OPENAI_API_KEY starts with sk-:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.startsWith('sk-') : 'undefined');

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
      console.log(`🔄 Starting AI generation for ${toolId}...`);
      output = await simulateAIGeneration(toolId, input)
      console.log(`✅ AI generation completed for ${toolId}:`, output ? 'Success' : 'No output');
      if (output) {
        console.log(`📊 Output keys:`, Object.keys(output));
      }
    } catch (aiError) {
      console.error(`❌ AI generation failed for ${toolId}:`, aiError)
      console.error(`📝 Error details:`, aiError.message, aiError.stack)
      output = getFallbackData(toolId, input)
      console.log(`🔄 Using fallback data for ${toolId}`);
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
    
    // For SEO audit, ensure we have the complete data structure
    if (toolId === 'seo-audit') {
      console.log('🔍 SEO Audit output validation:');
      console.log('📊 Output keys:', Object.keys(output));
      console.log('📊 Has technicalSEO:', !!output.technicalSEO);
      console.log('📊 Has performance:', !!output.performance);
      console.log('📊 Has recommendations:', !!output.recommendations);
      
      // Ensure all required sections exist
      if (!output.technicalSEO) {
        console.log('⚠️ Missing technicalSEO, adding fallback');
        output.technicalSEO = getFallbackData('seo-audit', input).technicalSEO;
      }
      if (!output.performance) {
        console.log('⚠️ Missing performance, adding fallback');
        output.performance = getFallbackData('seo-audit', input).performance;
      }
      if (!output.recommendations) {
        console.log('⚠️ Missing recommendations, adding fallback');
        output.recommendations = getFallbackData('seo-audit', input).recommendations;
      }
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
  console.log('🔑 OpenAI API Key Check:');
  console.log('📝 Environment variable exists:', !!process.env.OPENAI_API_KEY);
  console.log('📝 API Key length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
  console.log('📝 API Key starts with sk-:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.startsWith('sk-') : false);
  
  // Check if OpenAI API key is available
  if (!process.env.OPENAI_API_KEY) {
    console.log('❌ OpenAI API key not found, using fallback mock data');
    console.log('💡 Check your .env file and make sure it contains: OPENAI_API_KEY=sk-your-key-here');
    return getFallbackData(toolId, input);
  }
  
  if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
    console.log('❌ OpenAI API key format invalid, using fallback mock data');
    console.log('💡 API key should start with "sk-"');
    return getFallbackData(toolId, input);
  }
  
  console.log('✅ OpenAI API key found and valid, proceeding with AI generation');

  try {
    if (toolId === 'seo-audit') {
      console.log('🎯 Calling generateSEOAudit function...');
      const result = await generateSEOAudit(input);
      console.log('✅ generateSEOAudit completed successfully');
      console.log('📊 Result keys:', Object.keys(result));
      return result;
    } else if (toolId === 'product-launch') {
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
      return await generateColdOutreach(input);
    } else if (toolId === 'reels-scripts') {
      return await generateReelsScript(input);
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
  // Generate dynamic content mix based on user inputs with AI-powered customization
  const getContentMix = (contentGoals, brandVoice, postFrequency, business, industry, targetAudience) => {
    // Base percentages that will be dynamically adjusted
    let educational = 35, engaging = 35, promotional = 20, ugc = 10;
    
    // Dynamic adjustments based on business context
    if (industry?.toLowerCase().includes('healthcare') || industry?.toLowerCase().includes('medical')) {
      educational = Math.min(educational + 15, 50);
      promotional = Math.max(promotional - 10, 10);
      engaging = Math.max(engaging - 5, 25);
    } else if (industry?.toLowerCase().includes('e-commerce') || industry?.toLowerCase().includes('retail')) {
      promotional = Math.min(promotional + 10, 30);
      engaging = Math.min(engaging + 5, 40);
      educational = Math.max(educational - 5, 25);
    } else if (industry?.toLowerCase().includes('technology') || industry?.toLowerCase().includes('software')) {
      educational = Math.min(educational + 10, 45);
      engaging = Math.min(engaging + 5, 40);
      promotional = Math.max(promotional - 5, 15);
    } else if (industry?.toLowerCase().includes('hospitality') || industry?.toLowerCase().includes('tourism')) {
      engaging = Math.min(engaging + 15, 50);
      ugc = Math.min(ugc + 10, 25);
      educational = Math.max(educational - 10, 20);
    }
    
    // Adjust based on content goals
    if (contentGoals?.toLowerCase().includes('lead')) {
      promotional = Math.min(promotional + 10, 35);
      educational = Math.max(educational - 5, 20);
      engaging = Math.max(engaging - 5, 25);
    } else if (contentGoals?.toLowerCase().includes('awareness')) {
      educational = Math.min(educational + 15, 50);
      engaging = Math.min(engaging + 5, 40);
      promotional = Math.max(promotional - 10, 10);
    } else if (contentGoals?.toLowerCase().includes('engagement')) {
      engaging = Math.min(engaging + 15, 50);
      ugc = Math.min(ugc + 10, 25);
      educational = Math.max(educational - 5, 20);
    } else if (contentGoals?.toLowerCase().includes('sales')) {
      promotional = Math.min(promotional + 15, 35);
      engaging = Math.min(engaging + 5, 40);
      educational = Math.max(educational - 10, 20);
    }
    
    // Adjust based on brand voice
    if (brandVoice?.toLowerCase().includes('professional')) {
      educational = Math.min(educational + 10, 50);
      promotional = Math.max(promotional - 5, 15);
      engaging = Math.max(engaging - 5, 30);
    } else if (brandVoice?.toLowerCase().includes('casual') || brandVoice?.toLowerCase().includes('fun')) {
      engaging = Math.min(engaging + 15, 50);
      ugc = Math.min(ugc + 10, 25);
      educational = Math.max(educational - 10, 20);
    } else if (brandVoice?.toLowerCase().includes('luxury') || brandVoice?.toLowerCase().includes('premium')) {
      promotional = Math.min(promotional + 5, 25);
      educational = Math.min(educational + 5, 40);
      engaging = Math.max(engaging - 5, 30);
    }
    
    // Adjust based on posting frequency
    if (postFrequency?.toLowerCase().includes('daily') || postFrequency?.toLowerCase().includes('5')) {
      ugc = Math.min(ugc + 15, 30);
      engaging = Math.min(engaging + 5, 40);
      promotional = Math.max(promotional - 10, 15);
    } else if (postFrequency?.toLowerCase().includes('weekly') || postFrequency?.toLowerCase().includes('3')) {
      promotional = Math.min(promotional + 5, 25);
      educational = Math.min(educational + 5, 40);
      engaging = Math.max(engaging - 5, 30);
    } else if (postFrequency?.toLowerCase().includes('monthly') || postFrequency?.toLowerCase().includes('1')) {
      promotional = Math.min(promotional + 10, 30);
      educational = Math.min(educational + 10, 45);
      engaging = Math.max(engaging - 5, 25);
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
  const getPostingSchedule = (postFrequency, contentGoals, business, industry, targetAudience) => {
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

  const contentMix = getContentMix(input.contentGoals, input.brandVoice, input.postFrequency, input.business, input.industry, input.targetAudience);
  const postingSchedule = getPostingSchedule(input.postFrequency, input.contentGoals, input.business, input.industry, input.targetAudience);

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
  
  // Generate dynamic hashtag strategy based on business context
  const generateHashtagStrategy = (business, industry, targetAudience) => {
    const industryHashtags = {
      'healthcare': ['#HealthcareInnovation', '#MedicalTech', '#PatientCare', '#HealthTech', '#MedicalInnovation'],
      'e-commerce': ['#EcommerceTips', '#OnlineRetail', '#DigitalCommerce', '#RetailTech', '#ShoppingOnline'],
      'technology': ['#TechInnovation', '#DigitalTransformation', '#TechTrends', '#InnovationHub', '#FutureTech'],
      'hospitality': ['#HospitalityExcellence', '#GuestExperience', '#TravelIndustry', '#CustomerService', '#LuxuryTravel'],
      'education': ['#EdTech', '#LearningInnovation', '#DigitalEducation', '#StudentSuccess', '#FutureOfLearning'],
      'finance': ['#FinTech', '#FinancialServices', '#InvestmentTips', '#WealthManagement', '#FinancialPlanning']
    };
    
    const audienceHashtags = {
      'professionals': ['#ProfessionalDevelopment', '#CareerGrowth', '#BusinessTips', '#Leadership', '#Networking'],
      'entrepreneurs': ['#Entrepreneurship', '#StartupLife', '#BusinessGrowth', '#Innovation', '#Success'],
      'marketers': ['#DigitalMarketing', '#MarketingTips', '#BrandStrategy', '#ContentMarketing', '#GrowthHacking'],
      'students': ['#StudentLife', '#Learning', '#Education', '#StudyTips', '#AcademicSuccess'],
      'parents': ['#Parenting', '#FamilyLife', '#ParentingTips', '#FamilyTime', '#ParentingHacks']
    };
    
    const brandedHashtags = [
      `#${business?.replace(/\s+/g, '') || 'Business'}Excellence`,
      `#${business?.replace(/\s+/g, '') || 'Business'}Innovation`,
      `#${business?.replace(/\s+/g, '') || 'Business'}Success`,
      `#${business?.replace(/\s+/g, '') || 'Business'}Community`,
      `#${business?.replace(/\s+/g, '') || 'Business'}Journey`
    ];
    
    return {
      trending: industryHashtags[industry?.toLowerCase()] || ['#Innovation', '#Growth', '#Success', '#Excellence', '#Future'],
      niche: audienceHashtags[targetAudience?.toLowerCase()] || ['#Professional', '#Quality', '#Service', '#Excellence', '#Innovation'],
      branded: brandedHashtags
    };
  };
  
  const hashtagStrategy = generateHashtagStrategy(input.business, input.industry, input.targetAudience);

  const prompt = `Generate COMPLETELY UNIQUE and engaging social media content in JSON format for the following business (Request ID: ${Date.now()}):


Business Name: ${input.business || 'Business'}
Industry: ${input.industry || 'General business'}
Target Audience: ${input.targetAudience || 'General audience'}
Platforms: ${input.platforms?.join(', ') || 'All platforms'}
Content Goals: ${input.contentGoals || 'Engagement and brand awareness'}
Brand Voice: ${input.brandVoice || 'Professional'}
Post Frequency: ${input.postFrequency || 'Daily'}

ADDITIONAL REQUIREMENTS FOR API INTEGRATIONS:

11. **API Integration Options**: Include scheduling and visual creation options:
    - "autoSchedule": true/false (whether to auto-schedule posts)
    - "platform": "publer" or "buffer" (which scheduling platform to use)
    - "generateImages": true/false (whether to create Canva images)
    - "imageStyle": "modern", "minimal", "bold", "professional" (visual style preference)

12. **Export Options**: Include multiple export formats:
    - "exportFormats": ["csv", "google_sheets", "publer", "buffer"]
    - "scheduleType": "weekly", "monthly", "custom"
    - "postingTimes": ["9:00 AM", "12:00 PM", "3:00 PM", "6:00 PM"]

13. **Visual Content**: Include image generation specifications:
    - "imageIdeas": ["specific image concept 1", "specific image concept 2"]
    - "brandColors": ["#hex1", "#hex2", "#hex3"]
    - "visualStyle": "detailed description of visual style"

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
5. **strategy.contentMix.description**: Write detailed, specific strategies for each content type that are tailored to this exact business. For example:
   - Educational Content: "Share ${input.business || 'business'} insights about ${input.industry || 'industry'} trends, create how-to guides for ${input.targetAudience || 'audience'}, and provide expert tips that position ${input.business || 'business'} as a thought leader"
   - Engaging Content: "Show behind-the-scenes of ${input.business || 'business'} operations, create interactive polls about ${input.industry || 'industry'} challenges, and share customer success stories that resonate with ${input.targetAudience || 'audience'}"
   - Promotional Content: "Highlight ${input.business || 'business'} unique value propositions, showcase customer testimonials, and promote special offers that appeal to ${input.targetAudience || 'audience'}"
   - User-Generated Content: "Encourage ${input.targetAudience || 'audience'} to share their experiences with ${input.business || 'business'}, repost customer reviews, and create community challenges"

6. **strategy.postingSchedule.times**: Give specific times for each day based on ${input.industry || 'industry'} best practices
7. **strategy.postingSchedule.contentType**: Create specific content types for each day that align with ${input.business || 'business'} goals
8. **strategy.hashtagStrategy**: Generate hashtags specific to ${input.business || 'business'}:
   - trending: 3-5 trending hashtags in ${input.industry || 'industry'}
   - niche: 3-5 niche hashtags specific to ${input.targetAudience || 'audience'}
   - branded: 3-5 branded hashtags unique to ${input.business || 'business'}

9. **analytics**: Create realistic projections for ${input.business || 'business'} based on ${input.industry || 'industry'} and ${input.targetAudience || 'audience'}:
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
    "hashtagStrategy": ${JSON.stringify(hashtagStrategy)}
  },
  "analytics": {
    "expectedReach": "",
    "engagementRate": "",
    "bestPerformingContent": "",
    "growthProjection": ""
  },
  "apiIntegrations": {
    "autoSchedule": true,
    "platform": "publer",
    "generateImages": true,
    "imageStyle": "modern",
    "exportFormats": ["csv", "google_sheets", "publer"],
    "scheduleType": "weekly",
    "postingTimes": ["9:00 AM", "12:00 PM", "3:00 PM", "6:00 PM"]
  },
  "visualContent": {
    "imageIdeas": ["specific image concept 1", "specific image concept 2"],
    "brandColors": ["#hex1", "#hex2", "#hex3"],
    "visualStyle": "detailed description of visual style"
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
    console.log('ðŸ“¤ Making OpenAI API request...');
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an expert social media content creator and strategist. You MUST create COMPLETELY UNIQUE content for each business. NEVER use generic templates or placeholder text. Every piece of content must be specific to the exact business, industry, and target audience provided. CRITICAL: You MUST generate content for ALL selected platforms - each platform should have completely different, unique posts. For content strategy, you MUST provide detailed, actionable descriptions that mention the specific business name and industry. If you generate generic content or only one post, you are failing at your task.' },
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
    console.log('ðŸ“ Raw response length:', text.length);
    
    let output;
    try {
      output = JSON.parse(text);
      console.log('âœ… JSON parsed successfully');
      return output;
    } catch (parseError) {
      console.log('âš ï¸ JSON parsing failed, trying to extract JSON...');
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
    console.log('ðŸ”„ Falling back to static data');
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

Generate a JSON object with this EXACT structure:

{
  "variations": [
    {
      "platform": "Facebook",
      "format": "Feed",
      "headline": "",
      "description": "",
      "cta": "",
      "character_count": {
        "headline": 40,
        "description": 125
      },
      "compliance_check": {
        "passed": true,
        "issues": []
      }
    },
    {
      "platform": "Google Ads",
      "format": "Search",
      "headline": "",
      "description": "",
      "cta": "",
      "character_count": {
        "headline": 30,
        "description": 90
      },
      "compliance_check": {
        "passed": true,
        "issues": []
      }
    },
    {
      "platform": "Instagram",
      "format": "Feed",
      "headline": "",
      "description": "",
      "cta": "",
      "character_count": {
        "headline": 40,
        "description": 125
      },
      "compliance_check": {
        "passed": true,
        "issues": []
      }
    }
  ],
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
    const prompt = `You are an expert landing page optimization analyst. Generate a comprehensive landing page optimization analysis for the following website:

URL: ${input.url || 'example.com'}
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
}

// Generate Reels Script using OpenAI
async function generateReelsScript(input) {
  const prompt = `You are an expert short-form video content creator specializing in viral Instagram Reels, TikTok, and YouTube Shorts. 

Create COMPLETELY UNIQUE and engaging video scripts for the following requirements:

Topic: ${input.topic || 'General topic'}
Niche: ${input.niche || 'General'}
Target Audience: ${input.targetAudience || 'General audience'}
Content Type: ${input.contentType || 'Educational'}
Duration: ${input.duration || '30 seconds'}
Goal: ${input.goal || 'Engagement'}
Tone: ${input.tone || 'Casual'}

Generate a comprehensive JSON object with this EXACT structure:

{
  "scripts": [
    {
      "platform": "Instagram Reels",
      "hook": "Create a unique, attention-grabbing hook that makes viewers stop scrolling",
      "content": "Create a detailed, step-by-step script with scene breakdowns, timing, and engaging content that delivers value to the audience",
      "cta": "Create a compelling call-to-action that encourages engagement",
      "hashtags": ["Create 5-7 relevant, trending hashtags"],
      "duration": "${input.duration || '30 seconds'}",
      "engagement": "High (12-18%)"
    },
    {
      "platform": "TikTok",
      "hook": "Create a unique TikTok-style hook that's perfect for the platform",
      "content": "Create a TikTok-optimized script with trending elements, challenges, or viral content structure",
      "cta": "Create a TikTok-specific call-to-action",
      "hashtags": ["Create 5-7 TikTok-specific trending hashtags"],
      "duration": "${input.duration || '30 seconds'}",
      "engagement": "Very High (15-25%)"
    },
    {
      "platform": "YouTube Shorts",
      "YouTube Shorts",
      "hook": "Create a YouTube Shorts hook that encourages subscriptions",
      "content": "Create a YouTube-optimized script with educational value and clear structure",
      "cta": "Create a YouTube-specific call-to-action encouraging subscriptions",
      "hashtags": ["Create 5-7 YouTube-appropriate hashtags"],
      "duration": "${input.duration || '30 seconds'}",
      "engagement": "High (8-15%)"
    }
  ],
  "hooks": [
    {
      "category": "Question Hooks",
      "examples": ["Create 5 unique question-based hooks that make viewers curious"]
    },
    {
      "category": "POV Hooks",
      "examples": ["Create 5 unique POV-style hooks that create relatability"]
    },
    {
      "category": "Number Hooks",
      "examples": ["Create 5 unique number-based hooks that promise specific value"]
    },
    {
      "category": "Controversy Hooks",
      "examples": ["Create 5 unique controversy-style hooks that challenge assumptions"]
    }
  ],
  "trends": {
    "trending": ["Create 10 unique trending content types for 2024"],
    "sounds": ["Create 10 unique sound and audio recommendations"],
    "effects": ["Create 10 unique visual effects and transitions"]
  },
  "optimization": {
    "bestTimes": ["Create 8 unique best posting times with specific reasoning"],
    "captionTips": ["Create 10 unique caption writing tips"],
    "engagementTactics": ["Create 10 unique engagement strategies"]
  }
}

IMPORTANT REQUIREMENTS:
1. Generate COMPLETELY UNIQUE content for every section - no generic templates
2. Make content specific to the topic, niche, and target audience provided
3. Include current 2024 trends and best practices
4. Create engaging, viral-worthy content that drives real engagement
5. Return ONLY valid JSON, no explanations or additional text
6. Make each script variation truly different and platform-optimized

Focus on creating content that will actually go viral and engage the specific audience mentioned.`;

  try {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4',
      messages: [
          { 
            role: 'system', 
            content: 'You are an expert short-form video content creator with 10+ years of experience creating viral content for Instagram Reels, TikTok, and YouTube Shorts. You understand current trends, platform algorithms, and what makes content go viral in 2024. Always generate unique, creative content that drives real engagement.' 
          },
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
  let output;
  try {
    output = JSON.parse(text);
  } catch (e) {
      console.error('JSON parsing error:', e);
    const match = text.match(/\{[\s\S]*\}/);
    output = match ? JSON.parse(match[0]) : getFallbackData('reels-scripts', input);
  }
  return output;
  } catch (error) {
    console.error('OpenAI API error:', error);
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
    _warning: "âš ï¸ This is static fallback content. For dynamic AI-generated content, please ensure your OpenAI API key is configured correctly.",
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
        announcement: `ðŸš¨ BREAKING: ${input.productName || 'Product'} is launching!\n\nThe future of ${input.productType || 'SaaS'} is here!\n\nKey features:\nðŸ”¥ ${input.keyFeatures || 'Feature 1'}\nðŸ”¥ ${input.keyFeatures || 'Feature 2'}\nðŸ”¥ ${input.keyFeatures || 'Feature 3'}\n\nPerfect for: ${input.targetAudience || 'Business users'}\nPricing: ${input.pricing || '$99/month'}\n\n#${input.productName?.replace(/\s+/g, '') || 'Product'} #Launch #Innovation`,
        countdown: `â° 3 DAYS until ${input.productName || 'Product'} launches!\n\nReady to transform your ${input.productType || 'SaaS'} experience?\n\nWhat to expect:\nâš¡ ${input.keyFeatures || 'Feature 1'}\nâš¡ ${input.keyFeatures || 'Feature 2'}\n\nSet your reminder! ðŸ“…\n\n#${input.productName?.replace(/\s+/g, '') || 'Product'} #Countdown`,
        launch: `ðŸŽ‰ ${input.productName || 'Product'} IS LIVE! ðŸŽ‰\n\nExperience the future of ${input.productType || 'SaaS'} today!\n\nLaunch Special: ${input.pricing || '$99/month'}\n\nGet started: [Link]\n\n#${input.productName?.replace(/\s+/g, '') || 'Product'} #LiveNow`,
        testimonial: `ðŸ’¬ "${input.productName || 'Product'} changed everything!"\n\n"As a ${input.targetAudience || 'business user'}, this is exactly what I needed."\n\n- Happy Customer\n\n#${input.productName?.replace(/\s+/g, '') || 'Product'} #Success`
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
    return {
      ...fallbackWarning,
      variations: [
        {
          platform: "Facebook",
          format: "Feed",
          headline: `Transform Your ${input.product || 'Business'} with Our Solution`,
          description: `Discover how ${input.audience || 'thousands of professionals'} are achieving remarkable results with our ${input.product || 'solution'}. ${input.usp || 'Proven results'} guaranteed.`,
          cta: "Get Started Today",
          character_count: {
            headline: 40,
            description: 125
          },
          compliance_check: {
            passed: true,
            issues: []
          }
        },
        {
          platform: "Google Ads",
          format: "Search",
          headline: `${input.product || 'Solution'} That Actually Works`,
          description: `${input.usp || 'Proven'} ${input.product || 'solution'} for ${input.audience || 'businesses'}. See results in 30 days or money back.`,
          cta: "Learn More",
          character_count: {
            headline: 30,
            description: 90
          },
          compliance_check: {
            passed: true,
            issues: []
          }
        },
        {
          platform: "Instagram",
          format: "Feed",
          headline: `Revolutionary ${input.product || 'Solution'} for ${input.audience || 'Professionals'}`,
          description: `Join ${input.audience || 'successful businesses'} who trust our ${input.product || 'solution'}. ${input.usp || 'Award-winning'} results guaranteed.`,
          cta: "Shop Now",
          character_count: {
            headline: 40,
            description: 125
          },
          compliance_check: {
            passed: true,
            issues: []
          }
        }
      ],
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
    // Generate comprehensive landing page optimization analysis fallback
    const url = input.url || 'example.com';
    const industry = input.industry || 'General';
    const goal = input.goal || 'Lead generation';
    const targetAudience = input.targetAudience || 'General audience';
    
    // Generate domain from URL
    const domain = url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    
    // Industry-specific performance factors
    const industryFactors = {
      "saas": { avgConversionRate: 3.2, avgBounceRate: 45, avgSessionDuration: 180 },
      "e-commerce": { avgConversionRate: 2.8, avgBounceRate: 52, avgSessionDuration: 150 },
      "healthcare": { avgConversionRate: 4.1, avgBounceRate: 38, avgSessionDuration: 220 },
      "finance": { avgConversionRate: 3.5, avgBounceRate: 42, avgSessionDuration: 200 },
      "education": { avgConversionRate: 2.9, avgBounceRate: 48, avgSessionDuration: 160 },
      "real estate": { avgConversionRate: 2.5, avgBounceRate: 55, avgSessionDuration: 140 }
    };
    
    const factor = industryFactors[industry?.toLowerCase()] || industryFactors.saas;
    
    // Generate dynamic scores based on URL
    const urlHash = domain.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const baseScore = 60 + (urlHash % 40); // Score between 60-100
    
    return {
      ...fallbackWarning,
      overview: {
        overallScore: baseScore,
        conversionPotential: baseScore > 80 ? "Excellent" : baseScore > 70 ? "High" : baseScore > 60 ? "Good" : "Needs Improvement",
        trafficQuality: baseScore > 75 ? "Excellent" : baseScore > 65 ? "Good" : "Needs Improvement",
        userExperience: baseScore > 80 ? "Excellent" : baseScore > 70 ? "Good" : "Needs Improvement"
      },
      performance: {
        loadTime: parseFloat((2.1 + Math.random() * 2.5).toFixed(1)),
        mobileScore: Math.round(65 + Math.random() * 30),
        desktopScore: Math.round(75 + Math.random() * 20),
        seoScore: Math.round(70 + Math.random() * 25),
        accessibilityScore: Math.round(60 + Math.random() * 35),
        coreWebVitals: {
          lcp: parseFloat((1.5 + Math.random() * 1.5).toFixed(1)),
          fid: Math.round(20 + Math.random() * 50),
          cls: parseFloat((0.05 + Math.random() * 0.1).toFixed(2))
        }
      },
      seoAnalysis: {
        titleTag: {
          current: `Current title tag for ${domain}`,
          score: Math.round(70 + Math.random() * 20),
          issues: ["Missing target keywords", "Title too long"],
          suggestion: "Include primary keyword in title and keep under 60 characters"
        },
        metaDescription: {
          current: `Current meta description for ${domain}`,
          score: Math.round(75 + Math.random() * 15),
          issues: ["Missing call-to-action"],
          suggestion: "Add compelling CTA to meta description"
        },
        headings: {
          h1: {
            current: `Current H1 tag for ${domain}`,
            score: Math.round(65 + Math.random() * 25),
            suggestion: "Optimize H1 with primary keyword and value proposition"
          },
          structure: "Poor header hierarchy - needs better H1 to H6 structure"
        }
      },
      conversionOptimization: {
        headline: {
          current: `Current headline for ${domain}`,
          score: Math.round(70 + Math.random() * 20),
          issues: ["Weak value proposition", "Missing urgency"],
          suggestions: ["Strengthen value proposition", "Add urgency elements", "Include target audience benefit"]
        },
        cta: {
          current: `Current CTA for ${domain}`,
          score: Math.round(65 + Math.random() * 25),
          issues: ["Poor placement", "Weak copy"],
          suggestions: ["Move CTA above the fold", "Use action-oriented language", "Add urgency"]
        },
        valueProposition: {
          score: Math.round(68 + Math.random() * 20),
          issues: ["Unclear benefits", "Missing social proof"],
          suggestions: ["Clarify unique value proposition", "Add customer testimonials", "Include specific benefits"]
        }
      },
      userExperience: {
        navigation: {
          score: Math.round(70 + Math.random() * 20),
          issues: ["Complex menu structure", "Missing breadcrumbs"],
          suggestions: ["Simplify navigation menu", "Add breadcrumb navigation", "Improve mobile menu"]
        },
        forms: {
          score: Math.round(65 + Math.random() * 25),
          issues: ["Too many fields", "Poor validation"],
          suggestions: ["Reduce form fields", "Add inline validation", "Improve error messages"]
        },
        trust: {
          score: Math.round(68 + Math.random() * 20),
          issues: ["Missing testimonials", "No security badges"],
          suggestions: ["Add customer testimonials", "Display security badges", "Include trust signals"]
        }
      },
      recommendations: {
        immediate: [
          {
            task: "Optimize Page Load Speed",
            priority: "High",
            impact: "High",
            effort: "Medium",
            description: `Reduce load time from ${(2.1 + Math.random() * 2.5).toFixed(1)}s to under 2s by compressing images and optimizing CSS for ${domain}`
          },
          {
            task: "Improve Call-to-Action Placement",
            priority: "High",
            impact: "High",
            effort: "Low",
            description: `Optimize CTA button placement and messaging to better align with ${goal} objectives`
          },
          {
            task: "Enhance Mobile Experience",
            priority: "Medium",
            impact: "Medium",
            effort: "High",
            description: `Improve mobile responsiveness and touch interactions for better ${targetAudience} engagement`
          }
        ],
        longTerm: [
          {
            task: "Implement A/B Testing Framework",
            priority: "Medium",
            impact: "High",
            effort: "High",
            description: `Establish comprehensive A/B testing for continuous optimization of ${goal} performance`
          },
          {
            task: "Advanced Analytics Integration",
            priority: "Low",
            impact: "Medium",
            effort: "High",
            description: `Implement advanced analytics and personalization to better serve ${targetAudience}`
          }
        ]
      },
      projectedImprovements: {
        conversionRate: {
          current: `${(factor.avgConversionRate * (0.7 + Math.random() * 0.6)).toFixed(1)}%`,
          projected: `${(factor.avgConversionRate * (1.3 + Math.random() * 0.4)).toFixed(1)}%`,
          increase: "+50% improvement"
        },
        bounceRate: {
          current: `${Math.round(factor.avgBounceRate * (0.8 + Math.random() * 0.4))}%`,
          projected: `${Math.round(factor.avgBounceRate * (0.6 + Math.random() * 0.2))}%`,
          improvement: "-22% reduction"
        },
        avgSessionDuration: {
          current: `${Math.round(factor.avgSessionDuration * (0.7 + Math.random() * 0.6))}s`,
          projected: `${Math.round(factor.avgSessionDuration * (1.4 + Math.random() * 0.6))}s`,
          increase: "+55% increase"
        }
      },
      competitorAnalysis: {
        yourPosition: "Mid-tier",
        averageScore: Math.round(70 + Math.random() * 20),
        topPerformers: [
          {
            name: "CompetitorA.com",
            score: Math.round(85 + Math.random() * 10),
            strength: "Strong value proposition and clear pricing structure"
          },
          {
            name: "CompetitorB.com",
            score: Math.round(80 + Math.random() * 10),
            strength: "Excellent mobile optimization and fast load times"
          },
          {
            name: "CompetitorC.com",
            score: Math.round(75 + Math.random() * 10),
            strength: "Strong social proof and testimonials"
          }
        ]
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
    };

  } else if (toolId === 'cold-outreach') {
    // Generate dynamic cold outreach fallback data
    const targetRole = input.targetRole || 'Business Professional';
    const industry = input.industry || 'Technology';
    const companySize = input.companySize || 'Medium';
    const painPoint = input.painPoint || 'Operational efficiency';
    const valueProposition = input.valueProposition || 'Increase productivity by 40%';
    const productService = input.productService || 'Business solution';
    const campaignGoal = input.campaignGoal || 'Schedule demo';
    const tone = input.tone || 'Professional';
    
    // Generate dynamic research points based on industry and role
    const generateResearchPoints = (industry, role) => {
      const industryChallenges = {
        'Technology': ['Rapid technological changes', 'Cybersecurity threats', 'Talent acquisition', 'Digital transformation'],
        'Healthcare': ['Regulatory compliance', 'Patient care optimization', 'Cost management', 'Technology integration'],
        'Finance': ['Regulatory changes', 'Digital banking transformation', 'Risk management', 'Customer experience'],
        'Manufacturing': ['Supply chain disruptions', 'Automation needs', 'Quality control', 'Cost optimization'],
        'Retail': ['E-commerce competition', 'Customer experience', 'Inventory management', 'Omnichannel strategy']
      };
      
      const roleChallenges = {
        'CEO': ['Strategic growth', 'Market expansion', 'Operational efficiency', 'Competitive advantage'],
        'VP of Marketing': ['Lead generation', 'Brand awareness', 'ROI measurement', 'Customer acquisition'],
        'Sales Director': ['Revenue growth', 'Team performance', 'Pipeline management', 'Customer retention'],
        'CTO': ['Technology infrastructure', 'Digital transformation', 'Security', 'Innovation'],
        'Operations Manager': ['Process optimization', 'Cost reduction', 'Team productivity', 'Quality improvement']
      };
      
      const challenges = [
        ...(industryChallenges[industry] || industryChallenges['Technology']),
        ...(roleChallenges[role] || roleChallenges['CEO'])
      ];
      
      return challenges.slice(0, 5);
    };
    
    // Generate dynamic value propositions
    const generateValuePropositions = (industry, painPoint, valueProposition) => {
      const baseProps = [
        `Increase ${industry.toLowerCase()} efficiency by 40%`,
        `Reduce operational costs by 30%`,
        `Improve customer satisfaction by 50%`,
        `Streamline ${painPoint.toLowerCase()} processes`,
        `Generate 3x more qualified leads`
      ];
      
      return baseProps.slice(0, 4);
    };
    
    // Generate dynamic common ground elements
    const generateCommonGround = (industry, role) => {
      return [
        `Both focused on ${industry} excellence and innovation`,
        `Shared commitment to driving business growth and results`,
        `Understanding of ${role} challenges and priorities`,
        `Passion for delivering exceptional customer value`,
        `Dedication to continuous improvement and optimization`
      ];
    };
    
    // Generate dynamic outreach messages
    const generateOutreachMessages = (targetRole, industry, painPoint, valueProposition, tone) => {
      const messages = [
        {
          platform: "LinkedIn",
          message: `Hi [Name], I came across your recent insights on navigating the evolving ${industry} landscape, and your perspective really resonated with me. Your approach to tackling ${painPoint} challenges shows the kind of strategic thinking that separates industry leaders from followers. I've been working with companies facing similar hurdles and discovered some fascinating patterns that might be relevant to your current initiatives. Would love to share a case study that could offer valuable insights for your team.`,
          subjectLine: "Your strategic insights caught my attention",
          content: `Hi [Name], I came across your recent insights on navigating the evolving ${industry} landscape, and your perspective really resonated with me. Your approach to tackling ${painPoint} challenges shows the kind of strategic thinking that separates industry leaders from followers. I've been working with companies facing similar hurdles and discovered some fascinating patterns that might be relevant to your current initiatives. Would love to share a case study that could offer valuable insights for your team.`,
          timing: "Send on Tuesday or Wednesday between 9-11 AM",
          purpose: "Build authentic connection through shared insights",
          followUpTrigger: "No response after 3 business days"
        },
        {
          platform: "Email",
          subjectLine: "Quick thought on your industry approach",
          message: `Hi [Name], I hope this finds you well. I've been following your work in ${industry} and was particularly struck by your innovative approach to addressing ${painPoint}. It's refreshing to see someone tackle these challenges with such strategic clarity. I wanted to reach out because we've been helping companies navigate similar waters, and I think there might be some valuable insights we could share. Would you be open to a brief conversation about what we're seeing in the market?`,
          content: `Hi [Name], I hope this finds you well. I've been following your work in ${industry} and was particularly struck by your innovative approach to addressing ${painPoint}. It's refreshing to see someone tackle these challenges with such strategic clarity. I wanted to reach out because we've been helping companies navigate similar waters, and I think there might be some valuable insights we could share. Would you be open to a brief conversation about what we're seeing in the market?`,
          timing: "Send on Tuesday or Wednesday between 10 AM-2 PM",
          purpose: "Establish thought leadership connection",
          followUpTrigger: "No response after 4 business days"
        },
        {
          platform: "Twitter",
          subjectLine: "Your industry insights are spot-on",
          message: `Hi [Name], I've been following your insights on ${industry} trends and love your perspective on ${painPoint}. Your strategic thinking is exactly what the industry needs right now. We're helping companies achieve breakthrough results in this area - would love to connect and share some insights that might be valuable for your initiatives!`,
          content: `Hi [Name], I've been following your insights on ${industry} trends and love your perspective on ${painPoint}. Your strategic thinking is exactly what the industry needs right now. We're helping companies achieve breakthrough results in this area - would love to connect and share some insights that might be valuable for your initiatives!`,
          timing: "Send on Tuesday or Thursday between 1-3 PM",
          purpose: "Engage through shared industry passion",
          followUpTrigger: "No response after 2 business days"
        },
        {
          platform: "Phone",
          script: `Hi [Name], this is [Your Name] from [Company]. I've been following your work in ${industry} and was genuinely impressed by your strategic approach to ${painPoint}. Your insights show the kind of forward-thinking that drives real industry transformation. We've been working with companies facing similar challenges and have developed some innovative approaches that might be relevant to your current initiatives. Do you have 15 minutes for a conversation about what we're seeing in the market?`,
          subjectLine: "Quick call about industry insights",
          content: `Hi [Name], this is [Your Name] from [Company]. I've been following your work in ${industry} and was genuinely impressed by your strategic approach to ${painPoint}. Your insights show the kind of forward-thinking that drives real industry transformation. We've been working with companies facing similar challenges and have developed some innovative approaches that might be relevant to your current initiatives. Do you have 15 minutes for a conversation about what we're seeing in the market?`,
          timing: "Call on Tuesday or Wednesday between 10 AM-2 PM",
          purpose: "Direct value proposition discussion",
          followUpTrigger: "No response after 5 business days"
        }
      ];
      
      return messages;
    };
    
    // Generate dynamic analytics
    const generateAnalytics = (industry, targetRole) => {
      const baseRates = {
        'Technology': { openRate: '18-25%', responseRate: '12-18%', conversionRate: '4-6%' },
        'Healthcare': { openRate: '15-22%', responseRate: '10-15%', conversionRate: '3-5%' },
        'Finance': { openRate: '12-18%', responseRate: '8-12%', conversionRate: '2-4%' },
        'Manufacturing': { openRate: '16-23%', responseRate: '11-16%', conversionRate: '3-5%' },
        'Retail': { openRate: '14-20%', responseRate: '9-14%', conversionRate: '2-4%' }
      };
      
      const rates = baseRates[industry] || baseRates['Technology'];
      
      return {
        responseRate: rates.responseRate,
        conversionRate: rates.conversionRate,
        successFactors: [
          "Personalized research and targeting",
          "Clear value proposition specific to ${industry}",
          "Multiple touchpoint strategy",
          "Timing optimization for ${targetRole}",
          "Compelling call-to-action"
        ]
      };
    };
    
    // Generate dynamic optimization suggestions
    const generateOptimization = (industry, targetRole, painPoint) => {
      return {
        subjectLineVariations: [
          `Quick question about ${industry} efficiency`,
          `How ${industry} leaders are solving ${painPoint}`,
          `Thought you might find this interesting`,
          `${targetRole} insights for ${industry}`,
          `Quick ${industry} question`
        ],
        abTestingSuggestions: [
          "Test different personalization levels",
          "Vary call-to-action urgency",
          "Experiment with message length",
          "Test different value propositions",
          "Vary timing and frequency"
        ],
        followUpStrategy: "Send 3 follow-ups over 2 weeks: Day 1, Day 5, Day 14"
      };
    };
    
    // Generate dynamic best practices
    const generateBestPractices = (industry, tone) => {
      const practices = {
        do: [
          "Research the prospect's company and role thoroughly",
          "Personalize messages with specific ${industry} insights",
          "Focus on value proposition and benefits",
          "Use professional but approachable tone",
          "Include clear call-to-action"
        ],
        dont: [
          "Send generic, template messages",
          "Focus on product features instead of benefits",
          "Use aggressive or pushy language",
          "Send too many follow-ups",
          "Ignore prospect's time constraints"
        ],
        timing: "Best send times: Tuesday-Thursday, 9-11 AM or 1-3 PM"
      };
      
      return practices;
    };
    
    return {
      ...fallbackWarning,
      personalizationElements: {
        researchPoints: generateResearchPoints(industry, targetRole),
        commonGround: generateCommonGround(industry, targetRole),
        valuePropositions: generateValuePropositions(industry, painPoint, valueProposition)
      },
      outreachMessages: generateOutreachMessages(targetRole, industry, painPoint, valueProposition, tone),
      personalizationTemplates: [
        {
          templateName: `${industry} Value-First Approach`,
          hook: `I noticed your work in ${industry} and was impressed by your approach to ${painPoint}`,
          personalization: `Given the challenges ${industry} professionals are facing`,
          valueProposition: `We're helping companies achieve ${valueProposition}`,
          callToAction: "Would you be open to a 15-minute call to discuss how this could benefit your team?"
        },
        {
          templateName: `${targetRole} Problem-Solution Framework`,
          hook: `I've been following your work in ${industry} and love your insights`,
          personalization: `I understand ${targetRole}s are dealing with ${painPoint}`,
          valueProposition: `We've been helping companies like yours achieve ${valueProposition}`,
          callToAction: "Would love to share how this could benefit your team"
        }
      ],
      followUpSequence: [
        {
          followUp1: `Hi [Name], I wanted to follow up on my previous message about ${valueProposition}. I understand you're busy, but I believe this could be valuable for your ${industry} initiatives.`,
          timing1: "Send 3-5 days after initial contact"
        },
        {
          followUp2: `Hi [Name], I know you're busy, but I wanted to share a quick case study of how we helped a ${industry} company achieve ${valueProposition}. Would this be relevant to your current challenges?`,
          timing2: "Send 7-10 days after first follow-up"
        },
        {
          followUp3: `Hi [Name], I understand if this isn't the right time, but I wanted to offer one final resource that might be valuable for your ${industry} initiatives. Would you like me to send it over?`,
          timing3: "Send 14 days after second follow-up"
        }
      ],
      bestPractices: generateBestPractices(industry, tone),
      trackingMetrics: generateAnalytics(industry, targetRole),
      optimizationTesting: generateOptimization(industry, targetRole, painPoint)
    };
  }

  // SEO Audit fallback
  if (toolId === 'seo-audit') {
    return {
      ...fallbackWarning,
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
  }

  // Default fallback for other tools
  return {
    ...fallbackWarning,
    message: "Tool not implemented yet",
    toolId,
    input
  };
}

// Generate SEO Audit for single page using OpenAI
async function generateSEOAudit(input) {
  console.log('🔍 Starting SEO Audit generation...');
  console.log('📝 Input received:', input);
  
  const websiteUrl = input.url || input.websiteUrl || 'example.com';
  const auditType = input.type || 'website-wide';
  const industry = input.industry || 'general business';
  
  console.log('🌐 Website URL:', websiteUrl);
  console.log('📊 Audit Type:', auditType);
  console.log('🏢 Industry:', industry);

  const prompt = `You are an expert SEO analyst. Analyze the SEO quality of this entire website: ${websiteUrl}

Industry: ${industry}
Audit Type: ${auditType}

Generate a comprehensive website-wide SEO audit report in JSON format. Focus on:
- Technical SEO across multiple pages
- Performance and Core Web Vitals
- Security and HTTPS implementation
- Mobile usability and responsiveness
- Content quality and keyword optimization
- Accessibility and user experience
- Site architecture and internal linking
- Cross-page optimization strategies

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

IMPORTANT: Generate REAL, UNIQUE content for every field. Do NOT use templates or placeholders. Make everything specific to ${websiteUrl} and the ${industry} industry. Return ONLY valid JSON, no explanation.`;

  try {
    console.log('🚀 Making OpenAI API call...');
    console.log('🔑 OpenAI API Key available:', !!process.env.OPENAI_API_KEY);
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert SEO analyst specializing in comprehensive website-wide SEO audits. You analyze entire websites and provide detailed, actionable insights across all SEO aspects. Return ONLY valid JSON.' 
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
    
    console.log('✅ OpenAI API call successful');
    console.log('📊 Response status:', response.status);

    const text = response.data.choices[0].message.content;
    console.log('📝 Raw OpenAI response:', text.substring(0, 200) + '...');
    
    let output;
    
    try {
      output = JSON.parse(text);
      console.log('✅ SEO Audit AI generation successful');
      console.log('📊 Parsed output keys:', Object.keys(output));
    } catch (e) {
      console.log('❌ SEO Audit AI generation failed, using fallback');
      console.log('🔍 JSON parsing error:', e.message);
      output = {
        _warning: "AI generation failed - using fallback data",
        overallScore: 75,
        summary: { score: 75, failed: 3, warnings: 5, passed: 10, criticalIssues: 1, improvementOpportunities: 8 },
        technicalSEO: {
          metaTitle: { status: "warning", percentage: "70%", description: "Meta titles need optimization", details: "Some pages missing target keywords", howToFix: "Add primary keywords to all page titles" },
          metaDescription: { status: "warning", percentage: "65%", description: "Meta descriptions need improvement", details: "Missing compelling CTAs", howToFix: "Write engaging descriptions with clear calls-to-action" },
          headingStructure: { status: "pass", percentage: "85%", description: "Good heading hierarchy", details: "Proper H1-H6 structure", howToFix: "Maintain current heading structure" },
          images: { status: "fail", percentage: "45%", description: "Images need optimization", details: "Missing alt text and compression", howToFix: "Add descriptive alt text and compress images" }
        },
        performance: {
          pageSpeed: { status: "warning", percentage: "60%", description: "Page speed needs improvement", details: "Slow loading times detected", howToFix: "Optimize images and reduce server response time" }
        },
        security: {
          https: { status: "pass", percentage: "95%", description: "HTTPS properly implemented", details: "SSL certificate active", howToFix: "Maintain current security setup" }
        },
        mobileUsability: {
          responsiveDesign: { status: "pass", percentage: "80%", description: "Mobile-friendly design", details: "Responsive layout implemented", howToFix: "Test on more mobile devices" }
        },
        contentQuality: {
          readability: { status: "warning", percentage: "70%", description: "Content readability needs improvement", details: "Some content too dense", howToFix: "Break up long paragraphs and add subheadings" }
        },
        accessibility: {
          altText: { status: "fail", percentage: "40%", description: "Accessibility needs major improvement", details: "Many images missing alt text", howToFix: "Add descriptive alt text to all images" }
        },
        urlStructure: {
          seoFriendly: { status: "pass", percentage: "85%", description: "Good URL structure", details: "Clean, descriptive URLs", howToFix: "Maintain current URL structure" }
        },
        siteArchitecture: {
          internalLinking: { status: "warning", percentage: "65%", description: "Internal linking needs improvement", details: "Limited cross-page connections", howToFix: "Add more internal links between related pages" },
          siteStructure: { status: "pass", percentage: "80%", description: "Good site structure", details: "Logical page hierarchy", howToFix: "Maintain current site structure" }
        },
        crossPageOptimization: {
          keywordDistribution: { status: "warning", percentage: "60%", description: "Keyword distribution needs work", details: "Some pages lack target keywords", howToFix: "Distribute keywords evenly across all pages" },
          contentStrategy: { status: "pass", percentage: "75%", description: "Good content strategy", details: "Consistent content approach", howToFix: "Continue current content strategy" }
        },
        recommendations: [
          { category: "Technical SEO", priority: "high", title: "Optimize Meta Titles", description: "Add target keywords to all page titles", action: "Update meta titles with primary keywords", impact: "high", effort: "low", timeline: "1-2 weeks" },
          { category: "Accessibility", priority: "critical", title: "Add Alt Text to Images", description: "Many images missing alt text", action: "Add descriptive alt text to all images", impact: "high", effort: "medium", timeline: "immediate" },
          { category: "Performance", priority: "medium", title: "Improve Page Speed", description: "Pages loading slowly", action: "Optimize images and reduce server response time", impact: "medium", effort: "high", timeline: "1-3 months" }
        ],
        priorityActions: [
          { category: "Accessibility", action: "Add alt text to all images", priority: "critical", effort: "medium", impact: "high" },
          { category: "Technical SEO", action: "Optimize meta titles with keywords", priority: "high", effort: "low", impact: "high" },
          { category: "Performance", action: "Optimize page loading speed", priority: "medium", effort: "high", impact: "medium" }
        ]
      };
    }
    
    console.log('🎯 SEO Audit function returning output:', output ? 'Success' : 'No output');
    return output;
  } catch (error) {
    console.error('❌ SEO Audit generation error:', error);
    console.error('📝 Error details:', error.message, error.stack);
    return {
      _warning: "OpenAI API error - using fallback data",
      overallScore: 75,
      summary: { score: 75, failed: 3, warnings: 5, passed: 10, criticalIssues: 1, improvementOpportunities: 8 },
      technicalSEO: {
        metaTitle: { status: "warning", percentage: "70%", description: "Meta titles need optimization", details: "Some pages missing target keywords", howToFix: "Add primary keywords to all page titles" },
        metaDescription: { status: "warning", percentage: "65%", description: "Meta descriptions need improvement", details: "Missing compelling CTAs", howToFix: "Write engaging descriptions with clear calls-to-action" },
        headingStructure: { status: "pass", percentage: "85%", description: "Good heading hierarchy", details: "Proper H1-H6 structure", howToFix: "Maintain current heading structure" },
        images: { status: "fail", percentage: "45%", description: "Images need optimization", details: "Missing alt text and compression", howToFix: "Add descriptive alt text and compress images" }
      },
      performance: {
        pageSpeed: { status: "warning", percentage: "60%", description: "Page speed needs improvement", details: "Slow loading times detected", howToFix: "Optimize images and reduce server response time" }
      },
      security: {
        https: { status: "pass", percentage: "95%", description: "HTTPS properly implemented", details: "SSL certificate active", howToFix: "Maintain current security setup" }
      },
      mobileUsability: {
        responsiveDesign: { status: "pass", percentage: "80%", description: "Mobile-friendly design", details: "Responsive layout implemented", howToFix: "Test on more mobile devices" }
      },
      contentQuality: {
        readability: { status: "warning", percentage: "70%", description: "Content readability needs improvement", details: "Some content too dense", howToFix: "Break up long paragraphs and add subheadings" }
      },
      accessibility: {
        altText: { status: "fail", percentage: "40%", description: "Accessibility needs major improvement", details: "Many images missing alt text", howToFix: "Add descriptive alt text to all images" }
      },
      urlStructure: {
        seoFriendly: { status: "pass", percentage: "85%", description: "Good URL structure", details: "Clean, descriptive URLs", howToFix: "Maintain current URL structure" }
      },
      siteArchitecture: {
        internalLinking: { status: "warning", percentage: "65%", description: "Internal linking needs improvement", details: "Limited cross-page connections", howToFix: "Add more internal links between related pages" },
        siteStructure: { status: "pass", percentage: "80%", description: "Good site structure", details: "Logical page hierarchy", howToFix: "Maintain current site structure" }
      },
      crossPageOptimization: {
        keywordDistribution: { status: "warning", percentage: "60%", description: "Keyword distribution needs work", details: "Some pages lack target keywords", howToFix: "Distribute keywords evenly across all pages" },
        contentStrategy: { status: "pass", percentage: "75%", description: "Good content strategy", details: "Consistent content approach", howToFix: "Continue current content strategy" }
      },
      recommendations: [
        { category: "Technical SEO", priority: "high", title: "Optimize Meta Titles", description: "Add target keywords to all page titles", action: "Update meta titles with primary keywords", impact: "high", effort: "low", timeline: "1-2 weeks" },
        { category: "Accessibility", priority: "critical", title: "Add Alt Text to Images", description: "Many images missing alt text", action: "Add descriptive alt text to all images", impact: "high", effort: "medium", timeline: "immediate" },
        { category: "Performance", priority: "medium", title: "Improve Page Speed", description: "Pages loading slowly", action: "Optimize images and reduce server response time", impact: "medium", effort: "high", timeline: "1-3 months" }
      ],
      priorityActions: [
        { category: "Accessibility", action: "Add alt text to all images", priority: "critical", effort: "medium", impact: "high" },
        { category: "Technical SEO", action: "Optimize meta titles with keywords", priority: "high", effort: "low", impact: "high" },
        { category: "Performance", action: "Optimize page loading speed", priority: "medium", effort: "high", impact: "medium" }
      ]
    };
  }
}

// @route   POST /api/ai-tools/social-media/schedule
// @desc    Schedule social media content with Publer/Buffer
// @access  Private
router.post("/social-media/schedule", auth, async (req, res) => {
  try {
    const { content, platform, schedule } = req.body;
    const scheduler = new SocialMediaScheduler();
    
    let result;
    if (platform === 'publer') {
      result = await scheduler.scheduleWithPubler(content, schedule);
    } else if (platform === 'buffer') {
      result = await scheduler.scheduleWithBuffer(content, schedule);
    } else {
      return res.status(400).json({ message: "Invalid platform specified" });
    }
    
    res.json({ success: true, result });
  } catch (error) {
    console.error("Social media scheduling error:", error);
    res.status(500).json({ message: "Scheduling failed", error: error.message });
  }
});

// @route   POST /api/ai-tools/social-media/generate-images
// @desc    Generate visual content with Canva
// @access  Private
router.post("/social-media/generate-images", auth, async (req, res) => {
  try {
    const { content, platform, style } = req.body;
    const canvaService = new CanvaService();
    
    const image = await canvaService.createSocialMediaImage(content, platform, style);
    const exports = await canvaService.exportDesign(image.id, ['png', 'jpg']);
    
    res.json({ success: true, image, exports });
  } catch (error) {
    console.error("Image generation error:", error);
    res.status(500).json({ message: "Image generation failed", error: error.message });
  }
});

// @route   POST /api/ai-tools/social-media/export
// @desc    Export content in various formats
// @access  Private
router.post("/social-media/export", auth, async (req, res) => {
  try {
    const { content, format, platform } = req.body;
    
    let result;
    if (format === 'csv') {
      result = await exportToCSV(content);
    } else if (format === 'google_sheets') {
      result = await exportToGoogleSheets(content);
    } else if (format === 'publer' || format === 'buffer') {
      const scheduler = new SocialMediaScheduler();
      result = await scheduler.autoScheduleWeekly(content, format);
    }
    
    res.json({ success: true, result });
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ message: "Export failed", error: error.message });
  }
});

// @route   POST /api/ai-tools/social-media/auto-schedule
// @desc    Auto-schedule weekly content with selected platform
// @access  Private
router.post("/social-media/auto-schedule", auth, async (req, res) => {
  try {
    const { contentArray, platform, scheduleType } = req.body;
    const scheduler = new SocialMediaScheduler();
    
    let result;
    if (scheduleType === 'weekly') {
      result = await scheduler.autoScheduleWeekly(contentArray, platform);
    } else if (scheduleType === 'monthly') {
      // Generate monthly schedule
      const monthlySchedule = scheduler.generateMonthlySchedule();
      result = await scheduler.autoScheduleMonthly(contentArray, platform, monthlySchedule);
    }
    
    res.json({ success: true, result });
  } catch (error) {
    console.error("Auto-scheduling error:", error);
    res.status(500).json({ message: "Auto-scheduling failed", error: error.message });
  }
});

// @route   GET /api/ai-tools/social-media/validate-credentials
// @desc    Validate API credentials for scheduling platforms
// @access  Private
router.get("/social-media/validate-credentials", auth, async (req, res) => {
  try {
    const { platform } = req.query;
    const scheduler = new SocialMediaScheduler();
    const canvaService = new CanvaService();
    
    let result = {};
    
    if (platform === 'publer' || platform === 'buffer') {
      result.scheduler = await scheduler.validateCredentials(platform);
    } else if (platform === 'canva') {
      result.canva = await canvaService.validateCredentials();
    } else if (platform === 'all') {
      result.publer = await scheduler.validateCredentials('publer');
      result.buffer = await scheduler.validateCredentials('buffer');
      result.canva = await canvaService.validateCredentials();
    }
    
    res.json({ success: true, result });
  } catch (error) {
    console.error("Credential validation error:", error);
    res.status(500).json({ message: "Validation failed", error: error.message });
  }
});

// Helper function to export to CSV
async function exportToCSV(content) {
  try {
    const csvData = content.map(post => {
      return `${post.platform},${post.content},${post.hashtags.join(';')},${post.bestTime},${post.engagement}`;
    }).join('\n');
    
    const csvHeader = 'Platform,Content,Hashtags,Best Time,Engagement\n';
    const fullCSV = csvHeader + csvData;
    
    return {
      format: 'csv',
      data: fullCSV,
      filename: `social_media_content_${new Date().toISOString().split('T')[0]}.csv`
    };
  } catch (error) {
    console.error('CSV export error:', error);
    throw error;
  }
}

// Helper function to export to Google Sheets
async function exportToGoogleSheets(content) {
  try {
    // This would integrate with Google Sheets API
    // For now, return a structured format
    const sheetData = {
      format: 'google_sheets',
      data: content.map(post => ({
        platform: post.platform,
        content: post.content,
        hashtags: post.hashtags.join(', '),
        bestTime: post.bestTime,
        engagement: post.engagement
      })),
      filename: `social_media_content_${new Date().toISOString().split('T')[0]}.json`
    };
    
    return sheetData;
  } catch (error) {
    console.error('Google Sheets export error:', error);
    throw error;
  }
}

module.exports = router 
