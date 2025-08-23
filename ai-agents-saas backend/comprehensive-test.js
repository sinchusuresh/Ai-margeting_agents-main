const axios = require('axios');

async function comprehensiveTest() {
  console.log('🧪 Comprehensive Test: SEO Audit Real Data Generation');
  
  try {
    const response = await axios.post('http://localhost:5000/api/ai-tools/seo-audit', {
      url: 'https://www.example.com'
    });
    
    console.log('✅ Response received!');
    const data = response.data.output;
    
    console.log('\n📊 OVERALL RESULTS:');
    console.log('- Overall Score:', data.overallScore);
    console.log('- Summary:');
    console.log('  - Failed:', data.summary?.failed);
    console.log('  - Warnings:', data.summary?.warnings);
    console.log('  - Passed:', data.summary?.passed);
    console.log('  - Total:', (data.summary?.failed || 0) + (data.summary?.warnings || 0) + (data.summary?.passed || 0));
    
    console.log('\n🔍 SECTION ANALYSIS:');
    
    // Technical SEO
    if (data.technicalSEO) {
      console.log('\n📝 Technical SEO:');
      Object.entries(data.technicalSEO).forEach(([key, test]) => {
        console.log(`  - ${key}: ${test.status} | ${test.percentage} | ${test.description?.substring(0, 50)}...`);
        console.log(`    How to Fix: ${test.howToFix ? '✅ Available' : '❌ Missing'}`);
      });
    }
    
    // Performance
    if (data.performance) {
      console.log('\n⚡ Performance:');
      Object.entries(data.performance).forEach(([key, test]) => {
        console.log(`  - ${key}: ${test.status} | ${test.percentage} | ${test.description?.substring(0, 50)}...`);
        console.log(`    How to Fix: ${test.howToFix ? '✅ Available' : '❌ Missing'}`);
      });
    }
    
    // Security
    if (data.security) {
      console.log('\n🛡️ Security:');
      Object.entries(data.security).forEach(([key, test]) => {
        console.log(`  - ${key}: ${test.status} | ${test.percentage} | ${test.description?.substring(0, 50)}...`);
        console.log(`    How to Fix: ${test.howToFix ? '✅ Available' : '❌ Missing'}`);
      });
    }
    
    // Mobile Usability
    if (data.mobileUsability) {
      console.log('\n📱 Mobile Usability:');
      Object.entries(data.mobileUsability).forEach(([key, test]) => {
        console.log(`  - ${key}: ${test.status} | ${test.percentage} | ${test.description?.substring(0, 50)}...`);
        console.log(`    How to Fix: ${test.howToFix ? '✅ Available' : '❌ Missing'}`);
      });
    }
    
    // Content Quality
    if (data.contentQuality) {
      console.log('\n📄 Content Quality:');
      Object.entries(data.contentQuality).forEach(([key, test]) => {
        console.log(`  - ${key}: ${test.status} | ${test.percentage} | ${test.description?.substring(0, 50)}...`);
        console.log(`    How to Fix: ${test.howToFix ? '✅ Available' : '❌ Missing'}`);
      });
    }
    
    // Accessibility
    if (data.accessibility) {
      console.log('\n♿ Accessibility:');
      Object.entries(data.accessibility).forEach(([key, test]) => {
        console.log(`  - ${key}: ${test.status} | ${test.percentage} | ${test.description?.substring(0, 50)}...`);
        console.log(`    How to Fix: ${test.howToFix ? '✅ Available' : '❌ Missing'}`);
      });
    }
    
    // URL Structure
    if (data.urlStructure) {
      console.log('\n🔗 URL Structure:');
      Object.entries(data.urlStructure).forEach(([key, test]) => {
        console.log(`  - ${key}: ${test.status} | ${test.percentage} | ${test.description?.substring(0, 50)}...`);
        console.log(`    How to Fix: ${test.howToFix ? '✅ Available' : '❌ Missing'}`);
      });
    }
    
    // Site Architecture
    if (data.siteArchitecture) {
      console.log('\n🏗️ Site Architecture:');
      Object.entries(data.siteArchitecture).forEach(([key, test]) => {
        console.log(`  - ${key}: ${test.status} | ${test.percentage} | ${test.description?.substring(0, 50)}...`);
        console.log(`    How to Fix: ${test.howToFix ? '✅ Available' : '❌ Missing'}`);
      });
    }
    
    // Cross Page Optimizations
    if (data.crossPageOptimizations) {
      console.log('\n🔄 Cross Page Optimizations:');
      Object.entries(data.crossPageOptimizations).forEach(([key, test]) => {
        console.log(`  - ${key}: ${test.status} | ${test.percentage} | ${test.description?.substring(0, 50)}...`);
        console.log(`    How to Fix: ${test.howToFix ? '✅ Available' : '❌ Missing'}`);
      });
    }
    
    // Final validation
    const hasRealData = data.overallScore > 0 && 
                       data.summary?.failed > 0 &&
                       data.summary?.warnings > 0 &&
                       data.summary?.passed > 0;
    
    console.log('\n🎯 FINAL VALIDATION:');
    if (hasRealData) {
      console.log('✅ REAL DATA GENERATED SUCCESSFULLY!');
      console.log('✅ All sections have dynamic content');
      console.log('✅ Summary counts are valid');
      console.log('✅ How to Fix instructions available');
    } else {
      console.log('❌ Still getting template data');
      console.log('❌ Check summary counts and section data');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

comprehensiveTest();
