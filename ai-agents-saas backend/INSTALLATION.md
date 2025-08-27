# AI Marketing Agents - API Integration Installation Guide

## 🚀 New Features Added

Your social media content generator now includes:
- **Publer API Integration** - Auto-schedule posts
- **Buffer API Integration** - Social media management
- **Canva API Integration** - Visual content generation
- **Enhanced Export Options** - CSV, Google Sheets, direct API

## 📋 Prerequisites

- Node.js 16+ installed
- MongoDB running locally or cloud instance
- OpenAI API key
- Social media platform API keys (Publer, Buffer)
- Canva API access

## 🔧 Installation Steps

### 1. Install Dependencies

```bash
cd "ai-agents-saas backend"
npm install
```

### 2. Environment Setup

Copy the environment template:
```bash
cp env.example .env
```

Fill in your API keys in `.env`:
```bash
# OpenAI
OPENAI_API_KEY=sk-your_openai_api_key_here

# Social Media APIs
PUBLER_API_KEY=your_publer_api_key_here
BUFFER_API_KEY=your_buffer_api_key_here

# Canva
CANVA_API_KEY=your_canva_api_key_here
CANVA_BRAND_KIT_ID=your_brand_kit_id_here
```

### 3. Get API Keys

#### Publer API
1. Go to [Publer.io](https://publer.io)
2. Create account and go to API section
3. Generate API key
4. Add to `.env` as `PUBLER_API_KEY`

#### Buffer API
1. Go to [Buffer.com](https://buffer.com)
2. Create account and go to Developer section
3. Generate API key
4. Add to `.env` as `BUFFER_API_KEY`

#### Canva API
1. Go to [Canva Developers](https://www.canva.com/developers/)
2. Apply for API access
3. Generate API key and Brand Kit ID
4. Add to `.env` as `CANVA_API_KEY` and `CANVA_BRAND_KIT_ID`

### 4. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 🎯 New API Endpoints

### Social Media Scheduling
```bash
POST /api/ai-tools/social-media/schedule
POST /api/ai-tools/social-media/auto-schedule
```

### Visual Content Generation
```bash
POST /api/ai-tools/social-media/generate-images
```

### Export Options
```bash
POST /api/ai-tools/social-media/export
```

### Credential Validation
```bash
GET /api/ai-tools/social-media/validate-credentials
```

## 🔍 Testing the Integration

### 1. Test API Credentials
```bash
curl "http://localhost:5000/api/ai-tools/social-media/validate-credentials?platform=all" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Test Content Generation
```bash
curl -X POST "http://localhost:5000/api/ai-tools/social-media/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "business": "Test Business",
    "industry": "Technology",
    "targetAudience": "Professionals",
    "platforms": ["LinkedIn", "Instagram"],
    "contentGoals": "Lead Generation",
    "brandVoice": "Professional"
  }'
```

### 3. Test Auto-Scheduling
```bash
curl -X POST "http://localhost:5000/api/ai-tools/social-media/auto-schedule" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "contentArray": [...],
    "platform": "publer",
    "scheduleType": "weekly"
  }'
```

## 📱 Frontend Integration

Add these new options to your social media form:

```javascript
const [autoSchedule, setAutoSchedule] = useState(false);
const [selectedPlatform, setSelectedPlatform] = useState('publer');
const [generateImages, setGenerateImages] = useState(false);
const [exportFormats, setExportFormats] = useState(['csv']);

// Form JSX
<div className="api-integration-options">
  <h3>API Integrations</h3>
  
  <label>
    <input 
      type="checkbox" 
      checked={autoSchedule} 
      onChange={(e) => setAutoSchedule(e.target.checked)} 
    />
    Auto-schedule posts
  </label>
  
  {autoSchedule && (
    <select value={selectedPlatform} onChange={(e) => setSelectedPlatform(e.target.value)}>
      <option value="publer">Publer</option>
      <option value="buffer">Buffer</option>
    </select>
  )}
  
  <label>
    <input 
      type="checkbox" 
      checked={generateImages} 
      onChange={(e) => setGenerateImages(e.target.checked)} 
    />
    Generate Canva images
  </label>
</div>
```

## 🚨 Troubleshooting

### Common Issues

1. **API Key Errors**
   - Verify API keys are correct
   - Check if APIs are enabled
   - Ensure proper permissions

2. **Rate Limiting**
   - Check API rate limits
   - Implement proper error handling
   - Use fallback data when needed

3. **CORS Issues**
   - Verify CORS configuration
   - Check frontend URL in .env
   - Ensure proper headers

### Debug Mode

Enable debug logging:
```bash
DEBUG=* npm run dev
```

## 📚 API Documentation

- [Publer API Docs](https://publer.io/api/docs)
- [Buffer API Docs](https://buffer.com/developers/api)
- [Canva API Docs](https://www.canva.com/developers/)

## 🎉 What You Get

✅ **Auto-scheduling** - Content automatically posted to social platforms  
✅ **Visual Generation** - AI-powered image creation with Canva  
✅ **Multiple Export Formats** - CSV, Google Sheets, direct API integration  
✅ **Professional Workflow** - Complete social media management solution  
✅ **API Validation** - Credential checking and error handling  
✅ **Fallback Support** - Graceful degradation when APIs fail  

## 🔄 Next Steps

1. **Test all integrations** with sample content
2. **Customize visual styles** for your brand
3. **Set up automated workflows** for content scheduling
4. **Monitor API usage** and optimize costs
5. **Train your team** on the new features

Your social media content generator is now a complete social media management platform! 🚀
