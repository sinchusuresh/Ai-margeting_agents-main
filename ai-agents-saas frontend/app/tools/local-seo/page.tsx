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
import { ArrowLeft, Play, Download, Copy, CheckCircle, Loader2, MapPin, Lock, Crown, Star, TrendingUp, Search, Users, Settings, Calendar } from 'lucide-react'
import { useUserStore } from "@/lib/user-store"
import jsPDF from "jspdf";
import { makeAuthenticatedRequest } from "@/lib/auth-utils"

interface LocalSEOResult {
  businessProfile: {
    optimizationScore: number
    issues: Array<{
      issue: string
      priority: "High" | "Medium" | "Low"
      solution: string
    }>
    recommendations: string[]
  }
  keywordStrategy: {
    primaryKeywords: Array<{
      keyword: string
      searchVolume: string
      difficulty: string
      opportunity: string
    }>
    longTailKeywords: string[]
    locationModifiers: string[]
  }
  contentStrategy: {
    localPages: Array<{
      pageType: string
      title: string
      content: string
      keywords: string[]
    }>
    blogTopics: string[]
    faqSuggestions: string[]
  }
  citationAudit: {
    currentCitations: number
    missingCitations: Array<{
      platform: string
      importance: "High" | "Medium" | "Low"
      url: string
      description: string
    }>
    inconsistencies: string[]
  }
  reviewStrategy: {
    currentRating: number
    reviewGoals: string[]
    responseTemplates: Array<{
      type: string
      template: string
    }>
    acquisitionStrategy: string[]
  }
  competitorAnalysis: {
    competitors: Array<{
      name: string
      ranking: number
      strengths: string[]
      weaknesses: string[]
      opportunities: string[]
    }>
    marketGaps: string[]
  }
  actionPlan: {
    phase: string
    timeline: string
    tasks: string[]
    expectedResults: string[]
  }[]
}

export default function LocalSEOPage() {
  const { user } = useUserStore()
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    location: "",
    serviceArea: "",
    primaryServices: "",
    targetKeywords: "",
    currentWebsite: "",
    competitors: "",
    gmbEmail: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<LocalSEOResult | null>(null)
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({})
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasAccess = user.plan !== "Free Trial"

  // Add professional header to PDF
  const addHeader = (doc: jsPDF) => {
    // Header background with website theme colors
    doc.setFillColor(99, 102, 241); // Indigo primary color
    doc.rect(0, 0, 210, 40, 'F');
    
    // Logo/Icon placeholder (purple circle)
    doc.setFillColor(147, 51, 234); // Purple accent
    doc.circle(25, 20, 12, 'F');
    
    // Website name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text("AI Marketing Agents", 45, 18);
    
    // Tagline
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text("Automate Your Marketing", 45, 28);
    
    // Current date
    doc.setFontSize(8);
    doc.text(new Date().toLocaleDateString(), 160, 15);
    
    // Page number
    doc.text("Page 1", 160, 25);
  }

  // Add professional footer to PDF
  const addFooter = (doc: jsPDF, pageNumber: number) => {
    const pageHeight = doc.internal.pageSize.height;
    
    // Footer background
    doc.setFillColor(243, 244, 246); // Light gray
    doc.rect(0, pageHeight - 25, 210, 25, 'F');
    
    // Footer content
    doc.setTextColor(107, 114, 128); // Gray text
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    
    // Left side - Company info
    doc.text("AI Marketing Agents - Local SEO Optimizer", 15, pageHeight - 15);
    
    // Center - Contact info
    doc.text("Generated on " + new Date().toLocaleDateString(), 105, pageHeight - 15, { align: 'center' });
    
    // Right side - Page info
    doc.text(`Page ${pageNumber}`, 195, pageHeight - 15, { align: 'right' });
    
    // Bottom border
    doc.setDrawColor(99, 102, 241); // Indigo border
    doc.setLineWidth(0.5);
    doc.line(15, pageHeight - 25, 195, pageHeight - 25);
  }

  // Transform AI response to ensure complete data for all sections
  const transformAIResponseToFrontendFormat = (aiOutput: any, formData: any) => {
    console.log('🔄 Transforming Local SEO AI response:', aiOutput)
    console.log('📊 AI Output Structure:', Object.keys(aiOutput))
    
    // Ensure business profile has complete data
    const businessProfile = {
      optimizationScore: aiOutput.businessProfile?.optimizationScore || 65,
      issues: aiOutput.businessProfile?.issues || [
        {
          issue: 'Missing Google My Business optimization',
          priority: 'High' as const,
          solution: 'Complete GMB profile setup with accurate business information'
        }
      ],
      recommendations: aiOutput.businessProfile?.recommendations || [
        'Optimize Google My Business profile',
        'Add business photos and hours',
        'Ensure NAP consistency across platforms'
      ]
    }
    
    // Ensure keyword strategy has complete data
    const keywordStrategy = {
      primaryKeywords: aiOutput.keywordStrategy?.primaryKeywords || [
        {
          keyword: `${formData.primaryServices || 'local business'} services`,
          searchVolume: 'High',
          difficulty: 'Medium',
          opportunity: 'Good'
        }
      ],
      longTailKeywords: aiOutput.keywordStrategy?.longTailKeywords || [
        `best ${formData.primaryServices || 'local business'} in ${formData.location}`,
        `${formData.primaryServices || 'local business'} near me`,
        `${formData.primaryServices || 'local business'} ${formData.location}`
      ],
      locationModifiers: aiOutput.keywordStrategy?.locationModifiers || [
        formData.location?.split(',')[0] || 'Local',
        formData.location?.split(',')[1] || 'Area'
      ]
    }
    
    // Ensure content strategy has complete data
    const contentStrategy = {
      localPages: aiOutput.contentStrategy?.localPages || [
        {
          pageType: 'Service Page',
          title: `${formData.businessName} Services`,
          content: `Comprehensive ${formData.primaryServices || 'local business'} solutions in ${formData.location}`,
          keywords: [formData.primaryServices || 'local business', 'services', formData.location]
        }
      ],
      blogTopics: aiOutput.contentStrategy?.blogTopics || [
        `${formData.primaryServices || 'Local Business'} Tips`,
        'Community Involvement',
        `${formData.location} Business Guide`
      ],
      faqSuggestions: aiOutput.contentStrategy?.faqSuggestions || [
        'What services do you offer?',
        'What areas do you serve?',
        'How can customers contact you?'
      ]
    }
    
    // Ensure citation audit has complete data
    const citationAudit = {
      currentCitations: aiOutput.citationAudit?.currentCitations || 5,
      missingCitations: aiOutput.citationAudit?.missingCitations || [
        {
          platform: 'Google My Business',
          importance: 'High' as const,
          url: 'https://business.google.com',
          description: 'Primary local search platform'
        },
        {
          platform: 'Facebook Business',
          importance: 'Medium' as const,
          url: 'https://facebook.com/business',
          description: 'Social media presence'
        }
      ],
      inconsistencies: aiOutput.citationAudit?.inconsistencies || [
        'Business hours vary across platforms',
        'Phone number formatting differences',
        'Address variations'
      ]
    }
    
    // Ensure review strategy has complete data
    const reviewStrategy = {
      currentRating: aiOutput.reviewStrategy?.currentRating || 4.2,
      reviewGoals: aiOutput.reviewStrategy?.reviewGoals || [
        'Increase to 4.5+ rating',
        'Collect 50+ reviews',
        'Respond to all reviews within 24 hours'
      ],
      responseTemplates: aiOutput.reviewStrategy?.responseTemplates || [
        {
          type: 'Positive Review',
          template: 'Thank you for your feedback! We appreciate your business and look forward to serving you again.'
        },
        {
          type: 'Negative Review',
          template: 'We apologize for your experience. Please contact us directly so we can make this right.'
        }
      ],
      acquisitionStrategy: aiOutput.reviewStrategy?.acquisitionStrategy || [
        'Ask satisfied customers after service completion',
        'Follow up with email requests',
        'Include review links in receipts'
      ]
    }
    
    // Ensure competitor analysis has complete data
    const competitorAnalysis = {
      competitors: aiOutput.competitorAnalysis?.competitors || [
        {
          name: formData.competitors || 'Competitor Business',
          ranking: 3,
          strengths: ['Strong online presence', 'High review count', 'Comprehensive service offerings'],
          weaknesses: ['Higher pricing', 'Limited availability', 'Poor response times'],
          opportunities: ['Focus on competitive pricing', 'Emphasize availability and responsiveness', 'Highlight unique service features']
        }
      ],
      marketGaps: aiOutput.competitorAnalysis?.marketGaps || [
        'Specialized local services',
        'Extended hours',
        'Personalized customer service'
      ]
    }
    
    // Ensure action plan has complete data
    const actionPlan = aiOutput.actionPlan || [
      {
        phase: 'Phase 1: Foundation',
        timeline: '2-4 weeks',
        tasks: [
          'Optimize Google My Business profile',
          'Fix citation inconsistencies',
          'Create local content pages'
        ],
        expectedResults: [
          'Improved local search visibility',
          'Consistent business information',
          'Better local keyword rankings'
        ]
      },
      {
        phase: 'Phase 2: Growth',
        timeline: '4-8 weeks',
        tasks: [
          'Implement review management strategy',
          'Create local blog content',
          'Build local citations'
        ],
        expectedResults: [
          'Increased review count and rating',
          'Better local content presence',
          'Improved local authority'
        ]
      }
    ]

    return {
      businessProfile,
      keywordStrategy,
      contentStrategy,
      citationAudit,
      reviewStrategy,
      competitorAnalysis,
      actionPlan
    }
  }

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleGenerate = async () => {
    if (!hasAccess) {
      alert("Please upgrade to Pro or Agency plan to use this tool.")
      return
    }

    if (!formData.businessName || !formData.location) {
      alert("Please enter business name and location")
      return
    }

    setIsGenerating(true)
    setResult(null)
    setError(null)

    try {
      // Prepare input data for the backend
      const inputData = {
        businessName: formData.businessName,
        businessType: formData.businessType || 'Not specified',
        location: formData.location,
        serviceArea: formData.serviceArea || 'Not specified',
        primaryServices: formData.primaryServices || 'Not specified',
        targetKeywords: formData.targetKeywords || 'Not specified',
        currentWebsite: formData.currentWebsite || 'Not specified',
        competitors: formData.competitors || 'Not specified'
      }

      // Call the backend API
      console.log('🔍 Calling backend API with input:', inputData);
      const data = await makeAuthenticatedRequest('/api/ai-tools/local-seo/generate', {
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

      // Log strategy details
      console.log('Local SEO Strategy Response:', data.output);
      console.log('Business Name:', formData.businessName);
      console.log('Location:', formData.location);

      // Transform the data to ensure complete content for all sections
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
      } else       if (errorMessage.includes('parse')) {
        setError('Failed to process AI response. Please try again.');
      } else if (errorMessage.includes('Server error')) {
        setError('Backend server error. Please check if your backend is running on port 5000.');
      } else if (errorMessage.includes('500')) {
        setError('Internal server error. Please try again or contact support.');
      } else {
        setError(`Failed to generate local SEO strategy: ${errorMessage}`);
      }

      // Use transformation function to generate complete fallback data
      const fallbackResult = transformAIResponseToFrontendFormat({}, formData);
      setResult(fallbackResult);
    } finally {
      setIsGenerating(false)
    }
  }

  // GMB Profile Audit
  const handleGMBAudit = async () => {
    if (!hasAccess) {
      alert("Please upgrade to Pro or Agency plan to use this tool.")
      return
    }

    if (!formData.businessName || !formData.location) {
      alert("Please enter business name and location")
      return
    }

    try {
      const data = await makeAuthenticatedRequest('/api/ai-tools/local-seo/gmb-audit', {
        method: 'POST',
        body: JSON.stringify({
          businessName: formData.businessName,
          location: formData.location
        })
      })

      if (data.success) {
        alert(`GMB Audit completed! Profile Score: ${data.audit.completenessScore}/100`);
        // You can store this data in state for display
      } else {
        alert('GMB audit failed. Please try again.');
      }
    } catch (error) {
      console.error('GMB audit error:', error);
      alert('GMB audit failed. Please check your GMB integration settings.');
    }
  }

  // Citation Building
  const handleBuildCitations = async () => {
    if (!hasAccess) {
      alert("Please upgrade to Pro or Agency plan to use this tool.")
      return
    }

    try {
      const businessData = {
        businessName: formData.businessName,
        location: formData.location,
        city: formData.location.split(',')[0]?.trim(),
        state: formData.location.split(',')[1]?.trim(),
        businessType: formData.businessType,
        website: formData.currentWebsite
      }

      const data = await makeAuthenticatedRequest('/api/ai-tools/local-seo/build-citations', {
        method: 'POST',
        body: JSON.stringify({
          businessData: businessData,
          method: 'manual' // or 'brightlocal' if API key is configured
        })
      })

      if (data.success) {
        alert(`Citation building initiated! ${data.result.totalSubmitted} directories processed.`);
      } else {
        alert('Citation building failed. Please try again.');
      }
    } catch (error) {
      console.error('Citation building error:', error);
      alert('Citation building failed. Please try again.');
    }
  }

  // Performance Tracking
  const handleTrackPerformance = async () => {
    if (!hasAccess) {
      alert("Please upgrade to Pro or Agency plan to use this tool.")
      return
    }

    if (!formData.targetKeywords) {
      alert("Please enter target keywords first")
      return
    }

    try {
      const keywords = formData.targetKeywords.split(',').map(k => k.trim());
      const competitors = formData.competitors ? formData.competitors.split(',').map(c => ({ name: c.trim() })) : [];

      const data = await makeAuthenticatedRequest('/api/ai-tools/local-seo/performance-report', {
        method: 'POST',
        body: JSON.stringify({
          businessName: formData.businessName,
          location: formData.location,
          keywords: keywords,
          competitors: competitors
        })
      })

      if (data.success) {
        alert(`Performance report generated! Overall Score: ${data.report.summary.overallScore}/100`);
        // You can store this data in state for display
      } else {
        alert('Performance tracking failed. Please try again.');
      }
    } catch (error) {
      console.error('Performance tracking error:', error);
      alert('Performance tracking failed. Please try again.');
    }
  }

  // Content Calendar Generation
  const handleGenerateContentCalendar = async () => {
    if (!hasAccess) {
      alert("Please upgrade to Pro or Agency plan to use this tool.")
      return
    }

    try {
      const data = await makeAuthenticatedRequest('/api/ai-tools/local-seo/content-calendar', {
        method: 'POST',
        body: JSON.stringify({
          businessName: formData.businessName,
          businessType: formData.businessType,
          location: formData.location,
          primaryServices: formData.primaryServices
        })
      })

      if (data.success) {
        alert(`Content calendar generated! ${data.calendar.monthlyThemes.length} monthly themes created with ${data.calendar.totalPosts} posts.`);
        // You can store this data in state for display
      } else {
        alert('Content calendar generation failed. Please try again.');
      }
    } catch (error) {
      console.error('Content calendar generation error:', error);
      alert('Content calendar generation failed. Please try again.');
    }
  }

  // Competitor Monitoring
  const handleCompetitorMonitoring = async () => {
    if (!hasAccess) {
      alert("Please upgrade to Pro or Agency plan to use this tool.")
      return
    }

    if (!formData.competitors) {
      alert("Please enter competitor names first")
      return
    }

    try {
      const competitors = formData.competitors.split(',').map(c => c.trim());

      const data = await makeAuthenticatedRequest('/api/ai-tools/local-seo/competitor-tracking', {
        method: 'POST',
        body: JSON.stringify({
          businessName: formData.businessName,
          location: formData.location,
          competitors: competitors
        })
      })

      if (data.success) {
        alert(`Competitor monitoring initiated! Tracking ${data.tracking.competitors.length} competitors with ${data.tracking.metrics.length} performance metrics.`);
        // You can store this data in state for display
      } else {
        alert('Competitor monitoring failed. Please try again.');
      }
    } catch (error) {
      console.error('Competitor monitoring error:', error);
      alert('Competitor monitoring failed. Please try again.');
    }
  }

  // GMB Calendar Management
  const handleGMBCalendar = async () => {
    if (!hasAccess) {
      alert("Please upgrade to Pro or Agency plan to use this tool.")
      return
    }

    if (!formData.gmbEmail) {
      alert("Please enter your GMB email first")
      return
    }

    try {
      const data = await makeAuthenticatedRequest('/api/ai-tools/local-seo/gmb-calendar', {
        method: 'POST',
        body: JSON.stringify({
          businessName: formData.businessName,
          location: formData.location,
          gmbEmail: formData.gmbEmail,
          businessType: formData.businessType
        })
      })

      if (data.success) {
        alert(`GMB calendar created! ${data.calendar.events.length} events scheduled with ${data.calendar.posts.length} posts planned.`);
        // You can store this data in state for display
      } else {
        alert('GMB calendar creation failed. Please try again.');
      }
    } catch (error) {
      console.error('GMB calendar creation error:', error);
      alert('GMB calendar creation failed. Please try again.');
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied((prev) => ({ ...prev, [id]: true }))
    setTimeout(() => setCopied((prev) => ({ ...prev, [id]: false })), 2000)
  }

  const handleDownloadPDF = () => {
    if (!result) return;
    
    // Validate required data
    if (!result?.businessProfile || !result?.actionPlan || result?.actionPlan?.length === 0) {
      alert('No data available to export. Please generate a Local SEO plan first.');
      return;
    }
    
    setIsExportingPDF(true);

    try {
      const doc = new jsPDF();
      let yPosition = 20;
      
      // Add header with website theme
      addHeader(doc);
      yPosition = 50; // Start content below header
      
      // Title with gradient-like styling
      doc.setFillColor(99, 102, 241); // Indigo color
      doc.rect(15, yPosition - 5, 180, 25, 'F');
      doc.setTextColor(255, 255, 255); // White text
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text("Local SEO Plan", 105, yPosition + 8, { align: 'center' });
      yPosition += 35;
      
      // Business Info with styled box
      doc.setFillColor(243, 244, 246); // Light gray background
      doc.rect(15, yPosition - 5, 180, 35, 'F');
      doc.setTextColor(17, 24, 39); // Dark text
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text("Business Information", 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Business: ${formData.businessName ?? 'N/A'}`, 25, yPosition);
      yPosition += 8;
      doc.text(`Location: ${formData.location ?? 'N/A'}`, 25, yPosition);
      yPosition += 8;
      doc.text(`Business Type: ${formData.businessType ?? 'N/A'}`, 25, yPosition);
      yPosition += 15;
      
      // Business Profile Score with styled box
      doc.setFillColor(236, 254, 255); // Light blue background
      doc.rect(15, yPosition - 5, 180, 40, 'F');
      doc.setDrawColor(99, 102, 241); // Indigo border
      doc.setLineWidth(0.5);
      doc.rect(15, yPosition - 5, 180, 40, 'S');
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(99, 102, 241); // Indigo text
      doc.text("Business Profile Optimization", 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(17, 24, 39); // Dark text
      doc.text(`Optimization Score: ${result.businessProfile?.optimizationScore || 0}/100`, 25, yPosition);
      yPosition += 8;
      
      // Issues
      if (result.businessProfile?.issues && result.businessProfile.issues.length > 0) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(220, 38, 127); // Pink for critical issues
        doc.text("Critical Issues:", 25, yPosition);
        yPosition += 8;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(17, 24, 39); // Dark text
        result.businessProfile.issues.forEach((issue, index) => {
          const issueText = `${issue.priority} Priority: ${issue.issue}`;
          const lines = doc.splitTextToSize(issueText, 170);
          lines.forEach((line: string) => {
            doc.text(line, 30, yPosition);
            yPosition += 5;
          });
          yPosition += 3;
        });
        yPosition += 10;
      }
      
      // Action Plan with styled header
      doc.setFillColor(254, 243, 199); // Light yellow background
      doc.rect(15, yPosition - 5, 180, 20, 'F');
      doc.setDrawColor(245, 158, 11); // Amber border
      doc.setLineWidth(0.5);
      doc.rect(15, yPosition - 5, 180, 20, 'S');
      
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(245, 158, 11); // Amber text
      doc.text("90-Day Action Plan", 20, yPosition + 8);
      yPosition += 25;
      
      result.actionPlan.forEach((phase, index) => {
        // Check if we need a new page
        if (yPosition > 250) {
          addFooter(doc, doc.getCurrentPageInfo().pageNumber);
          doc.addPage();
          yPosition = 50; // Start below header on new page
          addHeader(doc);
        }
        
        // Phase Title with styled box
        doc.setFillColor(240, 249, 255); // Light blue background
        doc.rect(15, yPosition - 5, 180, 20, 'F');
        doc.setDrawColor(59, 130, 246); // Blue border
        doc.setLineWidth(0.5);
        doc.rect(15, yPosition - 5, 180, 20, 'S');
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(59, 130, 246); // Blue text
        doc.text(`${phase.phase}`, 20, yPosition + 8);
        yPosition += 25;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Timeline: ${phase.timeline}`, 25, yPosition);
        yPosition += 8;
        
        // Tasks
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text("Tasks:", 25, yPosition);
        yPosition += 6;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        phase.tasks.forEach((task, taskIndex) => {
          const lines = doc.splitTextToSize(`• ${task}`, 70);
          lines.forEach(line => {
            doc.text(line, 30, yPosition);
            yPosition += 5;
          });
          yPosition += 2;
        });
        yPosition += 5;
        
        // Expected Results
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text("Expected Results:", 110, yPosition - (phase.tasks.length * 7 + 5));
        yPosition = yPosition - (phase.tasks.length * 7 + 5) + 6;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        phase.expectedResults.forEach((result, resultIndex) => {
          const lines = doc.splitTextToSize(`• ${result}`, 70);
          lines.forEach(line => {
            doc.text(line, 115, yPosition);
            yPosition += 5;
          });
          yPosition += 2;
        });
        yPosition += 10;
      });
      
      // Add recommendations page
      addFooter(doc, doc.getCurrentPageInfo().pageNumber);
      doc.addPage();
      yPosition = 50; // Start below header
      addHeader(doc);
      
      // Recommendations with styled header
      doc.setFillColor(254, 226, 226); // Light red background
      doc.rect(15, yPosition - 5, 180, 20, 'F');
      doc.setDrawColor(239, 68, 68); // Red border
      doc.setLineWidth(0.5);
      doc.rect(15, yPosition - 5, 180, 20, 'S');
      
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(239, 68, 68); // Red text
      doc.text("Recommendations", 20, yPosition + 8);
      yPosition += 25;
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(17, 24, 39); // Dark text
      if (result.businessProfile?.recommendations && result.businessProfile.recommendations.length > 0) {
        result.businessProfile.recommendations.forEach((rec, index) => {
          const lines = doc.splitTextToSize(`${index + 1}. ${rec}`, 170);
          lines.forEach(line => {
            doc.text(line, 20, yPosition);
            yPosition += 5;
          });
          yPosition += 3;
        });
      } else {
        doc.text("No recommendations available.", 20, yPosition);
      }
      
      // Add footer to final page
      addFooter(doc, doc.getCurrentPageInfo().pageNumber);
      
      doc.save("local-seo-plan.pdf");
      alert('PDF exported successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
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
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-600 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Local SEO Optimizer</h1>
              {hasAccess ? (
                <Badge className="bg-green-100 text-green-800">Available</Badge>
              ) : (
                <Badge className="bg-orange-100 text-orange-800">Pro Required</Badge>
              )}
            </div>
            <p className="text-gray-600">Complete local SEO audit and optimization strategy</p>
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
            {/* GMB Integration Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  Google My Business Integration
                </CardTitle>
                <CardDescription>Connect and audit your GMB profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gmbEmail">GMB Email</Label>
                  <Input
                    id="gmbEmail"
                    placeholder="your@business.com"
                    value={formData.gmbEmail || ''}
                    onChange={(e) => handleInputChange("gmbEmail", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleGMBAudit}
                  disabled={!hasAccess || !formData.businessName || !formData.location}
                  className="w-full"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Audit GMB Profile
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Business Setup</CardTitle>
                <CardDescription>Configure your local SEO analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    placeholder="Enter your business name"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange("businessName", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type</Label>
                  <select
                    id="businessType"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={formData.businessType}
                    onChange={(e) => handleInputChange("businessType", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select business type</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="retail store">Retail Store</option>
                    <option value="service provider">Service Provider</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="automotive">Automotive</option>
                    <option value="real estate">Real Estate</option>
                    <option value="legal services">Legal Services</option>
                    <option value="home services">Home Services</option>
                    <option value="beauty salon">Beauty Salon</option>
                    <option value="fitness center">Fitness Center</option>
                    <option value="dentist">Dentist</option>
                    <option value="plumber">Plumber</option>
                    <option value="electrician">Electrician</option>
                    <option value="roofer">Roofer</option>
                    <option value="landscaper">Landscaper</option>
                    <option value="accountant">Accountant</option>
                    <option value="insurance agent">Insurance Agent</option>
                    <option value="pet groomer">Pet Groomer</option>
                    <option value="tutor">Tutor</option>
                    <option value="photographer">Photographer</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Primary Location *</Label>
                  <Input
                    id="location"
                    placeholder="City, State (e.g., Austin, TX)"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceArea">Service Area</Label>
                  <Input
                    id="serviceArea"
                    placeholder="Areas you serve (e.g., Austin Metro, Travis County)"
                    value={formData.serviceArea}
                    onChange={(e) => handleInputChange("serviceArea", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryServices">Primary Services</Label>
                  <Textarea
                    id="primaryServices"
                    placeholder="List your main services (comma separated)"
                    value={formData.primaryServices}
                    onChange={(e) => handleInputChange("primaryServices", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetKeywords">Target Keywords</Label>
                  <Textarea
                    id="targetKeywords"
                    placeholder="Keywords you want to rank for (comma separated)"
                    value={formData.targetKeywords}
                    onChange={(e) => handleInputChange("targetKeywords", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentWebsite">Website URL</Label>
                  <Input
                    id="currentWebsite"
                    placeholder="https://yourwebsite.com"
                    value={formData.currentWebsite}
                    onChange={(e) => handleInputChange("currentWebsite", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="competitors">Main Competitors</Label>
                  <Input
                    id="competitors"
                    placeholder="Competitor names (comma separated)"
                    value={formData.competitors}
                    onChange={(e) => handleInputChange("competitors", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-3 pt-4">
                  <Button
                    onClick={handleGenerate}
                    disabled={!hasAccess || isGenerating || !formData.businessName || !formData.location}
                    className="w-full bg-gradient-to-r from-green-400 to-emerald-600 hover:opacity-90 text-white font-semibold py-3"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing Local SEO...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Generate Local SEO Audit
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
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {!result ? (
              <Card>
                <CardContent className="text-center py-20">
                  <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Optimize</h3>
                  <p className="text-gray-600">
                    {hasAccess
                      ? "Enter your business details and generate a comprehensive local SEO strategy"
                      : "Upgrade to Pro plan to access the local SEO optimizer"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Business Profile Score */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      Local SEO Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-4xl font-bold text-green-600">{result?.businessProfile?.optimizationScore || 0}/100</div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-green-500 h-3 rounded-full"
                            style={{ width: `${result?.businessProfile?.optimizationScore || 0}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Good - Room for improvement</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Critical Issues:</h4>
                        <div className="space-y-2">
                          {result?.businessProfile?.issues
                            ?.filter((issue) => issue.priority === "High")
                            ?.map((issue, index) => (
                              <div key={index} className="p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className="bg-red-100 text-red-800 text-xs">High Priority</Badge>
                                </div>
                                <p className="text-sm font-medium text-red-900">{issue.issue}</p>
                                <p className="text-xs text-red-700 mt-1">{issue.solution}</p>
                              </div>
                            ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Quick Wins:</h4>
                        <div className="space-y-2">
                          {result?.businessProfile?.issues
                            ?.filter((issue) => issue.priority === "Medium")
                            ?.slice(0, 2)
                            ?.map((issue, index) => (
                              <div key={index} className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">Medium Priority</Badge>
                                </div>
                                <p className="text-sm font-medium text-yellow-900">{issue.issue}</p>
                                <p className="text-xs text-yellow-700 mt-1">{issue.solution}</p>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Keyword Strategy */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="w-5 h-5 text-blue-500" />
                      Local Keyword Strategy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Primary Target Keywords:</h4>
                      <div className="space-y-3">
                        {result?.keywordStrategy?.primaryKeywords?.map((keyword, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">{keyword?.keyword || 'N/A'}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-sm text-gray-600">Volume: {keyword?.searchVolume || 'N/A'}</span>
                                <Badge
                                  className={`text-xs ${
                                    keyword?.difficulty === "Low"
                                      ? "bg-green-100 text-green-800"
                                      : keyword?.difficulty === "Medium"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {keyword?.difficulty || 'N/A'} Difficulty
                                </Badge>
                                <Badge
                                  className={`text-xs ${
                                    keyword?.opportunity === "High"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {keyword?.opportunity || 'N/A'} Opportunity
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Long-tail Keywords:</h4>
                      <div className="flex flex-wrap gap-2">
                        {result?.keywordStrategy?.longTailKeywords?.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Content Strategy */}
                <Card>
                  <CardHeader>
                    <CardTitle>Local Content Strategy</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                                            {result?.contentStrategy?.localPages?.map((page, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{page.pageType}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(page.content, `page-${index}`)}
                          >
                            {copied[`page-${index}`] ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Optimized Title:</p>
                            <p className="font-medium text-blue-600">{page.title}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Content Preview:</p>
                            <div className="bg-gray-50 p-3 rounded text-sm max-h-32 overflow-y-auto">
                              {page.content.substring(0, 300)}...
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Target Keywords:</p>
                            <div className="flex flex-wrap gap-1">
                              {page.keywords.map((keyword, kIndex) => (
                                <Badge key={kIndex} variant="outline" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Blog Content Ideas:</h4>
                      <ul className="space-y-1">
                        {result?.contentStrategy?.blogTopics?.map((topic, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {topic}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Citation Audit */}
                <Card>
                  <CardHeader>
                    <CardTitle>Citation Audit & Directory Listings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{result?.citationAudit?.currentCitations || 0}</div>
                        <div className="text-sm text-gray-600">Current Citations</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{result?.citationAudit?.missingCitations?.length || 0}</div>
                        <div className="text-sm text-gray-600">Missing Citations</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{result?.citationAudit?.inconsistencies?.length || 0}</div>
                        <div className="text-sm text-gray-600">Inconsistencies</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Priority Citations to Create:</h4>
                      <div className="space-y-3">
                        {result?.citationAudit?.missingCitations
                          ?.filter((citation) => citation.importance === "High" || citation.importance === "Critical")
                          ?.map((citation, index) => (
                            <div key={index} className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{citation.platform}</p>
                                  <Badge 
                                    className={`text-xs ${
                                      citation.importance === "Critical" 
                                        ? "bg-red-100 text-red-800" 
                                        : "bg-orange-100 text-orange-800"
                                    }`}
                                  >
                                    {citation.importance} Priority
                                  </Badge>
                                </div>
                                <Link
                                  href={citation.url}
                                  target="_blank"
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                  Create Listing →
                                </Link>
                              </div>
                              <p className="text-sm text-gray-600">{citation.description}</p>
                            </div>
                          ))}
                      </div>
                      
                      <div className="mt-4">
                        <h5 className="font-medium text-gray-900 mb-2">Medium Priority Citations:</h5>
                        <div className="space-y-2">
                          {result?.citationAudit?.missingCitations
                            ?.filter((citation) => citation.importance === "Medium")
                            ?.slice(0, 5)
                            ?.map((citation, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{citation.platform}</p>
                                  <p className="text-xs text-gray-600">{citation.description}</p>
                                </div>
                                <Link
                                  href={citation.url}
                                  target="_blank"
                                  className="text-blue-600 hover:text-blue-800 text-sm ml-2"
                                >
                                  Create →
                                </Link>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Data Inconsistencies to Fix:</h4>
                      <ul className="space-y-1">
                        {result?.citationAudit?.inconsistencies?.map((inconsistency, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-yellow-500" />
                            {inconsistency}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Review Strategy */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      Review Management Strategy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl font-bold text-yellow-600">{result?.reviewStrategy?.currentRating || 0}</div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Current Rating</p>
                        <p className="text-sm font-medium">Goal: 4.5+ stars</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Review Response Templates:</h4>
                      <div className="space-y-3">
                        {result?.reviewStrategy?.responseTemplates?.map((template, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium">{template.type}</h5>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(template.template, `template-${index}`)}
                              >
                                {copied[`template-${index}`] ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                            <div className="bg-gray-50 p-3 rounded text-sm max-h-32 overflow-y-auto">
                              {template.template}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Review Acquisition Strategy:</h4>
                      <ul className="space-y-1">
                        {result?.reviewStrategy?.acquisitionStrategy?.map((strategy, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {strategy}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Competitor Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-500" />
                      Competitor Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                                            {result?.competitorAnalysis?.competitors?.map((competitor, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{competitor.name}</h4>
                          <Badge className="bg-purple-100 text-purple-800">Rank #{competitor.ranking}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h5 className="text-sm font-medium text-green-600 mb-1">Strengths:</h5>
                            <ul className="text-xs space-y-1">
                              {competitor.strengths.map((strength, sIndex) => (
                                <li key={sIndex} className="text-gray-600">• {strength}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-red-600 mb-1">Weaknesses:</h5>
                            <ul className="text-xs space-y-1">
                              {competitor.weaknesses.map((weakness, wIndex) => (
                                <li key={wIndex} className="text-gray-600">• {weakness}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-blue-600 mb-1">Opportunities:</h5>
                            <ul className="text-xs space-y-1">
                              {competitor.opportunities.map((opportunity, oIndex) => (
                                <li key={oIndex} className="text-gray-600">• {opportunity}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Market Gaps to Exploit:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {result?.competitorAnalysis?.marketGaps?.map((gap, index) => (
                          <div key={index} className="p-2 bg-blue-50 rounded text-sm text-blue-800">
                            {gap}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Plan */}
                <Card>
                  <CardHeader>
                    <CardTitle>90-Day Action Plan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                                            {result?.actionPlan?.map((phase, index) => (
                      <div key={index} className="border rounded-lg p-6 bg-white">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">{phase.phase}</h3>
                          <Badge variant="outline">{phase.timeline}</Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Tasks:</h4>
                            <ul className="space-y-1">
                              {phase.tasks.map((task, taskIndex) => (
                                <li key={taskIndex} className="text-sm text-gray-600 flex items-start gap-2">
                                  <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                                  {task}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Expected Results:</h4>
                            <ul className="space-y-1">
                              {phase.expectedResults.map((result, resultIndex) => (
                                <li key={resultIndex} className="text-sm text-gray-600 flex items-start gap-2">
                                  <TrendingUp className="w-4 h-4 text-green-500 mt-0.5" />
                                  {result}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(JSON.stringify(result, null, 2), "all-local-seo")}
                    className="flex-1 bg-transparent"
                    disabled={!result}
                  >
                    {copied["all-local-seo"] ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    {copied["all-local-seo"] ? "Copied!" : "Copy Full Report"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleDownloadPDF} 
                    className="flex-1 bg-transparent"
                    disabled={!result || isExportingPDF}
                  >
                    {isExportingPDF ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    {isExportingPDF ? "Exporting..." : "Export SEO Plan"}
                  </Button>
                </div>

                {/* Local SEO Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={handleBuildCitations}
                    className="w-full bg-blue-50 hover:bg-blue-100 border-blue-200"
                    disabled={!result}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Build Citations
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleTrackPerformance}
                    className="w-full bg-green-50 hover:bg-green-100 border-green-200"
                    disabled={!result}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Track Performance
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open('/api/ai-tools/local-seo/integrations', '_blank')}
                    className="w-full bg-purple-50 hover:bg-purple-100 border-purple-200"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Check Integrations
                  </Button>
                </div>

                {/* Advanced Local SEO Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={handleGenerateContentCalendar}
                    className="w-full bg-orange-50 hover:bg-orange-100 border-orange-200"
                    disabled={!result}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Content Calendar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCompetitorMonitoring}
                    className="w-full bg-red-50 hover:bg-red-100 border-red-200"
                    disabled={!result}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Competitor Monitor
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGMBCalendar}
                    className="w-full bg-indigo-50 hover:bg-indigo-100 border-indigo-200"
                    disabled={!result}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    GMB Calendar
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
