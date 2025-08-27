const googleAnalyticsService = require('./googleAnalyticsService');
const facebookMarketingService = require('./facebookMarketingService');
const linkedinMarketingService = require('./linkedinMarketingService');
const googleAdsService = require('./googleAdsService');

class DataAggregationService {
  constructor() {
    this.platforms = {
      googleAnalytics: googleAnalyticsService,
      facebookMarketing: facebookMarketingService,
      linkedinMarketing: linkedinMarketingService,
      googleAds: googleAdsService
    };
  }

  async generateComprehensiveReport(clientConfig, startDate, endDate) {
    try {
      console.log('🚀 Generating comprehensive client report...');
      
      const reportData = {
        clientInfo: {
          name: clientConfig.clientName,
          industry: clientConfig.industry,
          reportingPeriod: clientConfig.reportingPeriod,
          services: clientConfig.services,
          generatedAt: new Date().toISOString()
        },
        dataSources: {
          googleAnalytics: false,
          facebookMarketing: false,
          linkedinMarketing: false,
          googleAds: false
        },
        analytics: {},
        socialMedia: {},
        advertising: {},
        summary: {}
      };

      // Fetch Google Analytics data
      if (clientConfig.googleAnalyticsPropertyId) {
        try {
          console.log('📊 Fetching Google Analytics data...');
          const gaData = await this.platforms.googleAnalytics.getAnalyticsData(
            clientConfig.googleAnalyticsPropertyId,
            startDate,
            endDate
          );
          reportData.analytics.googleAnalytics = gaData;
          reportData.dataSources.googleAnalytics = true;
          console.log('✅ Google Analytics data fetched successfully');
        } catch (error) {
          console.error('❌ Google Analytics data fetch failed:', error.message);
        }
      }

      // Fetch Facebook Marketing data
      if (clientConfig.facebookAdAccountId) {
        try {
          console.log('📘 Fetching Facebook Marketing data...');
          const fbData = await this.platforms.facebookMarketing.getCampaignData(
            clientConfig.facebookAdAccountId,
            startDate,
            endDate
          );
          const fbPageData = await this.platforms.facebookMarketing.getPageInsights(
            clientConfig.facebookPageId,
            startDate,
            endDate
          );
          reportData.socialMedia.facebook = {
            campaigns: fbData,
            pageInsights: fbPageData
          };
          reportData.dataSources.facebookMarketing = true;
          console.log('✅ Facebook Marketing data fetched successfully');
        } catch (error) {
          console.error('❌ Facebook Marketing data fetch failed:', error.message);
        }
      }

      // Fetch LinkedIn Marketing data
      if (clientConfig.linkedinAdAccountId) {
        try {
          console.log('💼 Fetching LinkedIn Marketing data...');
          const liData = await this.platforms.linkedinMarketing.getCampaignData(
            clientConfig.linkedinAdAccountId,
            startDate,
            endDate
          );
          const liPageData = await this.platforms.linkedinMarketing.getCompanyPageInsights(
            clientConfig.linkedinCompanyId,
            startDate,
            endDate
          );
          reportData.socialMedia.linkedin = {
            campaigns: liData,
            pageInsights: liPageData
          };
          reportData.dataSources.linkedinMarketing = true;
          console.log('✅ LinkedIn Marketing data fetched successfully');
        } catch (error) {
          console.error('❌ LinkedIn Marketing data fetch failed:', error.message);
        }
      }

      // Fetch Google Ads data
      if (clientConfig.googleAdsCustomerId) {
        try {
          console.log('🎯 Fetching Google Ads data...');
          const adsData = await this.platforms.googleAds.getCampaignData(
            clientConfig.googleAdsCustomerId,
            startDate,
            endDate
          );
          const keywordData = await this.platforms.googleAds.getKeywordPerformance(
            clientConfig.googleAdsCustomerId,
            startDate,
            endDate
          );
          reportData.advertising.googleAds = {
            campaigns: adsData,
            keywords: keywordData
          };
          reportData.dataSources.googleAds = true;
          console.log('✅ Google Ads data fetched successfully');
        } catch (error) {
          console.error('❌ Google Ads data fetch failed:', error.message);
        }
      }

      // Generate comprehensive summary
      reportData.summary = this.generateSummary(reportData);
      
      console.log('🎉 Comprehensive report generated successfully!');
      return reportData;

    } catch (error) {
      console.error('❌ Error generating comprehensive report:', error.message);
      throw error;
    }
  }

  generateSummary(reportData) {
    const summary = {
      totalTraffic: 0,
      totalConversions: 0,
      totalSpend: 0,
      totalRevenue: 0,
      overallROI: 0,
      topPerformingChannels: [],
      keyInsights: [],
      recommendations: []
    };

    // Aggregate Google Analytics data
    if (reportData.analytics.googleAnalytics) {
      const ga = reportData.analytics.googleAnalytics;
      summary.totalTraffic += ga.totalUsers || 0;
      summary.totalConversions += ga.conversions || 0;
      summary.totalRevenue += ga.revenue || 0;
    }

    // Aggregate Facebook data
    if (reportData.socialMedia.facebook) {
      const fb = reportData.socialMedia.facebook.campaigns;
      if (fb.summary) {
        summary.totalSpend += fb.summary.totalSpend || 0;
        summary.totalConversions += fb.summary.totalConversions || 0;
      }
    }

    // Aggregate LinkedIn data
    if (reportData.socialMedia.linkedin) {
      const li = reportData.socialMedia.linkedin.campaigns;
      if (li.summary) {
        summary.totalSpend += li.summary.totalSpend || 0;
        summary.totalConversions += li.summary.totalConversions || 0;
      }
    }

    // Aggregate Google Ads data
    if (reportData.advertising.googleAds) {
      const ads = reportData.advertising.googleAds.campaigns;
      if (ads.summary) {
        summary.totalSpend += ads.summary.totalSpend || 0;
        summary.totalConversions += ads.summary.totalConversions || 0;
      }
    }

    // Calculate ROI
    if (summary.totalSpend > 0 && summary.totalRevenue > 0) {
      summary.overallROI = ((summary.totalRevenue - summary.totalSpend) / summary.totalSpend) * 100;
    }

    // Generate insights and recommendations
    summary.keyInsights = this.generateInsights(reportData);
    summary.recommendations = this.generateRecommendations(reportData, summary);
    summary.topPerformingChannels = this.identifyTopChannels(reportData);

    return summary;
  }

  generateInsights(reportData) {
    const insights = [];

    // Traffic insights
    if (reportData.analytics.googleAnalytics) {
      const ga = reportData.analytics.googleAnalytics;
      if (ga.bounceRate > 50) {
        insights.push(`High bounce rate (${ga.bounceRate.toFixed(1)}%) indicates potential content or user experience issues`);
      }
      if (ga.avgSessionDuration < 60) {
        insights.push(`Low average session duration (${Math.round(ga.avgSessionDuration)}s) suggests content may not be engaging enough`);
      }
    }

    // Social media insights
    if (reportData.socialMedia.facebook && reportData.socialMedia.facebook.campaigns) {
      const fb = reportData.socialMedia.facebook.campaigns;
      if (fb.summary.overallCtr > 10) {
        insights.push(`Strong Facebook ad performance with ${fb.summary.overallCtr.toFixed(2)}% CTR`);
      }
    }

    // Advertising insights
    if (reportData.advertising.googleAds && reportData.advertising.googleAds.campaigns) {
      const ads = reportData.advertising.googleAds.campaigns;
      if (ads.summary.overallRoi > 0) {
        insights.push(`Positive Google Ads ROI of ${ads.summary.overallRoi.toFixed(2)}x`);
      }
    }

    return insights;
  }

  generateRecommendations(reportData, summary) {
    const recommendations = [];

    // Traffic recommendations
    if (summary.totalTraffic < 1000) {
      recommendations.push({
        priority: 'high',
        category: 'Traffic Generation',
        title: 'Increase Organic Traffic',
        description: 'Focus on SEO optimization and content marketing to boost organic traffic',
        expectedImpact: '25-40% increase in organic traffic within 3 months'
      });
    }

    // Conversion recommendations
    if (summary.totalConversions < 100) {
      recommendations.push({
        priority: 'high',
        category: 'Conversion Optimization',
        title: 'Improve Conversion Rate',
        description: 'Optimize landing pages and implement A/B testing for better conversion rates',
        expectedImpact: '15-25% improvement in conversion rate within 2 months'
      });
    }

    // ROI recommendations
    if (summary.overallROI < 0) {
      recommendations.push({
        priority: 'high',
        category: 'ROI Optimization',
        title: 'Optimize Ad Spend',
        description: 'Review and optimize underperforming campaigns to improve overall ROI',
        expectedImpact: 'Positive ROI within 1-2 months'
      });
    }

    return recommendations;
  }

  identifyTopChannels(reportData) {
    const channels = [];

    // Google Analytics traffic sources
    if (reportData.analytics.googleAnalytics && reportData.analytics.googleAnalytics.trafficSources) {
      Object.entries(reportData.analytics.googleAnalytics.trafficSources).forEach(([source, data]) => {
        channels.push({
          name: source,
          type: 'Traffic',
          metric: data.users,
          performance: 'good'
        });
      });
    }

    // Social media channels
    if (reportData.socialMedia.facebook && reportData.socialMedia.facebook.campaigns) {
      const fb = reportData.socialMedia.facebook.campaigns;
      if (fb.summary && fb.summary.overallCtr > 5) {
        channels.push({
          name: 'Facebook Ads',
          type: 'Social Media',
          metric: fb.summary.overallCtr,
          performance: 'excellent'
        });
      }
    }

    // Sort by performance
    return channels.sort((a, b) => b.metric - a.metric).slice(0, 5);
  }
}

module.exports = new DataAggregationService();
