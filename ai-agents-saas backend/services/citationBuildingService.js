const axios = require('axios');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

class CitationBuildingService {
  constructor() {
    this.brightLocalApiKey = process.env.BRIGHTLOCAL_API_KEY;
    this.yelpApiKey = process.env.YELP_API_KEY;
    this.facebookAccessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    this.browser = null;
  }

  // Initialize browser for web automation
  async initializeBrowser() {
    try {
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
      return true;
    } catch (error) {
      console.error('❌ Browser initialization failed:', error.message);
      return false;
    }
  }

  // Build citations using BrightLocal API
  async buildCitationsWithBrightLocal(businessData) {
    try {
      if (!this.brightLocalApiKey) {
        return this.getFallbackCitationBuildingResult();
      }

      const citationData = {
        business_name: businessData.businessName,
        city: businessData.city,
        state: businessData.state,
        phone: businessData.phone,
        address: businessData.address,
        zip: businessData.zip,
        website: businessData.website,
        business_type: businessData.businessType,
        categories: businessData.categories || []
      };

      // Create citation campaign
      const campaignResponse = await axios.post(
        `https://tools.brightlocal.com/seo-tools/api/v1.0/account/${this.brightLocalApiKey}/citation-campaigns`,
        citationData
      );

      if (campaignResponse.data.success) {
        const campaignId = campaignResponse.data.campaign_id;
        
        // Get campaign status
        const statusResponse = await axios.get(
          `https://tools.brightlocal.com/seo-tools/api/v1.0/account/${this.brightLocalApiKey}/citation-campaigns/${campaignId}`
        );

        return {
          success: true,
          campaignId: campaignId,
          status: statusResponse.data.status,
          message: 'Citation campaign created successfully',
          estimatedCompletion: '2-4 weeks',
          targetDirectories: statusResponse.data.target_directories || []
        };
      }

      return this.getFallbackCitationBuildingResult();

    } catch (error) {
      console.error('❌ BrightLocal citation building failed:', error.message);
      return this.getFallbackCitationBuildingResult();
    }
  }

  // Build citations manually using web automation
  async buildCitationsManually(businessData) {
    try {
      if (!await this.initializeBrowser()) {
        return this.getFallbackCitationBuildingResult();
      }

      const results = [];
      const directories = this.getCitationDirectories();

      for (const directory of directories) {
        try {
          const result = await this.submitToDirectory(directory, businessData);
          results.push(result);
          
          // Add delay between submissions to avoid being blocked
          await this.delay(2000);
        } catch (error) {
          console.error(`❌ Failed to submit to ${directory.name}:`, error.message);
          results.push({
            directory: directory.name,
            success: false,
            error: error.message
          });
        }
      }

      await this.closeBrowser();

      return {
        success: true,
        results: results,
        totalSubmitted: results.filter(r => r.success).length,
        totalDirectories: directories.length,
        message: 'Citation building completed'
      };

    } catch (error) {
      console.error('❌ Manual citation building failed:', error.message);
      await this.closeBrowser();
      return this.getFallbackCitationBuildingResult();
    }
  }

  // Submit business to a specific directory
  async submitToDirectory(directory, businessData) {
    try {
      const page = await this.browser.newPage();
      
      // Set user agent to avoid detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Navigate to directory
      await page.goto(directory.url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for page to load
      await page.waitForTimeout(3000);
      
      // Fill out the form based on directory type
      const submissionResult = await this.fillDirectoryForm(page, directory, businessData);
      
      await page.close();
      return submissionResult;

    } catch (error) {
      throw new Error(`Directory submission failed: ${error.message}`);
    }
  }

  // Fill out directory form based on directory type
  async fillDirectoryForm(page, directory, businessData) {
    try {
      switch (directory.type) {
        case 'yelp':
          return await this.fillYelpForm(page, businessData);
        case 'facebook':
          return await this.fillFacebookForm(page, businessData);
        case 'yellowpages':
          return await this.fillYellowPagesForm(page, businessData);
        case 'angi':
          return await this.fillAngiForm(page, businessData);
        case 'bbb':
          return await this.fillBBBForm(page, businessData);
        default:
          return await this.fillGenericForm(page, businessData);
      }
    } catch (error) {
      throw new Error(`Form filling failed: ${error.message}`);
    }
  }

  // Fill Yelp business form
  async fillYelpForm(page, businessData) {
    try {
      // Look for business claim form
      const claimButton = await page.$('[data-testid="claim-business-button"]');
      if (claimButton) {
        await claimButton.click();
        await page.waitForTimeout(2000);
      }

      // Fill business information
      await this.fillInputField(page, 'input[name="business_name"]', businessData.businessName);
      await this.fillInputField(page, 'input[name="address"]', businessData.address);
      await this.fillInputField(page, 'input[name="city"]', businessData.city);
      await this.fillInputField(page, 'input[name="state"]', businessData.state);
      await this.fillInputField(page, 'input[name="zip"]', businessData.zip);
      await this.fillInputField(page, 'input[name="phone"]', businessData.phone);
      await this.fillInputField(page, 'input[name="website"]', businessData.website);

      // Select business category
      if (businessData.businessType) {
        await this.selectBusinessCategory(page, businessData.businessType);
      }

      // Submit form
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        await page.waitForTimeout(3000);
      }

      return {
        directory: 'Yelp',
        success: true,
        message: 'Business information submitted to Yelp'
      };

    } catch (error) {
      return {
        directory: 'Yelp',
        success: false,
        error: error.message
      };
    }
  }

  // Fill Facebook business form
  async fillFacebookForm(page, businessData) {
    try {
      // Navigate to Facebook Business page creation
      await page.goto('https://www.facebook.com/pages/create', { waitUntil: 'networkidle2' });
      await page.waitForTimeout(2000);

      // Fill business information
      await this.fillInputField(page, 'input[name="page_name"]', businessData.businessName);
      await this.fillInputField(page, 'input[name="category"]', businessData.businessType);
      await this.fillInputField(page, 'input[name="address"]', businessData.address);
      await this.fillInputField(page, 'input[name="city"]', businessData.city);
      await this.fillInputField(page, 'input[name="state"]', businessData.state);
      await this.fillInputField(page, 'input[name="zip"]', businessData.zip);
      await this.fillInputField(page, 'input[name="phone"]', businessData.phone);
      await this.fillInputField(page, 'input[name="website"]', businessData.website);

      // Submit form
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        await page.waitForTimeout(3000);
      }

      return {
        directory: 'Facebook Business',
        success: true,
        message: 'Business page created on Facebook'
      };

    } catch (error) {
      return {
        directory: 'Facebook Business',
        success: false,
        error: error.message
      };
    }
  }

  // Fill Yellow Pages form
  async fillYellowPagesForm(page, businessData) {
    try {
      // Look for business listing form
      const addBusinessButton = await page.$('a[href*="add-business"]');
      if (addBusinessButton) {
        await addBusinessButton.click();
        await page.waitForTimeout(2000);
      }

      // Fill business information
      await this.fillInputField(page, 'input[name="business_name"]', businessData.businessName);
      await this.fillInputField(page, 'input[name="address"]', businessData.address);
      await this.fillInputField(page, 'input[name="city"]', businessData.city);
      await this.fillInputField(page, 'input[name="state"]', businessData.state);
      await this.fillInputField(page, 'input[name="zip"]', businessData.zip);
      await this.fillInputField(page, 'input[name="phone"]', businessData.phone);
      await this.fillInputField(page, 'input[name="website"]', businessData.website);

      // Submit form
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        await page.waitForTimeout(3000);
      }

      return {
        directory: 'Yellow Pages',
        success: true,
        message: 'Business listed on Yellow Pages'
      };

    } catch (error) {
      return {
        directory: 'Yellow Pages',
        success: false,
        error: error.message
      };
    }
  }

  // Fill Angie's List form
  async fillAngiForm(page, businessData) {
    try {
      // Navigate to Angie's List business registration
      await page.goto('https://www.angi.com/business-registration', { waitUntil: 'networkidle2' });
      await page.waitForTimeout(2000);

      // Fill business information
      await this.fillInputField(page, 'input[name="business_name"]', businessData.businessName);
      await this.fillInputField(page, 'input[name="address"]', businessData.address);
      await this.fillInputField(page, 'input[name="city"]', businessData.city);
      await this.fillInputField(page, 'input[name="state"]', businessData.state);
      await this.fillInputField(page, 'input[name="zip"]', businessData.zip);
      await this.fillInputField(page, 'input[name="phone"]', businessData.phone);
      await this.fillInputField(page, 'input[name="website"]', businessData.website);

      // Submit form
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        await page.waitForTimeout(3000);
      }

      return {
        directory: 'Angie\'s List',
        success: true,
        message: 'Business registered on Angie\'s List'
      };

    } catch (error) {
      return {
        directory: 'Angie\'s List',
        success: false,
        error: error.message
      };
    }
  }

  // Fill BBB form
  async fillBBBForm(page, businessData) {
    try {
      // Navigate to BBB business registration
      await page.goto('https://www.bbb.org/us/add-business', { waitUntil: 'networkidle2' });
      await page.waitForTimeout(2000);

      // Fill business information
      await this.fillInputField(page, 'input[name="business_name"]', businessData.businessName);
      await this.fillInputField(page, 'input[name="address"]', businessData.address);
      await this.fillInputField(page, 'input[name="city"]', businessData.city);
      await this.fillInputField(page, 'input[name="state"]', businessData.state);
      await this.fillInputField(page, 'input[name="zip"]', businessData.zip);
      await this.fillInputField(page, 'input[name="phone"]', businessData.phone);
      await this.fillInputField(page, 'input[name="website"]', businessData.website);

      // Submit form
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        await page.waitForTimeout(3000);
      }

      return {
        directory: 'Better Business Bureau',
        success: true,
        message: 'Business registered with BBB'
      };

    } catch (error) {
      return {
        directory: 'Better Business Bureau',
        success: false,
        error: error.message
      };
    }
  }

  // Fill generic form (fallback)
  async fillGenericForm(page, businessData) {
    try {
      // Try to find common form fields
      const fields = [
        { selector: 'input[name="business_name"], input[name="company_name"], input[name="name"]', value: businessData.businessName },
        { selector: 'input[name="address"], input[name="street"], input[name="street_address"]', value: businessData.address },
        { selector: 'input[name="city"]', value: businessData.city },
        { selector: 'input[name="state"], select[name="state"]', value: businessData.state },
        { selector: 'input[name="zip"], input[name="zip_code"], input[name="postal_code"]', value: businessData.zip },
        { selector: 'input[name="phone"], input[name="telephone"], input[name="phone_number"]', value: businessData.phone },
        { selector: 'input[name="website"], input[name="url"], input[name="web_site"]', value: businessData.website }
      ];

      for (const field of fields) {
        try {
          const input = await page.$(field.selector);
          if (input) {
            await input.type(field.value);
            break;
          }
        } catch (error) {
          // Continue to next field if this one fails
        }
      }

      // Try to submit
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:contains("Submit")',
        'button:contains("Create")',
        'button:contains("Add")'
      ];

      for (const selector of submitSelectors) {
        try {
          const submitButton = await page.$(selector);
          if (submitButton) {
            await submitButton.click();
            await page.waitForTimeout(3000);
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }

      return {
        directory: 'Generic Directory',
        success: true,
        message: 'Business information submitted'
      };

    } catch (error) {
      return {
        directory: 'Generic Directory',
        success: false,
        error: error.message
      };
    }
  }

  // Helper method to fill input fields
  async fillInputField(page, selector, value) {
    try {
      const input = await page.$(selector);
      if (input) {
        await input.click();
        await input.type(value);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  // Helper method to select business category
  async selectBusinessCategory(page, businessType) {
    try {
      const categorySelectors = [
        'select[name="category"]',
        'select[name="business_category"]',
        'input[name="category"]'
      ];

      for (const selector of categorySelectors) {
        try {
          const select = await page.$(selector);
          if (select) {
            // Try to find matching option
            const options = await select.$$('option');
            for (const option of options) {
              const text = await option.textContent();
              if (text.toLowerCase().includes(businessType.toLowerCase())) {
                await option.click();
                return true;
              }
            }
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  // Get list of citation directories
  getCitationDirectories() {
    return [
      {
        name: 'Yelp',
        type: 'yelp',
        url: 'https://biz.yelp.com',
        priority: 'High'
      },
      {
        name: 'Facebook Business',
        type: 'facebook',
        url: 'https://www.facebook.com/pages/create',
        priority: 'High'
      },
      {
        name: 'Yellow Pages',
        type: 'yellowpages',
        url: 'https://www.yellowpages.com',
        priority: 'Medium'
      },
      {
        name: 'Angie\'s List',
        type: 'angi',
        url: 'https://www.angi.com',
        priority: 'Medium'
      },
      {
        name: 'Better Business Bureau',
        type: 'bbb',
        url: 'https://www.bbb.org',
        priority: 'Medium'
      },
      {
        name: 'Foursquare',
        type: 'generic',
        url: 'https://foursquare.com',
        priority: 'Low'
      },
      {
        name: 'TripAdvisor',
        type: 'generic',
        url: 'https://www.tripadvisor.com',
        priority: 'Low'
      }
    ];
  }

  // Monitor citation building progress
  async monitorCitationProgress(campaignId) {
    try {
      if (!this.brightLocalApiKey) {
        return this.getFallbackProgressData();
      }

      const response = await axios.get(
        `https://tools.brightlocal.com/seo-tools/api/v1.0/account/${this.brightLocalApiKey}/citation-campaigns/${campaignId}`
      );

      if (response.data.success) {
        return {
          campaignId: campaignId,
          status: response.data.status,
          progress: response.data.progress || 0,
          completedCitations: response.data.completed_citations || 0,
          totalCitations: response.data.total_citations || 0,
          lastUpdated: new Date().toISOString()
        };
      }

      return this.getFallbackProgressData();

    } catch (error) {
      console.error('❌ Citation progress monitoring failed:', error.message);
      return this.getFallbackProgressData();
    }
  }

  // Close browser
  async closeBrowser() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    } catch (error) {
      console.error('❌ Browser close failed:', error.message);
    }
  }

  // Utility method for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Fallback methods
  getFallbackCitationBuildingResult() {
    return {
      success: false,
      message: 'Citation building service not configured',
      results: [],
      totalSubmitted: 0,
      totalDirectories: 0
    };
  }

  getFallbackProgressData() {
    return {
      campaignId: 'fallback',
      status: 'Not Available',
      progress: 0,
      completedCitations: 0,
      totalCitations: 0,
      lastUpdated: new Date().toISOString()
    };
  }
}

module.exports = CitationBuildingService;
