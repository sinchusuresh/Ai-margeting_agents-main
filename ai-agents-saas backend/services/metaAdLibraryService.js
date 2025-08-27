const axios = require('axios');

class MetaAdLibraryService {
  constructor() {
    this.accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    this.baseUrl = 'https://graph.facebook.com/v18.0';
  }

  async getAdCreatives(advertiserName) {
    try {
      if (!this.accessToken) {
        console.warn('⚠️ Facebook Access Token not configured');
        return this.getMockAdCreatives(advertiserName);
      }

      console.log(`📺 Fetching Meta Ad Library data for: ${advertiserName}`);
      
      // First, search for the advertiser
      const searchResponse = await axios.get(`${this.baseUrl}/ads_archive`, {
        params: {
          access_token: this.accessToken,
          search_terms: advertiserName,
          ad_type: 'POLITICAL_AND_ISSUE_ADS',
          limit: 10
        }
      });

      if (!searchResponse.data.data || searchResponse.data.data.length === 0) {
        return this.getMockAdCreatives(advertiserName);
      }

      const advertiserId = searchResponse.data.data[0].id;
      
      // Get ads from the advertiser
      const adsResponse = await axios.get(`${this.baseUrl}/${advertiserId}/ads`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,ad_creation_time,ad_creative_body,ad_creative_link_title,ad_creative_link_description,ad_creative_link_url,page_id,page_name,spend,impressions,demographic_distribution,region_distribution',
          limit: 20
        }
      });

      return this.formatAdCreatives(adsResponse.data, advertiserName);
      
    } catch (error) {
      console.error(`❌ Error fetching Meta Ad Library data for ${advertiserName}:`, error.message);
      return this.getMockAdCreatives(advertiserName);
    }
  }

  async getAdSpending(advertiserName) {
    try {
      if (!this.accessToken) {
        return this.getMockAdSpending(advertiserName);
      }

      const searchResponse = await axios.get(`${this.baseUrl}/ads_archive`, {
        params: {
          access_token: this.accessToken,
          search_terms: advertiserName,
          ad_type: 'POLITICAL_AND_ISSUE_ADS',
          limit: 1
        }
      });

      if (!searchResponse.data.data || searchResponse.data.data.length === 0) {
        return this.getMockAdSpending(advertiserName);
      }

      const advertiserId = searchResponse.data.data[0].id;
      
      const spendingResponse = await axios.get(`${this.baseUrl}/${advertiserId}/ads`, {
        params: {
          access_token: this.accessToken,
          fields: 'spend,impressions,ad_creation_time',
          limit: 100
        }
      });

      return this.formatAdSpending(spendingResponse.data, advertiserName);
      
    } catch (error) {
      console.error(`❌ Error fetching ad spending for ${advertiserName}:`, error.message);
      return this.getMockAdSpending(advertiserName);
    }
  }

  async getAdDemographics(advertiserName) {
    try {
      if (!this.accessToken) {
        return this.getMockAdDemographics(advertiserName);
      }

      const searchResponse = await axios.get(`${this.baseUrl}/ads_archive`, {
        params: {
          access_token: this.accessToken,
          search_terms: advertiserName,
          ad_type: 'POLITICAL_AND_ISSUE_ADS',
          limit: 1
        }
      });

      if (!searchResponse.data.data || searchResponse.data.data.length === 0) {
        return this.getMockAdDemographics(advertiserName);
      }

      const advertiserId = searchResponse.data.data[0].id;
      
      const demographicsResponse = await axios.get(`${this.baseUrl}/${advertiserId}/ads`, {
        params: {
          access_token: this.accessToken,
          fields: 'demographic_distribution,region_distribution',
          limit: 50
        }
      });

      return this.formatAdDemographics(demographicsResponse.data, advertiserName);
      
    } catch (error) {
      console.error(`❌ Error fetching ad demographics for ${advertiserName}:`, error.message);
      return this.getMockAdDemographics(advertiserName);
    }
  }

  // Mock data methods for when API is not available
  getMockAdCreatives(advertiserName) {
    const adTypes = ['image', 'video', 'carousel', 'story'];
    const adThemes = [
      'Product Launch',
      'Special Offer',
      'Brand Awareness',
      'Customer Testimonial',
      'Feature Highlight',
      'Holiday Promotion',
      'Educational Content',
      'Social Proof'
    ];

    const creatives = [];
    
    for (let i = 0; i < 15; i++) {
      const adType = adTypes[Math.floor(Math.random() * adTypes.length)];
      const theme = adThemes[Math.floor(Math.random() * adThemes.length)];
      
      creatives.push({
        id: `ad_${Math.random().toString(36).substr(2, 9)}`,
        type: adType,
        theme: theme,
        title: `${theme} - ${advertiserName}`,
        body: this.generateMockAdBody(theme),
        linkTitle: `Learn More About ${theme}`,
        linkDescription: `Discover how ${advertiserName} can help with ${theme.toLowerCase()}`,
        linkUrl: `https://${advertiserName.toLowerCase().replace(/\s+/g, '')}.com/${theme.toLowerCase().replace(/\s+/g, '-')}`,
        creationTime: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        spend: Math.floor(Math.random() * 10000) + 100,
        impressions: Math.floor(Math.random() * 100000) + 10000,
        ctr: (Math.random() * 0.05 + 0.01).toFixed(3), // 1-6%
        cpc: (Math.random() * 5 + 0.5).toFixed(2)
      });
    }

    return {
      advertiser: advertiserName,
      totalAds: creatives.length,
      totalSpend: creatives.reduce((sum, ad) => sum + ad.spend, 0),
      totalImpressions: creatives.reduce((sum, ad) => sum + ad.impressions, 0),
      creatives,
      source: 'mock'
    };
  }

  getMockAdSpending(advertiserName) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const spending = months.map((month, index) => ({
      month,
      spend: Math.floor(Math.random() * 50000) + 5000,
      impressions: Math.floor(Math.random() * 500000) + 50000,
      ads: Math.floor(Math.random() * 20) + 5
    }));

    return {
      advertiser: advertiserName,
      totalSpend: spending.reduce((sum, month) => sum + month.spend, 0),
      totalImpressions: spending.reduce((sum, month) => sum + month.impressions, 0),
      monthlySpending: spending,
      source: 'mock'
    };
  }

  getMockAdDemographics(advertiserName) {
    const ageGroups = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
    const genders = ['Male', 'Female', 'Other'];
    const regions = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East', 'Africa'];

    const demographics = {
      age: ageGroups.map(age => ({
        group: age,
        percentage: (Math.random() * 30 + 10).toFixed(1)
      })),
      gender: genders.map(gender => ({
        group: gender,
        percentage: gender === 'Other' ? (Math.random() * 10 + 5).toFixed(1) : (Math.random() * 40 + 20).toFixed(1)
      })),
      regions: regions.map(region => ({
        region,
        percentage: (Math.random() * 40 + 10).toFixed(1)
      }))
    };

    // Normalize percentages
    const normalizePercentages = (data) => {
      const total = data.reduce((sum, item) => sum + parseFloat(item.percentage), 0);
      return data.map(item => ({
        ...item,
        percentage: ((parseFloat(item.percentage) / total) * 100).toFixed(1)
      }));
    };

    demographics.age = normalizePercentages(demographics.age);
    demographics.gender = normalizePercentages(demographics.gender);
    demographics.regions = normalizePercentages(demographics.regions);

    return {
      advertiser: advertiserName,
      demographics,
      source: 'mock'
    };
  }

  generateMockAdBody(theme) {
    const adBodies = {
      'Product Launch': 'Introducing our latest innovation that will revolutionize your workflow. Get early access and exclusive benefits.',
      'Special Offer': 'Limited time offer! Save up to 50% on our premium features. Don\'t miss out on this incredible deal.',
      'Brand Awareness': 'Join thousands of satisfied customers who trust our platform. Experience the difference quality makes.',
      'Customer Testimonial': '"This solution transformed our business operations completely. Highly recommended!" - Sarah M., CEO',
      'Feature Highlight': 'Discover our powerful new feature that automates your most time-consuming tasks. Boost productivity today.',
      'Holiday Promotion': 'Celebrate the season with our special holiday collection. Perfect gifts for your team and clients.',
      'Educational Content': 'Learn industry best practices from our expert team. Free webinar this week - register now!',
      'Social Proof': 'Over 10,000 businesses trust our platform. See why we\'re the industry leader in customer satisfaction.'
    };

    return adBodies[theme] || 'Discover amazing opportunities with our innovative solutions. Learn more today!';
  }

  // Data formatting methods
  formatAdCreatives(data, advertiserName) {
    if (!data.data || data.data.length === 0) {
      return this.getMockAdCreatives(advertiserName);
    }

    const creatives = data.data.map(ad => ({
      id: ad.id,
      type: this.determineAdType(ad),
      theme: this.extractAdTheme(ad.ad_creative_body || ''),
      title: ad.ad_creative_link_title || 'No Title',
      body: ad.ad_creative_body || 'No Body',
      linkTitle: ad.ad_creative_link_title || 'Learn More',
      linkDescription: ad.ad_creative_link_description || 'No Description',
      linkUrl: ad.ad_creative_link_url || '#',
      creationTime: ad.ad_creation_time || new Date().toISOString(),
      spend: ad.spend ? parseFloat(ad.spend.amount) : 0,
      impressions: ad.impressions ? parseInt(ad.impressions.lower_bound) : 0,
      ctr: '0.025', // Default CTR
      cpc: '2.50' // Default CPC
    }));

    return {
      advertiser: advertiserName,
      totalAds: creatives.length,
      totalSpend: creatives.reduce((sum, ad) => sum + ad.spend, 0),
      totalImpressions: creatives.reduce((sum, ad) => sum + ad.impressions, 0),
      creatives,
      source: 'api'
    };
  }

  formatAdSpending(data, advertiserName) {
    if (!data.data || data.data.length === 0) {
      return this.getMockAdSpending(advertiserName);
    }

    // Group by month
    const monthlyData = {};
    data.data.forEach(ad => {
      if (ad.ad_creation_time) {
        const month = new Date(ad.ad_creation_time).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (!monthlyData[month]) {
          monthlyData[month] = { month, spend: 0, impressions: 0, ads: 0 };
        }
        monthlyData[month].spend += ad.spend ? parseFloat(ad.spend.amount) : 0;
        monthlyData[month].impressions += ad.impressions ? parseInt(ad.impressions.lower_bound) : 0;
        monthlyData[month].ads += 1;
      }
    });

    const monthlySpending = Object.values(monthlyData);

    return {
      advertiser: advertiserName,
      totalSpend: monthlySpending.reduce((sum, month) => sum + month.spend, 0),
      totalImpressions: monthlySpending.reduce((sum, month) => sum + month.impressions, 0),
      monthlySpending,
      source: 'api'
    };
  }

  formatAdDemographics(data, advertiserName) {
    if (!data.data || data.data.length === 0) {
      return this.getMockAdDemographics(advertiserName);
    }

    // Aggregate demographic data
    const demographics = {
      age: {},
      gender: {},
      regions: {}
    };

    data.data.forEach(ad => {
      if (ad.demographic_distribution) {
        ad.demographic_distribution.forEach(demo => {
          if (demo.age) {
            demographics.age[demo.age] = (demographics.age[demo.age] || 0) + 1;
          }
          if (demo.gender) {
            demographics.gender[demo.gender] = (demographics.gender[demo.gender] || 0) + 1;
          }
        });
      }
      if (ad.region_distribution) {
        ad.region_distribution.forEach(region => {
          if (region.region) {
            demographics.regions[region.region] = (demographics.regions[region.region] || 0) + 1;
          }
        });
      }
    });

    // Convert to arrays and calculate percentages
    const formatDemographics = (data) => {
      const total = Object.values(data).reduce((sum, count) => sum + count, 0);
      return Object.entries(data).map(([group, count]) => ({
        group,
        percentage: ((count / total) * 100).toFixed(1)
      }));
    };

    return {
      advertiser: advertiserName,
      demographics: {
        age: formatDemographics(demographics.age),
        gender: formatDemographics(demographics.gender),
        regions: formatDemographics(demographics.regions)
      },
      source: 'api'
    };
  }

  determineAdType(ad) {
    if (ad.ad_creative_body && ad.ad_creative_body.includes('video')) return 'video';
    if (ad.ad_creative_body && ad.ad_creative_body.includes('carousel')) return 'carousel';
    if (ad.ad_creative_body && ad.ad_creative_body.includes('story')) return 'story';
    return 'image';
  }

  extractAdTheme(adBody) {
    const themes = [
      'Product Launch', 'Special Offer', 'Brand Awareness', 'Customer Testimonial',
      'Feature Highlight', 'Holiday Promotion', 'Educational Content', 'Social Proof'
    ];
    
    for (const theme of themes) {
      if (adBody.toLowerCase().includes(theme.toLowerCase().replace(/\s+/g, ''))) {
        return theme;
      }
    }
    
    return 'General';
  }
}

module.exports = MetaAdLibraryService;
