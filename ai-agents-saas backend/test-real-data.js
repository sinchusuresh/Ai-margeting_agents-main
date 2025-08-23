const axios = require('axios');

async function testRealData() {
  console.log('🧪 Testing Real Data Generation...');
  
  try {
    const response = await axios.post('http://localhost:5000/api/ai-tools/seo-audit', {
      url: 'https://www.example.com'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Response received!');
    console.log('📊 Overall Score:', response.data.output.overallScore);
    console.log('🔍 Summary:', response.data.output.summary);
    
    // Check if data is real (not template)
    const hasRealData = response.data.output.overallScore > 0 && 
                       response.data.output.summary.failed > 0 &&
                       response.data.output.technicalSEO?.metaTitle?.description;
    
    if (hasRealData) {
      console.log('✅ REAL DATA GENERATED!');
      console.log('📝 Meta Title Description:', response.data.output.technicalSEO.metaTitle.description);
      console.log('🔧 How to Fix:', response.data.output.technicalSEO.metaTitle.howToFix);
    } else {
      console.log('❌ Still getting template data');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testRealData();
