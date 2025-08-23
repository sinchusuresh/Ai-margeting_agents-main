const axios = require('axios');

async function testSEO() {
  try {
    console.log('🧪 Testing SEO Audit Tool...');
    
    const response = await axios.post('http://localhost:5000/api/ai-tools/seo-audit', {
      input: { url: 'https://example.com' }
    });
    
    console.log('✅ Response received');
    console.log('📊 Overall Score:', response.data.output?.overallScore);
    
    // Check if new sections exist
    console.log('🏗️  Site Architecture exists:', !!response.data.output?.siteArchitecture);
    console.log('🔄 Cross Page Optimizations exists:', !!response.data.output?.crossPageOptimizations);
    
    if (response.data.output?.siteArchitecture) {
      console.log('🏗️  Site Architecture sections:', Object.keys(response.data.output.siteArchitecture));
    }
    
    if (response.data.output?.crossPageOptimizations) {
      console.log('🔄 Cross Page Optimizations sections:', Object.keys(response.data.output.crossPageOptimizations));
    }
    
    // Check if score is different
    console.log('🎯 Score variation check - should be different each time');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testSEO(); 