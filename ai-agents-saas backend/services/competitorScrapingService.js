const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cheerio = require('cheerio');
const axios = require('axios');

puppeteer.use(StealthPlugin());

class CompetitorScrapingService {
  constructor() {
    this.browser = null;
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

  async scrapeCompetitorWebsite(url) {
    try {
      console.log(`🔍 Starting to scrape: ${url}`);
      
      const browser = await this.initializeBrowser();
      const page = await browser.newPage();
      
      // Set user agent to avoid detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Navigate to the page
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for content to load
      await page.waitForTimeout(2000);
      
      // Get page content
      const content = await page.content();
      const $ = cheerio.load(content);
      
      // Extract meta tags
      const metaTags = this.extractMetaTags($);
      
      // Extract content structure
      const contentStructure = this.extractContentStructure($);
      
      // Extract social media links
      const socialLinks = this.extractSocialLinks($);
      
      // Extract contact information
      const contactInfo = this.extractContactInfo($);
      
      // Extract pricing information
      const pricingInfo = this.extractPricingInfo($);
      
      // Extract blog topics and content
      const blogContent = await this.extractBlogContent(page, $);
      
      // Extract ad creatives (if available)
      const adCreatives = await this.extractAdCreatives(page);
      
      await page.close();
      
      return {
        url,
        scrapedAt: new Date().toISOString(),
        metaTags,
        contentStructure,
        socialLinks,
        contactInfo,
        pricingInfo,
        blogContent,
        adCreatives
      };
      
    } catch (error) {
      console.error(`❌ Error scraping ${url}:`, error.message);
      return {
        url,
        error: error.message,
        scrapedAt: new Date().toISOString()
      };
    }
  }

  extractMetaTags($) {
    const metaTags = {};
    
    // Basic meta tags
    metaTags.title = $('title').text().trim();
    metaTags.description = $('meta[name="description"]').attr('content') || '';
    metaTags.keywords = $('meta[name="keywords"]').attr('content') || '';
    metaTags.author = $('meta[name="author"]').attr('content') || '';
    metaTags.viewport = $('meta[name="viewport"]').attr('content') || '';
    
    // Open Graph tags
    metaTags.ogTitle = $('meta[property="og:title"]').attr('content') || '';
    metaTags.ogDescription = $('meta[property="og:description"]').attr('content') || '';
    metaTags.ogImage = $('meta[property="og:image"]').attr('content') || '';
    metaTags.ogUrl = $('meta[property="og:url"]').attr('content') || '';
    metaTags.ogType = $('meta[property="og:type"]').attr('content') || '';
    
    // Twitter Card tags
    metaTags.twitterCard = $('meta[name="twitter:card"]').attr('content') || '';
    metaTags.twitterTitle = $('meta[name="twitter:title"]').attr('content') || '';
    metaTags.twitterDescription = $('meta[name="twitter:description"]').attr('content') || '';
    metaTags.twitterImage = $('meta[name="twitter:image"]').attr('content') || '';
    
    // Canonical URL
    metaTags.canonical = $('link[rel="canonical"]').attr('href') || '';
    
    return metaTags;
  }

  extractContentStructure($) {
    const structure = {
      headings: [],
      navigation: [],
      mainContent: [],
      forms: [],
      buttons: []
    };
    
    // Extract headings
    $('h1, h2, h3, h4, h5, h6').each((i, el) => {
      const tag = el.name;
      const text = $(el).text().trim();
      if (text) {
        structure.headings.push({ tag, text });
      }
    });
    
    // Extract navigation
    $('nav a, .nav a, .navigation a, .menu a').each((i, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr('href');
      if (text && href) {
        structure.navigation.push({ text, href });
      }
    });
    
    // Extract main content areas
    $('main, .main, .content, .container, .wrapper').each((i, el) => {
      const className = $(el).attr('class') || '';
      const text = $(el).text().trim().substring(0, 200);
      if (text) {
        structure.mainContent.push({ className, text });
      }
    });
    
    // Extract forms
    $('form').each((i, el) => {
      const action = $(el).attr('action') || '';
      const method = $(el).attr('method') || 'get';
      const inputs = [];
      
      $(el).find('input, select, textarea').each((j, input) => {
        const type = $(input).attr('type') || 'text';
        const name = $(input).attr('name') || '';
        const placeholder = $(input).attr('placeholder') || '';
        inputs.push({ type, name, placeholder });
      });
      
      structure.forms.push({ action, method, inputs });
    });
    
    // Extract buttons
    $('button, .btn, .button, input[type="submit"]').each((i, el) => {
      const text = $(el).text().trim() || $(el).attr('value') || '';
      const className = $(el).attr('class') || '';
      if (text) {
        structure.buttons.push({ text, className });
      }
    });
    
    return structure;
  }

  extractSocialLinks($) {
    const socialLinks = {
      facebook: '',
      twitter: '',
      linkedin: '',
      instagram: '',
      youtube: '',
      tiktok: ''
    };
    
    // Find social media links
    $('a[href*="facebook.com"], a[href*="fb.com"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && !socialLinks.facebook) {
        socialLinks.facebook = href;
      }
    });
    
    $('a[href*="twitter.com"], a[href*="x.com"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && !socialLinks.twitter) {
        socialLinks.twitter = href;
      }
    });
    
    $('a[href*="linkedin.com"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && !socialLinks.linkedin) {
        socialLinks.linkedin = href;
      }
    });
    
    $('a[href*="instagram.com"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && !socialLinks.instagram) {
        socialLinks.instagram = href;
      }
    });
    
    $('a[href*="youtube.com"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && !socialLinks.youtube) {
        socialLinks.youtube = href;
      }
    });
    
    $('a[href*="tiktok.com"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && !socialLinks.tiktok) {
        socialLinks.tiktok = href;
      }
    });
    
    return socialLinks;
  }

  extractContactInfo($) {
    const contactInfo = {
      phone: '',
      email: '',
      address: '',
      contactForm: false
    };
    
    // Extract phone numbers
    const phoneRegex = /(\+?[\d\s\-\(\)]{10,})/g;
    const pageText = $('body').text();
    const phoneMatches = pageText.match(phoneRegex);
    if (phoneMatches) {
      contactInfo.phone = phoneMatches[0];
    }
    
    // Extract email addresses
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const emailMatches = pageText.match(emailRegex);
    if (emailMatches) {
      contactInfo.email = emailMatches[0];
    }
    
    // Check for contact forms
    contactInfo.contactForm = $('form').length > 0;
    
    return contactInfo;
  }

  extractPricingInfo($) {
    const pricingInfo = {
      hasPricing: false,
      pricingElements: [],
      currency: ''
    };
    
    // Look for pricing-related elements
    $('*:contains("$"), *:contains("€"), *:contains("£"), *:contains("₹")').each((i, el) => {
      const text = $(el).text().trim();
      if (text.match(/[\$€£₹]\d+/)) {
        pricingInfo.pricingElements.push(text);
        pricingInfo.hasPricing = true;
        
        // Determine currency
        if (text.includes('$')) pricingInfo.currency = 'USD';
        else if (text.includes('€')) pricingInfo.currency = 'EUR';
        else if (text.includes('£')) pricingInfo.currency = 'GBP';
        else if (text.includes('₹')) pricingInfo.currency = 'INR';
      }
    });
    
    return pricingInfo;
  }

  async extractBlogContent(page, $) {
    try {
      const blogContent = {
        hasBlog: false,
        blogPosts: [],
        categories: [],
        tags: []
      };
      
      // Look for blog indicators
      const blogIndicators = ['blog', 'news', 'articles', 'posts', 'insights'];
      let hasBlogSection = false;
      
      for (const indicator of blogIndicators) {
        if ($(`a[href*="${indicator}"], .${indicator}, #${indicator}`).length > 0) {
          hasBlogSection = true;
          break;
        }
      }
      
      if (hasBlogSection) {
        blogContent.hasBlog = true;
        
        // Try to find blog posts
        const blogLinks = $('a[href*="blog"], a[href*="post"], a[href*="article"]');
        blogLinks.slice(0, 5).each((i, el) => {
          const href = $(el).attr('href');
          const text = $(el).text().trim();
          if (text && href) {
            blogContent.blogPosts.push({ title: text, url: href });
          }
        });
      }
      
      return blogContent;
      
    } catch (error) {
      console.error('Error extracting blog content:', error);
      return { hasBlog: false, blogPosts: [], categories: [], tags: [] };
    }
  }

  async extractAdCreatives(page) {
    try {
      const adCreatives = {
        hasAds: false,
        adElements: [],
        adNetworks: []
      };
      
      // Look for common ad network indicators
      const adNetworks = [
        'googleadservices',
        'googlesyndication',
        'doubleclick',
        'facebook.com/tr',
        'pixel',
        'analytics'
      ];
      
      for (const network of adNetworks) {
        const elements = await page.$$(`[src*="${network}"], [href*="${network}"]`);
        if (elements.length > 0) {
          adCreatives.hasAds = true;
          adCreatives.adNetworks.push(network);
        }
      }
      
      // Look for ad-related CSS classes
      const adClasses = await page.$$eval('.ad, .advertisement, .banner, .sponsored', elements => 
        elements.map(el => el.className)
      );
      
      if (adClasses.length > 0) {
        adCreatives.hasAds = true;
        adCreatives.adElements.push(...adClasses);
      }
      
      return adCreatives;
      
    } catch (error) {
      console.error('Error extracting ad creatives:', error);
      return { hasAds: false, adElements: [], adNetworks: [] };
    }
  }

  async scrapeMultipleCompetitors(urls) {
    const results = [];
    
    for (const url of urls) {
      console.log(`🔍 Scraping competitor: ${url}`);
      const result = await this.scrapeCompetitorWebsite(url);
      results.push(result);
      
      // Add delay between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return results;
  }
}

module.exports = CompetitorScrapingService;
