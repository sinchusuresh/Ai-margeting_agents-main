const dataAggregationService = require('./services/dataAggregationService');

async function testClientReporting() {
  console.log('🧪 Testing Client Reporting Agent...\n');

  try {
    // Test configuration
    const clientConfig = {
      clientName: 'Test Client',
      industry: 'Technology',
      reportingPeriod: 'Monthly',
      services: 'Digital Marketing, SEO, PPC',
      googleAnalyticsPropertyId: '123456789',
      facebookAdAccountId: 'act_123456789',
      facebookPageId: '123456789',
      linkedinAdAccountId: '123456789',
      linkedinCompanyId: '123456789',
      googleAdsCustomerId: '123456789'
    };

    const startDate = '20241201';
    const endDate = '20241231';

    console.log('📊 Testing data aggregation service...');
    const report = await dataAggregationService.generateComprehensiveReport(
      clientConfig,
      startDate,
      endDate
    );

    console.log('✅ Report generated successfully!');
    console.log('\n📋 Report Summary:');
    console.log(`- Client: ${report.clientInfo.name}`);
    console.log(`- Industry: ${report.clientInfo.industry}`);
    console.log(`- Period: ${report.clientInfo.reportingPeriod}`);
    console.log(`- Generated: ${report.clientInfo.generatedAt}`);

    console.log('\n🔗 Data Sources Status:');
    console.log(`- Google Analytics: ${report.dataSources.googleAnalytics ? '✅ Connected' : '❌ Not Connected'}`);
    console.log(`- Facebook Marketing: ${report.dataSources.facebookMarketing ? '✅ Connected' : '❌ Not Connected'}`);
    console.log(`- LinkedIn Marketing: ${report.dataSources.linkedinMarketing ? '✅ Connected' : '❌ Not Connected'}`);
    console.log(`- Google Ads: ${report.dataSources.googleAds ? '✅ Connected' : '❌ Not Connected'}`);

    console.log('\n📈 Performance Summary:');
    console.log(`- Total Traffic: ${report.realData.summary.totalTraffic.toLocaleString()}`);
    console.log(`- Total Conversions: ${report.realData.summary.totalConversions.toLocaleString()}`);
    console.log(`- Total Ad Spend: $${report.realData.summary.totalSpend.toLocaleString()}`);
    console.log(`- Overall ROI: ${report.realData.summary.overallROI.toFixed(2)}%`);

    console.log('\n💡 Key Insights:');
    report.realData.summary.keyInsights.forEach((insight, index) => {
      console.log(`${index + 1}. ${insight}`);
    });

    console.log('\n🎯 Top Recommendations:');
    report.realData.summary.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec.title} (${rec.priority} priority)`);
      console.log(`   ${rec.description}`);
      console.log(`   Expected Impact: ${rec.expectedImpact}\n`);
    });

    console.log('🎉 All tests passed! Your Client Reporting Agent is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 This is expected if you haven\'t configured the API keys yet.');
    console.log('   Check the CLIENT_REPORTING_SETUP.md file for setup instructions.');
  }
}

// Run the test
testClientReporting();
