const axios = require('axios');
const fs = require('fs');
const path = require('path');

class CanvaService {
  constructor() {
    this.canvaApiKey = process.env.CANVA_API_KEY;
    this.canvaBaseUrl = 'https://api.canva.com/v1';
    this.brandKitId = process.env.CANVA_BRAND_KIT_ID;
  }

  // Create social media image template
  async createSocialMediaImage(content, platform, dimensions) {
    try {
      console.log('🎨 Creating Canva image for:', platform);
      
      const template = await this.getTemplate(platform, dimensions);
      
      const design = await axios.post(
        `${this.canvaBaseUrl}/designs/create`,
        {
          template_id: template.id,
          brand_kit_id: this.brandKitId,
          elements: [
            {
              type: 'text',
              content: content.caption,
              position: { x: 50, y: 50 },
              style: {
                font_family: 'Arial',
                font_size: 24,
                color: '#000000'
              }
            },
            {
              type: 'text',
              content: content.hashtags.join(' '),
              position: { x: 50, y: 200 },
              style: {
                font_family: 'Arial',
                font_size: 18,
                color: '#666666'
              }
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${this.canvaApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Canva image creation successful');
      return design.data;
    } catch (error) {
      console.error('❌ Canva image creation error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get platform-specific templates
  async getTemplate(platform, dimensions) {
    const templates = {
      'instagram': { id: 'instagram_post', width: 1080, height: 1080 },
      'linkedin': { id: 'linkedin_post', width: 1200, height: 627 },
      'twitter': { id: 'twitter_post', width: 1200, height: 675 },
      'facebook': { id: 'facebook_post', width: 1200, height: 630 }
    };

    return templates[platform] || templates['instagram'];
  }

  // Generate image ideas based on content
  generateImageIdeas(content) {
    const ideas = [];
    
    if (content.type === 'educational') {
      ideas.push('Infographic with key statistics');
      ideas.push('Step-by-step process diagram');
      ideas.push('Comparison chart or table');
      ideas.push('Educational illustration');
    } else if (content.type === 'engaging') {
      ideas.push('Behind-the-scenes photo collage');
      ideas.push('Interactive poll or question');
      ideas.push('Customer testimonial card');
      ideas.push('Team celebration image');
    } else if (content.type === 'promotional') {
      ideas.push('Product showcase with benefits');
      ideas.push('Special offer announcement');
      ideas.push('Success story highlight');
      ideas.push('Limited time promotion');
    } else if (content.type === 'ugc') {
      ideas.push('Customer photo showcase');
      ideas.push('Community highlight');
      ideas.push('User-generated content collage');
      ideas.push('Community celebration');
    }

    return ideas;
  }

  // Export design in multiple formats
  async exportDesign(designId, formats = ['png', 'jpg']) {
    console.log('📤 Exporting design in formats:', formats);
    
    const exports = [];
    
    for (const format of formats) {
      try {
        const response = await axios.post(
          `${this.canvaBaseUrl}/designs/${designId}/export`,
          {
            format: format,
            quality: 'high'
          },
          {
            headers: {
              'Authorization': `Bearer ${this.canvaApiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        exports.push({
          format,
          url: response.data.download_url
        });
        
        console.log(`✅ Exported ${format} successfully`);
      } catch (error) {
        console.error(`❌ Failed to export ${format}:`, error.message);
      }
    }
    
    return exports;
  }

  // Create branded template
  async createBrandedTemplate(brandColors, brandFonts, industry) {
    try {
      console.log('🎨 Creating branded template for:', industry);
      
      const template = await axios.post(
        `${this.canvaBaseUrl}/templates/create`,
        {
          name: `${industry} Social Media Template`,
          brand_kit_id: this.brandKitId,
          colors: brandColors,
          fonts: brandFonts,
          industry: industry
        },
        {
          headers: {
            'Authorization': `Bearer ${this.canvaApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Branded template creation successful');
      return template.data;
    } catch (error) {
      console.error('❌ Branded template creation error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Generate AI-powered image suggestions
  async generateAIImageSuggestions(content, style) {
    try {
      console.log('🤖 Generating AI image suggestions for:', style);
      
      const response = await axios.post(
        `${this.canvaBaseUrl}/ai/suggestions`,
        {
          content: content.caption,
          style: style,
          platform: content.platform,
          industry: content.industry
        },
        {
          headers: {
            'Authorization': `Bearer ${this.canvaApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ AI suggestions generated successfully');
      return response.data.suggestions;
    } catch (error) {
      console.error('❌ AI suggestions generation error:', error.response?.data || error.message);
      // Return fallback suggestions if AI fails
      return this.getFallbackImageSuggestions(content, style);
    }
  }

  // Fallback image suggestions
  getFallbackImageSuggestions(content, style) {
    const suggestions = {
      'modern': [
        'Clean geometric shapes with gradient backgrounds',
        'Minimalist typography with ample white space',
        'Abstract geometric patterns with brand colors',
        'Modern iconography with clean lines'
      ],
      'minimal': [
        'Simple typography on solid backgrounds',
        'Clean borders with subtle shadows',
        'Minimal color palette with focus on content',
        'Simple icon placement with clean spacing'
      ],
      'bold': [
        'High contrast color combinations',
        'Large, impactful typography',
        'Dynamic geometric shapes',
        'Strong visual hierarchy with bold elements'
      ],
      'professional': [
        'Corporate color schemes with clean layouts',
        'Professional typography with structured grids',
        'Business-focused imagery and icons',
        'Formal design elements with consistent spacing'
      ]
    };

    return suggestions[style] || suggestions['modern'];
  }

  // Validate API credentials
  async validateCredentials() {
    try {
      const response = await axios.get(`${this.canvaBaseUrl}/user/profile`, {
        headers: { 'Authorization': `Bearer ${this.canvaApiKey}` }
      });
      return { valid: true, user: response.data };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

module.exports = CanvaService;
