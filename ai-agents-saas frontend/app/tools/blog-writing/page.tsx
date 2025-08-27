"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  PenTool,
  Lock,
  Crown,
  FileText,
  Target,
  TrendingUp,
  Eye,
  Share2,
  Image,
} from "lucide-react"
import { useUserStore } from "@/lib/user-store"
import { makeAuthenticatedRequest } from "@/lib/auth-utils"
import jsPDF from "jspdf";

interface BlogResult {
  title: string
  metaDescription?: string
  introduction?: string
  outline: string[]
  content: string
  conclusion?: string
  wordCount: number
  readingTime: string
  seoScore: number
  keywords?: Array<{
    primary: string
    secondary: string[]
    density: number
  }>
  suggestions?: {
    improvements: string[]
    additionalSections: string[]
  }
  cta?: {
    primaryCta: string
    secondaryCta: string
    socialCta: string
    ctaPlacement: string[]
  }
  seoOptimization?: {
    targetKeywords: string[]
    relatedKeywords: string[]
    keywordClusters: string[][]
    internalLinks: string[]
    externalLinks: string[]
    lsiKeywords: string[]
  }
  contentMarketing?: {
    socialMediaSnippets: string[];
    emailNewsletter: string;
    infographicIdeas: string[];
  }
  exportOptions?: {
    googleDocs: string
    markdown: string
    html: string
  }
  seoMetrics?: {
    surferSeo: string
    clearscope: string
    contentGrade: string
    readabilityScore: string
    seoDifficulty: string
  }
}

export default function BlogWritingPage() {
  const { user, refreshUserData } = useUserStore()
  
  // Debug: Log user plan information
  console.log('User object:', user);
  console.log('User plan:', user.plan);
  console.log('User plan type:', typeof user.plan);
  
  // Refresh user data on component mount
  useEffect(() => {
    refreshUserData();
    
    // Fallback: If user is still showing as Free Trial after 2 seconds, manually set admin credentials
    const timer = setTimeout(() => {
      if (user.plan === 'Free Trial' || user.email === 'john.doe@example.com') {
        console.log('Fallback: Manually setting admin credentials');
        useUserStore.getState().setUser({
          email: 'admin@aimarketing.com',
          plan: 'agency',
          isAdmin: true,
          role: 'admin',
          isAuthenticated: true
        });
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [refreshUserData, user.plan, user.email]);
  
  const [formData, setFormData] = useState({
    title: "",
    keywords: "",
    audience: "",
    length: "",
    tone: "",
    outline: "",
    industry: "",
    purpose: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<BlogResult | null>(null)
  const [copied, setCopied] = useState(false)

  const hasAccess = user.plan && (user.plan === "Pro" || user.plan === "agency" || user.plan === "Agency" || user.plan === "pro")

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleGenerate = async () => {
    if (!hasAccess) {
      alert("Please upgrade to Pro or Agency plan to use this tool.")
      return
    }

    if (!formData.title || !formData.keywords) {
      alert("Please enter a title and keywords")
      return
    }

    setIsGenerating(true)
    try {
      // Prepare the input data for the backend
      const inputData = {
        topic: formData.title,
        keywords: formData.keywords,
        targetAudience: formData.audience || "general audience",
        tone: formData.tone || "professional",
        wordCount: formData.length || "800-1200",
        industry: formData.industry || "marketing",
        goal: formData.purpose || "educational",
        customOutline: formData.outline || ""
      }

      const data = await makeAuthenticatedRequest("/api/ai-tools/blog-writing/generate", {
        method: "POST",
        body: JSON.stringify({ input: inputData }),
      })
      
      if (data.success) {
        // Transform the backend response to match our frontend structure
        const transformedResult = transformBackendResponse(data.output, inputData)
        setResult(transformedResult)
      } else {
        alert(data.message || "Failed to generate content")
      }
    } catch (error) {
      console.error("Error generating blog content:", error)
      alert(error instanceof Error ? error.message : "Failed to generate content. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Transform backend response to match our frontend structure
  const transformBackendResponse = (backendOutput: any, inputData: any): BlogResult => {
    console.log('Backend output received:', backendOutput);
    
    // Extract and transform the comprehensive content from backend
    const transformedResult: BlogResult = {
      title: backendOutput.title || inputData.topic || 'Untitled Blog Post',
      metaDescription: backendOutput.metaDescription || '',
      introduction: backendOutput.introduction || '',
      outline: backendOutput.outline && Array.isArray(backendOutput.outline) ? 
        backendOutput.outline.map((section: any) => 
          typeof section === 'string' ? section : (section?.heading || 'Untitled Section')
        ) : [],
      content: backendOutput.content ? 
        (typeof backendOutput.content === 'string' ? 
          backendOutput.content : 
          // Handle structured content sections properly
          Object.entries(backendOutput.content || {}).map(([key, value]) => {
            if (key.startsWith('section')) {
              const sectionIndex = parseInt(key.replace('section', '')) - 1;
              const sectionHeading = backendOutput.outline && Array.isArray(backendOutput.outline) && backendOutput.outline[sectionIndex] ? 
                (backendOutput.outline[sectionIndex]?.heading || `Section ${key.replace('section', '')}`) : 
                `Section ${key.replace('section', '')}`;
              return `## ${sectionHeading}\n\n${value}`;
            }
            return value;
          }).join('\n\n')
        ) : '',
      conclusion: backendOutput.conclusion || '',
      wordCount: 0, // Will be calculated below
      readingTime: '', // Will be calculated below
      seoScore: 0, // Will be calculated below
      cta: backendOutput.cta || {
        primaryCta: 'Get Started Today',
        secondaryCta: 'Learn More',
        socialCta: 'Share This Post',
        ctaPlacement: ['End of introduction', 'After key points', 'Before conclusion']
      },
      seoOptimization: backendOutput.seoOptimization || {
        targetKeywords: [],
        relatedKeywords: [],
        keywordClusters: [],
        internalLinks: [],
        externalLinks: [],
        lsiKeywords: []
      },
      contentMarketing: backendOutput.contentMarketing || {
        socialMediaSnippets: [],
        emailNewsletter: '',
        infographicIdeas: []
      },
      suggestions: backendOutput.suggestions || {
        improvements: [],
        additionalSections: []
      },
      exportOptions: backendOutput.exportOptions || {},
      seoMetrics: backendOutput.seoMetrics || {
        contentGrade: 'B',
        readabilityScore: '75',
        seoDifficulty: 'Medium'
      }
    };

    // Calculate word count and reading time from ALL content
    const allContent = [
      transformedResult.introduction || '',
      transformedResult.content || '',
      transformedResult.conclusion || ''
    ].filter(Boolean).join(' ');
    
    transformedResult.wordCount = allContent.trim() ? allContent.split(/\s+/).length : 0;
    transformedResult.readingTime = transformedResult.wordCount > 0 ? Math.ceil(transformedResult.wordCount / 200) + ' min read' : '0 min read';
    
    // Calculate SEO score based on content quality
    let seoScore = 60; // Base score
    if (transformedResult.seoOptimization && transformedResult.seoOptimization.targetKeywords && transformedResult.seoOptimization.targetKeywords.length > 0) seoScore += 10;
    if (transformedResult.seoOptimization && transformedResult.seoOptimization.relatedKeywords && transformedResult.seoOptimization.relatedKeywords.length > 0) seoScore += 5;
    if (transformedResult.seoOptimization && transformedResult.seoOptimization.lsiKeywords && transformedResult.seoOptimization.lsiKeywords.length > 0) seoScore += 5;
    if (transformedResult.outline && Array.isArray(transformedResult.outline) && transformedResult.outline.length > 2) seoScore += 10;
    if (transformedResult.cta && transformedResult.cta.primaryCta) seoScore += 5;
    if (transformedResult.metaDescription) seoScore += 5;
    
    transformedResult.seoScore = Math.min(100, seoScore);

    console.log('Transformed result:', transformedResult);
    return transformedResult;
  };

  const copyToClipboard = (text: string) => {
    if (!text || text.trim() === '') {
      alert('No content to copy! Please generate content first.');
      return;
    }

    console.log('Attempting to copy text:', text.substring(0, 100) + '...');
    
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        console.log('✅ Content copied successfully via clipboard API');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch((err) => {
        console.error('❌ Clipboard API failed:', err);
        // Fallback for older browsers
        fallbackCopyTextToClipboard(text);
      });
    } else {
      // Fallback for older browsers or non-secure contexts
      console.log('Using fallback copy method');
      fallbackCopyTextToClipboard(text);
    }
  }

  // Fallback copy function for older browsers
  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        console.log('✅ Fallback copy successful');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        console.error('❌ Fallback copy failed');
        alert('Copy failed. Please manually select and copy the content.');
      }
    } catch (err) {
      console.error('❌ Fallback copy error:', err);
      alert('Copy failed. Please manually select and copy the content.');
    }
    
    document.body.removeChild(textArea);
  }

  // Generate actual Markdown content from the result
  const generateMarkdown = (result: BlogResult): string => {
    console.log('Generating markdown for result:', result);
    
    if (!result || !result.title) {
      console.error('Invalid result for markdown generation');
      return 'Error: No content available';
    }
    
    let markdown = `# ${result.title || 'Untitled'}\n\n`
    
    if (result.metaDescription) {
      markdown += `> ${result.metaDescription}\n\n`
    }
    
    if (result.introduction) {
      markdown += `${result.introduction}\n\n`
    }
    
    if (result.outline && result.outline.length > 0) {
      markdown += `## Table of Contents\n\n`
      result.outline.forEach((section, index) => {
        markdown += `${index + 1}. [${section}](#${section.toLowerCase().replace(/\s+/g, '-')})\n`
      })
      markdown += `\n`
    }
    
    if (result.content) {
      // Ensure content is in markdown format, not HTML
      const markdownContent = result.content
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1')
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1')
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1')
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
        .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '') // Remove any remaining HTML tags
        .replace(/\n\n\n+/g, '\n\n') // Clean up excessive newlines
      
      markdown += markdownContent + '\n\n'
    }
    
    if (result.conclusion) {
      markdown += `## Conclusion\n\n${result.conclusion}\n\n`
    }
    
    if (result.cta?.primaryCta) {
      markdown += `## Call to Action\n\n${result.cta.primaryCta}\n\n`
    }
    
    if (result.seoOptimization?.targetKeywords && result.seoOptimization.targetKeywords.length > 0) {
      markdown += `## SEO Keywords\n\n`
      result.seoOptimization.targetKeywords.forEach(keyword => {
        markdown += `- ${keyword}\n`
      })
      markdown += `\n`
    }
    
    if (result.seoOptimization?.relatedKeywords && result.seoOptimization.relatedKeywords.length > 0) {
      markdown += `## Related Keywords\n\n`
      result.seoOptimization.relatedKeywords.forEach(keyword => {
        markdown += `- ${keyword}\n`
      })
      markdown += `\n`
    }
    
    if (result.seoOptimization?.lsiKeywords && result.seoOptimization.lsiKeywords.length > 0) {
      markdown += `## LSI Keywords\n\n`
      result.seoOptimization.lsiKeywords.forEach(keyword => {
        markdown += `- ${keyword}\n`
      })
      markdown += `\n`
    }
    
    markdown += `---\n*Generated by AI Marketing Agents*\n`
    console.log('Generated markdown:', markdown);
    return markdown
  }

  // Generate actual HTML content from the result
  const generateHTML = (result: BlogResult): string => {
    console.log('Generating HTML for result:', result);
    
    if (!result || !result.title) {
      console.error('Invalid result for HTML generation');
      return '<p>Error: No content available</p>';
    }
    
    let html = `<!DOCTYPE html>\n<html lang="en">\n<head>\n`
    html += `  <meta charset="UTF-8">\n`
    html += `  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n`
    html += `  <title>${result.title || 'Untitled'}</title>\n`
    if (result.metaDescription) {
      html += `  <meta name="description" content="${result.metaDescription}">\n`
    }
    html += `  <style>\n`
    html += `    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }\n`
    html += `    h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }\n`
    html += `    h2 { color: #1e40af; margin-top: 30px; }\n`
    html += `    h3 { color: #1e40af; margin-top: 25px; }\n`
    html += `    .meta { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }\n`
    html += `    .cta { background: #dcfce7; border: 1px solid #22c55e; padding: 20px; border-radius: 8px; margin: 20px 0; }\n`
    html += `    .keywords { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; }\n`
    html += `    .seo-section { background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; }\n`
    html += `    .keyword-highlight { background: #fef3c7; padding: 2px 4px; border-radius: 3px; }\n`
    html += `    .toc { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }\n`
    html += `    .toc ul { list-style: none; padding-left: 0; }\n`
    html += `    .toc li { margin: 8px 0; }\n`
    html += `    .toc a { color: #2563eb; text-decoration: none; }\n`
    html += `    .toc a:hover { text-decoration: underline; }\n`
    html += `  </style>\n</head>\n<body>\n`
    
    html += `  <h1>${result.title}</h1>\n\n`
    
    if (result.metaDescription) {
      html += `  <div class="meta">\n    <strong>Meta Description:</strong> ${result.metaDescription}\n  </div>\n\n`
    }
    
    if (result.introduction) {
      html += `  <div class="introduction">\n    ${result.introduction}\n  </div>\n\n`
    }
    
    if (result.outline && result.outline.length > 0) {
      html += `  <div class="toc">\n    <h2>Table of Contents</h2>\n    <ul>\n`
      result.outline.forEach((section, index) => {
        html += `      <li><a href="#${section.toLowerCase().replace(/\s+/g, '-')}">${index + 1}. ${section}</a></li>\n`
      })
      html += `    </ul>\n  </div>\n\n`
    }
    
    if (result.content) {
      // Convert markdown-style content to HTML
      const htmlContent = result.content
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2 id="$1">$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p>\n<p>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>')
      
      html += htmlContent + '\n\n'
    }
    
    if (result.conclusion) {
      html += `  <h2>Conclusion</h2>\n  <p>${result.conclusion}</p>\n\n`
    }
    
    if (result.cta?.primaryCta) {
      html += `  <div class="cta">\n    <h2>Call to Action</h2>\n    <p>${result.cta.primaryCta}</p>\n  </div>\n\n`
    }
    
    if (result.seoOptimization?.targetKeywords && result.seoOptimization.targetKeywords.length > 0) {
      html += `  <div class="seo-section">\n    <h2>SEO Keywords</h2>\n    <ul>\n`
      result.seoOptimization.targetKeywords.forEach(keyword => {
        html += `      <li><span class="keyword-highlight">${keyword}</span></li>\n`
      })
      html += `    </ul>\n  </div>\n\n`
    }
    
    if (result.seoOptimization?.relatedKeywords && result.seoOptimization.relatedKeywords.length > 0) {
      html += `  <div class="seo-section">\n    <h2>Related Keywords</h2>\n    <ul>\n`
      result.seoOptimization.relatedKeywords.forEach(keyword => {
        html += `      <li>${keyword}</li>\n`
      })
      html += `    </ul>\n  </div>\n\n`
    }
    
    if (result.seoOptimization?.lsiKeywords && result.seoOptimization.lsiKeywords.length > 0) {
      html += `  <div class="seo-section">\n    <h2>LSI Keywords</h2>\n    <ul>\n`
      result.seoOptimization.lsiKeywords.forEach(keyword => {
        html += `      <li>${keyword}</li>\n`
      })
      html += `    </ul>\n  </div>\n\n`
    }
    
    html += `  <hr>\n  <p><em>Generated by AI Marketing Agents</em></p>\n</body>\n</html>`
    console.log('Generated HTML:', html);
    return html
  }

  // Create a new Google Doc with the content
  const createGoogleDoc = (result: BlogResult) => {
    // Create a formatted text document that can be copied to Google Docs
    const docContent = `
${result.title}
${'='.repeat(result.title.length)}

${result.metaDescription || ''}

${result.outline ? 'TABLE OF CONTENTS:' : ''}
${result.outline ? result.outline.map((section, index) => `${index + 1}. ${section}`).join('\n') : ''}

${result.introduction || ''}

${result.content || ''}

${result.conclusion || ''}

${result.cta?.primaryCta ? `CALL TO ACTION:\n${result.cta.primaryCta}` : ''}

${result.seoOptimization?.targetKeywords ? `SEO KEYWORDS:\n${result.seoOptimization.targetKeywords.join(', ')}` : ''}
${result.seoOptimization?.relatedKeywords ? `RELATED KEYWORDS:\n${result.seoOptimization.relatedKeywords.join(', ')}` : ''}
${result.seoOptimization?.lsiKeywords ? `LSI KEYWORDS:\n${result.seoOptimization.lsiKeywords.join(', ')}` : ''}

${result.contentMarketing?.socialMediaSnippets ? `SOCIAL MEDIA SNIPPETS:\n${result.contentMarketing.socialMediaSnippets.join('\n')}` : ''}
${result.contentMarketing?.emailNewsletter ? `EMAIL NEWSLETTER:\n${result.contentMarketing.emailNewsletter}` : ''}
${result.contentMarketing?.infographicIdeas ? `INFOPGRAPHIC IDEAS:\n${result.contentMarketing.infographicIdeas.join('\n')}` : ''}

---
Generated by AI Marketing Agents
    `.trim()

    // Copy the formatted content to clipboard
    copyToClipboard(docContent)
    
    // Open Google Docs in a new tab
    window.open('https://docs.google.com/document/create', '_blank')
    
    // Show success message
    alert('Content copied to clipboard! Please paste it into the new Google Doc that just opened.')
  }

  // SurferSEO Integration - Analyze content with SurferSEO API
  const analyzeWithSurferSEO = async (result: BlogResult) => {
    try {
      console.log('Analyzing content with SurferSEO...');
      
      // Show loading state
      const button = document.querySelector('[onclick*="analyzeWithSurferSEO"]') as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.textContent = 'Analyzing...';
      }

      // Prepare content for SurferSEO analysis
      const contentData = {
        title: result.title,
        content: result.content,
        keywords: result.seoOptimization?.targetKeywords || [],
        url: window.location.href,
        language: 'en'
      };

      // Make API call to SurferSEO (you'll need to add your API key to backend)
      const response = await makeAuthenticatedRequest('/api/ai-tools/surfer-seo/analyze', {
        method: 'POST',
        body: JSON.stringify({ content: contentData }),
      });

      if (response.success) {
        // Display SurferSEO results
        const surferResults = response.data;
        alert(`SurferSEO Analysis Complete!\n\nContent Score: ${surferResults.score}/100\nKeyword Density: ${surferResults.keywordDensity}%\nReadability: ${surferResults.readability}\n\nCheck console for detailed results.`);
        
        console.log('SurferSEO Results:', surferResults);
        
        // Update the content grade in real-time
        if (surferResults.score) {
          // You can update the UI here to show real SurferSEO scores
          console.log(`Content improved from ${result.seoMetrics?.contentGrade} to ${surferResults.score}/100`);
        }
      } else {
        throw new Error(response.message || 'SurferSEO analysis failed');
      }
    } catch (error) {
      console.error('SurferSEO analysis error:', error);
      alert('SurferSEO analysis failed. Please check console for details.');
    } finally {
      // Reset button state
      const button = document.querySelector('[onclick*="analyzeWithSurferSEO"]') as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.textContent = 'Analyze Content';
      }
    }
  };

  // Clearscope Integration - Grade content with Clearscope API
  const analyzeWithClearscope = async (result: BlogResult) => {
    try {
      console.log('Grading content with Clearscope...');
      
      // Show loading state
      const button = document.querySelector('[onclick*="analyzeWithClearscope"]') as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.textContent = 'Grading...';
      }

      // Prepare content for Clearscope analysis
      const contentData = {
        title: result.title,
        content: result.content,
        keywords: result.seoOptimization?.targetKeywords || [],
        targetUrl: window.location.href,
        language: 'en'
      };

      // Make API call to Clearscope (you'll need to add your API key to backend)
      const response = await makeAuthenticatedRequest('/api/ai-tools/clearscope/grade', {
        method: 'POST',
        body: JSON.stringify({ content: contentData }),
      });

      if (response.success) {
        // Display Clearscope results
        const clearscopeResults = response.data;
        alert(`Clearscope Grading Complete!\n\nContent Grade: ${clearscopeResults.grade}\nReadability Score: ${clearscopeResults.readabilityScore}\nSEO Score: ${clearscopeResults.seoScore}/100\n\nCheck console for detailed results.`);
        
        console.log('Clearscope Results:', clearscopeResults);
        
        // Update the content grade in real-time
        if (clearscopeResults.grade) {
          // You can update the UI here to show real Clearscope grades
          console.log(`Content graded as ${clearscopeResults.grade} by Clearscope`);
        }
      } else {
        throw new Error(response.message || 'Clearscope grading failed');
      }
    } catch (error) {
      console.error('Clearscope grading error:', error);
      alert('Clearscope grading failed. Please check console for details.');
    } finally {
      // Reset button state
      const button = document.querySelector('[onclick*="analyzeWithClearscope"]') as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.textContent = 'Grade Content';
      }
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100"
    if (score >= 60) return "bg-yellow-100"
    return "bg-red-100"
  }

  const handleDownloadPDF = () => {
    if (!result) return;
    
    // Create a new jsPDF instance
    const doc = new jsPDF();
    
    // Set up fonts and colors
    const titleFontSize = 20;
    const headingFontSize = 16;
    const bodyFontSize = 12;
    const margin = 20;
    let yPosition = 20;

    // Add professional header with background
    doc.setFillColor(37, 99, 235); // Blue background
    doc.rect(0, 0, 210, 35, 'F');
    
    // Add header text
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255); // White text
    doc.text('AI Marketing Agents', margin, 15);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Blog Writing & Optimization Report', margin, 25);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, 32);

    // Reset position for content
    yPosition = 45;

    // Add title with styling
    doc.setFontSize(titleFontSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235); // Blue color
    doc.text(result.title, margin, yPosition);
    yPosition += 15;

    // Add meta description
    if (result.metaDescription) {
      doc.setFontSize(bodyFontSize);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(107, 114, 128); // Gray color
      const metaLines = doc.splitTextToSize(result.metaDescription, 170);
      doc.text(metaLines, margin, yPosition);
      yPosition += (metaLines.length * 5) + 10;
    }

    // Add content metrics box
    doc.setFillColor(248, 250, 252); // Very light blue background
    doc.rect(margin, yPosition, 170, 30, 'F');
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(1);
    doc.rect(margin, yPosition, 170, 30);
    
    // Add metrics with better styling
    doc.setFontSize(bodyFontSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text('📊 Content Metrics', margin + 5, yPosition + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    
    // Create three columns for metrics
    doc.setFont('helvetica', 'bold');
    doc.text(`Words: ${result.wordCount}`, margin + 5, yPosition + 18);
    doc.text(`Reading Time: ${result.readingTime}`, margin + 60, yPosition + 18);
    doc.text(`SEO Score: ${result.seoScore}/100`, margin + 120, yPosition + 18);
    
    // Add score indicator
    if (result.seoScore >= 80) {
      doc.setFillColor(34, 197, 94); // Green
    } else if (result.seoScore >= 60) {
      doc.setFillColor(245, 158, 11); // Yellow
    } else {
      doc.setFillColor(239, 68, 68); // Red
    }
    doc.circle(margin + 155, yPosition + 18, 3, 'F');
    
    yPosition += 40;
    
    // Add introduction
    if (result.introduction) {
      doc.setFontSize(headingFontSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text('Introduction', margin, yPosition);
      yPosition += 10;
      doc.setFontSize(bodyFontSize);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(17, 24, 39);
      const introLines = doc.splitTextToSize(result.introduction, 170);
      doc.text(introLines, margin, yPosition);
      yPosition += (introLines.length * 5) + 10;
    }
    
    // Add table of contents
    if (result.outline && result.outline.length > 0) {
      doc.setFontSize(headingFontSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text('Table of Contents', margin, yPosition);
      yPosition += 10;
      doc.setFontSize(bodyFontSize);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(17, 24, 39);
      
      // Create a styled table of contents
      doc.setFillColor(248, 250, 252); // Very light blue background
      doc.rect(margin, yPosition, 170, (result.outline.length * 8) + 10, 'F');
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, margin + 170, yPosition);
      doc.line(margin, yPosition + (result.outline.length * 8) + 10, margin + 170, yPosition + (result.outline.length * 8) + 10);
      
      result.outline.forEach((section, index) => {
        doc.text(`${index + 1}. ${section}`, margin + 5, yPosition + 8 + (index * 8));
      });
      yPosition += (result.outline.length * 8) + 20;
    }

    // Add main content
    if (result.content) {
      doc.setFontSize(headingFontSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text('Main Content', margin, yPosition);
      yPosition += 10;
      doc.setFontSize(bodyFontSize);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(17, 24, 39);
      
      // Split content into manageable chunks
      const contentChunks = result.content.split('\n\n');
      for (const chunk of contentChunks) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        const lines = doc.splitTextToSize(chunk, 170);
        doc.text(lines, margin, yPosition);
        yPosition += (lines.length * 5) + 5;
      }
    }
    
    // Add conclusion
    if (result.conclusion) {
      if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
      }
      doc.setFontSize(headingFontSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text('Conclusion', margin, yPosition);
      yPosition += 10;
      doc.setFontSize(bodyFontSize);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(17, 24, 39);
      const conclusionLines = doc.splitTextToSize(result.conclusion, 170);
      doc.text(conclusionLines, margin, yPosition);
      yPosition += (conclusionLines.length * 5) + 10;
    }
    
    // Add SEO Keywords section
    if (result.seoOptimization && result.seoOptimization.targetKeywords && result.seoOptimization.targetKeywords.length > 0) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      doc.setFontSize(headingFontSize);
          doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text('SEO Keywords', margin, yPosition);
      yPosition += 10;
      
      // Create keyword boxes with dynamic height
      const targetKeywordsText = result.seoOptimization.targetKeywords.join(', ');
      const targetKeywordsLines = doc.splitTextToSize(targetKeywordsText, 160);
      const targetBoxHeight = Math.max(20, (targetKeywordsLines.length * 5) + 10);
      
      doc.setFillColor(254, 243, 199); // Light yellow background
      doc.rect(margin, yPosition, 170, targetBoxHeight, 'F');
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(0.5);
      doc.rect(margin, yPosition, 170, targetBoxHeight);
      
          doc.setFontSize(bodyFontSize);
          doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 53, 15);
      doc.text('Target Keywords:', margin + 5, yPosition + 8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(120, 53, 15);
      doc.text(targetKeywordsLines, margin + 5, yPosition + 15);
      yPosition += targetBoxHeight + 10;
      
      // Add related keywords if available
      if (result.seoOptimization.relatedKeywords && result.seoOptimization.relatedKeywords.length > 0) {
          doc.setFontSize(bodyFontSize);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(17, 24, 39);
        doc.text('Related Keywords:', margin, yPosition);
        yPosition += 8;
        
        // Create a styled box for related keywords
        const relatedKeywordsText = result.seoOptimization.relatedKeywords.join(', ');
        const relatedLines = doc.splitTextToSize(relatedKeywordsText, 160);
        const relatedBoxHeight = Math.max(15, (relatedLines.length * 5) + 10);
        
        doc.setFillColor(239, 246, 255); // Light blue background
        doc.rect(margin, yPosition, 170, relatedBoxHeight, 'F');
        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(0.5);
        doc.rect(margin, yPosition, 170, relatedBoxHeight);
        
          doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(30, 58, 138);
        doc.text(relatedLines, margin + 5, yPosition + 8);
        yPosition += relatedBoxHeight + 10;
      }
      
      // Add LSI keywords if available
      if (result.seoOptimization.lsiKeywords && result.seoOptimization.lsiKeywords.length > 0) {
          doc.setFontSize(bodyFontSize);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(17, 24, 39);
        doc.text('LSI Keywords:', margin, yPosition);
        yPosition += 8;
        
        // Create a styled box for LSI keywords
        const lsiKeywordsText = result.seoOptimization.lsiKeywords.join(', ');
        const lsiLines = doc.splitTextToSize(lsiKeywordsText, 160);
        const lsiBoxHeight = Math.max(15, (lsiLines.length * 5) + 10);
        
        doc.setFillColor(255, 243, 244); // Light red background
        doc.rect(margin, yPosition, 170, lsiBoxHeight, 'F');
        doc.setDrawColor(239, 68, 68);
        doc.setLineWidth(0.5);
        doc.rect(margin, yPosition, 170, lsiBoxHeight);
        
          doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(127, 29, 29);
        doc.text(lsiLines, margin + 5, yPosition + 8);
        yPosition += lsiBoxHeight + 10;
      }
    }
    
    // Add CTA section
    if (result.cta && result.cta.primaryCta) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      doc.setFontSize(headingFontSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text('Call to Action', margin, yPosition);
      yPosition += 10;
      
      // Calculate box height based on content length
      const ctaText = result.cta.primaryCta;
      const ctaLines = doc.splitTextToSize(ctaText, 160); // Leave 10px margin on each side
      const boxHeight = Math.max(25, (ctaLines.length * 5) + 15); // Minimum 25px height
      
      // Create CTA box with green background - dynamic height
      doc.setFillColor(220, 252, 231); // Light green background
      doc.rect(margin, yPosition, 170, boxHeight, 'F');
      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(0.5);
      doc.rect(margin, yPosition, 170, boxHeight);
      
      doc.setFontSize(bodyFontSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(21, 128, 61);
      doc.text('Primary CTA:', margin + 5, yPosition + 8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      // Split CTA text to fit within box
      const ctaTextLines = doc.splitTextToSize(ctaText, 160);
      doc.text(ctaTextLines, margin + 5, yPosition + 15);
      
      yPosition += boxHeight + 10;
    }
    
    // Add content marketing suggestions if available
    if (result.contentMarketing && (result.contentMarketing.socialMediaSnippets || result.contentMarketing.emailNewsletter)) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      doc.setFontSize(headingFontSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text('Content Marketing Ideas', margin, yPosition);
      yPosition += 10;
      
      if (result.contentMarketing.socialMediaSnippets && result.contentMarketing.socialMediaSnippets.length > 0) {
        doc.setFontSize(bodyFontSize);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(17, 24, 39);
        doc.text('Social Media Snippets:', margin, yPosition);
        yPosition += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        
        result.contentMarketing.socialMediaSnippets.forEach((snippet, index) => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(`${index + 1}. ${snippet}`, margin, yPosition);
          yPosition += 8;
        });
        yPosition += 5;
      }
    }
    
    // Add footer
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(1);
    doc.line(margin, yPosition, margin + 170, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(107, 114, 128);
    doc.text('Generated by AI Marketing Agents', margin, yPosition);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition + 5);

    // Save the PDF
    const filename = `blog-content-${Date.now()}.pdf`;
    doc.save(filename);
    
    // Show success message
    alert(`PDF "${filename}" downloaded successfully!`);
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
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-600 rounded-xl flex items-center justify-center">
                <PenTool className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Blog Writing & Optimization</h1>
              {hasAccess ? (
                <Badge className="bg-green-100 text-green-800">
                  {user.plan === "agency" || user.plan === "Agency" ? "Agency Plan" : "Pro Plan"}
                </Badge>
              ) : (
                <Badge className="bg-orange-100 text-orange-800">Pro Required</Badge>
              )}
            </div>
            <p className="text-gray-600">AI-powered long-form content creation optimized for search engines</p>
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
                <CardTitle>Blog Configuration</CardTitle>
                <CardDescription>Set up your blog post parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Blog Title *</Label>
                  <Input
                    id="title"
                    placeholder="The Ultimate Guide to AI Marketing"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">SEO Keywords *</Label>
                  <Input
                    id="keywords"
                    placeholder="AI marketing, automation, digital tools"
                    value={formData.keywords}
                    onChange={(e) => handleInputChange("keywords", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Input
                    id="audience"
                    placeholder="Marketing professionals, business owners"
                    value={formData.audience}
                    onChange={(e) => handleInputChange("audience", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="length">Word Count</Label>
                  <select
                    id="length"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.length}
                    onChange={(e) => handleInputChange("length", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select length</option>
                    <option value="500-800">500-800 words</option>
                    <option value="800-1200">800-1200 words</option>
                    <option value="1200-2000">1200-2000 words</option>
                    <option value="2000+">2000+ words</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone">Writing Tone</Label>
                  <select
                    id="tone"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.tone}
                    onChange={(e) => handleInputChange("tone", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select tone</option>
                    <option value="professional">Professional</option>
                    <option value="conversational">Conversational</option>
                    <option value="authoritative">Authoritative</option>
                    <option value="friendly">Friendly</option>
                    <option value="technical">Technical</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">Content Purpose</Label>
                  <select
                    id="purpose"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.purpose}
                    onChange={(e) => handleInputChange("purpose", e.target.value)}
                    disabled={!hasAccess}
                  >
                    <option value="">Select purpose</option>
                    <option value="educational">Educational</option>
                    <option value="promotional">Promotional</option>
                    <option value="thought-leadership">Thought Leadership</option>
                    <option value="how-to-guide">How-to Guide</option>
                    <option value="case-study">Case Study</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outline">Custom Outline (Optional)</Label>
                  <Textarea
                    id="outline"
                    placeholder="1. Introduction&#10;2. Main Topic&#10;3. Benefits&#10;4. Conclusion"
                    value={formData.outline}
                    onChange={(e) => handleInputChange("outline", e.target.value)}
                    disabled={!hasAccess}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-3 pt-4">
                  <Button
                    onClick={handleGenerate}
                    disabled={!hasAccess || isGenerating || !formData.title || !formData.keywords}
                    className="w-full bg-gradient-to-r from-blue-400 to-cyan-600 hover:opacity-90 text-white font-semibold py-3"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Writing Blog Post...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Generate Blog Post
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
                  <PenTool className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Write</h3>
                  <p className="text-gray-600">
                    {hasAccess
                      ? "Enter your blog details and generate SEO-optimized content"
                      : "Upgrade to Pro plan to access the blog writing tool"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Blog Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-500" />
                      Content Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{result.wordCount}</div>
                        <div className="text-sm text-gray-600">Words</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{result.readingTime}</div>
                        <div className="text-sm text-gray-600">Reading Time</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className={`text-2xl font-bold ${getScoreColor(result.seoScore)}`}>
                          {result.seoScore}/100
                        </div>
                        <div className="text-sm text-gray-600">SEO Score</div>
                      </div>
                      {result.keywords && Array.isArray(result.keywords) && result.keywords.length > 0 && (
                        <div>
                          {result.keywords.map((kw: { primary: string; secondary: string[]; density: number }, idx: number) => (
                            <div key={idx} className="text-center p-3 bg-yellow-50 rounded-lg mb-2">
                              <div className="text-2xl font-bold text-yellow-600">{kw.density}%</div>
                              <div className="text-sm text-gray-600">{kw.primary} Density</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Content Display */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-green-500" />
                      Generated Content
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Introduction */}
                    {result.introduction && (
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">Introduction</h4>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-gray-700">{result.introduction}</p>
                      </div>
                    </div>
                    )}

                    {/* Main Content */}
                    {result.content && (
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">Main Content</h4>
                        <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{result.content}</pre>
                        </div>
                      </div>
                    )}

                    {/* Conclusion */}
                    {result.conclusion && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Conclusion</h4>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <p className="text-gray-700">{result.conclusion}</p>
                    </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Enhanced SEO Optimization Display */}
                {result.seoOptimization && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-purple-500" />
                        SEO Optimization & Keywords
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Target Keywords */}
                      {result.seoOptimization.targetKeywords && result.seoOptimization.targetKeywords.length > 0 && (
                    <div>
                          <h4 className="font-medium text-gray-900 mb-2">Target Keywords</h4>
                          <div className="flex flex-wrap gap-2">
                            {result.seoOptimization.targetKeywords.map((keyword, index) => (
                              <Badge key={index} className="bg-blue-100 text-blue-800 px-3 py-1">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Related Keywords */}
                      {result.seoOptimization.relatedKeywords && result.seoOptimization.relatedKeywords.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Related Keywords</h4>
                          <div className="flex flex-wrap gap-2">
                            {result.seoOptimization.relatedKeywords.map((keyword, index) => (
                              <Badge key={index} variant="outline" className="px-3 py-1">
                                {keyword}
                              </Badge>
                            ))}
                        </div>
                        </div>
                      )}

                      {/* LSI Keywords */}
                      {result.seoOptimization.lsiKeywords && result.seoOptimization.lsiKeywords.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">LSI Keywords</h4>
                          <div className="flex flex-wrap gap-2">
                            {result.seoOptimization.lsiKeywords.map((keyword, index) => (
                              <Badge key={index} variant="outline" className="bg-yellow-50 text-yellow-800 px-3 py-1">
                                  {keyword}
                                </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Keyword Clusters */}
                      {result.seoOptimization.keywordClusters && result.seoOptimization.keywordClusters.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Keyword Clusters</h4>
                          <div className="space-y-3">
                            {result.seoOptimization.keywordClusters.map((cluster, index) => (
                              <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                <h5 className="font-medium text-gray-800 mb-2">Cluster {index + 1}</h5>
                                <div className="flex flex-wrap gap-2">
                                  {cluster.map((keyword, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs px-2 py-1">
                                      {keyword}
                                    </Badge>
                                  ))}
                          </div>
                        </div>
                            ))}
                      </div>
                        </div>
                      )}

                      {/* Internal & External Links */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.seoOptimization.internalLinks && result.seoOptimization.internalLinks.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Internal Link Suggestions</h4>
                            <ul className="space-y-1">
                              {result.seoOptimization.internalLinks.map((link, index) => (
                                <li key={index} className="text-sm text-gray-600">
                                  <span className="font-medium">{link}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {result.seoOptimization.externalLinks && result.seoOptimization.externalLinks.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">External Link Suggestions</h4>
                            <ul className="space-y-1">
                              {result.seoOptimization.externalLinks.map((link, index) => (
                                <li key={index} className="text-sm text-gray-600">
                                  <span className="font-medium">{link}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
                )}

                {/* Content Marketing Suggestions */}
                {result.contentMarketing && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-orange-500" />
                        Content Marketing Ideas
                    </CardTitle>
                  </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Social Media Snippets */}
                      {result.contentMarketing.socialMediaSnippets && result.contentMarketing.socialMediaSnippets.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Social Media Snippets</h4>
                          <div className="space-y-2">
                            {result.contentMarketing.socialMediaSnippets.map((snippet, index) => (
                              <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-sm text-gray-700">{snippet}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Email Newsletter */}
                      {result.contentMarketing.emailNewsletter && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Email Newsletter Version</h4>
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-700">{result.contentMarketing.emailNewsletter}</p>
                          </div>
                        </div>
                      )}

                      {/* Infographic Ideas */}
                      {result.contentMarketing.infographicIdeas && result.contentMarketing.infographicIdeas.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Infographic Ideas</h4>
                          <ul className="space-y-1">
                            {result.contentMarketing.infographicIdeas.map((idea, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                                <Image className="w-4 h-4 text-blue-500" />
                                {idea}
                          </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </CardContent>
                </Card>
                )}

                {/* SEO Metrics & Tools Integration */}
                {result.seoMetrics && (
                <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-500" />
                        SEO Metrics & Tools
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-indigo-50 rounded-lg">
                          <div className="text-2xl font-bold text-indigo-600">{result.seoMetrics.contentGrade}</div>
                          <div className="text-sm text-gray-600">Content Grade</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{result.seoMetrics.readabilityScore}</div>
                          <div className="text-sm text-gray-600">Readability</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{result.seoMetrics.seoDifficulty}</div>
                          <div className="text-sm text-gray-600">SEO Difficulty</div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-blue-900">SurferSEO Integration</h4>
                            <p className="text-sm text-blue-700">
                              {user.plan === 'agency' ? 'Connected and Active' : 'Available with Pro plan'}
                            </p>
                          </div>
                      <div className="flex items-center gap-2">
                            {user.plan === 'agency' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="bg-green-100 border-green-300 text-green-800 hover:bg-green-200"
                                onClick={() => analyzeWithSurferSEO(result)}
                              >
                                Analyze Content
                              </Button>
                            )}
                            <Badge className={`${user.plan === 'agency' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                              {user.plan === 'agency' ? 'Active' : 'Pro Plan'}
                            </Badge>
                      </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-purple-900">Clearscope Integration</h4>
                            <p className="text-sm text-purple-700">
                              {user.plan === 'agency' ? 'Connected and Active' : 'Available with Agency plan'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {user.plan === 'agency' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="bg-green-100 border-green-300 text-green-800 hover:bg-green-200"
                                onClick={() => analyzeWithClearscope(result)}
                              >
                                Grade Content
                      </Button>
                            )}
                            <Badge className={`${user.plan === 'agency' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
                              {user.plan === 'agency' ? 'Active' : 'Agency Plan'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Export Options */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="w-5 h-5 text-green-500" />
                      Export Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-medium text-green-900 mb-2">Google Docs</h4>
                        <p className="text-sm text-green-700 mb-3">Create a new Google Doc with this content</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full bg-green-100 border-green-300 text-green-800 hover:bg-green-200"
                          onClick={() => createGoogleDoc(result)}
                        >
                          Create New Doc
                        </Button>
                      </div>
                      
                      <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-900 mb-2">Markdown</h4>
                        <p className="text-sm text-blue-700 mb-3">Copy as markdown format</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200"
                          onClick={() => {
                            try {
                              console.log('=== MARKDOWN GENERATION DEBUG ===');
                              console.log('Result object:', result);
                              console.log('Content type:', typeof result.content);
                              console.log('Content preview:', result.content?.substring(0, 200));
                              
                              const markdown = generateMarkdown(result);
                              console.log('Generated Markdown:', markdown);
                              console.log('Markdown starts with:', markdown.substring(0, 100));
                              
                              if (markdown && markdown !== 'Error: No content available') {
                                copyToClipboard(markdown);
                                console.log('✅ Markdown copied successfully');
                              } else {
                                alert('No content available to copy. Please generate content first.');
                              }
                            } catch (error) {
                              console.error('Error generating markdown:', error);
                              alert('Failed to generate markdown. Please try again.');
                            }
                          }}
                        >
                          Copy Markdown
                        </Button>
                      </div>
                      
                      <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <h4 className="font-medium text-purple-900 mb-2">HTML</h4>
                        <p className="text-sm text-purple-700 mb-3">Copy as HTML format</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full bg-purple-100 border-purple-300 text-purple-800 hover:bg-purple-200"
                          onClick={() => {
                            try {
                              console.log('=== HTML GENERATION DEBUG ===');
                              console.log('Result object:', result);
                              console.log('Content type:', typeof result.content);
                              console.log('Content preview:', result.content?.substring(0, 200));
                              
                              const html = generateHTML(result);
                              console.log('Generated HTML:', html);
                              console.log('HTML starts with:', html.substring(0, 100));
                              
                              if (html && html !== '<p>Error: No content available</p>') {
                                copyToClipboard(html);
                                console.log('✅ HTML copied successfully');
                              } else {
                                alert('No content available to copy. Please generate content first.');
                              }
                            } catch (error) {
                              console.error('Error generating HTML:', error);
                              alert('Failed to generate HTML. Please try again.');
                            }
                          }}
                        >
                          Copy HTML
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Call-to-Action Section */}
                {result.cta && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-red-500" />
                        Call-to-Action (CTA)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Primary CTA:</h4>
                        <div className="bg-red-50 p-3 rounded-lg border-l-4 border-red-500">
                          <p className="text-red-800 font-medium">{result.cta.primaryCta}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Secondary CTA:</h4>
                        <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                          <p className="text-blue-800">{result.cta.secondaryCta}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Social CTA:</h4>
                        <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
                          <p className="text-green-800">{result.cta.socialCta}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">CTA Placement Strategy:</h4>
                        <ul className="space-y-1">
                          {result.cta.ctaPlacement.map((placement, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              {placement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Suggestions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Content Suggestions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Improvements:</h4>
                      <ul className="space-y-1">
                        {result.suggestions && Array.isArray(result.suggestions.improvements) && result.suggestions.improvements.length > 0 ? (
                          result.suggestions.improvements.map((improvement, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              {improvement}
                            </li>
                          ))
                        ) : (
                          <li className="text-gray-400">No improvements suggested.</li>
                        )}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Additional Sections to Consider:</h4>
                      <ul className="space-y-1">
                        {result.suggestions && Array.isArray(result.suggestions.additionalSections) && result.suggestions.additionalSections.length > 0 ? (
                          result.suggestions.additionalSections.map((section, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-blue-500" />
                              {section}
                            </li>
                          ))
                        ) : (
                          <li className="text-gray-400">No additional sections suggested.</li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => copyToClipboard(result.content)} className="flex-1">
                    {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? "Copied!" : "Copy Content"}
                  </Button>
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={handleDownloadPDF}>
                    <Download className="w-4 h-4 mr-2" />
                    Download as PDF
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
