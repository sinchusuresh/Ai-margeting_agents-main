const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cheerio = require('cheerio');
const axios = require('axios');

puppeteer.use(StealthPlugin());

class ProspectResearchService {
  constructor() {
    this.browser = null;
    this.apolloApiKey = process.env.APOLLO_API_KEY;
    this.linkedinApiKey = process.env.LINKEDIN_API_KEY;
  }

  async initializeBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async researchProspect(linkedinUrl, companyWebsite = null) {
    try {
      console.log('🔍 Starting prospect research...');
      console.log('LinkedIn URL:', linkedinUrl);
      console.log('Company Website:', companyWebsite);

      const prospectData = {
        linkedinProfile: null,
        companyInfo: null,
        recentNews: null,
        socialPresence: null,
        researchTimestamp: new Date().toISOString()
      };

      // 1. Research LinkedIn Profile
      if (linkedinUrl) {
        prospectData.linkedinProfile = await this.scrapeLinkedInProfile(linkedinUrl);
      }

      // 2. Research Company Website
      if (companyWebsite) {
        prospectData.companyInfo = await this.scrapeCompanyWebsite(companyWebsite);
      }

      // 3. Get Recent Company News
      if (companyWebsite) {
        prospectData.recentNews = await this.getCompanyNews(prospectData.companyInfo?.companyName);
      }

      // 4. Research Social Media Presence
      if (companyWebsite) {
        prospectData.socialPresence = await this.researchSocialPresence(prospectData.companyInfo?.companyName);
      }

      // 5. Use Apollo.io API if available
      if (this.apolloApiKey && prospectData.companyInfo?.companyName) {
        const apolloData = await this.getApolloData(prospectData.companyInfo.companyName);
        if (apolloData) {
          prospectData.apolloInsights = apolloData;
        }
      }

      console.log('✅ Prospect research completed successfully');
      return prospectData;

    } catch (error) {
      console.error('❌ Error in prospect research:', error.message);
      return {
        error: error.message,
        researchTimestamp: new Date().toISOString()
      };
    } finally {
      await this.closeBrowser();
    }
  }

  async scrapeLinkedInProfile(linkedinUrl) {
    try {
      console.log('🔍 Scraping LinkedIn profile:', linkedinUrl);
      
      const browser = await this.initializeBrowser();
      const page = await browser.newPage();
      
      // Set user agent to avoid detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Navigate to LinkedIn profile
      await page.goto(linkedinUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for content to load
      await page.waitForTimeout(3000);
      
      // Extract profile information
      const profileData = await page.evaluate(() => {
        const data = {};
        
        // Name
        const nameElement = document.querySelector('h1.text-heading-xlarge');
        data.fullName = nameElement ? nameElement.textContent.trim() : null;
        
        // Headline
        const headlineElement = document.querySelector('.text-body-medium.break-words');
        data.headline = headlineElement ? headlineElement.textContent.trim() : null;
        
        // Company
        const companyElement = document.querySelector('[aria-label="Current company"]');
        data.currentCompany = companyElement ? companyElement.textContent.trim() : null;
        
        // Location
        const locationElement = document.querySelector('[aria-label="Location"]');
        data.location = locationElement ? locationElement.textContent.trim() : null;
        
        // About
        const aboutElement = document.querySelector('#about ~ .display-flex .pv-shared-text-with-see-more');
        data.about = aboutElement ? aboutElement.textContent.trim() : null;
        
        // Experience
        const experienceElements = document.querySelectorAll('#experience ~ .pvs-list__outer-container .pvs-entity');
        data.experience = Array.from(experienceElements).slice(0, 3).map(exp => {
          const titleElement = exp.querySelector('.pvs-entity__path-node');
          const companyElement = exp.querySelector('.pvs-entity__path-node + span');
          return {
            title: titleElement ? titleElement.textContent.trim() : null,
            company: companyElement ? companyElement.textContent.trim() : null
          };
        });
        
        // Education
        const educationElement = document.querySelector('#education ~ .pvs-list__outer-container .pvs-entity');
        if (educationElement) {
          const schoolElement = educationElement.querySelector('.pvs-entity__path-node');
          const degreeElement = educationElement.querySelector('.pvs-entity__path-node + span');
          data.education = {
            school: schoolElement ? schoolElement.textContent.trim() : null,
            degree: degreeElement ? degreeElement.textContent.trim() : null
          };
        }
        
        // Skills
        const skillElements = document.querySelectorAll('#skills ~ .pvs-list__outer-container .pvs-entity');
        data.skills = Array.from(skillElements).slice(0, 5).map(skill => {
          const skillElement = skill.querySelector('.pvs-entity__path-node');
          return skillElement ? skillElement.textContent.trim() : null;
        }).filter(Boolean);
        
        // Recent Activity
        const activityElements = document.querySelectorAll('.feed-shared-update-v2');
        data.recentActivity = Array.from(activityElements).slice(0, 3).map(activity => {
          const textElement = activity.querySelector('.feed-shared-text');
          return textElement ? textElement.textContent.trim() : null;
        }).filter(Boolean);
        
        return data;
      });
      
      await page.close();
      
      console.log('✅ LinkedIn profile scraped successfully');
      return profileData;
      
    } catch (error) {
      console.error('❌ Error scraping LinkedIn profile:', error.message);
      return { error: error.message };
    }
  }

  async scrapeCompanyWebsite(companyWebsite) {
    try {
      console.log('🔍 Scraping company website:', companyWebsite);
      
      const browser = await this.initializeBrowser();
      const page = await browser.newPage();
      
      // Set user agent to avoid detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Navigate to company website
      await page.goto(companyWebsite, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for content to load
      await page.waitForTimeout(2000);
      
      // Extract company information
      const companyData = await page.evaluate(() => {
        const data = {};
        
        // Company name
        const titleElement = document.querySelector('title');
        data.companyName = titleElement ? titleElement.textContent.trim() : null;
        
        // Meta description
        const metaDescElement = document.querySelector('meta[name="description"]');
        data.metaDescription = metaDescElement ? metaDescElement.getAttribute('content') : null;
        
        // Company description
        const descElement = document.querySelector('meta[property="og:description"]') || 
                           document.querySelector('meta[name="description"]');
        data.description = descElement ? descElement.getAttribute('content') : null;
        
        // Industry keywords
        const keywordsElement = document.querySelector('meta[name="keywords"]');
        data.keywords = keywordsElement ? keywordsElement.getAttribute('content') : null;
        
        // Company size (try to find in content)
        const sizePatterns = [
          /(\d+)\+?\s*employees?/i,
          /(\d+)\+?\s*team\s*members?/i,
          /(\d+)\+?\s*people/i
        ];
        
        const bodyText = document.body.textContent;
        for (const pattern of sizePatterns) {
          const match = bodyText.match(pattern);
          if (match) {
            data.estimatedSize = match[0];
            break;
          }
        }
        
        // Company type
        if (bodyText.includes('startup') || bodyText.includes('Startup')) {
          data.companyType = 'Startup';
        } else if (bodyText.includes('enterprise') || bodyText.includes('Enterprise')) {
          data.companyType = 'Enterprise';
        } else if (bodyText.includes('SMB') || bodyText.includes('small business')) {
          data.companyType = 'SMB';
        }
        
        // Recent news/updates
        const newsElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        data.recentUpdates = Array.from(newsElements).slice(0, 10).map(el => el.textContent.trim()).filter(text => 
          text.length > 10 && text.length < 100
        );
        
        // Contact information
        const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const phonePattern = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
        
        data.contactInfo = {
          emails: bodyText.match(emailPattern) || [],
          phones: bodyText.match(phonePattern) || []
        };
        
        return data;
      });
      
      await page.close();
      
      console.log('✅ Company website scraped successfully');
      return companyData;
      
    } catch (error) {
      console.error('❌ Error scraping company website:', error.message);
      return { error: error.message };
    }
  }

  async getCompanyNews(companyName) {
    try {
      if (!companyName) return null;
      
      console.log('📰 Getting recent news for:', companyName);
      
      // Use Google News search
      const searchQuery = encodeURIComponent(`${companyName} company news 2024`);
      const newsUrl = `https://news.google.com/search?q=${searchQuery}&hl=en-US&gl=US&ceid=US:en`;
      
      const browser = await this.initializeBrowser();
      const page = await browser.newPage();
      
      await page.goto(newsUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      const newsData = await page.evaluate(() => {
        const articles = [];
        const articleElements = document.querySelectorAll('article');
        
        articleElements.forEach((article, index) => {
          if (index < 5) { // Limit to 5 articles
            const titleElement = article.querySelector('h3 a');
            const sourceElement = article.querySelector('time');
            const snippetElement = article.querySelector('div[data-n-tid]');
            
            if (titleElement) {
              articles.push({
                title: titleElement.textContent.trim(),
                source: sourceElement ? sourceElement.textContent.trim() : null,
                snippet: snippetElement ? snippetElement.textContent.trim() : null
              });
            }
          }
        });
        
        return articles;
      });
      
      await page.close();
      
      console.log('✅ Company news retrieved successfully');
      return newsData;
      
    } catch (error) {
      console.error('❌ Error getting company news:', error.message);
      return null;
    }
  }

  async researchSocialPresence(companyName) {
    try {
      if (!companyName) return null;
      
      console.log('📱 Researching social media presence for:', companyName);
      
      const socialData = {
        linkedin: null,
        twitter: null,
        facebook: null,
        instagram: null
      };
      
      // Research LinkedIn company page
      try {
        const linkedinSearchUrl = `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(companyName)}`;
        const browser = await this.initializeBrowser();
        const page = await browser.newPage();
        
        await page.goto(linkedinSearchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForTimeout(2000);
        
        const linkedinInfo = await page.evaluate(() => {
          const companyElement = document.querySelector('.search-result__info');
          if (companyElement) {
            const nameElement = companyElement.querySelector('.search-result__title');
            const industryElement = companyElement.querySelector('.search-result__subtitle');
            const followerElement = companyElement.querySelector('.search-result__subtitle + div');
            
            return {
              companyName: nameElement ? nameElement.textContent.trim() : null,
              industry: industryElement ? industryElement.textContent.trim() : null,
              followers: followerElement ? followerElement.textContent.trim() : null
            };
          }
          return null;
        });
        
        socialData.linkedin = linkedinInfo;
        await page.close();
        
      } catch (error) {
        console.error('❌ Error researching LinkedIn:', error.message);
      }
      
      console.log('✅ Social media presence researched successfully');
      return socialData;
      
    } catch (error) {
      console.error('❌ Error researching social presence:', error.message);
      return null;
    }
  }

  async getApolloData(companyName) {
    try {
      if (!this.apolloApiKey || !companyName) return null;
      
      console.log('🔍 Getting Apollo.io data for:', companyName);
      
      // Apollo.io API endpoint for company search
      const response = await axios.get('https://api.apollo.io/v1/organizations/search', {
        headers: {
          'X-Api-Key': this.apolloApiKey,
          'Content-Type': 'application/json'
        },
        params: {
          q_organization_name: companyName,
          page: 1,
          per_page: 1
        }
      });
      
      if (response.data && response.data.organizations && response.data.organizations.length > 0) {
        const company = response.data.organizations[0];
        
        return {
          companyId: company.id,
          industry: company.industry,
          employeeCount: company.employee_count,
          revenue: company.revenue_range,
          foundedYear: company.founded_year,
          description: company.description,
          website: company.website_url,
          linkedinUrl: company.linkedin_url,
          twitterUrl: company.twitter_url,
          facebookUrl: company.facebook_url,
          technologies: company.technology_names || [],
          keywords: company.keywords || []
        };
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ Error getting Apollo.io data:', error.message);
      return null;
    }
  }

  async generatePersonalizationInsights(prospectData) {
    try {
      console.log('🧠 Generating personalization insights...');
      
      const insights = {
        personalizationHooks: [],
        commonGround: [],
        valuePropositions: [],
        conversationStarters: [],
        researchSummary: ''
      };
      
      // Extract insights from LinkedIn profile
      if (prospectData.linkedinProfile) {
        const profile = prospectData.linkedinProfile;
        
        // Personalization hooks based on experience
        if (profile.experience && profile.experience.length > 0) {
          profile.experience.forEach(exp => {
            if (exp.title && exp.company) {
              insights.personalizationHooks.push(
                `Your experience as ${exp.title} at ${exp.company}`
              );
            }
          });
        }
        
        // Common ground based on skills
        if (profile.skills && profile.skills.length > 0) {
          insights.commonGround.push(
            `Shared expertise in ${profile.skills.slice(0, 3).join(', ')}`
          );
        }
        
        // Conversation starters based on recent activity
        if (profile.recentActivity && profile.recentActivity.length > 0) {
          insights.conversationStarters.push(
            `Your recent post about ${profile.recentActivity[0].substring(0, 50)}...`
          );
        }
      }
      
      // Extract insights from company information
      if (prospectData.companyInfo) {
        const company = prospectData.companyInfo;
        
        if (company.industry) {
          insights.valuePropositions.push(
            `Solutions specifically designed for ${company.industry} companies`
          );
        }
        
        if (company.companyType) {
          insights.personalizationHooks.push(
            `Understanding the unique challenges of ${company.companyType.toLowerCase()} companies`
          );
        }
      }
      
      // Extract insights from recent news
      if (prospectData.recentNews && prospectData.recentNews.length > 0) {
        const latestNews = prospectData.recentNews[0];
        insights.conversationStarters.push(
          `Congratulations on ${latestNews.title}`
        );
      }
      
      // Generate research summary
      insights.researchSummary = this.generateResearchSummary(prospectData);
      
      console.log('✅ Personalization insights generated successfully');
      return insights;
      
    } catch (error) {
      console.error('❌ Error generating personalization insights:', error.message);
      return { error: error.message };
    }
  }

  generateResearchSummary(prospectData) {
    let summary = '';
    
    if (prospectData.linkedinProfile) {
      const profile = prospectData.linkedinProfile;
      summary += `${profile.fullName} is a ${profile.headline} at ${profile.currentCompany}. `;
      
      if (profile.experience && profile.experience.length > 0) {
        summary += `They have experience as ${profile.experience[0].title} at ${profile.experience[0].company}. `;
      }
      
      if (profile.location) {
        summary += `Based in ${profile.location}. `;
      }
    }
    
    if (prospectData.companyInfo) {
      const company = prospectData.companyInfo;
      if (company.companyType) {
        summary += `${company.companyName} is a ${company.companyType.toLowerCase()} company. `;
      }
      if (company.estimatedSize) {
        summary += `Company size: ${company.estimatedSize}. `;
      }
    }
    
    if (prospectData.recentNews && prospectData.recentNews.length > 0) {
      summary += `Recent company news: ${prospectData.recentNews[0].title}. `;
    }
    
    return summary.trim();
  }
}

module.exports = ProspectResearchService;
