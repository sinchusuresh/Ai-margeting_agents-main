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
import { ArrowLeft, Play, Download, Copy, CheckCircle, Loader2, Users, Lock, Crown, Mail, Target, TrendingUp, MessageSquare } from 'lucide-react'
import { useUserStore } from "@/lib/user-store"
import { makeAuthenticatedRequest } from "@/lib/auth-utils"

interface OutreachSequence {
  emailNumber: number
  subject: string
  content: string
  timing: string
  purpose: string
  followUpTrigger: string
}

interface OutreachResult {
  sequences: OutreachSequence[]
  personalization: {
    researchPoints: string[]
    customizationTips: string[]
    industryInsights: string[]
  }
  analytics: {
    expectedOpenRate: string
    expectedResponseRate: string
    expectedConversionRate: string
    bestSendTimes: string[]
  }
  optimization: {
    subjectLineVariations: string[]
    abtestingSuggestions: string[]
    followUpStrategy: string[]
  }
  templates: {
    linkedin: string
    twitter: string
    phone: string
  }
}

export default function ColdOutreachPage() {
  const { user } = useUserStore()
  const [formData, setFormData] = useState({
    targetRole: "",
    industry: "",
    companySize: "",
    painPoint: "",
    valueProposition: "",
    productService: "",
    campaignGoal: "",
    tone: "",
    linkedinUrl: "",
    companyWebsite: "",
    prospectName: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<OutreachResult | null>(null)
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({})
  const [error, setError] = useState<string | null>(null)

  const hasAccess = user.plan !== "Free Trial"



  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Transform AI response to match frontend structure
  const transformAIResponseToFrontendFormat = (aiOutput: any, formData: any) => {
    console.log('🔄 Transforming AI response:', aiOutput)
    console.log('📊 AI Output Structure:', Object.keys(aiOutput))
    console.log('📧 Outreach Messages:', aiOutput.outreachMessages)
    console.log('🎯 Personalization Elements:', aiOutput.personalizationElements)
    console.log('📈 Tracking Metrics:', aiOutput.trackingMetrics)
    console.log('⏰ Best Practices:', aiOutput.bestPractices)
    console.log('🔧 Optimization Testing:', aiOutput.optimizationTesting)
    
    // Transform sequences from outreachMessages - USE ONLY AI GENERATED CONTENT
    const sequences = aiOutput.outreachMessages?.map((message: any, index: number) => ({
      emailNumber: index + 1,
      subject: message.subjectLine || message.subject || '',
      content: message.message || message.content || '',
      timing: message.timing || '',
      purpose: message.purpose || (index === 0 ? 'Initial contact with value proposition' : 'Follow-up with additional value'),
      followUpTrigger: message.followUpTrigger || (index === 0 ? 'No response after 5 business days' : 'No response after 3 business days')
    })) || []

    // Transform personalization - USE ONLY AI GENERATED CONTENT
    const personalization = {
      researchPoints: aiOutput.personalizationElements?.researchPoints || aiOutput.researchPoints || [],
      customizationTips: aiOutput.personalizationElements?.commonGround || aiOutput.customizationTips || [],
      industryInsights: aiOutput.personalizationElements?.valuePropositions || aiOutput.industryInsights || []
    }

    // Transform analytics - USE ONLY AI GENERATED CONTENT
    const analytics = {
      expectedOpenRate: aiOutput.trackingMetrics?.responseRate || aiOutput.analytics?.expectedOpenRate || '',
      expectedResponseRate: aiOutput.trackingMetrics?.responseRate || aiOutput.analytics?.expectedResponseRate || '',
      expectedConversionRate: aiOutput.trackingMetrics?.conversionRate || aiOutput.analytics?.expectedConversionRate || '',
      bestSendTimes: aiOutput.bestPractices?.timing ? [aiOutput.bestPractices.timing] : (aiOutput.analytics?.bestSendTimes || [])
    }

    // Transform optimization - USE ONLY AI GENERATED CONTENT
    const optimization = {
      subjectLineVariations: aiOutput.optimizationTesting?.subjectLineVariations || aiOutput.optimization?.subjectLineVariations || [],
      abtestingSuggestions: aiOutput.optimizationTesting?.abTestingSuggestions || aiOutput.optimization?.abtestingSuggestions || [],
      followUpStrategy: aiOutput.optimizationTesting?.followUpStrategy ? [aiOutput.optimizationTesting.followUpStrategy] : (aiOutput.optimization?.followUpStrategy || [])
    }

    // Transform templates - USE ONLY AI GENERATED CONTENT
    const templates = {
      linkedin: aiOutput.outreachMessages?.find((m: any) => m.platform === 'LinkedIn')?.message || aiOutput.templates?.linkedin || '',
      twitter: aiOutput.outreachMessages?.find((m: any) => m.platform === 'Twitter')?.message || aiOutput.templates?.twitter || '',
      phone: aiOutput.outreachMessages?.find((m: any) => m.platform === 'Phone')?.script || aiOutput.templates?.phone || ''
    }

    // Add fallback data if any section is empty
    const finalResult = {
      sequences: sequences.length > 0 ? sequences : [
        {
          emailNumber: 1,
          subject: 'Initial Outreach - Value Proposition',
          content: 'Based on your industry and role, I\'d like to discuss how we can help address your specific challenges.',
          timing: 'Immediate',
          purpose: 'Initial contact with value proposition',
          followUpTrigger: 'No response after 5 business days'
        }
      ],
      personalization: {
        researchPoints: personalization.researchPoints.length > 0 ? personalization.researchPoints : ['Company size and structure', 'Industry challenges', 'Role responsibilities'],
        customizationTips: personalization.customizationTips.length > 0 ? personalization.customizationTips : ['Reference recent company news', 'Mention mutual connections', 'Highlight industry expertise'],
        industryInsights: personalization.industryInsights.length > 0 ? personalization.industryInsights : ['Market trends analysis', 'Competitive landscape', 'Growth opportunities']
      },
      analytics: {
        expectedOpenRate: analytics.expectedOpenRate || '25-35%',
        expectedResponseRate: analytics.expectedResponseRate || '5-8%',
        expectedConversionRate: analytics.expectedConversionRate || '2-3%',
        bestSendTimes: analytics.bestSendTimes.length > 0 ? analytics.bestSendTimes : ['Tuesday 10 AM', 'Wednesday 2 PM', 'Thursday 9 AM']
      },
      optimization: {
        subjectLineVariations: optimization.subjectLineVariations.length > 0 ? optimization.subjectLineVariations : ['Value-focused subject line', 'Question-based subject line', 'Industry-specific subject line'],
        abtestingSuggestions: optimization.abtestingSuggestions.length > 0 ? optimization.abtestingSuggestions : ['Test different send times', 'A/B test subject lines', 'Vary message length'],
        followUpStrategy: optimization.followUpStrategy.length > 0 ? optimization.followUpStrategy : ['Follow up after 3-5 days', 'Provide additional value', 'Ask for feedback']
      },
      templates: {
        linkedin: templates.linkedin || 'Professional LinkedIn connection message with value proposition',
        twitter: templates.twitter || 'Engaging Twitter outreach with industry insights',
        phone: templates.phone || 'Phone script for cold calling with clear value proposition'
      }
    }

    console.log('🎯 Final transformed result:', finalResult);
    return finalResult
  }

  const handleGenerate = async () => {
    if (!hasAccess) {
      alert("Please upgrade to Pro or Agency plan to use this tool.")
      return
    }

    if (!formData.targetRole || !formData.industry) {
      alert("Please enter target role and industry")
      return
    }

    setIsGenerating(true)
    setResult(null)
    setError(null)

    try {
      // Prepare input data for the backend
      const inputData = {
        prospectName: formData.prospectName || '',
        linkedinUrl: formData.linkedinUrl || '',
        companyWebsite: formData.companyWebsite || '',
        targetRole: formData.targetRole,
        industry: formData.industry,
        companySize: formData.companySize || 'Not specified',
        painPoint: formData.painPoint || 'Not specified',
        valueProposition: formData.valueProposition || 'Not specified',
        productService: formData.productService || 'Not specified',
        campaignGoal: formData.campaignGoal || 'Not specified',
        tone: formData.tone || 'Professional and friendly'
      }

      // Call the backend API
      console.log('🚀 Calling backend API with input:', inputData);
      const data = await makeAuthenticatedRequest('/api/ai-tools/cold-outreach/generate', {
        method: 'POST',
        body: JSON.stringify({
          input: inputData,
          timestamp: Date.now() // Add timestamp to prevent caching
        })
      })
      console.log('✅ Backend API response received:', data);

      if (data.error) {
        throw new Error(data.error)
      }

      // Log campaign details
      console.log('Cold Outreach Campaign Response:', data.output);
      console.log('Target Role:', formData.targetRole);
      console.log('Industry:', formData.industry);

      // Transform the data to match frontend expectations
      const transformedOutput = transformAIResponseToFrontendFormat(data.output, formData);
      setResult(transformedOutput);

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
      } else if (errorMessage.includes('Server error')) {
        setError('Backend server error. Please check if your backend is running on port 5000.');
      } else if (errorMessage.includes('500')) {
        setError('Internal server error. Please try again or contact support.');
      } else {
        setError(`Failed to generate cold outreach campaign: ${errorMessage}`);
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

  const exportToCRM = () => {
    if (!result) return

    // Create comprehensive CRM export data
    const crmData = {
      campaign: {
        name: `Cold Outreach - ${formData.targetRole} in ${formData.industry}`,
        targetRole: formData.targetRole,
        industry: formData.industry,
        companySize: formData.companySize,
        painPoint: formData.painPoint,
        valueProposition: formData.valueProposition,
        createdDate: new Date().toISOString(),
      },
      sequences: result?.sequences?.map(seq => ({
        emailNumber: seq?.emailNumber || 0,
        subject: seq?.subject || '',
        content: seq?.content || '',
        timing: seq?.timing || '',
        purpose: seq?.purpose || '',
        followUpTrigger: seq?.followUpTrigger || '',
      })) || [],
      analytics: {
        expectedOpenRate: result?.analytics?.expectedOpenRate || 'N/A',
        expectedResponseRate: result?.analytics?.expectedResponseRate || 'N/A',
        expectedConversionRate: result?.analytics?.expectedConversionRate || 'N/A',
        bestSendTimes: result?.analytics?.bestSendTimes || [],
      },
      templates: {
        linkedin: result?.templates?.linkedin || '',
        twitter: result?.templates?.twitter || '',
        phone: result?.templates?.phone || '',
      },
      optimization: {
        subjectLineVariations: result?.optimization?.subjectLineVariations || [],
        abtestingSuggestions: result?.optimization?.abtestingSuggestions || [],
        followUpStrategy: result?.optimization?.followUpStrategy || [],
      },
      personalization: {
        researchPoints: result?.personalization?.researchPoints || [],
        customizationTips: result?.personalization?.customizationTips || [],
        industryInsights: result?.personalization?.industryInsights || [],
      }
    }

    // Create and download JSON file
    const dataStr = JSON.stringify(crmData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cold-outreach-campaign-${formData.targetRole}-${formData.industry}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    // Also create a CSV version for better CRM compatibility
    const csvData = createCSVExport(crmData)
    const csvBlob = new Blob([csvData], { type: 'text/csv' })
    const csvUrl = URL.createObjectURL(csvBlob)
    const csvLink = document.createElement('a')
    csvLink.href = csvUrl
    csvLink.download = `cold-outreach-campaign-${formData.targetRole}-${formData.industry}.csv`
    document.body.appendChild(csvLink)
    csvLink.click()
    document.body.removeChild(csvLink)
    URL.revokeObjectURL(csvUrl)
  }

  const exportToGoogleSheets = () => {
    if (!result) return

    // Prepare data for Google Sheets export
    const sheetData = {
      prospects: [{
        'Prospect Name': formData.prospectName || 'Prospect',
        'LinkedIn URL': formData.linkedinUrl || '',
        'Company Website': formData.companyWebsite || '',
        'Target Role': formData.targetRole,
        'Industry': formData.industry,
        'Company Size': formData.companySize,
        'Campaign Goal': formData.campaignGoal,
        'Status': 'New'
      }],
      emailSequence: result?.sequences?.map((seq, index) => ({
        'Email #': index + 1,
        'Subject': seq?.subject || '',
        'Content': seq?.content || '',
        'Timing': seq?.timing || '',
        'Purpose': seq?.purpose || '',
        'Follow-up Trigger': seq?.followUpTrigger || ''
      })) || [],
      campaignAnalytics: [
        { 'Metric': 'Expected Open Rate', 'Value': result?.analytics?.expectedOpenRate || 'N/A' },
        { 'Metric': 'Expected Response Rate', 'Value': result?.analytics?.expectedResponseRate || 'N/A' },
        { 'Metric': 'Expected Conversion Rate', 'Value': result?.analytics?.expectedConversionRate || 'N/A' },
        { 'Metric': 'Best Send Times', 'Value': result?.analytics?.bestSendTimes?.join(', ') || 'N/A' }
      ]
    }

    // Create CSV files for each sheet
    const prospectsCSV = createCSVFromArray(sheetData.prospects)
    const sequenceCSV = createCSVFromArray(sheetData.emailSequence)
    const analyticsCSV = createCSVFromArray(sheetData.campaignAnalytics)

    // Download all CSV files
    downloadCSV(prospectsCSV, 'prospects.csv')
    downloadCSV(sequenceCSV, 'email-sequence.csv')
    downloadCSV(analyticsCSV, 'campaign-analytics.csv')

    // Show success message
    alert('Google Sheets data exported! Import the CSV files into your Google Sheets.')
  }

  const integrateWithCRM = async (crmType) => {
    if (!result) return

    try {
      const response = await makeAuthenticatedRequest('/api/ai-tools/crm-integration', {
        method: 'POST',
        body: JSON.stringify({
          crmType,
          prospectData: {
            prospectName: formData.prospectName,
            linkedinUrl: formData.linkedinUrl,
            companyWebsite: formData.companyWebsite,
            targetRole: formData.targetRole,
            industry: formData.industry,
            companySize: formData.companySize,
            painPoint: formData.painPoint,
            valueProposition: formData.valueProposition,
            campaignGoal: formData.campaignGoal,
            linkedinProfile: result.prospectResearch?.linkedinProfile,
            companyInfo: result.prospectResearch?.companyInfo
          },
          campaignData: {
            campaignName: `Cold Outreach - ${formData.targetRole} in ${formData.industry}`,
            targetRole: formData.targetRole,
            industry: formData.industry,
            campaignGoal: formData.campaignGoal,
            valueProposition: formData.valueProposition
          }
        })
      })

      if (response.success) {
        alert(`Successfully integrated with ${crmType}! ${response.message}`)
      } else {
        alert(`Failed to integrate with ${crmType}: ${response.error}`)
      }

    } catch (error) {
      console.error('CRM integration error:', error)
      alert(`Failed to integrate with ${crmType}. Please check your API configuration.`)
    }
  }

  const sendMailmergeCampaign = async () => {
    if (!result) return

    try {
      const response = await makeAuthenticatedRequest('/api/ai-tools/mailmerge-campaign', {
        method: 'POST',
        body: JSON.stringify({
          prospects: [{
            prospectName: formData.prospectName,
            email: result.prospectResearch?.companyInfo?.contactInfo?.emails?.[0] || 'prospect@example.com',
            companyName: result.prospectResearch?.companyInfo?.companyName,
            role: formData.targetRole,
            industry: formData.industry,
            linkedinUrl: formData.linkedinUrl,
            companyWebsite: formData.companyWebsite
          }],
          campaignData: {
            campaignId: Date.now().toString(),
            campaignName: `Cold Outreach - ${formData.targetRole} in ${formData.industry}`,
            fromEmail: 'noreply@yourcompany.com',
            fromName: 'Your Sales Team',
            campaignGoal: formData.campaignGoal,
            valueProposition: formData.valueProposition
          },
          emailTemplates: {
            email: result?.sequences?.[0]?.content || '',
            subject: result?.sequences?.[0]?.subject || ''
          }
        })
      })

      if (response.success) {
        alert(`Mailmerge campaign sent successfully! ${response.totalSent} emails sent.`)
      } else {
        alert(`Failed to send mailmerge campaign: ${response.error}`)
      }

    } catch (error) {
      console.error('Mailmerge campaign error:', error)
      alert('Failed to send mailmerge campaign. Please check your SendGrid configuration.')
    }
  }

  const createCSVFromArray = (data) => {
    if (!data || data.length === 0) return ''
    
    const headers = Object.keys(data[0])
    const csvRows = [headers.join(',')]
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header] || ''
        return `"${value.toString().replace(/"/g, '""')}"`
      })
      csvRows.push(values.join(','))
    }
    
    return csvRows.join('\n')
  }

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const createCSVExport = (data: any) => {
    let csv = 'Campaign Name,Target Role,Industry,Company Size,Pain Point,Value Proposition,Email Number,Subject,Content,Timing,Purpose\n'
    
    data.sequences.forEach((seq: any) => {
      const row = [
        data.campaign.name,
        data.campaign.targetRole,
        data.campaign.industry,
        data.campaign.companySize,
        data.campaign.painPoint,
        data.campaign.valueProposition,
        seq.emailNumber,
        `"${seq.subject.replace(/"/g, '""')}"`,
        `"${seq.content.replace(/"/g, '""')}"`,
        seq.timing,
        seq.purpose
      ].join(',')
      csv += row + '\n'
    })
    
    return csv
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
              <div className="w-10 h-10 bg-gradient-to-r from-rose-400 to-pink-600 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Cold Outreach Personalization</h1>
              {hasAccess ? (
                <Badge className="bg-green-100 text-green-800">Available</Badge>
              ) : (
                <Badge className="bg-orange-100 text-orange-800">Pro Required</Badge>
              )}
            </div>
            <p className="text-gray-600">Personalized outreach messages based on prospect research</p>
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
                <CardTitle>Outreach Setup</CardTitle>
                <CardDescription>Configure your cold outreach campaign</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prospectName">Prospect Name</Label>
                  <Input
                    id="prospectName"
                    placeholder="John Smith, Sarah Johnson"
                    value={formData.prospectName}
                    onChange={(e) => handleInputChange("prospectName", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedinUrl">LinkedIn Profile URL</Label>
                  <Input
                    id="linkedinUrl"
                    placeholder="https://linkedin.com/in/johnsmith"
                    value={formData.linkedinUrl}
                    onChange={(e) => handleInputChange("linkedinUrl", e.target.value)}
                    disabled={!hasAccess}
                  />
                  <p className="text-sm text-gray-600">
                    🔍 We'll research their profile for personalization
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyWebsite">Company Website</Label>
                  <Input
                    id="companyWebsite"
                    placeholder="https://company.com"
                    value={formData.companyWebsite}
                    onChange={(e) => handleInputChange("companyWebsite", e.target.value)}
                    disabled={!hasAccess}
                  />
                  <p className="text-sm text-gray-600">
                    🌐 We'll analyze their company for insights
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetRole">Target Role *</Label>
                  <Input
                    id="targetRole"
                    placeholder="VP of Marketing, CEO, Sales Director"
                    value={formData.targetRole}
                    onChange={(e) => handleInputChange("targetRole", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry *</Label>
                  <Input
                    id="industry"
                    placeholder="SaaS, E-commerce, Healthcare"
                    value={formData.industry}
                    onChange={(e) => handleInputChange("industry", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companySize">Company Size</Label>
                  <select
                    id="companySize"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    value={formData.companySize}
                    onChange={(e) => handleInputChange("companySize", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select company size</option>
                    <option value="startup">Startup (1-50 employees)</option>
                    <option value="small">Small (51-200 employees)</option>
                    <option value="medium">Medium (201-1000 employees)</option>
                    <option value="large">Large (1000+ employees)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="painPoint">Main Pain Point</Label>
                  <Input
                    id="painPoint"
                    placeholder="Lead generation, customer retention, operational efficiency"
                    value={formData.painPoint}
                    onChange={(e) => handleInputChange("painPoint", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valueProposition">Value Proposition</Label>
                  <Textarea
                    id="valueProposition"
                    placeholder="How do you solve their problem? What's the main benefit?"
                    value={formData.valueProposition}
                    onChange={(e) => handleInputChange("valueProposition", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productService">Product/Service</Label>
                  <Input
                    id="productService"
                    placeholder="Marketing automation, CRM software, consulting"
                    value={formData.productService}
                    onChange={(e) => handleInputChange("productService", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaignGoal">Campaign Goal</Label>
                  <select
                    id="campaignGoal"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    value={formData.campaignGoal}
                    onChange={(e) => handleInputChange("campaignGoal", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select goal</option>
                    <option value="demo">Schedule Demo</option>
                    <option value="meeting">Book Discovery Call</option>
                    <option value="trial">Start Free Trial</option>
                    <option value="partnership">Explore Partnership</option>
                    <option value="consultation">Free Consultation</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone">Communication Tone</Label>
                  <select
                    id="tone"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    value={formData.tone}
                    onChange={(e) => handleInputChange("tone", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select tone</option>
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="direct">Direct</option>
                    <option value="consultative">Consultative</option>
                    <option value="casual">Casual</option>
                  </select>
                </div>

                <div className="space-y-3 pt-4">
                  <Button
                    onClick={handleGenerate}
                    disabled={!hasAccess || isGenerating || !formData.targetRole || !formData.industry}
                    className="w-full bg-gradient-to-r from-rose-400 to-pink-600 hover:opacity-90 text-white font-semibold py-3"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Outreach...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Generate Outreach Sequence
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
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}
            {!result ? (
              <Card>
                <CardContent className="text-center py-20">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Create</h3>
                  <p className="text-gray-600">
                    {hasAccess
                      ? "Set up your outreach parameters and generate personalized cold outreach sequences"
                      : "Upgrade to Pro plan to access the cold outreach tool"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Prospect Research Results */}
                {result?.prospectResearch && !result.prospectResearch.error && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500" />
                        Prospect Research Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {result.prospectResearch.linkedinProfile && (
                        <div className="border rounded-lg p-4 bg-blue-50">
                          <h4 className="font-medium text-blue-900 mb-2">LinkedIn Profile</h4>
                          <div className="space-y-2 text-sm">
                            <p><strong>Name:</strong> {result.prospectResearch.linkedinProfile.fullName}</p>
                            <p><strong>Headline:</strong> {result.prospectResearch.linkedinProfile.headline}</p>
                            <p><strong>Company:</strong> {result.prospectResearch.linkedinProfile.currentCompany}</p>
                            <p><strong>Location:</strong> {result.prospectResearch.linkedinProfile.location}</p>
                            {result.prospectResearch.linkedinProfile.skills && (
                              <p><strong>Skills:</strong> {result.prospectResearch.linkedinProfile.skills.join(', ')}</p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {result.prospectResearch.companyInfo && (
                        <div className="border rounded-lg p-4 bg-green-50">
                          <h4 className="font-medium text-green-900 mb-2">Company Information</h4>
                          <div className="space-y-2 text-sm">
                            <p><strong>Company:</strong> {result.prospectResearch.companyInfo.companyName}</p>
                            <p><strong>Type:</strong> {result.prospectResearch.companyInfo.companyType}</p>
                            <p><strong>Size:</strong> {result.prospectResearch.companyInfo.estimatedSize}</p>
                            <p><strong>Description:</strong> {result.prospectResearch.companyInfo.description}</p>
                          </div>
                        </div>
                        )}
                      
                      {result.prospectResearch.recentNews && result.prospectResearch.recentNews.length > 0 && (
                        <div className="border rounded-lg p-4 bg-yellow-50">
                          <h4 className="font-medium text-yellow-900 mb-2">Recent Company News</h4>
                          <div className="space-y-2 text-sm">
                            {result.prospectResearch.recentNews.slice(0, 3).map((news, index) => (
                              <div key={index} className="border-l-2 border-yellow-400 pl-3">
                                <p className="font-medium">{news.title}</p>
                                {news.snippet && <p className="text-snippet">{news.snippet}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

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
                        <div className="text-2xl font-bold text-blue-600">{result?.analytics?.expectedOpenRate || 'N/A'}</div>
                        <div className="text-sm text-gray-600">Open Rate</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{result?.analytics?.expectedResponseRate || 'N/A'}</div>
                        <div className="text-sm text-gray-600">Response Rate</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {result?.analytics?.expectedConversionRate || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Conversion Rate</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-sm font-bold text-yellow-600">
                          {result?.analytics?.bestSendTimes?.[0] || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Best Send Time</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Email Sequence */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-rose-500" />
                      Cold Outreach Email Sequence
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {Array.isArray(result?.sequences) 
                      ? result.sequences.map((email, index) => (
                      <div key={index} className="border rounded-lg p-6 bg-white">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-rose-100 text-rose-800">
                              Email {email?.emailNumber || index + 1}
                            </Badge>
                            <Badge variant="outline">{email?.timing || 'N/A'}</Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(email.content, `email-${index}`)}
                          >
                            {copied[`email-${index}`] ? (
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
                              <p className="font-medium">{email?.subject || ''}</p>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Email Content:</h4>
                            <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                                {email?.content || ''}
                              </pre>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Purpose:</h4>
                              <div className="bg-green-50 p-3 rounded-lg">
                                <p className="text-green-800 text-sm">{email?.purpose || ''}</p>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Follow-up Trigger:</h4>
                              <div className="bg-yellow-50 p-3 rounded-lg">
                                <p className="text-yellow-800 text-sm">{email?.followUpTrigger || ''}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                      : (
                        <div className="text-center py-8 text-gray-500">
                          <p></p>
                        </div>
                      )
                    }
                  </CardContent>
                </Card>

                {/* Personalization Guide */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-500" />
                      Personalization Guide
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Research Points to Include:</h4>
                      <ul className="space-y-1">
                        {Array.isArray(result?.personalization?.researchPoints) 
                          ? result.personalization.researchPoints.map((point, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                {point}
                              </li>
                            ))
                          : (
                              <li className="text-sm text-gray-600 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                {result?.personalization?.researchPoints || ''}
                              </li>
                            )
                        }
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Customization Tips:</h4>
                      <ul className="space-y-1">
                        {Array.isArray(result?.personalization?.customizationTips) 
                          ? result.personalization.customizationTips.map((tip, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-blue-500" />
                                {tip}
                              </li>
                            ))
                          : (
                              <li className="text-sm text-gray-600 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-blue-500" />
                                {result?.personalization?.customizationTips || ''}
                              </li>
                            )
                        }
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Industry Insights:</h4>
                      <ul className="space-y-1">
                        {Array.isArray(result?.personalization?.industryInsights) 
                          ? result.personalization.industryInsights.map((insight, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-purple-500" />
                                {insight}
                              </li>
                            ))
                          : (
                              <li className="text-sm text-gray-600 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-purple-500" />
                                {result?.personalization?.industryInsights || ''}
                              </li>
                            )
                        }
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Multi-Channel Templates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-orange-500" />
                      Multi-Channel Templates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">LinkedIn Message</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(result?.templates?.linkedin || '', "linkedin")}
                        >
                          {copied["linkedin"] ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                      <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-line">
                        {result?.templates?.linkedin || ''}
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Twitter DM</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(result?.templates?.twitter || '', "twitter")}
                        >
                          {copied["twitter"] ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                      <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-line">
                        {result?.templates?.twitter || ''}
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Cold Call Script</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(result?.templates?.phone || '', "phone")}
                        >
                          {copied["phone"] ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                      <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-line">
                        {result?.templates?.phone || ''}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Optimization Tips */}
                <Card>
                  <CardHeader>
                    <CardTitle>Optimization & Testing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Subject Line Variations for A/B Testing:</h4>
                      <div className="space-y-2">
                        {Array.isArray(result?.optimization?.subjectLineVariations) 
                          ? result.optimization.subjectLineVariations.map((variation, index) => (
                              <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                                {variation}
                              </div>
                            ))
                          : (
                              <div className="bg-gray-50 p-2 rounded text-sm">
                                {result?.optimization?.subjectLineVariations || ''}
                              </div>
                            )
                        }
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">A/B Testing Suggestions:</h4>
                      <ul className="space-y-1">
                        {Array.isArray(result?.optimization?.abtestingSuggestions) 
                          ? result.optimization.abtestingSuggestions.map((suggestion, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                {suggestion}
                              </li>
                            ))
                          : (
                              <li className="text-sm text-gray-600 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                {result?.optimization?.abtestingSuggestions || ''}
                              </li>
                            )
                        }
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Follow-up Strategy:</h4>
                      <ul className="space-y-1">
                        {Array.isArray(result?.optimization?.followUpStrategy) 
                          ? result.optimization.followUpStrategy.map((strategy, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-blue-500" />
                                {strategy}
                              </li>
                            ))
                          : (
                              <li className="text-sm text-gray-600 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-blue-500" />
                                {result?.optimization?.followUpStrategy || ''}
                              </li>
                            )
                        }
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* CRM Integration & Export */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-500" />
                      CRM Integration & Export
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        className="w-full bg-transparent"
                        onClick={exportToGoogleSheets}
                        disabled={!result}
                      >
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                        </svg>
                        Export to Google Sheets
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full bg-transparent"
                        onClick={exportToCRM}
                        disabled={!result}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export to CRM
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => integrateWithCRM('hubspot')}
                        disabled={!result}
                        className="bg-orange-50 hover:bg-orange-100"
                      >
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9.5 4C5.36 4 2 6.69 2 10c0 1.89 1.08 3.56 2.78 4.66L3.5 20l3.5-2.5c1.1.66 2.33 1.5 3.5 1.5 3.64 0 7-2.69 7-6s-3.36-6-7-6z"/>
                        </svg>
                        HubSpot
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => integrateWithCRM('salesforce')}
                        disabled={!result}
                        className="bg-blue-50 hover:bg-blue-100"
                      >
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                        </svg>
                        Salesforce
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => integrateWithCRM('pipedrive')}
                        disabled={!result}
                        className="bg-green-50 hover:bg-green-100"
                      >
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        Pipedrive
                      </Button>
                    </div>

                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(JSON.stringify(result, null, 2), "all-outreach")}
                        className="flex-1"
                      >
                        {copied["all-outreach"] ? (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        ) : (
                          <Copy className="w-4 h-4 mr-2" />
                        )}
                        {copied["all-outreach"] ? "Copied!" : "Copy All Templates"}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={sendMailmergeCampaign}
                        disabled={!result}
                        className="flex-1 bg-green-50 hover:bg-green-100"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Send Mailmerge Campaign
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
