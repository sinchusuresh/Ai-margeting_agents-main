const axios = require('axios');

console.log('🧪 Testing SEO Audit Tool with OpenAI API...\n');

async function testSEOAudit() {
  try {
    // Test the SEO audit endpoint
    const response = await axios.post('http://localhost:5000/api/ai-tools/seo-audit', {
      input: {
        url: 'https://example.com'
      }
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ SEO Audit Test Successful!');
    console.log('📊 Response Status:', response.status);
    
    if (response.data.output) {
      console.log('🎯 Overall Score:', response.data.output.overallScore);
      console.log('📈 Summary:', response.data.output.summary);
      console.log('🔧 Technical SEO Status:', response.data.output.technicalSEO?.metaTitle?.status);
      
      // Test new sections
      console.log('🏗️  Site Architecture Status:', response.data.output.siteArchitecture?.siteMap?.status);
      console.log('🔄 Cross Page Optimizations Status:', response.data.output.crossPageOptimizations?.contentConsistency?.status);
      
      console.log('\n📋 Full Response Preview:');
      console.log(JSON.stringify(response.data.output, null, 2).substring(0, 500) + '...');
    } else {
      console.log('⚠️  No output data received');
      console.log('📄 Full Response:', response.data);
    }

  } catch (error) {
    console.error('❌ SEO Audit Test Failed:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else if (error.request) {
      console.error('No response received - server may not be running');
      console.error('Make sure to start your backend server first: npm start');
    } else {
      console.error('Error:', error.message);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure backend server is running (npm start)');
    console.log('2. Check that .env file exists with OpenAI API key');
    console.log('3. Verify server shows "✅ OpenAI API key configured"');
  }
}

// Run the test
testSEOAudit(); 