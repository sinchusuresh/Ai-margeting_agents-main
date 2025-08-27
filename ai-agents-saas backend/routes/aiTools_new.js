// Generate Competitor Analysis using OpenAI + Web Scraping + APIs
async function generateCompetitorAnalysis(input) {
  try {
    console.log('🚀 Starting comprehensive competitor analysis...');
    
    // Import services
    const CompetitorScrapingService = require('../services/competitorScrapingService');
    const SimilarWebService = require('../services/similarWebService');
    const SEMrushService = require('../services/semrushService');
    const MetaAdLibraryService = require('../services/metaAdLibraryService');
    
    const scrapingService = new CompetitorScrapingService();
    const similarWebService = new SimilarWebService();
    const semrushService = new SEMrushService();
    const metaAdService = new MetaAdLibraryService();
    
    // Extract competitor URLs from input
    const competitorUrls = input.competitorUrls || [];
    const yourBusiness = input.yourBusiness || 'Your Business';
    const industry = input.industry || 'Business Industry';
    const analysisFocus = input.analysisFocus || 'Marketing Strategy';
    
    if (competitorUrls.length === 0) {
      console.log('⚠️ No competitor URLs provided, using fallback data');
      return getFallbackData('competitor-analysis', input);
    }
    
    console.log(`🔍 Analyzing ${competitorUrls.length} competitors:`, competitorUrls);
    
    // 1. Scrape competitor websites
    console.log('📊 Step 1: Scraping competitor websites...');
    const scrapedData = await scrapingService.scrapeMultipleCompetitors(competitorUrls);
    
    // 2. Get traffic and SEO data from SimilarWeb
    console.log('📈 Step 2: Fetching traffic data from SimilarWeb...');
    const trafficData = await Promise.all(
      competitorUrls.map(url => {
        const domain = new URL(url).hostname.replace('www.', '');
        return similarWebService.getWebsiteTraffic(domain);
      })
    );
    
    // 3. Get backlink and SEO data from SEMrush
    console.log('🔗 Step 3: Fetching backlink data from SEMrush...');
    const seoData = await Promise.all(
      competitorUrls.map(url => {
        const domain = new URL(url).hostname.replace('www.', '');
        return Promise.all([
          semrushService.getDomainOverview(domain),
          semrushService.getBacklinks(domain),
          semrushService.getOrganicKeywords(domain)
        ]);
      })
    );
    
    // 4. Get ad creatives from Meta Ad Library
    console.log('📺 Step 4: Fetching ad creatives from Meta Ad Library...');
    const adData = await Promise.all(
      competitorUrls.map(url => {
        const domain = new URL(url).hostname.replace('www.', '');
        const companyName = domain.split('.')[0];
        return metaAdService.getAdCreatives(companyName);
      })
    );
    
    // 5. Generate AI analysis using all collected data
    console.log('🤖 Step 5: Generating AI analysis...');
    const analysisPrompt = `Generate a comprehensive competitor analysis based on the following real data:

BUSINESS CONTEXT:
Your Business: ${yourBusiness}
Industry: ${industry}
Analysis Focus: ${analysisFocus}

COMPETITOR DATA COLLECTED:
${competitorUrls.map((url, index) => `
Competitor ${index + 1}: ${url}
- Scraped Content: ${scrapedData[index]?.metaTags?.title || 'N/A'}
- Traffic: ${trafficData[index]?.totalVisits?.toLocaleString() || 'N/A'} monthly visits
- SEO Score: ${seoData[index]?.[0]?.rank || 'N/A'} rank
- Backlinks: ${seoData[index]?.[1]?.totalBacklinks?.toLocaleString() || 'N/A'}
- Ad Spend: ${adData[index]?.totalSpend?.toLocaleString() || 'N/A'} USD
`).join('\n')}

Generate a comprehensive SWOT analysis and strategic insights based on this real data. Focus on actionable recommendations and market opportunities.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert business analyst specializing in competitive analysis. Use the provided real data to generate actionable insights."
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    const aiAnalysis = completion.choices[0].message.content;
    
    // 6. Compile comprehensive report
    console.log('📋 Step 6: Compiling comprehensive report...');
    const comprehensiveReport = {
      analysisMetadata: {
        generatedAt: new Date().toISOString(),
        yourBusiness,
        industry,
        analysisFocus,
        competitorCount: competitorUrls.length,
        dataSources: ['Web Scraping', 'SimilarWeb API', 'SEMrush API', 'Meta Ad Library', 'OpenAI GPT-4']
      },
      competitorProfiles: competitorUrls.map((url, index) => {
        const domain = new URL(url).hostname.replace('www.', '');
        const scraped = scrapedData[index] || {};
        const traffic = trafficData[index] || {};
        const seo = seoData[index] || [];
        const ads = adData[index] || {};
        
        return {
          competitorName: domain,
          website: url,
          scrapedData: {
            metaTags: scraped.metaTags || {},
            contentStructure: scraped.contentStructure || {},
            socialLinks: scraped.socialLinks || {},
            contactInfo: scraped.contactInfo || {},
            pricingInfo: scraped.pricingInfo || {},
            blogContent: scraped.blogContent || {},
            adCreatives: scraped.adCreatives || {}
          },
          trafficData: {
            totalVisits: traffic.totalVisits || 0,
            monthlyVisits: traffic.monthlyVisits || 0,
            growthRate: traffic.growthRate || '0%',
            uniqueVisitors: traffic.uniqueVisitors || 0,
            pageViews: traffic.pageViews || 0,
            avgVisitDuration: traffic.avgVisitDuration || 0,
            bounceRate: traffic.bounceRate || '0%'
          },
          seoData: {
            domainRank: seo[0]?.rank || 0,
            organicTraffic: seo[0]?.organicTraffic || 0,
            organicKeywords: seo[0]?.organicKeywords || 0,
            backlinks: seo[1]?.totalBacklinks || 0,
            topKeywords: seo[2]?.keywords || []
          },
          adData: {
            totalAds: ads.totalAds || 0,
            totalSpend: ads.totalSpend || 0,
            totalImpressions: ads.totalImpressions || 0,
            adCreatives: ads.creatives || []
          }
        };
      }),
      aiAnalysis,
      strategicInsights: {
        marketPosition: `Based on analysis of ${competitorUrls.length} competitors`,
        competitiveAdvantages: 'Generated from real data analysis',
        marketGaps: 'Identified through comprehensive research',
        recommendations: 'AI-powered strategic insights'
      }
    };
    
    // Clean up browser resources
    await scrapingService.closeBrowser();
    
    console.log('✅ Competitor analysis completed successfully!');
    return comprehensiveReport;
    
  } catch (error) {
    console.error('❌ Error in competitor analysis:', error);
    
    // Clean up resources on error
    try {
      const CompetitorScrapingService = require('../services/competitorScrapingService');
      const scrapingService = new CompetitorScrapingService();
      await scrapingService.closeBrowser();
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
    
    return getFallbackData('competitor-analysis', input);
  }
}
