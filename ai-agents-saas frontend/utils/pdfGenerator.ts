import jsPDF from 'jspdf';

interface PDFOptions {
  title: string;
  subtitle?: string;
  toolName: string;
  clientName?: string;
  reportPeriod?: string;
  generatedDate?: string;
  content: any;
  formData?: any;
}

export class ProfessionalPDFGenerator {
  private doc: jsPDF;
  private yPosition: number = 20;
  private pageWidth: number = 210;
  private margin: number = 20;
  private contentWidth: number = 170;

  constructor() {
    this.doc = new jsPDF();
  }

  private addHeader(options: PDFOptions) {
    // Pure vibrant purple background - no gradient overlay to ensure purple shows
    this.doc.setFillColor(147, 51, 234); // Vibrant purple base
    this.doc.rect(0, 0, this.pageWidth, 45, 'F');
    
    // Add decorative accent line
    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(0, 42, this.pageWidth, 3, 'F');
    
    // Enhanced logo with better styling
    this.doc.setFillColor(255, 255, 255);
    this.doc.circle(30, 22, 10, 'F');
    this.doc.setFillColor(147, 51, 234);
    this.doc.circle(30, 22, 8, 'F');
    this.doc.setFillColor(255, 255, 255);
    this.doc.setFontSize(14);
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('AI', 25, 26);
    
    // Company name with enhanced typography
    this.doc.setFontSize(18);
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('AI Marketing Agents', 55, 28);
    
    // Tool name with subtitle styling
    this.doc.setFontSize(11);
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(options.toolName, 55, 38);
    
    this.yPosition = 55;
  }

  private addTitle(options: PDFOptions) {
    // Enhanced title with better spacing and typography
    this.doc.setFontSize(26);
    this.doc.setTextColor(51, 51, 51);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(options.title, this.margin, this.yPosition);
    this.yPosition += 20;

    // Subtitle with enhanced styling
    if (options.subtitle) {
      this.doc.setFontSize(15);
      this.doc.setTextColor(102, 102, 102);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(options.subtitle, this.margin, this.yPosition);
      this.yPosition += 12;
    }

    // Enhanced metadata section with better visual separation
    this.doc.setFillColor(248, 250, 252);
    this.doc.roundedRect(this.margin - 5, this.yPosition - 5, this.contentWidth + 10, 25, 3, 3, 'F');
    this.doc.setDrawColor(226, 232, 240);
    this.doc.roundedRect(this.margin - 5, this.yPosition - 5, this.contentWidth + 10, 25, 3, 3, 'S');
    
    this.doc.setFontSize(10);
    this.doc.setTextColor(100, 116, 139);
    this.doc.setFont('helvetica', 'bold');
    
    let metadataY = this.yPosition;
    if (options.clientName) {
      this.doc.text(`Client: ${options.clientName}`, this.margin, metadataY);
      metadataY += 6;
    }
    
    if (options.reportPeriod) {
      this.doc.text(`Report Period: ${options.reportPeriod}`, this.margin, metadataY);
      metadataY += 6;
    }
    
    this.doc.text(`Generated: ${options.generatedDate || new Date().toLocaleDateString()}`, this.margin, metadataY);
    this.yPosition += 35;
  }

  private addSection(title: string, content: any, level: number = 1) {
    if (this.yPosition > 250) {
      this.addPage();
    }

    // Enhanced section title with decorative elements
    this.doc.setFillColor(248, 250, 252);
    this.doc.rect(this.margin - 5, this.yPosition - 3, this.contentWidth + 10, 12, 'F');
    this.doc.setDrawColor(226, 232, 240);
    this.doc.rect(this.margin - 5, this.yPosition - 3, this.contentWidth + 10, 12, 'S');
    
    // Section title with enhanced styling
    this.doc.setFontSize(16 - (level * 2));
    this.doc.setTextColor(51, 51, 51);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.yPosition + 2);
    this.yPosition += 15;

    // Section content with better formatting
    this.doc.setFontSize(10);
    this.doc.setTextColor(68, 68, 68);
    this.doc.setFont('helvetica', 'normal');

    if (typeof content === 'string') {
      const lines = this.doc.splitTextToSize(content, this.contentWidth);
      lines.forEach((line: string) => {
        if (this.yPosition > 250) {
          this.addPage();
        }
        this.doc.text(line, this.margin, this.yPosition);
        this.yPosition += 5;
      });
    } else if (Array.isArray(content)) {
      content.forEach((item: any, index: number) => {
        if (this.yPosition > 250) {
          this.addPage();
        }
        
        if (typeof item === 'string') {
          this.doc.text(`• ${item}`, this.margin, this.yPosition);
          this.yPosition += 5;
        } else if (typeof item === 'object') {
          // Handle object items with better formatting
          Object.entries(item).forEach(([key, value]) => {
            if (this.yPosition > 250) {
              this.addPage();
            }
            this.doc.setFont(undefined, 'bold');
            this.doc.setTextColor(51, 51, 51);
            this.doc.text(`${key}:`, this.margin, this.yPosition);
            this.yPosition += 5;
            this.doc.setFont(undefined, 'normal');
            this.doc.setTextColor(68, 68, 68);
            
            if (typeof value === 'string') {
              const lines = this.doc.splitTextToSize(value, this.contentWidth - 10);
              lines.forEach((line: string) => {
                if (this.yPosition > 250) {
                  this.addPage();
                }
                this.doc.text(line, this.margin + 10, this.yPosition);
                this.yPosition += 5;
              });
            }
          });
        }
      });
    }

    this.yPosition += 10;
  }

  private addMetricsCard(title: string, value: string | number, subtitle?: string) {
    if (this.yPosition > 220) {
      this.addPage();
    }

    // Enhanced card design with gradient and better styling
    this.doc.setFillColor(248, 250, 252);
    this.doc.roundedRect(this.margin, this.yPosition - 5, 85, 30, 5, 5, 'F');
    
    // Card border with gradient effect
    this.doc.setDrawColor(147, 51, 234);
    this.doc.setLineWidth(0.5);
    this.doc.roundedRect(this.margin, this.yPosition - 5, 85, 30, 5, 5, 'S');

    // Title with enhanced styling
    this.doc.setFontSize(9);
    this.doc.setTextColor(100, 116, 139);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin + 5, this.yPosition);

    // Value with larger, bolder styling
    this.doc.setFontSize(18);
    this.doc.setTextColor(147, 51, 234);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(value.toString(), this.margin + 5, this.yPosition + 12);

    // Subtitle if provided
    if (subtitle) {
      this.doc.setFontSize(8);
      this.doc.setTextColor(148, 163, 184);
      this.doc.setFont(undefined, 'normal');
      this.doc.text(subtitle, this.margin + 5, this.yPosition + 22);
    }

    this.yPosition += 35;
  }

  private addTable(headers: string[], data: any[][]) {
    if (this.yPosition > 200) {
      this.addPage();
    }

    const colWidth = this.contentWidth / headers.length;
    const rowHeight = 10;

    // Enhanced table header with gradient background
    this.doc.setFillColor(147, 51, 234);
    this.doc.rect(this.margin, this.yPosition, this.contentWidth, rowHeight, 'F');
    
    this.doc.setFontSize(10);
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont(undefined, 'bold');

    headers.forEach((header, index) => {
      this.doc.text(header, this.margin + (index * colWidth) + 3, this.yPosition + 6);
    });

    this.yPosition += rowHeight;

    // Table data with alternating row colors
    this.doc.setFontSize(9);
    this.doc.setTextColor(68, 68, 68);
    this.doc.setFont(undefined, 'normal');

    data.forEach((row, rowIndex) => {
      if (this.yPosition > 250) {
        this.addPage();
        // Redraw header on new page
        this.doc.setFillColor(147, 51, 234);
        this.doc.rect(this.margin, this.yPosition, this.contentWidth, rowHeight, 'F');
        this.doc.setFontSize(10);
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFont('helvetica', 'bold');
        headers.forEach((header, index) => {
          this.doc.text(header, this.margin + (index * colWidth) + 3, this.yPosition + 6);
        });
        this.yPosition += rowHeight;
      }

      // Alternate row colors for better readability
      if (rowIndex % 2 === 0) {
        this.doc.setFillColor(248, 250, 252);
        this.doc.rect(this.margin, this.yPosition, this.contentWidth, rowHeight, 'F');
      }

      row.forEach((cell, colIndex) => {
        this.doc.text(cell.toString(), this.margin + (colIndex * colWidth) + 3, this.yPosition + 6);
      });
      this.yPosition += rowHeight;
    });

    this.yPosition += 10;
  }

  private addPage() {
    this.doc.addPage();
    this.yPosition = 20;
    
    // Add footer to new page
    this.addFooter();
  }

  private addFooter() {
    const pageCount = this.doc.getNumberOfPages();
    
    // Enhanced footer with gradient background
    this.doc.setFillColor(248, 250, 252);
    this.doc.rect(0, 275, this.pageWidth, 25, 'F');
    
    // Footer line with brand colors
    this.doc.setDrawColor(147, 51, 234);
    this.doc.setLineWidth(1);
    this.doc.line(this.margin, 275, this.pageWidth - this.margin, 275);
    
    // Footer text with enhanced styling
    this.doc.setFontSize(9);
    this.doc.setTextColor(100, 116, 139);
    this.doc.setFont(undefined, 'bold');
    this.doc.text('AI Marketing Agents - Professional AI-Powered Marketing Solutions', this.margin, 285);
    
    this.doc.setFontSize(8);
    this.doc.setTextColor(148, 163, 184);
    this.doc.setFont(undefined, 'normal');
    this.doc.text(`Page ${pageCount}`, this.pageWidth - this.margin - 20, 285);
  }

  public generatePDF(options: PDFOptions): jsPDF {
    // Add header
    this.addHeader(options);
    
    // Add title
    this.addTitle(options);
    
    // Add content based on tool type
    this.addContent(options);
    
    // Add footer to first page
    this.addFooter();
    
    return this.doc;
  }

  private addContent(options: PDFOptions) {
    const { content, toolName } = options;

    switch (toolName.toLowerCase()) {
      case 'seo audit':
        this.addSEOAuditContent(content);
        break;
      case 'client reporting':
        this.addClientReportingContent(content);
        break;
      case 'email marketing':
        this.addEmailMarketingContent(content);
        break;
      case 'competitor analysis':
        this.addCompetitorAnalysisContent(content);
        break;
      case 'local seo':
        this.addLocalSEOContent(content);
        break;
      case 'reels scripts':
        this.addReelsScriptsContent(content);
        break;
      case 'cold outreach':
        this.addColdOutreachContent(content);
        break;
      case 'landing page':
        this.addLandingPageContent(content);
        break;
      default:
        this.addGenericContent(content);
    }
  }

  private addSEOAuditContent(content: any) {
    if (content.overallScore !== undefined) {
      this.addMetricsCard('Overall Score', `${content.overallScore}/100`, 'SEO Performance');
    }

    if (content.summary) {
      // Enhanced Audit Summary with detailed content
      const auditSummaryContent = this.generateAuditSummaryContent(content);
      this.addSection('Audit Summary', auditSummaryContent);
    }

    if (content.recommendations && Array.isArray(content.recommendations)) {
      this.addSection('Key Recommendations', content.recommendations.map((rec: any) => 
        `${rec.title} (${rec.priority} priority): ${rec.description}`
      ));
    }

    if (content.priorityActions && Array.isArray(content.priorityActions)) {
      this.addSection('Priority Actions', content.priorityActions.map((action: any) => 
        `${action.action} - ${action.priority} priority, ${action.effort} effort`
      ));
    }
  }

  private generateAuditSummaryContent(content: any): string {
    const score = content.overallScore || 75;
    const passed = content.summary?.passed || 0;
    const warnings = content.summary?.warnings || 0;
    const failed = content.summary?.failed || 0;
    const totalTests = passed + warnings + failed;

    let summaryText = `This comprehensive SEO audit analyzed ${totalTests} critical factors affecting your website's search engine performance. `;
    
    // Overall performance assessment
    if (score >= 90) {
      summaryText += `Your website demonstrates excellent SEO health with a score of ${score}/100. The site follows most SEO best practices and should perform well in search results. `;
    } else if (score >= 80) {
      summaryText += `Your website shows good SEO fundamentals with a score of ${score}/100. There are some areas for improvement, but overall performance is solid. `;
    } else if (score >= 70) {
      summaryText += `Your website has moderate SEO health with a score of ${score}/100. Several improvements are needed to enhance search visibility and performance. `;
    } else if (score >= 60) {
      summaryText += `Your website requires significant SEO improvements with a score of ${score}/100. Multiple critical issues need immediate attention. `;
    } else {
      summaryText += `Your website has poor SEO health with a score of ${score}/100. Major improvements are required to improve search engine visibility. `;
    }

    // Test results breakdown
    summaryText += `\n\nTest Results Breakdown:\n`;
    summaryText += `• ${passed} tests passed - These elements are properly optimized\n`;
    summaryText += `• ${warnings} warnings - These areas need attention but aren't critical\n`;
    summaryText += `• ${failed} tests failed - These issues should be addressed immediately\n`;

    // Key findings
    summaryText += `\nKey Findings:\n`;
    
    // Technical SEO findings
    if (content.technicalSEO) {
      const techSEO = content.technicalSEO;
      if (techSEO.metaTitle?.status === 'fail') {
        summaryText += `• Meta title optimization needs immediate attention\n`;
      }
      if (techSEO.metaDescription?.status === 'fail') {
        summaryText += `• Meta description requires optimization\n`;
      }
      if (techSEO.headingStructure?.status === 'fail') {
        summaryText += `• Heading structure needs improvement for better content hierarchy\n`;
      }
      if (techSEO.images?.status === 'fail') {
        summaryText += `• Image optimization issues detected (missing alt text, large file sizes)\n`;
      }
    }

    // Performance findings
    if (content.performance?.pageSpeed?.status === 'fail') {
      summaryText += `• Page load speed is below optimal levels and needs optimization\n`;
    }

    // Security findings
    if (content.security?.https?.status === 'fail') {
      summaryText += `• Security configuration requires immediate attention\n`;
    }

    // Mobile usability findings
    if (content.mobileUsability?.mobileFriendliness?.status === 'fail') {
      summaryText += `• Mobile optimization needs improvement for better user experience\n`;
    }

    // Content quality findings
    if (content.contentQuality?.contentAnalysis?.status === 'fail') {
      summaryText += `• Content quality and optimization need enhancement\n`;
    }

    // Accessibility findings
    if (content.accessibility?.accessibilityScore?.status === 'fail') {
      summaryText += `• Accessibility improvements needed for better user experience\n`;
    }

    // URL structure findings
    if (content.urlStructure?.urlOptimization?.status === 'fail') {
      summaryText += `• URL structure optimization required\n`;
    }

    // Site architecture findings
    if (content.siteArchitecture?.siteStructure?.status === 'fail') {
      summaryText += `• Site architecture and navigation need improvement\n`;
    }

    // Cross-page optimization findings
    if (content.crossPageOptimization?.internalLinking?.status === 'fail') {
      summaryText += `• Internal linking strategy needs enhancement\n`;
    }

    // Impact assessment
    summaryText += `\nImpact Assessment:\n`;
    if (score >= 80) {
      summaryText += `With your current SEO score, your website should maintain good search visibility. Implementing the recommended improvements will help you achieve even better rankings and organic traffic growth.`;
    } else if (score >= 70) {
      summaryText += `Your current SEO score indicates moderate search visibility. Addressing the identified issues will significantly improve your search rankings and organic traffic.`;
    } else {
      summaryText += `Your current SEO score suggests limited search visibility. Implementing the critical fixes identified in this audit will be essential for improving your search engine performance and driving organic traffic.`;
    }

    return summaryText;
  }

  private addClientReportingContent(content: any) {
    console.log('📄 PDF Generator - Client Reporting Content:', content);
    console.log('📊 Key Metrics:', content.key_metrics);
    console.log('🎯 Recommendations:', content.recommendations);
    console.log('📈 Campaign Performance:', content.campaign_performance);
    console.log('🎯 Next Month Goals:', content.next_month_goals);
    
    if (content.executive_summary) {
      this.addSection('Executive Summary', content.executive_summary);
    }

    if (content.key_metrics && Array.isArray(content.key_metrics)) {
      // Create a detailed metrics table for better presentation
      const metricsData = content.key_metrics.map((metric: any) => [
        metric.name || 'Unknown Metric',
        `${metric.current}${metric.unit || ''}`,
        `${metric.previous}${metric.unit || ''}`,
        `${metric.change > 0 ? '+' : ''}${metric.change}%`,
        metric.trend || 'stable'
      ]);
      
      this.addTable(
        ['Metric', 'Current', 'Previous', 'Change', 'Trend'],
        metricsData
      );
    }

    if (content.campaign_performance && Array.isArray(content.campaign_performance)) {
      this.addSection('Campaign Performance', 'Detailed performance metrics for all campaigns');
      const campaignData = content.campaign_performance.map((campaign: any) => [
        campaign.name || 'Unknown Campaign',
        campaign.impressions?.toLocaleString() || 'N/A',
        campaign.clicks?.toLocaleString() || 'N/A',
        campaign.conversions?.toLocaleString() || 'N/A',
        `$${campaign.cost?.toLocaleString() || 'N/A'}`,
        `${campaign.roi}x`
      ]);
      
      this.addTable(
        ['Campaign', 'Impressions', 'Clicks', 'Conversions', 'Cost', 'ROI'],
        campaignData
      );
    }

    if (content.recommendations && Array.isArray(content.recommendations)) {
      this.addSection('Strategic Recommendations', 'Priority-based recommendations for improvement');
      content.recommendations.forEach((rec: any, index: number) => {
        if (this.yPosition > 250) {
          this.addPage();
        }
        
        // Priority badge
        const priorityColor = rec.priority === 'high' ? [239, 68, 68] : 
                            rec.priority === 'medium' ? [245, 158, 11] : [34, 197, 94];
        
        this.doc.setFillColor(priorityColor[0], priorityColor[1], priorityColor[2]);
        this.doc.circle(this.margin + 5, this.yPosition + 3, 3, 'F');
        
        this.doc.setFontSize(11);
        this.doc.setTextColor(51, 51, 51);
        this.doc.setFont(undefined, 'bold');
        this.doc.text(`${rec.title || `Recommendation ${index + 1}`}`, this.margin + 15, this.yPosition);
        this.yPosition += 8;
        
        this.doc.setFontSize(9);
        this.doc.setTextColor(68, 68, 68);
        this.doc.setFont(undefined, 'normal');
        
        if (rec.description) {
          this.doc.text(rec.description, this.margin + 15, this.yPosition);
          this.yPosition += 6;
        }
        
        if (rec.expected_impact) {
          this.doc.setFont(undefined, 'bold');
          this.doc.setTextColor(34, 197, 94);
          this.doc.text(`Expected Impact: ${rec.expected_impact}`, this.margin + 15, this.yPosition);
          this.yPosition += 6;
        }
        
        this.yPosition += 8;
      });
    }

    if (content.next_month_goals && Array.isArray(content.next_month_goals)) {
      this.addSection('Next Month Goals', 'Strategic objectives and action plans for the next period');
      content.next_month_goals.forEach((goal: any, index: number) => {
        if (this.yPosition > 250) {
          this.addPage();
        }
        
        this.doc.setFontSize(11);
        this.doc.setTextColor(51, 51, 51);
        this.doc.setFont(undefined, 'bold');
        this.doc.text(`${goal.metric || `Goal ${index + 1}`}: ${goal.target || 'N/A'}`, this.margin, this.yPosition);
        this.yPosition += 6;
        
        this.doc.setFontSize(9);
        this.doc.setTextColor(68, 68, 68);
        this.doc.setFont(undefined, 'normal');
        this.doc.text(goal.strategy || 'Strategy not specified', this.margin + 5, this.yPosition);
        this.yPosition += 8;
      });
    }
  }

  private addEmailMarketingContent(content: any) {
    if (content.analytics) {
      this.addMetricsCard('Expected Open Rate', content.analytics.expectedOpenRate || 'N/A');
      this.addMetricsCard('Expected Click Rate', content.analytics.expectedClickRate || 'N/A');
    }

    if (content.campaigns && Array.isArray(content.campaigns)) {
      this.addSection('Email Campaigns', content.campaigns.map((campaign: any) => 
        `${campaign.type}: ${campaign.subject} - ${campaign.content.substring(0, 100)}...`
      ));
    }

    if (content.sequence && content.sequence.emails) {
      this.addSection('Email Sequence', content.sequence.emails.map((email: any, index: number) => 
        `Day ${email.day}: ${email.subject} - ${email.purpose}`
      ));
    }
  }

  private addCompetitorAnalysisContent(content: any) {
    // Market Analysis Section
    if (content.market_analysis) {
      this.addSection('Market Analysis', {
        'Market Size': content.market_analysis.market_size || 'N/A',
        'Growth Rate': content.market_analysis.growth_rate || 'N/A',
        'Market Leaders': content.market_analysis.market_leaders?.length || 0
      });

      if (content.market_analysis.key_trends && Array.isArray(content.market_analysis.key_trends)) {
        this.addSection('Key Market Trends', content.market_analysis.key_trends);
      }
    }

    // Competitors Section with proper data handling
    if (content.competitors && Array.isArray(content.competitors)) {
      this.addSection('Competitor Analysis', `Analyzed ${content.competitors.length} competitors`);
      
      content.competitors.forEach((competitor: any, index: number) => {
        if (this.yPosition > 250) {
          this.addPage();
        }
        
        this.doc.setFontSize(12);
        this.doc.setTextColor(51, 51, 51);
        this.doc.setFont(undefined, 'bold');
        this.doc.text(`${index + 1}. ${competitor.name || 'Unknown Competitor'}`, this.margin, this.yPosition);
        this.yPosition += 8;
        
        this.doc.setFontSize(10);
        this.doc.setTextColor(68, 68, 68);
        this.doc.setFont(undefined, 'normal');
        
        if (competitor.website) {
          this.doc.text(`Website: ${competitor.website}`, this.margin + 5, this.yPosition);
          this.yPosition += 5;
        }
        
        if (competitor.overview?.description) {
          this.doc.text(`Overview: ${competitor.overview.description}`, this.margin + 5, this.yPosition);
          this.yPosition += 5;
        }
        
        // Strengths
        if (competitor.strengths && Array.isArray(competitor.strengths) && competitor.strengths.length > 0) {
          this.doc.setFont(undefined, 'bold');
          this.doc.setTextColor(34, 197, 94);
          this.doc.text('Strengths:', this.margin + 5, this.yPosition);
          this.yPosition += 5;
          this.doc.setFont(undefined, 'normal');
          this.doc.setTextColor(68, 68, 68);
          competitor.strengths.forEach((strength: string) => {
            this.doc.text(`• ${strength}`, this.margin + 10, this.yPosition);
            this.yPosition += 4;
          });
        }
        
        // Weaknesses
        if (competitor.weaknesses && Array.isArray(competitor.weaknesses) && competitor.weaknesses.length > 0) {
          this.doc.setFont(undefined, 'bold');
          this.doc.setTextColor(239, 68, 68);
          this.doc.text('Weaknesses:', this.margin + 5, this.yPosition);
          this.yPosition += 5;
          this.doc.setFont(undefined, 'normal');
          this.doc.setTextColor(68, 68, 68);
          competitor.weaknesses.forEach((weakness: string) => {
            this.doc.text(`• ${weakness}`, this.margin + 10, this.yPosition);
            this.yPosition += 4;
          });
        }
        
        this.yPosition += 10;
      });
    }

    // Competitive Gaps Section
    if (content.competitive_gaps && Array.isArray(content.competitive_gaps)) {
      this.addSection('Competitive Gaps & Opportunities', content.competitive_gaps.map((gap: any) => 
        `${gap.category}: ${gap.opportunity} (${gap.difficulty} difficulty, ${gap.impact} impact)`
      ));
    }

    // Recommendations Section
    if (content.recommendations && Array.isArray(content.recommendations)) {
      this.addSection('Strategic Recommendations', content.recommendations.map((rec: any) => 
        `${rec.action} (${rec.priority} priority): ${rec.rationale}`
      ));
    }

    // Benchmarking Section
    if (content.benchmarking) {
      // Your Position (without section heading)
      if (content.benchmarking.your_position) {
        this.doc.setFontSize(11);
        this.doc.setTextColor(51, 51, 51);
        this.doc.setFont(undefined, 'bold');
        this.doc.text('Your Position:', this.margin, this.yPosition);
        this.yPosition += 6;
        
        this.doc.setFontSize(9);
        this.doc.setTextColor(68, 68, 68);
        this.doc.setFont(undefined, 'normal');
        this.doc.text(content.benchmarking.your_position, this.margin + 5, this.yPosition);
        this.yPosition += 8;
      }
      
      if (content.benchmarking.key_metrics_comparison && Array.isArray(content.benchmarking.key_metrics_comparison)) {
        this.addSection('Key Metrics Comparison', content.benchmarking.key_metrics_comparison.map((metric: any) => 
          `${metric.metric}: Your Score ${metric.your_score} vs Competitor Avg ${metric.competitor_avg} vs Industry Avg ${metric.industry_avg}`
        ));
      }
    }
  }

  private addLocalSEOContent(content: any) {
    if (content.businessProfile && content.businessProfile.optimizationScore) {
      this.addMetricsCard('Optimization Score', `${content.businessProfile.optimizationScore}/100`);
    }

    if (content.keywordStrategy && content.keywordStrategy.primaryKeywords) {
      this.addSection('Primary Keywords', content.keywordStrategy.primaryKeywords);
    }

    if (content.citationAudit && content.citationAudit.currentCitations) {
      this.addSection('Citation Audit', {
        'Current Citations': content.citationAudit.currentCitations,
        'Missing Citations': content.citationAudit.missingCitations || 0
      });
    }
  }

  private addReelsScriptsContent(content: any) {
    if (content.scripts && Array.isArray(content.scripts)) {
      this.addSection('Video Scripts', content.scripts.map((script: any) => 
        `${script.platform}: ${script.content.substring(0, 100)}...`
      ));
    }

    if (content.hooks && Array.isArray(content.hooks)) {
      this.addSection('Engaging Hooks', content.hooks.map((hook: any) => hook.content));
    }

    if (content.trends && content.trends.trending) {
      this.addSection('Trending Topics', content.trends.trending);
    }
  }

  private addColdOutreachContent(content: any) {
    if (content.campaigns && Array.isArray(content.campaigns)) {
      this.addSection('Outreach Campaigns', content.campaigns.map((campaign: any) => 
        `${campaign.type}: ${campaign.subject} - ${campaign.content.substring(0, 100)}...`
      ));
    }

    if (content.sequence && content.sequence.emails) {
      this.addSection('Follow-up Sequence', content.sequence.emails.map((email: any, index: number) => 
        `Day ${email.day}: ${email.subject} - ${email.purpose}`
      ));
    }
  }

  private addLandingPageContent(content: any) {
    if (content.overview && content.overview.overallScore) {
      this.addMetricsCard('Overall Score', `${content.overview.overallScore}/100`);
    }

    if (content.seoAnalysis) {
      this.addSection('SEO Analysis', {
        'Title Tag Score': `${content.seoAnalysis.titleTag?.score || 0}/100`,
        'Meta Description Score': `${content.seoAnalysis.metaDescription?.score || 0}/100`
      });
    }

    if (content.recommendations && Array.isArray(content.recommendations)) {
      this.addSection('Optimization Recommendations', content.recommendations.map((rec: any) => 
        `${rec.category}: ${rec.action} - ${rec.priority} priority`
      ));
    }
  }

  private addGenericContent(content: any) {
    if (typeof content === 'object') {
      Object.entries(content).forEach(([key, value]) => {
        if (typeof value === 'string') {
          this.addSection(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), value);
        } else if (Array.isArray(value)) {
          this.addSection(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), value);
        } else if (typeof value === 'object') {
          this.addSection(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), value);
        }
      });
    } else {
      this.addSection('Content', content);
    }
  }
}

export const generateProfessionalPDF = (options: PDFOptions): jsPDF => {
  const generator = new ProfessionalPDFGenerator();
  return generator.generatePDF(options);
}; 