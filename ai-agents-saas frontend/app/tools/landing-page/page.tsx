"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Globe, Zap, Copy, Download, Sparkles, Target, ArrowLeft, FileText, Palette, Code, ExternalLink, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useUserStore } from "@/lib/user-store"
import { makeAuthenticatedRequest } from "@/lib/auth-utils"

interface LandingPageContent {
  headline: {
    main: string
    subheadline: string
    tagline: string
  }
  heroSection: {
    valueProposition: string
    primaryCTA: string
    secondaryCTA: string
    heroImage: string
  }
  features: Array<{
    title: string
    description: string
    icon: string
  }>
  benefits: Array<{
    benefit: string
    explanation: string
  }>
  testimonials: Array<{
    quote: string
    author: string
    title: string
    avatar: string
  }>
  cta: {
    primary: string
    secondary: string
    urgency: string
    guarantee: string
  }
  formCopy: {
    title: string
    description: string
    fields: string[]
    submitButton: string
    privacyNote: string
  }
  faqs: Array<{
    question: string
    answer: string
  }>
  socialProof: {
    stats: Array<{
      number: string
      label: string
    }>
    logos: string[]
    certifications: string[]
  }
  designLayout: {
    template: string
    colorScheme: string
    typography: string
    mobileOptimization: string
  }
  seoElements: {
    pageTitle: string
    metaDescription: string
    h1Tags: string[]
    keywords: string[]
  }
}

export default function LandingPageBuilderPage() {
  const { user } = useUserStore()
  const [isGenerating, setIsGenerating] = useState(false)
  const [content, setContent] = useState<LandingPageContent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    offerDetails: "",
    targetAudience: "",
    painPoints: "",
    benefits: "",
    url: "", // Add URL field for landing page analysis
  })

  const hasAccess = user.plan !== "Free Trial"

  const generateLandingPage = async () => {
    if (!hasAccess) {
      alert("Please upgrade to Pro or Agency plan to use this tool.")
      return
    }

    if (!formData.offerDetails || !formData.targetAudience) {
      alert("Please fill in at least the Offer Details and Target Audience fields.")
      return
    }

    setIsGenerating(true)
    setContent(null)
    setError(null)

    try {
      const inputData = {
        offerDetails: formData.offerDetails,
        targetAudience: formData.targetAudience,
        painPoints: formData.painPoints || 'Common challenges',
        benefits: formData.benefits || 'Key advantages',
        url: formData.url || 'example.com' // Include URL field
      }

      console.log('🚀 Generating landing page content with input:', inputData);
      
      const data = await makeAuthenticatedRequest('/api/ai-tools/landing-page/generate', {
        method: 'POST',
        body: JSON.stringify({ 
          input: inputData,
          timestamp: Date.now()
        })
      })
      
      console.log('✅ Landing page content generated:', data);
      
      if (data.error) {
        throw new Error(data.error)
      }

      setContent(data.output);

    } catch (error: unknown) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to generate landing page content: ${errorMessage}`);
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${type} copied to clipboard!`);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert(`${type} copied to clipboard!`);
    }
  }

  const generateHTML = () => {
    if (!content) return '';
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.seoElements.pageTitle}</title>
    <meta name="description" content="${content.seoElements.metaDescription}">
    <meta name="keywords" content="${content.seoElements.keywords.join(', ')}">
    <style>
        body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 80px 20px; text-align: center; }
        .hero h1 { font-size: 3rem; margin-bottom: 20px; }
        .hero p { font-size: 1.2rem; margin-bottom: 30px; }
        .cta-button { background: #ff6b6b; color: white; padding: 15px 30px; border: none; border-radius: 5px; font-size: 1.1rem; cursor: pointer; margin: 10px; transition: all 0.3s ease; }
        .cta-button:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .features { padding: 60px 20px; background: #f8f9fa; }
        .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
        .feature-card { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .testimonials { padding: 60px 20px; background: white; }
        .testimonial-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 30px; }
        .testimonial-card { background: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 4px solid #667eea; }
        .faq { padding: 60px 20px; background: #f8f9fa; }
        .faq-item { background: white; margin-bottom: 20px; padding: 20px; border-radius: 5px; }
        .faq-question { font-weight: bold; color: #333; margin-bottom: 10px; }
        .form-section { padding: 60px 20px; background: white; text-align: center; }
        .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }
        .form-input { padding: 15px; border: 1px solid #ddd; border-radius: 5px; font-size: 1rem; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 40px 0; }
        .stat-item { text-align: center; }
        .stat-number { font-size: 2.5rem; font-weight: bold; color: #667eeb; }
        .stat-label { color: #666; margin-top: 10px; }
    </style>
    
    <script>
        function handlePrimaryCTA() {
            // Scroll to the form section
            const formSection = document.querySelector('.form-section');
            if (formSection) {
                formSection.scrollIntoView({ behavior: 'smooth' });
            } else {
                // If form section doesn't exist, show an alert
                alert('Thank you for your interest! Please contact us to get started.');
            }
        }
        
        function handleSecondaryCTA() {
            // Scroll to the features section
            const featuresSection = document.querySelector('.features');
            if (featuresSection) {
                featuresSection.scrollIntoView({ behavior: 'smooth' });
            } else {
                // If features section doesn't exist, show an alert
                alert('Learn more about our amazing features and benefits!');
            }
        }
        
        // Add smooth scrolling for all internal links
        document.addEventListener('DOMContentLoaded', function() {
            // Add click handlers for any other interactive elements
            const formSubmit = document.querySelector('form');
            if (formSubmit) {
                formSubmit.addEventListener('submit', function(e) {
                    e.preventDefault();
                    alert('Thank you for your submission! We will contact you soon.');
                });
            }
        });
    </script>
</head>
<body>
    <div class="hero">
        <div class="container">
            <h1>${content.headline.main}</h1>
            <p>${content.headline.subheadline}</p>
            <button class="cta-button" onclick="handlePrimaryCTA()">${content.heroSection.primaryCTA}</button>
            <button class="cta-button" style="background: transparent; border: 2px solid white;" onclick="handleSecondaryCTA()">${content.heroSection.secondaryCTA}</button>
        </div>
    </div>

    <div class="features">
        <div class="container">
            <h2 style="text-align: center; margin-bottom: 40px;">Key Features</h2>
            <div class="feature-grid">
                ${content.features.map(feature => `
                <div class="feature-card">
                    <h3 style="font-size: 1.5rem; margin-bottom: 15px;">${feature.icon} ${feature.title}</h3>
                    <p>${feature.description}</p>
                </div>
                `).join('')}
            </div>
        </div>
    </div>

    <div class="testimonials">
        <div class="container">
            <h2 style="text-align: center; margin-bottom: 40px;">What Our Customers Say</h2>
            <div class="testimonial-grid">
                ${content.testimonials.map(testimonial => `
                <div class="testimonial-card">
                    <p style="font-style: italic; margin-bottom: 20px;">${testimonial.quote}</p>
                    <div>
                        <strong>${testimonial.author}</strong><br>
                        <span style="color: #666;">${testimonial.title}</span>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
    </div>

    <div class="faq">
        <div class="container">
            <h2 style="text-align: center; margin-bottom: 40px;">Frequently Asked Questions</h2>
            ${content.faqs.map(faq => `
            <div class="faq-item">
                <div class="faq-question">${faq.question}</div>
                <div>${faq.answer}</div>
            </div>
            `).join('')}
        </div>
    </div>

    <div class="form-section">
        <div class="container">
            <h2>${content.formCopy.title}</h2>
            <p>${content.formCopy.description}</p>
            <form style="max-width: 600px; margin: 0 auto;">
                <div class="form-grid">
                    ${content.formCopy.fields.map(field => `
                    <input type="text" class="form-input" placeholder="${field}" required>
                    `).join('')}
                </div>
                <button type="submit" class="cta-button">${content.formCopy.submitButton}</button>
                <p style="font-size: 0.9rem; color: #666; margin-top: 20px;">${content.formCopy.privacyNote}</p>
            </form>
        </div>
    </div>

    <div style="padding: 40px 20px; background: #f8f9fa; text-align: center;">
        <div class="container">
            <div class="stats">
                ${content.socialProof.stats.map(stat => `
                <div class="stat-item">
                    <div class="stat-number">${stat.number}</div>
                    <div class="stat-label">${stat.label}</div>
                </div>
                `).join('')}
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  const downloadHTML = () => {
    const htmlContent = generateHTML();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'landing-page.html';
    a.click();
    URL.revokeObjectURL(url);
  }

  const generateNotion = () => {
    if (!content) return '';
    
    return `# Landing Page Content for ${formData.offerDetails}

## Headlines
**Main Headline:** ${content.headline.main}
**Subheadline:** ${content.headline.subheadline}
**Tagline:** ${content.headline.tagline}

## Hero Section
**Value Proposition:** ${content.heroSection.valueProposition}
**Primary CTA:** ${content.heroSection.primaryCTA}
**Secondary CTA:** ${content.heroSection.secondaryCTA}
**Hero Image:** ${content.heroSection.heroImage}

## Features
${content.features.map((feature, index) => `${index + 1}. **${feature.title}** - ${feature.description}`).join('\n')}

## Benefits
${content.benefits.map((benefit, index) => `${index + 1}. **${benefit.benefit}** - ${benefit.explanation}`).join('\n')}

## Testimonials
${content.testimonials.map((testimonial, index) => `${index + 1}. "${testimonial.quote}" - ${testimonial.author}, ${testimonial.title}`).join('\n')}

## Call-to-Actions
**Primary CTA:** ${content.cta.primary}
**Secondary CTA:** ${content.cta.secondary}
**Urgency Message:** ${content.cta.urgency}
**Guarantee:** ${content.cta.guarantee}

## Form Copy
**Title:** ${content.formCopy.title}
**Description:** ${content.formCopy.description}
**Fields:** ${content.formCopy.fields.join(', ')}
**Submit Button:** ${content.formCopy.submitButton}
**Privacy Note:** ${content.formCopy.privacyNote}

## FAQs
${content.faqs.map((faq, index) => `**Q${index + 1}: ${faq.question}**
A: ${faq.answer}`).join('\n\n')}

## Social Proof
**Statistics:**
${content.socialProof.stats.map(stat => `- ${stat.number} ${stat.label}`).join('\n')}

**Company Logos:** ${content.socialProof.logos.join(', ')}
**Certifications:** ${content.socialProof.certifications.join(', ')}

## Design Layout
**Template:** ${content.designLayout.template}
**Color Scheme:** ${content.designLayout.colorScheme}
**Typography:** ${content.designLayout.typography}
**Mobile Optimization:** ${content.designLayout.mobileOptimization}

## SEO Elements
**Page Title:** ${content.seoElements.pageTitle}
**Meta Description:** ${content.seoElements.metaDescription}
**H1 Tags:** ${content.seoElements.h1Tags.join(', ')}
**Keywords:** ${content.seoElements.keywords.join(', ')}`;
  }

  const downloadNotion = () => {
    const notionContent = generateNotion();
    const blob = new Blob([notionContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'landing-page-notion.md';
    a.click();
    URL.revokeObjectURL(url);
  }

  const generateJSON = () => {
    if (!content) return '';
    return JSON.stringify(content, null, 2);
  }

  const downloadJSON = () => {
    const jsonContent = generateJSON();
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'landing-page-content.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/tools" className="inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tools
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-teal-400 to-green-600 flex items-center justify-center">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Landing Page Builder Assistant</h1>
            <p className="text-gray-600">Auto-generate compelling landing page content that converts</p>
          </div>
        </div>
      </div>
      
      <Alert className="mb-8">
        <Zap className="h-4 w-4" />
        <AlertDescription>
          <strong>Pro Feature:</strong> This tool requires a Pro or Agency plan for full access.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Content Generation Setup
              </CardTitle>
              <CardDescription>Enter your offer details to generate landing page content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="offerDetails">Offer Details *</Label>
                <Input
                  id="offerDetails"
                  placeholder="e.g., AI Marketing Course, SaaS Tool, Consulting Service"
                  value={formData.offerDetails}
                  onChange={(e) => setFormData((prev) => ({ ...prev, offerDetails: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="targetAudience">Target Audience *</Label>
                <Input
                  id="targetAudience"
                  placeholder="e.g., Small business owners, Marketing professionals"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData((prev) => ({ ...prev, targetAudience: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="painPoints">Pain Points</Label>
                <Textarea
                  id="painPoints"
                  placeholder="What problems does your offer solve?"
                  value={formData.painPoints}
                  onChange={(e) => setFormData((prev) => ({ ...prev, painPoints: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="benefits">Key Benefits</Label>
                <Textarea
                  id="benefits"
                  placeholder="What advantages does your offer provide?"
                  value={formData.benefits}
                  onChange={(e) => setFormData((prev) => ({ ...prev, benefits: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="url">Website URL (Optional)</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com (for existing landing page analysis)"
                  value={formData.url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Leave empty if creating a new landing page from scratch
                </p>
              </div>

              <Button onClick={generateLandingPage} disabled={isGenerating || !formData.offerDetails || !formData.targetAudience} className="w-full">
                {isGenerating ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                    Generating Content...
                  </>
                ) : (
                  <>
                    <Globe className="mr-2 h-4 w-4" />
                    Generate Landing Page Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {isGenerating && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 animate-spin" />
                    <span>Generating your landing page content...</span>
                  </div>
                  <Progress value={80} />
                  <p className="text-sm text-muted-foreground">
                    Creating headlines, features, testimonials, CTAs, and more...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {content && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Generated Landing Page Content
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(generateHTML(), 'HTML')}>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy HTML
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="headlines" className="w-full">
                    <TabsList className="grid w-full grid-cols-6">
                      <TabsTrigger value="headlines">Headlines</TabsTrigger>
                      <TabsTrigger value="content">Content</TabsTrigger>
                      <TabsTrigger value="cta">CTAs</TabsTrigger>
                      <TabsTrigger value="social">Social Proof</TabsTrigger>
                      <TabsTrigger value="design">Design</TabsTrigger>
                      <TabsTrigger value="export">Export</TabsTrigger>
                    </TabsList>

                    <TabsContent value="headlines" className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">Main Headline</h4>
                          <p className="text-lg font-semibold text-blue-600">{content.headline.main}</p>
                        </div>
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">Subheadline</h4>
                          <p className="text-gray-700">{content.headline.subheadline}</p>
                        </div>
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">Tagline</h4>
                          <p className="text-gray-600">{content.headline.tagline}</p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="content" className="space-y-4">
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-medium mb-3">Hero Section</h4>
                          <div className="border rounded-lg p-4">
                            <p className="text-gray-700 mb-3">{content.heroSection.valueProposition}</p>
                            <div className="flex gap-2">
                              <Badge variant="default">{content.heroSection.primaryCTA}</Badge>
                              <Badge variant="secondary">{content.heroSection.secondaryCTA}</Badge>
                            </div>
                            </div>
                          </div>

                        <div>
                          <h4 className="font-medium mb-3">Features</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {content.features.map((feature, index) => (
                              <div key={index} className="border rounded-lg p-4">
                                <h5 className="font-medium mb-2">{feature.icon} {feature.title}</h5>
                                <p className="text-sm text-gray-600">{feature.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-3">Benefits</h4>
                          <div className="space-y-3">
                            {content.benefits.map((benefit, index) => (
                              <div key={index} className="border rounded-lg p-4">
                                <h5 className="font-medium text-green-700 mb-2">{benefit.benefit}</h5>
                                <p className="text-sm text-gray-600">{benefit.explanation}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-3">Testimonials</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {content.testimonials.map((testimonial, index) => (
                              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                                <p className="italic text-gray-700 mb-3">"{testimonial.quote}"</p>
                                <div className="text-sm">
                                  <strong>{testimonial.author}</strong><br />
                                  <span className="text-gray-600">{testimonial.title}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                              </div>

                        <div>
                          <h4 className="font-medium mb-3">FAQs</h4>
                          <div className="space-y-3">
                            {content.faqs.map((faq, index) => (
                              <div key={index} className="border rounded-lg p-4">
                                <h5 className="font-medium text-gray-900 mb-2">{faq.question}</h5>
                                <p className="text-sm text-gray-600">{faq.answer}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="cta" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="border rounded-lg p-4">
                            <h4 className="font-medium mb-2">Primary CTA</h4>
                            <Badge variant="default" className="text-lg px-4 py-2">{content.cta.primary}</Badge>
                            </div>
                          <div className="border rounded-lg p-4">
                            <h4 className="font-medium mb-2">Secondary CTA</h4>
                            <Badge variant="secondary" className="text-lg px-4 py-2">{content.cta.secondary}</Badge>
                          </div>
                        </div>
                        <div className="space-y-4">
                        <div className="border rounded-lg p-4">
                            <h4 className="font-medium mb-2">Urgency Message</h4>
                            <p className="text-red-600 font-medium">{content.cta.urgency}</p>
                            </div>
                          <div className="border rounded-lg p-4">
                            <h4 className="font-medium mb-2">Guarantee</h4>
                            <p className="text-green-600 font-medium">{content.cta.guarantee}</p>
                              </div>
                          </div>
                        </div>

                        <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">Form Copy</h4>
                        <div className="space-y-3">
                              <div>
                            <h5 className="font-medium text-gray-700">{content.formCopy.title}</h5>
                            <p className="text-sm text-gray-600">{content.formCopy.description}</p>
                              </div>
                              <div>
                            <h5 className="font-medium text-gray-700 mb-2">Form Fields:</h5>
                            <div className="flex flex-wrap gap-2">
                              {content.formCopy.fields.map((field, index) => (
                                <Badge key={index} variant="outline">{field}</Badge>
                              ))}
                                </div>
                              </div>
                              <div>
                            <h5 className="font-medium text-gray-700 mb-2">Submit Button:</h5>
                            <Badge variant="default">{content.formCopy.submitButton}</Badge>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="social" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {content.socialProof.stats.map((stat, index) => (
                          <div key={index} className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{stat.number}</div>
                            <div className="text-sm text-blue-600">{stat.label}</div>
                          </div>
                        ))}
                        </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-3">Company Logos</h4>
                          <div className="flex flex-wrap gap-2">
                            {content.socialProof.logos.map((logo, index) => (
                              <Badge key={index} variant="outline">{logo}</Badge>
                            ))}
                          </div>
                        </div>

                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-3">Certifications</h4>
                          <div className="flex flex-wrap gap-2">
                            {content.socialProof.certifications.map((cert, index) => (
                              <Badge key={index} variant="outline">{cert}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="design" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="border rounded-lg p-4">
                            <h4 className="font-medium mb-2">Template</h4>
                            <p className="text-sm text-gray-600">{content.designLayout.template}</p>
                            </div>
                          <div className="border rounded-lg p-4">
                            <h4 className="font-medium mb-2">Color Scheme</h4>
                            <p className="text-sm text-gray-600">{content.designLayout.colorScheme}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                        <div className="border rounded-lg p-4">
                            <h4 className="font-medium mb-2">Typography</h4>
                            <p className="text-sm text-gray-600">{content.designLayout.typography}</p>
                            </div>
                          <div className="border rounded-lg p-4">
                            <h4 className="font-medium mb-2">Mobile Optimization</h4>
                            <p className="text-sm text-gray-600">{content.designLayout.mobileOptimization}</p>
                              </div>
                          </div>
                        </div>

                        <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">SEO Elements</h4>
                        <div className="space-y-3">
                          <div>
                            <h5 className="font-medium text-gray-700 mb-2">Page Title</h5>
                            <p className="text-sm text-gray-600">{content.seoElements.pageTitle}</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-700 mb-2">Meta Description</h5>
                            <p className="text-sm text-gray-600">{content.seoElements.metaDescription}</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-700 mb-2">H1 Tags</h5>
                            <div className="flex flex-wrap gap-2">
                              {content.seoElements.h1Tags.map((tag, index) => (
                                <Badge key={index} variant="outline">{tag}</Badge>
                              ))}
                            </div>
                              </div>
                              <div>
                            <h5 className="font-medium text-gray-700 mb-2">Keywords</h5>
                            <div className="flex flex-wrap gap-2">
                              {content.seoElements.keywords.map((keyword, index) => (
                                <Badge key={index} variant="outline">{keyword}</Badge>
                              ))}
                              </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="export" className="space-y-4">
                      <div className="text-center py-8">
                        <h3 className="text-lg font-semibold mb-4">Export Your Landing Page Content</h3>
                        <p className="text-gray-600 mb-6">Choose your preferred format for easy integration</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Button onClick={downloadHTML} className="w-full">
                            <Code className="mr-2 h-4 w-4" />
                            Download HTML
                          </Button>
                          <Button onClick={downloadNotion} variant="outline" className="w-full">
                            <FileText className="mr-2 h-4 w-4" />
                            Download Notion
                          </Button>
                          <Button onClick={downloadJSON} variant="outline" className="w-full">
                            <Download className="mr-2 h-4 w-4" />
                            Download JSON
                          </Button>
                        </div>

                        <div className="mt-6 text-sm text-gray-500">
                          <p>HTML: Ready-to-use landing page for Elementor/Webflow</p>
                          <p>Notion: Markdown format for easy content management</p>
                          <p>JSON: Structured data for developers and integrations</p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
