const axios = require('axios');

class SimilarWebService {
  constructor() {
    this.apiKey = process.env.SIMILARWEB_API_KEY;
    this.baseUrl = 'https://api.similarweb.com/v1';
  }

  async getWebsiteTraffic(domain) {
    try {
      if (!this.apiKey) {
        console.warn('⚠️ SimilarWeb API key not configured');
        return this.getMockTrafficData(domain);
      }

      console.log(`📊 Fetching traffic data for: ${domain}`);
      
      const response = await axios.get(`${this.baseUrl}/website/${domain}/total-traffic-and-engagement/visits`, {
        headers: {
          'api-key': this.apiKey
        },
        params: {
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          granularity: 'monthly'
        }
      });

      return this.formatTrafficData(response.data);
      
    } catch (error) {
      console.error(`❌ Error fetching SimilarWeb data for ${domain}:`, error.message);
      return this.getMockTrafficData(domain);
    }
  }

  async getTrafficSources(domain) {
    try {
      if (!this.apiKey) {
        return this.getMockTrafficSources(domain);
      }

      const response = await axios.get(`${this.baseUrl}/website/${domain}/traffic-sources/overview`, {
        headers: {
          'api-key': this.apiKey
        }
      });

      return this.formatTrafficSources(response.data);
      
    } catch (error) {
      console.error(`❌ Error fetching traffic sources for ${domain}:`, error.message);
      return this.getMockTrafficSources(domain);
    }
  }

  async getTopKeywords(domain) {
    try {
      if (!this.apiKey) {
        return this.getMockKeywords(domain);
      }

      const response = await axios.get(`${this.baseUrl}/website/${domain}/search/keywords`, {
        headers: {
          'api-key': this.apiKey
        },
        params: {
          limit: 20
        }
      });

      return this.formatKeywords(response.data);
      
    } catch (error) {
      console.error(`❌ Error fetching keywords for ${domain}:`, error.message);
      return this.getMockKeywords(domain);
    }
  }

  async getReferralTraffic(domain) {
    try {
      if (!this.apiKey) {
        return this.getMockReferralTraffic(domain);
      }

      const response = await axios.get(`${this.baseUrl}/website/${domain}/referrals/overview`, {
        headers: {
          'api-key': this.apiKey
        },
        params: {
          limit: 20
        }
      });

      return this.formatReferralTraffic(response.data);
      
    } catch (error) {
      console.error(`❌ Error fetching referral traffic for ${domain}:`, error.message);
      return this.getMockReferralTraffic(domain);
    }
  }

  async getCompetitorAnalysis(domain) {
    try {
      if (!this.apiKey) {
        return this.getMockCompetitorAnalysis(domain);
      }

      const response = await axios.get(`${this.baseUrl}/website/${domain}/competitors/overview`, {
        headers: {
          'api-key': this.apiKey
        }
      });

      return this.formatCompetitorAnalysis(response.data);
      
    } catch (error) {
      console.error(`❌ Error fetching competitor analysis for ${domain}:`, error.message);
      return this.getMockCompetitorAnalysis(domain);
    }
  }

  // Mock data methods for when API is not available
  getMockTrafficData(domain) {
    const baseTraffic = Math.floor(Math.random() * 1000000) + 10000;
    const growth = (Math.random() - 0.5) * 0.3; // -15% to +15%
    
    return {
      domain,
      totalVisits: baseTraffic,
      monthlyVisits: Math.floor(baseTraffic / 12),
      growthRate: (growth * 100).toFixed(1) + '%',
      uniqueVisitors: Math.floor(baseTraffic * 0.7),
      pageViews: Math.floor(baseTraffic * 2.5),
      avgVisitDuration: Math.floor(Math.random() * 300) + 60, // 1-6 minutes
      bounceRate: (Math.random() * 0.4 + 0.3).toFixed(2), // 30-70%
      source: 'mock'
    };
  }

  getMockTrafficSources(domain) {
    return {
      domain,
      sources: {
        direct: Math.floor(Math.random() * 40) + 20, // 20-60%
        search: Math.floor(Math.random() * 50) + 30, // 30-80%
        social: Math.floor(Math.random() * 20) + 5,  // 5-25%
        referral: Math.floor(Math.random() * 15) + 5, // 5-20%
        email: Math.floor(Math.random() * 10) + 2,   // 2-12%
        display: Math.floor(Math.random() * 8) + 2    // 2-10%
      },
      source: 'mock'
    };
  }

  getMockKeywords(domain) {
    const keywords = [
      'business solutions',
      'digital marketing',
      'software tools',
      'online services',
      'professional services',
      'industry solutions',
      'technology services',
      'business software',
      'digital tools',
      'online platform'
    ];

    return {
      domain,
      keywords: keywords.map((keyword, index) => ({
        keyword,
        volume: Math.floor(Math.random() * 10000) + 1000,
        position: Math.floor(Math.random() * 20) + 1,
        difficulty: Math.floor(Math.random() * 100) + 1,
        cpc: (Math.random() * 5 + 0.5).toFixed(2)
      })),
      source: 'mock'
    };
  }

  getMockReferralTraffic(domain) {
    const referralSites = [
      'linkedin.com',
      'facebook.com',
      'twitter.com',
      'medium.com',
      'reddit.com',
      'quora.com',
      'stackoverflow.com',
      'github.com',
      'producthunt.com',
      'hackernews.com'
    ];

    return {
      domain,
      referrals: referralSites.map((site, index) => ({
        site,
        visits: Math.floor(Math.random() * 10000) + 100,
        percentage: (Math.random() * 5 + 0.5).toFixed(2)
      })),
      source: 'mock'
    };
  }

  getMockCompetitorAnalysis(domain) {
    const competitors = [
      'competitor1.com',
      'competitor2.com',
      'competitor3.com',
      'competitor4.com',
      'competitor5.com'
    ];

    return {
      domain,
      competitors: competitors.map((comp, index) => ({
        domain: comp,
        overlap: (Math.random() * 30 + 10).toFixed(1),
        visits: Math.floor(Math.random() * 100000) + 10000,
        source: 'mock'
      })),
      source: 'mock'
    };
  }

  // Data formatting methods
  formatTrafficData(data) {
    // Format actual API response data
    return {
      domain: data.domain,
      totalVisits: data.totalVisits || 0,
      monthlyVisits: data.monthlyVisits || 0,
      growthRate: data.growthRate || '0%',
      uniqueVisitors: data.uniqueVisitors || 0,
      pageViews: data.pageViews || 0,
      avgVisitDuration: data.avgVisitDuration || 0,
      bounceRate: data.bounceRate || '0%',
      source: 'api'
    };
  }

  formatTrafficSources(data) {
    return {
      domain: data.domain,
      sources: data.sources || {},
      source: 'api'
    };
  }

  formatKeywords(data) {
    return {
      domain: data.domain,
      keywords: data.keywords || [],
      source: 'api'
    };
  }

  formatReferralTraffic(data) {
    return {
      domain: data.domain,
      referrals: data.referrals || [],
      source: 'api'
    };
  }

  formatCompetitorAnalysis(data) {
    return {
      domain: data.domain,
      competitors: data.competitors || [],
      source: 'api'
    };
  }
}

module.exports = SimilarWebService;
