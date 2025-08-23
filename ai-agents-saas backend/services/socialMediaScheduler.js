const axios = require('axios');
const cron = require('node-cron');

class SocialMediaScheduler {
  constructor() {
    this.publerApiKey = process.env.PUBLER_API_KEY;
    this.bufferApiKey = process.env.BUFFER_API_KEY;
    this.publerBaseUrl = 'https://api.publer.io/v1';
    this.bufferBaseUrl = 'https://api.bufferapp.com/1';
  }

  // Schedule content with Publer
  async scheduleWithPubler(content, schedule) {
    try {
      console.log('📅 Scheduling with Publer:', content.platform);
      
      const response = await axios.post(
        `${this.publerBaseUrl}/posts/schedule`,
        {
          content: content.caption,
          media: content.media || [],
          platforms: content.platforms,
          scheduled_at: schedule.postTime,
          hashtags: content.hashtags
        },
        {
          headers: {
            'Authorization': `Bearer ${this.publerApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Publer scheduling successful');
      return response.data;
    } catch (error) {
      console.error('❌ Publer scheduling error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Schedule content with Buffer
  async scheduleWithBuffer(content, schedule) {
    try {
      console.log('📅 Scheduling with Buffer:', content.platform);
      
      const response = await axios.post(
        `${this.bufferBaseUrl}/updates/create.json`,
        {
          text: content.caption,
          scheduled_at: schedule.postTime,
          profile_ids: content.profileIds
        },
        {
          headers: {
            'Authorization': `Bearer ${this.bufferApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Buffer scheduling successful');
      return response.data;
    } catch (error) {
      console.error('❌ Buffer scheduling error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Auto-schedule weekly content
  async autoScheduleWeekly(contentArray, platform) {
    console.log(`🚀 Auto-scheduling ${contentArray.length} posts with ${platform}`);
    
    const schedule = this.generateWeeklySchedule();
    const results = [];
    
    for (let i = 0; i < contentArray.length; i++) {
      const content = contentArray[i];
      const postTime = schedule[i];
      
      try {
        let result;
        if (platform === 'publer') {
          result = await this.scheduleWithPubler(content, { postTime });
        } else if (platform === 'buffer') {
          result = await this.scheduleWithBuffer(content, { postTime });
        }
        
        results.push({
          postIndex: i + 1,
          postTime,
          status: 'success',
          result
        });
        
        console.log(`✅ Scheduled post ${i + 1} for ${postTime}`);
      } catch (error) {
        results.push({
          postIndex: i + 1,
          postTime,
          status: 'failed',
          error: error.message
        });
        
        console.error(`❌ Failed to schedule post ${i + 1}:`, error.message);
      }
    }
    
    return {
      platform,
      totalPosts: contentArray.length,
      successfulPosts: results.filter(r => r.status === 'success').length,
      failedPosts: results.filter(r => r.status === 'failed').length,
      results
    };
  }

  // Generate optimal posting schedule
  generateWeeklySchedule() {
    const schedule = [];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const times = ['9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM'];
    
    days.forEach(day => {
      times.forEach(time => {
        schedule.push(`${day} ${time}`);
      });
    });
    
    return schedule;
  }

  // Get platform-specific posting times
  getOptimalPostingTimes(platform, industry) {
    const platformTimes = {
      'instagram': {
        'general': ['9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM'],
        'b2b': ['8:00 AM', '11:00 AM', '2:00 PM', '5:00 PM'],
        'b2c': ['10:00 AM', '1:00 PM', '4:00 PM', '7:00 PM']
      },
      'linkedin': {
        'general': ['8:00 AM', '11:00 AM', '2:00 PM', '5:00 PM'],
        'b2b': ['7:00 AM', '10:00 AM', '1:00 PM', '4:00 PM'],
        'b2c': ['9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM']
      },
      'twitter': {
        'general': ['8:00 AM', '12:00 PM', '4:00 PM', '8:00 PM'],
        'b2b': ['7:00 AM', '11:00 AM', '3:00 PM', '7:00 PM'],
        'b2c': ['9:00 AM', '1:00 PM', '5:00 PM', '9:00 PM']
      },
      'facebook': {
        'general': ['9:00 AM', '1:00 PM', '5:00 PM', '8:00 PM'],
        'b2b': ['8:00 AM', '12:00 PM', '4:00 PM', '7:00 PM'],
        'b2c': ['10:00 AM', '2:00 PM', '6:00 PM', '9:00 PM']
      }
    };

    const industryType = industry?.toLowerCase().includes('b2b') ? 'b2b' : 
                        industry?.toLowerCase().includes('b2c') ? 'b2c' : 'general';
    
    return platformTimes[platform]?.[industryType] || platformTimes[platform]?.['general'] || ['9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM'];
  }

  // Validate API credentials
  async validateCredentials(platform) {
    try {
      if (platform === 'publer') {
        const response = await axios.get(`${this.publerBaseUrl}/user/profile`, {
          headers: { 'Authorization': `Bearer ${this.publerApiKey}` }
        });
        return { valid: true, user: response.data };
      } else if (platform === 'buffer') {
        const response = await axios.get(`${this.bufferBaseUrl}/user.json`, {
          headers: { 'Authorization': `Bearer ${this.bufferApiKey}` }
        });
        return { valid: true, user: response.data };
      }
      return { valid: false, error: 'Invalid platform' };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

module.exports = SocialMediaScheduler;
