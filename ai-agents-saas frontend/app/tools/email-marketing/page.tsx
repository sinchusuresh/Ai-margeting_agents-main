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
  Mail,
  Lock,
  Crown,
  Send,
  Users,
  TrendingUp,
  Calendar,
} from "lucide-react"
import { useUserStore } from "@/lib/user-store"
import { makeAuthenticatedRequest } from "@/lib/auth-utils"

interface EmailCampaign {
  type: string
  subject: string
  subjectVariations?: string[]
  preheader: string
  content: string
  cta: string
  personalizations: string[]
}

interface EmailResult {
  campaigns: EmailCampaign[]
  sequence: {
    name: string
    emails: Array<{
      day: number
      subject: string
      purpose: string
      content: string
    }>
  }
  analytics: {
    expectedOpenRate: string
    expectedClickRate: string
    expectedConversionRate: string
    bestSendTime: string
  }
  optimization: {
    subjectLineVariations: string[]
    abTestingIdeas: string[]
    segmentationTips: string[]
    testingRecommendations: string[]
  }
}

export default function EmailMarketingPage() {
  const { user } = useUserStore()
  const [formData, setFormData] = useState({
    campaignType: "",
    subject: "",
    audience: "",
    goal: "",
    tone: "",
    industry: "",
    productService: "",
    urgency: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<EmailResult | null>(null)
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({})
  const [isExporting, setIsExporting] = useState(false)

  const hasAccess = user.plan !== "Free Trial"

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleGenerate = async () => {
    if (!hasAccess) {
      alert("Please upgrade to Pro or Agency plan to use this tool.")
      return
    }

    if (!formData.subject || !formData.audience) {
      alert("Please enter a subject line and target audience")
      return
    }

    setIsGenerating(true)

    try {
      // Prepare input data for the backend
      const inputData = {
        campaignType: formData.campaignType || "welcome",
        subject: formData.subject,
        audience: formData.audience,
        goal: formData.goal || "engagement",
        tone: formData.tone || "professional",
        industry: formData.industry || "marketing",
        productService: formData.productService || "",
        urgency: formData.urgency || "medium"
      }

      const data = await makeAuthenticatedRequest('/api/ai-tools/email-marketing/generate', {
        method: 'POST',
        body: JSON.stringify({ 
          input: inputData,
          timestamp: Date.now() // Add timestamp to prevent caching
        })
      })
      
      if (data.error) {
        throw new Error(data.error)
      }

      // Transform backend response to match our frontend structure
      const transformedResult = transformBackendResponse(data.output, inputData)
      setResult(transformedResult)
    } catch (error: any) {
      console.error('Error generating email marketing content:', error)
      alert(`Error generating content: ${error.message || 'Unknown error occurred'}`)
      
      // Show error message instead of fallback content
      alert('Failed to generate email marketing content. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const transformBackendResponse = (backendOutput: any, inputData: any): EmailResult => {
    // Extract campaigns from backend response
    const campaigns = backendOutput.campaigns || backendOutput.emails || []
    
    // Transform campaigns to our format
    const transformedCampaigns = campaigns.map((campaign: any) => ({
      type: campaign.type || campaign.campaignType || "welcome",
      subject: campaign.subject || campaign.subjectLine || inputData.subject,
      preheader: campaign.preheader || campaign.previewText || `Discover how ${inputData.audience} are transforming their results`,
      content: campaign.content || campaign.body || campaign.emailContent || `Hi [First Name],\n\nWelcome to our community! We're thrilled to have you join thousands of ${inputData.audience} who are already transforming their ${inputData.productService || "business"}.\n\nBest regards,\nThe Team`,
      cta: campaign.cta || campaign.callToAction || "Get Started",
      personalizations: campaign.personalizations || campaign.personalizationTokens || ["First Name", "Company Name", "Industry"]
    }))

    // Use analytics from backend response
    const analytics = backendOutput.analytics || {
      expectedOpenRate: "25.0%",
      expectedClickRate: "3.5%", 
      expectedConversionRate: "1.2%",
      bestSendTime: "10:00 AM Tuesday"
    }

    // Use sequence from backend response
    const sequence = backendOutput.sequence || {
      name: `${inputData.campaignType} Email Sequence`,
      emails: []
    }

    // Use optimization from backend response
    const optimization = backendOutput.optimization || {
      subjectLineVariations: [],
      segmentationTips: [],
      testingRecommendations: []
    }

    return {
      campaigns: transformedCampaigns,
      sequence,
      analytics,
      optimization
    }
  }











  const generateSegmentationTips = (audience: string) => {
    const tips = [
      `Segment by ${audience} experience level (beginner, intermediate, advanced)`,
      `Create separate campaigns for different ${audience} industries`,
      `Target ${audience} based on their engagement history`,
      `Personalize content for ${audience} based on their goals`,
      `Send different content to ${audience} based on their location`
    ]
    return tips.slice(0, 3) // Return first 3 tips
  }

  const generateTestingRecommendations = (inputData: any) => {
    const { campaignType, tone, urgency } = inputData
    
    const recommendations = [
      "Test different subject line lengths (short vs long)",
      "A/B test send times (morning vs afternoon)",
      "Compare different CTA button colors and text",
      "Test personalization vs generic messaging",
      "Experiment with different email layouts"
    ]

    // Add specific recommendations based on campaign type
    if (campaignType === "promotional") {
      recommendations.push("Test urgency messaging vs benefit-focused content")
    }
    if (tone === "urgent") {
      recommendations.push("Compare urgent vs informative subject lines")
    }

    return recommendations.slice(0, 4) // Return first 4 recommendations
  }

  const generateBestSendTime = (audience: string) => {
    const audienceLower = audience?.toLowerCase() || ""
    const times = {
      "business owners": "10:00 AM Tuesday",
      "marketers": "2:00 PM Wednesday", 
      "entrepreneurs": "9:00 AM Thursday",
      "professionals": "11:00 AM Tuesday",
      "ladies": "7:00 PM Tuesday",
      "default": "10:00 AM Tuesday"
    }

    for (const [key, time] of Object.entries(times)) {
      if (audienceLower.includes(key)) return time
    }
    return times.default
  }

  const generateEmailContent = (type: string, audience: string, product: string) => {
    const templates = {
      welcome: `Hi [First Name],

Welcome to our community! We're thrilled to have you join thousands of ${audience || "professionals"} who are already transforming their ${product || "business"}.

Here's what you can expect:
✅ Weekly insights and tips
✅ Exclusive resources and tools
✅ Access to our expert community
✅ Special offers and early access

To get started, here are 3 quick wins you can implement today:

1. [Quick Win #1] - This simple change can improve your results by 25%
2. [Quick Win #2] - A 5-minute task that saves hours later
3. [Quick Win #3] - The one thing most people overlook

Ready to dive in? Click the button below to access your welcome resources.

[CTA Button: Get Started Now]

Best regards,
[Your Name]
[Your Company]

P.S. Have questions? Simply reply to this email - I read every message personally!`,

      nurture: `Hi [First Name],

I hope you've had a chance to implement some of the strategies we shared earlier. 

Today, I want to share something that's been a game-changer for ${audience || "our clients"}: [Key Strategy/Insight].

Here's why this matters:
• 73% of ${audience || "professionals"} struggle with [Common Problem]
• This approach has helped our clients achieve [Specific Result]
• It takes just [Time Frame] to see initial results

Case Study: [Client Name] used this exact strategy to [Specific Achievement]. Here's how they did it:

[Step 1]: [Description]
[Step 2]: [Description]  
[Step 3]: [Description]

Want to learn the complete framework? I've created a detailed guide that walks you through each step.

[CTA Button: Get the Complete Guide]

Questions? Just hit reply - I'm here to help!

Best,
[Your Name]`,

      promotional: `Hi [First Name],

I have some exciting news to share with you!

For the next 48 hours, we're offering ${audience || "our community"} exclusive access to [Product/Service] at a special price.

Here's what makes this offer special:
🎯 [Benefit 1] - Save [Time/Money/Effort]
🎯 [Benefit 2] - Get [Specific Result]
🎯 [Benefit 3] - Access to [Exclusive Feature]

This is perfect for you if:
✓ You're ready to [Desired Outcome]
✓ You want to [Solve Specific Problem]
✓ You're serious about [Achieving Goal]

"[Testimonial quote from satisfied customer]" - [Customer Name], [Title]

The regular price is [Regular Price], but for the next 48 hours, you can get it for just [Special Price].

[CTA Button: Claim Your Special Offer]

This offer expires on [Date] at midnight, so don't wait!

Best regards,
[Your Name]

P.S. This pricing won't be available again this year, so if you've been waiting for the right time, this is it!`,
    }

    return templates[type as keyof typeof templates] || templates.welcome
  }

  const getBestSendTime = (audience: string) => {
    const times = {
      "business owners": "10:00 AM Tuesday",
      marketers: "2:00 PM Wednesday",
      entrepreneurs: "9:00 AM Thursday",
      professionals: "11:00 AM Tuesday",
    }

    const audienceLower = audience?.toLowerCase() || ""
    for (const [key, time] of Object.entries(times)) {
      if (audienceLower.includes(key)) return time
    }

    return "10:00 AM Tuesday"
  }

  const generateSubjectVariations = (originalSubject: string) => {
    if (!originalSubject) {
      return [
        "🚀 Ready to transform your business?",
        "The secret that changed everything",
        "Your exclusive invitation inside",
        "[First Name], this is for you",
      ]
    }

    return [
      `🔥 ${originalSubject}`,
      `[First Name], ${originalSubject.toLowerCase()}`,
      `URGENT: ${originalSubject}`,
      `Re: ${originalSubject}`,
      `${originalSubject} (Limited Time)`,
    ]
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied((prev) => ({ ...prev, [id]: true }))
    setTimeout(() => setCopied((prev) => ({ ...prev, [id]: false })), 2000)
  }

  const handleExportToEmailPlatform = () => {
    if (!result || !result.campaigns || result.campaigns.length === 0) {
      alert("No campaigns to export!");
      return;
    }

    setIsExporting(true);

    try {
      // Create CSV content for email platform import
      const headers = [
        "Campaign Type",
        "Subject Line",
        "Preheader",
        "Email Content",
        "Call to Action",
        "Personalizations",
        "Send Day",
        "Expected Open Rate",
        "Expected Click Rate"
      ];

      const rows = result.campaigns.map((campaign, index) => [
        campaign.type,
        campaign.subject,
        campaign.preheader,
        campaign.content.replace(/\n/g, " ").replace(/\r/g, " "),
        campaign.cta,
        campaign.personalizations.join(", "),
        result.sequence.emails[index]?.day || index + 1,
        result.analytics.expectedOpenRate,
        result.analytics.expectedClickRate
      ]);

      // Combine header and rows
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
      ].join("\r\n");

      // Create a Blob and trigger download
      const csvBlob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const csvUrl = URL.createObjectURL(csvBlob);
      const csvLink = document.createElement("a");
      csvLink.href = csvUrl;
      csvLink.setAttribute("download", "email-campaigns.csv");
      document.body.appendChild(csvLink);
      csvLink.click();
      document.body.removeChild(csvLink);
      URL.revokeObjectURL(csvUrl);

      // Also create a JSON export for advanced email platforms
      const jsonExport = {
        campaigns: result.campaigns,
        sequence: result.sequence,
        analytics: result.analytics,
        optimization: result.optimization,
        exportDate: new Date().toISOString(),
        platform: "AI Marketing Agents"
      };

      const jsonBlob = new Blob([JSON.stringify(jsonExport, null, 2)], { type: "application/json" });
      const jsonUrl = URL.createObjectURL(jsonBlob);
      const jsonLink = document.createElement("a");
      jsonLink.href = jsonUrl;
      jsonLink.setAttribute("download", "email-campaigns.json");
      document.body.appendChild(jsonLink);
      jsonLink.click();
      document.body.removeChild(jsonLink);
      URL.revokeObjectURL(jsonUrl);

      // Create HTML export for email platforms that support HTML templates
      const htmlContent = result.campaigns.map((campaign, index) => `
        <div style="margin-bottom: 30px; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h3 style="color: #333; margin-bottom: 10px;">${campaign.type}</h3>
          <div style="margin-bottom: 15px;">
            <strong>Subject:</strong> ${campaign.subject}
          </div>
          <div style="margin-bottom: 15px;">
            <strong>Preheader:</strong> ${campaign.preheader}
          </div>
          <div style="margin-bottom: 15px;">
            <strong>Content:</strong>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; white-space: pre-wrap; font-family: Arial, sans-serif;">
              ${campaign.content}
            </div>
          </div>
          <div style="margin-bottom: 15px;">
            <strong>CTA:</strong> ${campaign.cta}
          </div>
          <div>
            <strong>Personalizations:</strong> ${campaign.personalizations.join(", ")}
          </div>
        </div>
      `).join('');

      const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Email Campaigns Export</title>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Email Campaigns Export</h1>
          <p style="text-align: center; color: #666;">Generated by AI Marketing Agents</p>
          <hr style="margin: 30px 0;">
          ${htmlContent}
        </body>
        </html>
      `;

      const htmlBlob = new Blob([fullHtml], { type: "text/html" });
      const htmlUrl = URL.createObjectURL(htmlBlob);
      const htmlLink = document.createElement("a");
      htmlLink.href = htmlUrl;
      htmlLink.setAttribute("download", "email-campaigns.html");
      document.body.appendChild(htmlLink);
      htmlLink.click();
      document.body.removeChild(htmlLink);
      URL.revokeObjectURL(htmlUrl);

      setTimeout(() => {
        setIsExporting(false);
        alert("Campaigns exported successfully! You can now import the CSV file into your email platform.");
      }, 1000);
    } catch (error) {
      console.error("Export error:", error);
      setIsExporting(false);
      alert("Export failed. Please try again.");
    }
  }

  // Platform-specific export functions
  const exportToMailchimp = (result: EmailResult) => {
    if (!result || !result.campaigns) {
      alert("No campaigns to export!");
      return;
    }

    try {
      // Generate Mailchimp-compatible HTML
      const mailchimpHtml = result.campaigns.map(campaign => `
        <div class="mcnTextBlock" style="margin-bottom: 20px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnTextBlockOuter">
            <tr>
              <td valign="top" class="mcnTextBlockInner">
                <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnTextContentContainer">
                  <tr>
                    <td valign="top" class="mcnTextContent" style="padding: 20px;">
                      <h2 style="color: #333; margin-bottom: 15px;">${campaign.type}</h2>
                      <p><strong>Subject:</strong> ${campaign.subject}</p>
                      ${campaign.subjectVariations && campaign.subjectVariations.length > 0 ? `
                      <p><strong>Subject Variations:</strong></p>
                      <ul>
                        ${campaign.subjectVariations.map(variation => `<li>${variation}</li>`).join('')}
                      </ul>
                      ` : ''}
                      <p><strong>Preheader:</strong> ${campaign.preheader}</p>
                      <div style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
                        ${campaign.content}
                      </div>
                      <p><strong>CTA:</strong> ${campaign.cta}</p>
                      <p><strong>Personalizations:</strong> ${campaign.personalizations.join(", ")}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      `).join('');

      const fullMailchimpHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Mailchimp Email Campaigns</title>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${mailchimpHtml}
        </body>
        </html>
      `;

      const blob = new Blob([fullMailchimpHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "mailchimp-campaigns.html");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert("Mailchimp export successful! Import the HTML file into your Mailchimp account.");
    } catch (error) {
      console.error("Mailchimp export error:", error);
      alert("Mailchimp export failed. Please try again.");
    }
  };

  const exportToConvertKit = (result: EmailResult) => {
    if (!result || !result.campaigns) {
      alert("No campaigns to export!");
      return;
    }

    try {
      // Generate ConvertKit-compatible HTML
      const convertkitHtml = result.campaigns.map(campaign => `
        <div class="convertkit-email" style="margin-bottom: 30px; padding: 20px; border: 1px solid #e1e5e9; border-radius: 8px;">
          <h2 style="color: #2c3e50; margin-bottom: 15px;">${campaign.type}</h2>
          <div style="margin-bottom: 15px;">
            <strong>Subject:</strong> ${campaign.subject}
          </div>
          ${campaign.subjectVariations && campaign.subjectVariations.length > 0 ? `
          <div style="margin-bottom: 15px;">
            <strong>Subject Variations:</strong>
            <ul style="margin: 5px 0; padding-left: 20px;">
              ${campaign.subjectVariations.map(variation => `<li>${variation}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          <div style="margin-bottom: 15px;">
            <strong>Preheader:</strong> ${campaign.preheader}
          </div>
          <div style="margin-bottom: 15px;">
            <strong>Content:</strong>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
              ${campaign.content}
            </div>
          </div>
          <div style="margin-bottom: 15px;">
            <strong>CTA:</strong> ${campaign.cta}
          </div>
          <div>
            <strong>Personalizations:</strong> ${campaign.personalizations.join(", ")}
          </div>
        </div>
      `).join('');

      const fullConvertkitHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>ConvertKit Email Campaigns</title>
          <meta charset="utf-8">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          ${convertkitHtml}
        </body>
        </html>
      `;

      const blob = new Blob([fullConvertkitHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "convertkit-campaigns.html");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert("ConvertKit export successful! Import the HTML file into your ConvertKit account.");
    } catch (error) {
      console.error("ConvertKit export error:", error);
      alert("ConvertKit export failed. Please try again.");
    }
  };

  const exportToSendGrid = (result: EmailResult) => {
    if (!result || !result.campaigns) {
      alert("No campaigns to export!");
      return;
    }

    try {
      // Generate SendGrid-compatible HTML
      const sendgridHtml = result.campaigns.map(campaign => `
        <div class="sendgrid-email" style="margin-bottom: 30px; padding: 20px; border: 1px solid #d1d5db; border-radius: 8px;">
          <h2 style="color: #1f2937; margin-bottom: 15px;">${campaign.type}</h2>
          <div style="margin-bottom: 15px;">
            <strong>Subject:</strong> ${campaign.subject}
          </div>
          ${campaign.subjectVariations && campaign.subjectVariations.length > 0 ? `
          <div style="margin-bottom: 15px;">
            <strong>Subject Variations:</strong>
            <ul style="margin: 5px 0; padding-left: 20px;">
              ${campaign.subjectVariations.map(variation => `<li>${variation}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          <div style="margin-bottom: 15px;">
            <strong>Preheader:</strong> ${campaign.preheader}
          </div>
          <div style="margin-bottom: 15px;">
            <strong>Content:</strong>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 5px;">
              ${campaign.content}
            </div>
          </div>
          <div style="margin-bottom: 15px;">
            <strong>CTA:</strong> ${campaign.cta}
          </div>
          <div>
            <strong>Personalizations:</strong> ${campaign.personalizations.join(", ")}
          </div>
        </div>
      `).join('');

      const fullSendgridHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>SendGrid Email Campaigns</title>
          <meta charset="utf-8">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          ${sendgridHtml}
        </body>
        </html>
      `;

      const blob = new Blob([fullSendgridHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "sendgrid-campaigns.html");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert("SendGrid export successful! Import the HTML file into your SendGrid account.");
    } catch (error) {
      console.error("SendGrid export error:", error);
      alert("SendGrid export failed. Please try again.");
    }
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
              <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-violet-600 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Email Marketing Agent</h1>
              {hasAccess ? (
                <Badge className="bg-green-100 text-green-800">Available</Badge>
              ) : (
                <Badge className="bg-orange-100 text-orange-800">Pro Required</Badge>
              )}
            </div>
            <p className="text-gray-600">Create compelling email campaigns and automated sequences</p>
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
                <CardTitle>Campaign Setup</CardTitle>
                <CardDescription>Configure your email marketing campaign</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="campaignType">Campaign Type</Label>
                  <select
                    id="campaignType"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={formData.campaignType}
                    onChange={(e) => handleInputChange("campaignType", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select type</option>
                    <option value="welcome">Welcome Series</option>
                    <option value="nurture">Lead Nurturing</option>
                    <option value="promotional">Promotional</option>
                    <option value="newsletter">Newsletter</option>
                    <option value="re-engagement">Re-engagement</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Email Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="Boost your marketing ROI with AI"
                    value={formData.subject}
                    onChange={(e) => handleInputChange("subject", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience *</Label>
                  <Input
                    id="audience"
                    placeholder="Small business owners, marketers"
                    value={formData.audience}
                    onChange={(e) => handleInputChange("audience", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal">Campaign Goal</Label>
                  <select
                    id="goal"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={formData.goal}
                    onChange={(e) => handleInputChange("goal", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select goal</option>
                    <option value="lead-generation">Lead Generation</option>
                    <option value="sales">Drive Sales</option>
                    <option value="engagement">Increase Engagement</option>
                    <option value="retention">Customer Retention</option>
                    <option value="education">Education</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone">Email Tone</Label>
                  <select
                    id="tone"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={formData.tone}
                    onChange={(e) => handleInputChange("tone", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select tone</option>
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="urgent">Urgent</option>
                    <option value="educational">Educational</option>
                    <option value="conversational">Conversational</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productService">Product/Service</Label>
                  <Input
                    id="productService"
                    placeholder="AI marketing software, consulting services"
                    value={formData.productService}
                    onChange={(e) => handleInputChange("productService", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgency Level</Label>
                  <select
                    id="urgency"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={formData.urgency}
                    onChange={(e) => handleInputChange("urgency", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select urgency</option>
                    <option value="low">Low - Informational</option>
                    <option value="medium">Medium - Time-sensitive</option>
                    <option value="high">High - Limited time offer</option>
                  </select>
                </div>

                <div className="space-y-3 pt-4">
                  <Button
                    onClick={handleGenerate}
                    disabled={!hasAccess || isGenerating || !formData.subject || !formData.audience}
                    className="w-full bg-gradient-to-r from-purple-400 to-violet-600 hover:opacity-90 text-white font-semibold py-3"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Campaign...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Generate Email Campaign
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
                  <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Create</h3>
                  <p className="text-gray-600">
                    {hasAccess
                      ? "Set up your campaign parameters and generate professional email content"
                      : "Upgrade to Pro plan to access the email marketing tool"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Performance Predictions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      Expected Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{result.analytics?.expectedOpenRate || '25%'}</div>
                        <div className="text-sm text-gray-600">Open Rate</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{result.analytics?.expectedClickRate || '3.5%'}</div>
                        <div className="text-sm text-gray-600">Click Rate</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {result.analytics?.expectedConversionRate || '1.2%'}
                        </div>
                        <div className="text-sm text-gray-600">Conversion Rate</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-sm font-bold text-yellow-600">{result.analytics?.bestSendTime || 'Tuesday 10:00 AM'}</div>
                        <div className="text-sm text-gray-600">Best Send Time</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Generated Campaigns */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="w-5 h-5 text-purple-500" />
                      Generated Email Campaigns ({result.campaigns?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {result.campaigns?.map((campaign, index) => (
                      <div key={index} className="border rounded-lg p-6 bg-white">
                        <div className="flex items-center justify-between mb-4">
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                            {campaign.type}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(campaign.content, `campaign-${index}`)}
                          >
                            {copied[`campaign-${index}`] ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Subject Line:</h4>
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <p className="font-medium">{campaign.subject}</p>
                            </div>
                          </div>
                          
                          {campaign.subjectVariations && campaign.subjectVariations.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Subject Line Variations (A/B Testing):</h4>
                              <div className="space-y-2">
                                {campaign.subjectVariations.map((variation, varIndex) => (
                                  <div key={varIndex} className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                                    <p className="text-blue-800">
                                      <span className="font-medium">Variation {varIndex + 1}:</span> {variation}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Preheader:</h4>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm text-gray-700">{campaign.preheader}</p>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Email Content:</h4>
                            <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                                {campaign.content}
                              </pre>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Call to Action:</h4>
                              <div className="bg-green-50 p-3 rounded-lg">
                                <p className="text-green-800 font-medium">{campaign.cta}</p>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Personalizations:</h4>
                              <div className="flex flex-wrap gap-1">
                                {campaign.personalizations?.map((personalization, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {personalization}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Email Sequence */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-500" />
                      {result.sequence?.name || 'Email Sequence'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {result.sequence?.emails?.map((email, index) => (
                        <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                            {email.day}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{email.subject}</h4>
                            <p className="text-sm text-gray-600 mt-1">{email.purpose}</p>
                            <p className="text-xs text-gray-500 mt-2">{email.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Optimization Tips */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-orange-500" />
                      Optimization Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Subject Line Variations for A/B Testing:</h4>
                      <div className="space-y-2">
                        {result.optimization?.subjectLineVariations?.map((variation, index) => (
                          <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                            {variation}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">A/B Testing Ideas:</h4>
                      <ul className="space-y-1">
                        {result.optimization?.abTestingIdeas?.map((idea, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-yellow-500" />
                            {idea}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Segmentation Tips:</h4>
                      <ul className="space-y-1">
                        {result.optimization?.segmentationTips?.map((tip, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Testing Recommendations:</h4>
                      <ul className="space-y-1">
                        {result.optimization?.testingRecommendations?.map((rec, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-blue-500" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(JSON.stringify(result, null, 2), "all-emails")}
                      className="flex-1"
                    >
                      {copied["all-emails"] ? (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      {copied["all-emails"] ? "Copied!" : "Copy All Campaigns"}
                    </Button>
                    <Button variant="outline" className="flex-1 bg-transparent" onClick={handleExportToEmailPlatform} disabled={isExporting}>
                      {isExporting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      {isExporting ? "Exporting..." : "Export to Email Platform"}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => exportToMailchimp(result)}
                      className="bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Export to Mailchimp
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => exportToConvertKit(result)}
                      className="bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Export to ConvertKit
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => exportToSendGrid(result)}
                      className="bg-green-50 border-green-200 text-green-800 hover:bg-green-100"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Export to SendGrid
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
