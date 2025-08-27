const axios = require('axios');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cheerio = require('cheerio');

puppeteer.use(StealthPlugin());

class VideoGenerationService {
  constructor() {
    this.pictoryApiKey = process.env.PICTORY_API_KEY;
    this.lumen5ApiKey = process.env.LUMEN5_API_KEY;
    this.youtubeApiKey = process.env.YOUTUBE_API_KEY;
    this.youtubeClientId = process.env.YOUTUBE_CLIENT_ID;
    this.youtubeClientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  }

  // URL Scraping for Blog Content
  async scrapeBlogContent(url) {
    try {
      console.log('🌐 Starting blog content scraping...');
      
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Extract blog content
      const content = await page.evaluate(() => {
        // Try to find main content area
        const selectors = [
          'article',
          '.post-content',
          '.entry-content',
          '.blog-content',
          '.content',
          'main',
          '[role="main"]'
        ];

        let content = '';
        let title = '';

        // Find title
        const titleSelectors = ['h1', '.post-title', '.entry-title', 'title'];
        for (const selector of titleSelectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent.trim()) {
            title = element.textContent.trim();
            break;
          }
        }

        // Find content
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent.trim().length > 100) {
            content = element.textContent.trim();
            break;
          }
        }

        // Fallback: get all text content
        if (!content) {
          const body = document.body;
          const textNodes = [];
          
          function extractText(node) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
              textNodes.push(node.textContent.trim());
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              const tag = node.tagName.toLowerCase();
              if (!['script', 'style', 'nav', 'header', 'footer', 'aside'].includes(tag)) {
                for (const child of node.childNodes) {
                  extractText(child);
                }
              }
            }
          }
          
          extractText(body);
          content = textNodes.join(' ').replace(/\s+/g, ' ').trim();
        }

        return { title, content };
      });

      await browser.close();

      if (!content.content || content.content.length < 100) {
        throw new Error('Could not extract sufficient content from the URL');
      }

      return {
        success: true,
        title: content.title,
        content: content.content.substring(0, 5000), // Limit content length
        url: url,
        scrapedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Blog scraping error:', error.message);
      return {
        success: false,
        error: error.message,
        fallback: this.generateFallbackContent(url)
      };
    }
  }

  // Generate fallback content if scraping fails
  generateFallbackContent(url) {
    return {
      title: 'Blog Content from URL',
      content: `Unable to automatically extract content from ${url}. Please copy and paste the blog content manually into the input field above.`,
      url: url
    };
  }

  // Pictory Integration for Video Generation
  async generateVideoWithPictory(scriptData, options = {}) {
    try {
      if (!this.pictoryApiKey) {
        throw new Error('Pictory API key not configured');
      }

      const videoRequest = this.transformScriptToPictory(scriptData, options);
      
      const response = await axios.post(
        'https://api.pictory.ai/v1/videos/create',
        videoRequest,
        {
          headers: {
            'Authorization': `Bearer ${this.pictoryApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        message: 'Video generation started with Pictory',
        videoId: response.data.video_id,
        status: 'processing',
        estimatedTime: '5-10 minutes'
      };

    } catch (error) {
      console.error('Pictory integration error:', error.message);
      return {
        success: false,
        message: 'Failed to generate video with Pictory',
        error: error.message,
        fallback: this.generatePictoryTemplate(scriptData, options)
      };
    }
  }

  // Transform script data to Pictory format
  transformScriptToPictory(scriptData, options) {
    const scenes = [];
    
    if (scriptData.scripts) {
      scriptData.scripts.forEach((script, index) => {
        scenes.push({
          scene_number: index + 1,
          duration: this.parseDuration(script.duration),
          text: script.script,
          visual_style: options.visualStyle || 'modern',
          background_music: options.backgroundMusic || 'upbeat',
          voice_over: options.voiceOver || 'professional'
        });
      });
    }

    return {
      project_name: `Blog-to-Video: ${scriptData.blogTitle || 'Content'}`,
      scenes: scenes,
      aspect_ratio: options.aspectRatio || '16:9',
      resolution: options.resolution || '1080p',
      language: options.language || 'en',
      voice_gender: options.voiceGender || 'neutral'
    };
  }

  // Generate Pictory template as fallback
  generatePictoryTemplate(scriptData, options) {
    return {
      type: 'text/markdown',
      filename: `pictory-template-${scriptData.blogTitle || 'video'}.md`,
      content: `# Pictory Video Generation Template

## Project Details
- **Project Name:** Blog-to-Video: ${scriptData.blogTitle || 'Content'}
- **Aspect Ratio:** ${options.aspectRatio || '16:9'}
- **Resolution:** ${options.resolution || '1080p'}
- **Language:** ${options.language || 'en'}

## Scenes
${scriptData.scripts?.map((script, index) => 
  `### Scene ${index + 1}: ${script.section}
- **Duration:** ${script.duration}
- **Script:** ${script.script}
- **Visual Style:** ${options.visualStyle || 'modern'}
- **Background Music:** ${options.backgroundMusic || 'upbeat'}
- **Voice Over:** ${options.voiceOver || 'professional'}`
).join('\n\n') || 'No scripts available'}

---
*Copy this template into Pictory manually*`
    };
  }

  // Lumen5 Integration for Video Generation
  async generateVideoWithLumen5(scriptData, options = {}) {
    try {
      if (!this.lumen5ApiKey) {
        throw new Error('Lumen5 API key not configured');
      }

      const videoRequest = this.transformScriptToLumen5(scriptData, options);
      
      const response = await axios.post(
        'https://api.lumen5.com/v1/videos/create',
        videoRequest,
        {
          headers: {
            'Authorization': `Bearer ${this.lumen5ApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        message: 'Video generation started with Lumen5',
        videoId: response.data.id,
        status: 'processing',
        estimatedTime: '3-7 minutes'
      };

    } catch (error) {
      console.error('Lumen5 integration error:', error.message);
      return {
        success: false,
        message: 'Failed to generate video with Lumen5',
        error: error.message,
        fallback: this.generateLumen5Template(scriptData, options)
      };
    }
  }

  // Transform script data to Lumen5 format
  transformScriptToLumen5(scriptData, options) {
    const slides = [];
    
    if (scriptData.scripts) {
      scriptData.scripts.forEach((script, index) => {
        slides.push({
          slide_number: index + 1,
          duration: this.parseDuration(script.duration),
          text: script.script,
          background: options.background || 'gradient',
          font: options.font || 'modern',
          color_scheme: options.colorScheme || 'professional'
        });
      });
    }

    return {
      title: `Blog-to-Video: ${scriptData.blogTitle || 'Content'}`,
      slides: slides,
      aspect_ratio: options.aspectRatio || '16:9',
      quality: options.quality || 'high',
      format: options.format || 'mp4'
    };
  }

  // Generate Lumen5 template as fallback
  generateLumen5Template(scriptData, options) {
    return {
      type: 'text/markdown',
      filename: `lumen5-template-${scriptData.blogTitle || 'video'}.md`,
      content: `# Lumen5 Video Generation Template

## Project Details
- **Title:** Blog-to-Video: ${scriptData.blogTitle || 'Content'}
- **Aspect Ratio:** ${options.aspectRatio || '16:9'}
- **Quality:** ${options.quality || 'high'}
- **Format:** ${options.format || 'mp4'}

## Slides
${scriptData.scripts?.map((script, index) => 
  `### Slide ${index + 1}: ${script.section}
- **Duration:** ${script.duration}
- **Text:** ${script.script}
- **Background:** ${options.background || 'gradient'}
- **Font:** ${options.font || 'modern'}
- **Color Scheme:** ${options.colorScheme || 'professional'}`
).join('\n\n') || 'No scripts available'}

---
*Copy this template into Lumen5 manually*`
    };
  }

  // YouTube Upload Integration
  async uploadToYouTube(videoFile, metadata) {
    try {
      if (!this.youtubeApiKey || !this.youtubeClientId || !this.youtubeClientSecret) {
        throw new Error('YouTube API credentials not configured');
      }

      // This would require OAuth2 flow for actual uploads
      // For now, return upload instructions
      return {
        success: true,
        message: 'YouTube upload instructions generated',
        instructions: this.generateYouTubeUploadInstructions(metadata),
        requirements: [
          'OAuth2 authentication required',
          'Video file must be under 128GB',
          'Supported formats: MP4, MOV, AVI, WMV'
        ]
      };

    } catch (error) {
      console.error('YouTube upload error:', error.message);
      return {
        success: false,
        message: 'Failed to generate YouTube upload instructions',
        error: error.message,
        fallback: this.generateYouTubeTemplate(metadata)
      };
    }
  }

  // Generate YouTube upload instructions
  generateYouTubeUploadInstructions(metadata) {
    return `# YouTube Upload Instructions

## Video Details
- **Title:** ${metadata.title || 'Blog-to-Video Content'}
- **Description:** ${metadata.description || 'Generated from blog content'}
- **Tags:** ${metadata.tags?.join(', ') || 'blog, video, content'}
- **Category:** ${metadata.category || 'Education'}

## Upload Steps
1. Go to [YouTube Studio](https://studio.youtube.com/)
2. Click "CREATE" → "Upload videos"
3. Select your generated video file
4. Fill in the details above
5. Set visibility (Public, Unlisted, or Private)
6. Click "PUBLISH"

## Best Practices
- Add end screens and cards for engagement
- Include relevant hashtags in description
- Set appropriate age restrictions
- Enable comments for community engagement`;
  }

  // Generate YouTube template as fallback
  generateYouTubeTemplate(metadata) {
    return {
      type: 'text/markdown',
      filename: `youtube-template-${metadata.title || 'video'}.md`,
      content: this.generateYouTubeUploadInstructions(metadata)
    };
  }

  // MP4 Export (Local file generation)
  async exportToMP4(scriptData, options = {}) {
    try {
      // This would integrate with actual video rendering
      // For now, return export instructions
      return {
        success: true,
        message: 'MP4 export instructions generated',
        instructions: this.generateMP4ExportInstructions(scriptData, options),
        fileInfo: {
          format: 'MP4',
          codec: 'H.264',
          quality: options.quality || 'high',
          estimatedSize: '50-200 MB'
        }
      };

    } catch (error) {
      console.error('MP4 export error:', error.message);
      return {
        success: false,
        message: 'Failed to generate MP4 export instructions',
        error: error.message,
        fallback: this.generateMP4Template(scriptData, options)
      };
    }
  }

  // Generate MP4 export instructions
  generateMP4ExportInstructions(scriptData, options) {
    return `# MP4 Export Instructions

## Video Specifications
- **Format:** MP4 (H.264)
- **Quality:** ${options.quality || 'high'}
- **Resolution:** ${options.resolution || '1920x1080'}
- **Frame Rate:** ${options.frameRate || '30 fps'}
- **Audio:** ${options.audio || 'AAC, 128kbps'}

## Export Steps
1. **Using Adobe Premiere Pro:**
   - File → Export → Media
   - Format: H.264
   - Preset: YouTube 1080p HD
   - Click Export

2. **Using DaVinci Resolve:**
   - Deliver → Custom → H.264
   - Resolution: 1920x1080
   - Frame Rate: 30
   - Click Add to Render Queue

3. **Using Online Tools:**
   - Upload to Kapwing, Canva, or Clipchamp
   - Export as MP4
   - Download high-quality file

## File Naming
Suggested: \`${scriptData.blogTitle?.replace(/[^a-zA-Z0-9]/g, '_') || 'blog_video'}_${new Date().toISOString().split('T')[0]}.mp4\``;
  }

  // Generate MP4 template as fallback
  generateMP4Template(scriptData, options) {
    return {
      type: 'text/markdown',
      filename: `mp4-export-${scriptData.blogTitle || 'video'}.md`,
      content: this.generateMP4ExportInstructions(scriptData, options)
    };
  }

  // Parse duration string to seconds
  parseDuration(duration) {
    if (typeof duration === 'string') {
      const match = duration.match(/(\d+)\s*(seconds?|minutes?|s|m)/i);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        if (unit.includes('minute') || unit === 'm') {
          return value * 60;
        } else {
          return value;
        }
      }
    }
    return 30; // Default to 30 seconds
  }

  // Get available integrations
  getAvailableIntegrations() {
    return {
      pictory: !!this.pictoryApiKey,
      lumen5: !!this.lumen5ApiKey,
      youtube: !!(this.youtubeApiKey && this.youtubeClientId && this.youtubeClientSecret),
      urlScraping: true // Always available (puppeteer)
    };
  }

  // Generate comprehensive video production guide
  generateVideoProductionGuide(scriptData) {
    return {
      type: 'text/markdown',
      filename: `video-production-guide-${scriptData.blogTitle || 'content'}.md`,
      content: `# 🎬 Video Production Guide

## 📋 Pre-Production Checklist
- [ ] Script finalized and timed
- [ ] Visual assets gathered (images, graphics, icons)
- [ ] Background music selected
- [ ] Voice-over script prepared
- [ ] Storyboard approved

## 🎥 Production Tools
### Free Options
- **Canva Video**: Easy templates and animations
- **Kapwing**: Online video editor
- **Clipchamp**: Browser-based editing
- **OpenShot**: Desktop video editor

### Professional Options
- **Adobe Premiere Pro**: Industry standard
- **DaVinci Resolve**: Free professional editing
- **Final Cut Pro**: Mac-only professional editor
- **Camtasia**: Screen recording and editing

## 🎵 Audio Resources
### Free Music
- YouTube Audio Library
- Free Music Archive
- ccMixter
- Incompetech

### Voice-over Options
- **Text-to-Speech**: Google Text-to-Speech, Amazon Polly
- **Professional VO**: Fiverr, Upwork, Voices.com
- **DIY Recording**: Use smartphone with quiet environment

## 🎨 Visual Elements
### Text Overlays
- Use high-contrast colors
- Keep text on screen for 3-5 seconds
- Use readable fonts (Arial, Helvetica, Roboto)
- Add subtle animations

### Transitions
- Keep transitions under 1 second
- Use consistent transition style
- Avoid flashy effects for professional content
- Cross-fade works well for most content

## 📱 Platform Optimization
### YouTube
- **Thumbnail**: 1280x720px, eye-catching
- **Description**: Include keywords and timestamps
- **Tags**: Use relevant, trending hashtags
- **End Screen**: Add subscribe button and related videos

### Instagram Reels
- **Aspect Ratio**: 9:16 (vertical)
- **Duration**: 15-60 seconds
- **Text**: Large, readable fonts
- **Music**: Use trending audio

### TikTok
- **Aspect Ratio**: 9:16 (vertical)
- **Duration**: 15-60 seconds
- **Trending**: Follow current challenges and sounds
- **Engagement**: Ask questions in captions

## 🚀 Publishing Checklist
- [ ] Video exported in highest quality
- [ ] Thumbnail created and uploaded
- [ ] Description written with keywords
- [ ] Tags added for discoverability
- [ ] Playlist added if applicable
- [ ] Social media promotion planned

## 📊 Analytics to Track
- **Views**: Total video views
- **Watch Time**: Average view duration
- **Engagement**: Likes, comments, shares
- **Click-through Rate**: Thumbnail performance
- **Subscriber Growth**: New subscribers from video

---
*Use this guide to create professional videos from your blog content!*`
    };
  }
}

module.exports = VideoGenerationService;
