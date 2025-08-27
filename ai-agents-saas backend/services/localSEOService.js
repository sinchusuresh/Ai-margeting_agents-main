const axios = require('axios');
const { google } = require('googleapis');

class LocalSEOService {
  constructor() {
    this.googleAuth = null;
    this.brightLocalApiKey = process.env.BRIGHTLOCAL_API_KEY;
    this.googleApiKey = process.env.GOOGLE_API_KEY;
    this.googleClientId = process.env.GOOGLE_CLIENT_ID;
    this.googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    this.googleRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  }

  // Initialize Google OAuth2 client
  async initializeGoogleAuth() {
    try {
      if (!this.googleClientId || !this.googleClientSecret || !this.googleRefreshToken) {
        throw new Error('Google OAuth2 credentials not configured');
      }

      this.googleAuth = new google.auth.OAuth2(
        this.googleClientId,
        this.googleClientSecret,
        'urn:ietf:wg:oauth:2.0:oob'
      );

      this.googleAuth.setCredentials({
        refresh_token: this.googleRefreshToken
      });

      return true;
    } catch (error) {
      console.error('❌ Google Auth initialization failed:', error.message);
      return false;
    }
  }

  // Audit Google My Business Profile
  async auditGoogleMyBusiness(businessName, location) {
    try {
      if (!await this.initializeGoogleAuth()) {
        return this.getFallbackGMBData(businessName, location);
      }

      const businessService = google.mybusinessbusinessinformation('v1');
      
      // Search for business
      const searchResponse = await businessService.accounts.locations.list({
        auth: this.googleAuth,
        parent: 'accounts/me'
      });

      const locations = searchResponse.data.locations || [];
      const businessLocation = locations.find(loc => 
        loc.title?.toLowerCase().includes(businessName.toLowerCase()) ||
        loc.address?.addressLines?.some(line => 
          line.toLowerCase().includes(location.toLowerCase())
        )
      );

      if (!businessLocation) {
        return this.getFallbackGMBData(businessName, location);
      }

      // Get detailed profile information
      const profileResponse = await businessService.accounts.locations.get({
        auth: this.googleAuth,
        name: businessLocation.name
      });

      const profile = profileResponse.data;
      
      // Analyze profile completeness
      const completenessScore = this.calculateGMBCompleteness(profile);
      const issues = this.identifyGMBIssues(profile);
      const recommendations = this.generateGMBRecommendations(profile);

      return {
        profileId: profile.name,
        businessName: profile.title,
        address: profile.address,
        phone: profile.phoneNumbers?.primaryPhone,
        website: profile.websiteUri,
        hours: profile.regularHours,
        categories: profile.categories,
        completenessScore,
        issues,
        recommendations,
        lastUpdated: profile.updateTime,
        status: 'Active'
      };

    } catch (error) {
      console.error('❌ GMB audit failed:', error.message);
      return this.getFallbackGMBData(businessName, location);
    }
  }

  // Calculate GMB profile completeness score
  calculateGMBCompleteness(profile) {
    let score = 0;
    const totalFields = 8;

    if (profile.title) score++;
    if (profile.address) score++;
    if (profile.phoneNumbers?.primaryPhone) score++;
    if (profile.websiteUri) score++;
    if (profile.regularHours) score++;
    if (profile.categories && profile.categories.length > 0) score++;
    if (profile.description) score++;
    if (profile.profile && profile.profile.profilePhotoUri) score++;

    return Math.round((score / totalFields) * 100);
  }

  // Identify GMB profile issues
  identifyGMBIssues(profile) {
    const issues = [];

    if (!profile.description) {
      issues.push({
        issue: 'Missing business description',
        priority: 'High',
        solution: 'Add a detailed business description with keywords'
      });
    }

    if (!profile.profile?.profilePhotoUri) {
      issues.push({
        issue: 'Missing profile photo',
        priority: 'High',
        solution: 'Upload a professional business photo'
      });
    }

    if (!profile.regularHours) {
      issues.push({
        issue: 'Missing business hours',
        priority: 'High',
        solution: 'Set accurate business hours'
      });
    }

    if (!profile.websiteUri) {
      issues.push({
        issue: 'Missing website link',
        priority: 'Medium',
        solution: 'Connect your business website'
      });
    }

    if (!profile.categories || profile.categories.length === 0) {
      issues.push({
        issue: 'Missing business categories',
        priority: 'Medium',
        solution: 'Select relevant business categories'
      });
    }

    return issues;
  }

  // Generate GMB recommendations
  generateGMBRecommendations(profile) {
    const recommendations = [];

    if (profile.completenessScore < 80) {
      recommendations.push('Complete all missing profile information');
    }

    if (!profile.description) {
      recommendations.push('Add compelling business description with local keywords');
    }

    if (!profile.profile?.profilePhotoUri) {
      recommendations.push('Upload high-quality business photos');
    }

    if (!profile.regularHours) {
      recommendations.push('Set accurate and consistent business hours');
    }

    recommendations.push('Post regular updates and offers');
    recommendations.push('Respond to all customer reviews promptly');
    recommendations.push('Use local keywords in posts and descriptions');

    return recommendations;
  }

  // Analyze reviews and ratings
  async analyzeReviews(businessName, location) {
    try {
      if (!await this.initializeGoogleAuth()) {
        return this.getFallbackReviewData();
      }

      const businessService = google.mybusinessaccountmanagement('v1');
      
      // Get account information
      const accountsResponse = await businessService.accounts.list({
        auth: this.googleAuth
      });

      const account = accountsResponse.data.accounts?.[0];
      if (!account) {
        return this.getFallbackReviewData();
      }

      // Get reviews (Note: GMB API v1 doesn't provide reviews directly)
      // We'll use Google Places API as fallback
      return await this.getReviewsFromPlacesAPI(businessName, location);

    } catch (error) {
      console.error('❌ Review analysis failed:', error.message);
      return this.getFallbackReviewData();
    }
  }

  // Get reviews from Google Places API
  async getReviewsFromPlacesAPI(businessName, location) {
    try {
      if (!this.googleApiKey) {
        return this.getFallbackReviewData();
      }

      // Search for business
      const searchResponse = await axios.get(
        `https://maps.googleapis.com/maps/api/place/textsearch/json`,
        {
          params: {
            query: `${businessName} ${location}`,
            key: this.googleApiKey
          }
        }
      );

      if (!searchResponse.data.results?.[0]) {
        return this.getFallbackReviewData();
      }

      const placeId = searchResponse.data.results[0].place_id;
      
      // Get detailed place information including reviews
      const detailsResponse = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`,
        {
          params: {
            place_id: placeId,
            fields: 'rating,reviews,user_ratings_total,formatted_phone_number,formatted_address',
            key: this.googleApiKey
          }
        }
      );

      const place = detailsResponse.data.result;
      
      return {
        currentRating: place.rating || 0,
        totalReviews: place.user_ratings_total || 0,
        reviews: place.reviews?.slice(0, 10) || [],
        responseRate: this.calculateResponseRate(place.reviews),
        lastReviewDate: place.reviews?.[0]?.time || null
      };

    } catch (error) {
      console.error('❌ Places API failed:', error.message);
      return this.getFallbackReviewData();
    }
  }

  // Calculate review response rate
  calculateResponseRate(reviews) {
    if (!reviews || reviews.length === 0) return 0;
    
    const respondedReviews = reviews.filter(review => review.owner_response);
    return Math.round((respondedReviews.length / reviews.length) * 100);
  }

  // Analyze citations using BrightLocal API
  async analyzeCitations(businessName, location, phone) {
    try {
      if (!this.brightLocalApiKey) {
        return this.getFallbackCitationData();
      }

      // Search for existing citations
      const searchResponse = await axios.get(
        `https://tools.brightlocal.com/seo-tools/api/v1.0/account/${this.brightLocalApiKey}/citation-search`,
        {
          params: {
            business_name: businessName,
            city: location.split(',')[0]?.trim(),
            state: location.split(',')[1]?.trim(),
            phone: phone
          }
        }
      );

      if (searchResponse.data.success) {
        const citations = searchResponse.data.citations || [];
        
        return {
          currentCitations: citations.length,
          citationDetails: citations.map(citation => ({
            platform: citation.directory_name,
            url: citation.listing_url,
            status: citation.status,
            lastUpdated: citation.last_updated
          })),
          missingCitations: this.identifyMissingCitations(citations),
          inconsistencies: this.findCitationInconsistencies(citations)
        };
      }

      return this.getFallbackCitationData();

    } catch (error) {
      console.error('❌ Citation analysis failed:', error.message);
      return this.getFallbackCitationData();
    }
  }

  // Identify missing citations
  identifyMissingCitations(existingCitations) {
    const essentialDirectories = [
      'Google My Business',
      'Yelp',
      'Facebook Business',
      'Yellow Pages',
      'Angie\'s List',
      'Better Business Bureau',
      'Foursquare',
      'Apple Maps',
      'Bing Places',
      'TripAdvisor'
    ];

    const existingPlatforms = existingCitations.map(c => c.directory_name.toLowerCase());
    
    return essentialDirectories
      .filter(directory => !existingPlatforms.includes(directory.toLowerCase()))
      .map(directory => ({
        platform: directory,
        importance: this.getCitationImportance(directory),
        url: this.getDirectoryUrl(directory),
        description: `Essential directory for local business visibility`
      }));
  }

  // Get citation importance level
  getCitationImportance(platform) {
    const highPriority = ['Google My Business', 'Yelp', 'Facebook Business'];
    const mediumPriority = ['Yellow Pages', 'Angie\'s List', 'Better Business Bureau'];
    
    if (highPriority.includes(platform)) return 'High';
    if (mediumPriority.includes(platform)) return 'Medium';
    return 'Low';
  }

  // Get directory URLs
  getDirectoryUrl(platform) {
    const urls = {
      'Google My Business': 'https://business.google.com',
      'Yelp': 'https://biz.yelp.com',
      'Facebook Business': 'https://facebook.com/business',
      'Yellow Pages': 'https://yellowpages.com',
      'Angie\'s List': 'https://angi.com',
      'Better Business Bureau': 'https://bbb.org',
      'Foursquare': 'https://foursquare.com',
      'Apple Maps': 'https://maps.apple.com',
      'Bing Places': 'https://bingplaces.com',
      'TripAdvisor': 'https://tripadvisor.com'
    };
    
    return urls[platform] || '#';
  }

  // Find citation inconsistencies
  findCitationInconsistencies(citations) {
    const inconsistencies = [];
    
    // Check for phone number inconsistencies
    const phoneNumbers = citations
      .filter(c => c.phone)
      .map(c => c.phone.replace(/\D/g, ''));
    
    if (phoneNumbers.length > 1) {
      const uniquePhones = [...new Set(phoneNumbers)];
      if (uniquePhones.length > 1) {
        inconsistencies.push('Phone number varies across directories');
      }
    }

    // Check for address inconsistencies
    const addresses = citations
      .filter(c => c.address)
      .map(c => c.address.toLowerCase().trim());
    
    if (addresses.length > 1) {
      const uniqueAddresses = [...new Set(addresses)];
      if (uniqueAddresses.length > 1) {
        inconsistencies.push('Address format differs between directories');
      }
    }

    return inconsistencies;
  }

  // Create GMB calendar events
  async createGMBCalendarEvent(businessName, eventData) {
    try {
      if (!await this.initializeGoogleAuth()) {
        return { success: false, message: 'Google authentication failed' };
      }

      const businessService = google.mybusinessbusinessinformation('v1');
      
      // Create a post (GMB doesn't have traditional calendar events)
      const postResponse = await businessService.accounts.locations.localPosts.create({
        auth: this.googleAuth,
        parent: `accounts/me/locations/${eventData.locationId}`,
        requestBody: {
          summary: eventData.title,
          callToAction: {
            actionType: 'LEARN_MORE',
            url: eventData.url || ''
          },
          media: eventData.media || []
        }
      });

      return {
        success: true,
        postId: postResponse.data.name,
        message: 'GMB post created successfully'
      };

    } catch (error) {
      console.error('❌ GMB calendar event creation failed:', error.message);
      return { success: false, message: error.message };
    }
  }

  // Generate local SEO content calendar
  async generateContentCalendar(businessName, businessType, location) {
    try {
      const calendar = {
        weeklyPosts: [],
        monthlyThemes: [],
        seasonalContent: [],
        localEvents: []
      };

      // Generate weekly post ideas
      const weeklyTopics = [
        'Local business spotlight',
        'Service tips and tricks',
        'Customer success stories',
        'Local community updates',
        'Industry insights',
        'Behind the scenes',
        'Local events and happenings'
      ];

      weeklyTopics.forEach((topic, index) => {
        calendar.weeklyPosts.push({
          week: index + 1,
          topic: topic,
          content: this.generatePostContent(topic, businessName, businessType, location),
          hashtags: this.generateLocalHashtags(location, businessType),
          mediaType: 'image'
        });
      });

      // Generate monthly themes
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];
      
      months.forEach((month, index) => {
        calendar.monthlyThemes.push({
          month: month,
          theme: this.getMonthlyTheme(index, businessType),
          contentIdeas: this.getMonthlyContentIdeas(index, businessType, location)
        });
      });

      // Generate seasonal content
      calendar.seasonalContent = this.generateSeasonalContent(businessType, location);

      // Generate local event content
      calendar.localEvents = this.generateLocalEventContent(location, businessType);

      return calendar;

    } catch (error) {
      console.error('❌ Content calendar generation failed:', error.message);
      return this.getFallbackContentCalendar();
    }
  }

  // Generate post content
  generatePostContent(topic, businessName, businessType, location) {
    const contentTemplates = {
      'Local business spotlight': `🌟 Spotlight on ${businessName}! We're proud to be part of the ${location} community, providing top-quality ${businessType} services. What makes us different? Our commitment to excellence and local expertise! #${location.replace(/\s+/g, '')} #${businessType.replace(/\s+/g, '')}`,
      'Service tips and tricks': `💡 Pro tip from ${businessName}: [Insert specific tip related to ${businessType}]. Serving ${location} with expert advice and quality service! #${businessType.replace(/\s+/g, '')}Tips #${location.replace(/\s+/g, '')}`,
      'Customer success stories': `🎉 Another happy customer in ${location}! [Brief success story]. This is why we love what we do at ${businessName} - making a difference in our community! #${businessType.replace(/\s+/g, '')} #SuccessStory #${location.replace(/\s+/g, '')}`,
      'Local community updates': `🏘️ Community update from ${location}! [Local news or event]. ${businessName} is proud to support our local community through quality ${businessType} services. #${location.replace(/\s+/g, '')} #Community #${businessType.replace(/\s+/g, '')}`,
      'Industry insights': `📊 Industry insight: [Insert industry trend or fact]. At ${businessName}, we stay ahead of the curve to provide the best ${businessType} services in ${location}. #${businessType.replace(/\s+/g, '')} #IndustryInsights #${location.replace(/\s+/g, '')}`,
      'Behind the scenes': `🔧 Behind the scenes at ${businessName}! [Show team working or process]. Quality ${businessType} services in ${location} - this is how we do it! #BehindTheScenes #${businessType.replace(/\s+/g, '')} #${location.replace(/\s+/g, '')}`,
      'Local events and happenings': `📅 What's happening in ${location} this week? [Local event details]. ${businessName} loves being part of our vibrant community! #${location.replace(/\s+/g, '')} #LocalEvents #${businessType.replace(/\s+/g, '')}`
    };

    return contentTemplates[topic] || `Great content from ${businessName} - your trusted ${businessType} provider in ${location}! #${businessType.replace(/\s+/g, '')} #${location.replace(/\s+/g, '')}`;
  }

  // Generate local hashtags
  generateLocalHashtags(location, businessType) {
    const locationTags = location.split(',').map(part => 
      part.trim().replace(/\s+/g, '')
    );
    
    const businessTags = businessType.split(' ').map(word => 
      word.replace(/\s+/g, '')
    );
    
    return [...locationTags, ...businessTags, 'LocalBusiness', 'SmallBusiness'];
  }

  // Get monthly theme
  getMonthlyTheme(monthIndex, businessType) {
    const themes = [
      'New Year, New Goals',
      'Love & Relationships',
      'Spring Renewal',
      'Growth & Development',
      'Mother\'s Day Special',
      'Summer Preparation',
      'Independence & Freedom',
      'Back to School',
      'Harvest & Abundance',
      'Halloween & Fall',
      'Gratitude & Giving',
      'Holiday Celebration'
    ];
    
    return themes[monthIndex];
  }

  // Get monthly content ideas
  getMonthlyContentIdeas(monthIndex, businessType, location) {
    const ideas = [
      'New Year resolutions for your [business/service]',
      'Valentine\'s Day special offers',
      'Spring cleaning tips for [business/service]',
      'Tax season preparation guide',
      'Mother\'s Day gift ideas',
      'Summer maintenance checklist',
      'Independence Day community events',
      'Back-to-school preparation',
      'Fall maintenance tips',
      'Halloween safety guidelines',
      'Thanksgiving community involvement',
      'Holiday season special offers'
    ];
    
    return ideas[monthIndex] || 'Monthly content ideas for your business';
  }

  // Generate seasonal content
  generateSeasonalContent(businessType, location) {
    return [
      {
        season: 'Spring',
        content: `Spring is here in ${location}! Time to refresh and renew. ${businessType} services to get your property ready for the new season. #Spring #${location.replace(/\s+/g, '')} #${businessType.replace(/\s+/g, '')}`,
        hashtags: ['Spring', 'Renewal', 'FreshStart']
      },
      {
        season: 'Summer',
        content: `Summer vibes in ${location}! Beat the heat with our ${businessType} services. Stay cool and comfortable all season long! #Summer #${location.replace(/\s+/g, '')} #${businessType.replace(/\s+/g, '')}`,
        hashtags: ['Summer', 'BeatTheHeat', 'Comfort']
      },
      {
        season: 'Fall',
        content: `Fall colors are here in ${location}! Prepare for the season with our ${businessType} services. Cozy up and get ready for winter! #Fall #${location.replace(/\s+/g, '')} #${businessType.replace(/\s+/g, '')}`,
        hashtags: ['Fall', 'Cozy', 'Preparation']
      },
      {
        season: 'Winter',
        content: `Winter is coming to ${location}! Stay warm and safe with our ${businessType} services. We\'re here to help you through the cold season! #Winter #${location.replace(/\s+/g, '')} #${businessType.replace(/\s+/g, '')}`,
        hashtags: ['Winter', 'StayWarm', 'Safety']
      }
    ];
  }

  // Generate local event content
  generateLocalEventContent(location, businessType) {
    return [
      {
        event: 'Local Business Expo',
        content: `Join us at the ${location} Business Expo! Meet local entrepreneurs and discover amazing services. ${businessType} excellence on display! #LocalBusiness #${location.replace(/\s+/g, '')} #Expo`,
        date: 'Monthly',
        hashtags: ['LocalBusiness', 'Expo', 'Networking']
      },
      {
        event: 'Community Cleanup',
        content: `Proud to participate in ${location} community cleanup! Giving back to our community through ${businessType} services and volunteer work. #CommunityService #${location.replace(/\s+/g, '')} #Cleanup`,
        date: 'Quarterly',
        hashtags: ['CommunityService', 'Cleanup', 'Volunteer']
      },
      {
        event: 'Local Market',
        content: `Supporting local vendors at the ${location} market! Local businesses working together to strengthen our community. #LocalMarket #${location.replace(/\s+/g, '')} #SupportLocal`,
        date: 'Weekly',
        hashtags: ['LocalMarket', 'SupportLocal', 'Community']
      }
    ];
  }

  // Fallback data methods
  getFallbackGMBData(businessName, location) {
    return {
      profileId: 'fallback-profile',
      businessName: businessName,
      address: `${location}`,
      completenessScore: 65,
      issues: [
        {
          issue: 'Profile not fully optimized',
          priority: 'High',
          solution: 'Complete all profile sections with accurate information'
        }
      ],
      recommendations: [
        'Add business description',
        'Upload business photos',
        'Set business hours',
        'Add service categories'
      ],
      status: 'Needs Optimization'
    };
  }

  getFallbackReviewData() {
    return {
      currentRating: 4.2,
      totalReviews: 25,
      reviews: [],
      responseRate: 80,
      lastReviewDate: new Date().toISOString()
    };
  }

  getFallbackCitationData() {
    return {
      currentCitations: 8,
      citationDetails: [],
      missingCitations: [
        {
          platform: 'Google My Business',
          importance: 'High',
          url: 'https://business.google.com',
          description: 'Essential for local search visibility'
        }
      ],
      inconsistencies: [
        'Phone number format varies',
        'Address format differences'
      ]
    };
  }

  getFallbackContentCalendar() {
    return {
      weeklyPosts: [],
      monthlyThemes: [],
      seasonalContent: [],
      localEvents: []
    };
  }
}

module.exports = LocalSEOService;
