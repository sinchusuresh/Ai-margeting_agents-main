
const dataAggregationService = require('../services/dataAggregationService');

// Generate Client Report using real data + AI insights
async function generateClientReport(input) {
  try {
    // Validate input
    if (!input || typeof input !== 'object') {
      console.warn('Invalid input for client report generation, using fallback data');
      return getFallbackData('client-reporting', input);
    }

    console.log('🚀 Starting comprehensive client report generation...');

    // Calculate date range for the reporting period
    const endDate = new Date();
    let startDate = new Date();
    
    switch (input.reportingPeriod?.toLowerCase()) {
      case 'weekly':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 1); // Default to monthly
    }

    const startDateStr = startDate.toISOString().slice(0, 10).replace(/-/g, '');
    const endDateStr = endDate.toISOString().slice(0, 10).replace(/-/g, '');

    // Prepare client configuration for data fetching
    const clientConfig = {
      clientName: input.clientName || 'Client',
      industry: input.industry || 'Business',
      reportingPeriod: input.reportingPeriod || 'Monthly',
      services: input.services || 'Marketing services',
      // Platform IDs (these would be configured per client)
      googleAnalyticsPropertyId: input.googleAnalyticsPropertyId || '123456789',
      facebookAdAccountId: input.facebookAdAccountId || 'act_123456789',
      facebookPageId: input.facebookPageId || '123456789',
      linkedinAdAccountId: input.linkedinAdAccountId || '123456789',
      linkedinCompanyId: input.linkedinCompanyId || '123456789',
      googleAdsCustomerId: input.googleAdsCustomerId || '123456789'
    };

    // Fetch real data from all platforms
    console.log('📊 Fetching real-time data from marketing platforms...');
    const realData = await dataAggregationService.generateComprehensiveReport(
      clientConfig,
      startDateStr,
      endDateStr
    );

    // Generate AI insights and recommendations based on real data
    const aiPrompt = `Based on the following real marketing data, generate comprehensive insights and recommendations:

CLIENT: ${clientConfig.clientName}
INDUSTRY: ${clientConfig.industry}
REPORTING PERIOD: ${clientConfig.reportingPeriod}

REAL DATA SUMMARY:
- Total Traffic: ${realData.summary.totalTraffic.toLocaleString()}
- Total Conversions: ${realData.summary.totalConversions.toLocaleString()}
- Total Ad Spend: $${realData.summary.totalSpend.toLocaleString()}
- Total Revenue: $${realData.summary.totalRevenue.toLocaleString()}
- Overall ROI: ${realData.summary.overallROI.toFixed(2)}%

KEY INSIGHTS FROM DATA:
${realData.summary.keyInsights.map(insight => `- ${insight}`).join('\n')}

TOP PERFORMING CHANNELS:
${realData.summary.topPerformingChannels.map(channel => `- ${channel.name}: ${channel.metric.toLocaleString()} ${channel.type}`).join('\n')}

Generate a comprehensive executive summary, detailed analysis, and actionable recommendations. Focus on:
1. Performance analysis based on real metrics
2. Data-driven insights
3. Specific, actionable recommendations
4. Industry-specific insights for ${clientConfig.industry}

Return in this JSON format:
{
  "executiveSummary": {
    "overview": "Comprehensive analysis based on real data...",
    "keyAchievements": ["Specific achievement 1", "Specific achievement 2"],
    "challenges": ["Specific challenge 1", "Specific challenge 2"],
    "recommendations": ["Specific recommendation 1", "Specific recommendation 2"]
  },
  "performanceAnalysis": {
    "trafficAnalysis": "Detailed traffic analysis based on real data...",
    "conversionAnalysis": "Detailed conversion analysis...",
    "roiAnalysis": "Detailed ROI analysis...",
    "channelPerformance": "Detailed channel performance analysis..."
  },
  "strategicRecommendations": {
    "immediateActions": ["Action 1", "Action 2"],
    "longTermStrategy": "Long-term strategic plan...",
    "budgetAllocation": "Specific budget recommendations...",
    "expectedOutcomes": "Expected results from recommendations..."
  }
}`;

    // Generate AI insights
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: 'system', content: 'You are an expert marketing analyst. Generate data-driven insights and recommendations based on real marketing data. Be specific, actionable, and industry-relevant.' },
        { role: 'user', content: aiPrompt }
      ],
      max_tokens: 3000,
      temperature: 0.7
    });

    const aiInsights = JSON.parse(aiResponse.choices[0].message.content);

    // Combine real data with AI insights
    const comprehensiveReport = {
      clientInfo: realData.clientInfo,
      dataSources: realData.dataSources,
      realData: realData,
      aiInsights: aiInsights,
      generatedAt: new Date().toISOString()
    };

    console.log('✅ Comprehensive client report generated successfully');
    return comprehensiveReport;

  } catch (error) {
    console.error('❌ Client report generation failed:', error.message);
    
    // Handle specific OpenAI errors
    if (error.response) {
      if (error.response.status === 429) {
        console.error('Rate limit exceeded - using fallback data');
      } else if (error.response.status === 401) {
        console.error('OpenAI API key invalid or expired - using fallback data');
      } else if (error.response.status === 429 && error.response.data?.error?.code === 'insufficient_quota') {
        console.error('OpenAI API quota exceeded - using fallback data');
      } else {
        console.error(`OpenAI API error ${error.response.status}: ${error.response.data?.error?.message || 'Unknown error'}`);
      }
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('Network error - using fallback data');
    } else {
      console.error('Unknown error in client report generation:', error.message);
    }
    
    // Return fallback data instead of crashing
    return getFallbackData('client-reporting', input);
  }
}

