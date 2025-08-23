const axios = require('axios');

async function quickTest() {
  console.log('🧪 Quick Test: SEO Audit Real Data Generation');
  
  try {
    const response = await axios.post('http://localhost:5000/api/ai-tools/seo-audit', {
      url: 'https://www.google.com'
    });
    
    console.log('✅ Response received!');
    const data = response.data.output;
    
    console.log('📊 Overall Score:', data.overallScore);
    console.log('🔍 Summary:');
    console.log('  - Failed:', data.summary?.failed);
    console.log('  - Warnings:', data.summary?.warnings);
    console.log('  - Passed:', data.summary?.passed);
    console.log('  - Total:', (data.summary?.failed || 0) + (data.summary?.warnings || 0) + (data.summary?.passed || 0));
    
    // Check if data is real
    const hasRealData = data.overallScore > 0 && 
                       data.summary?.failed > 0 &&
                       data.summary?.warnings > 0 &&
                       data.summary?.passed > 0;
    
    if (hasRealData) {
      console.log('✅ REAL DATA GENERATED!');
      console.log('📝 Sample Description:', data.technicalSEO?.metaTitle?.description);
      console.log('🔧 How to Fix:', data.technicalSEO?.metaTitle?.howToFix);
    } else {
      console.log('❌ Still getting template data');
      console.log('❌ Failed:', data.summary?.failed);
      console.log('❌ Warnings:', data.summary?.warnings);
      console.log('❌ Passed:', data.summary?.passed);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

quickTest();
