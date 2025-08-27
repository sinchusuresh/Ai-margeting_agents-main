// Generate Competitor Analysis using the comprehensive service
async function generateCompetitorAnalysis(input) {
  try {
    console.log('🚀 Starting comprehensive competitor analysis...');
    
    // Parse competitors from text area (one per line)
    const competitorUrls = input.competitors.split('\n').filter(url => url.trim().startsWith('http'));
    
    if (competitorUrls.length === 0) {
      throw new Error('No valid competitor URLs provided');
    }

    if (competitorUrls.length > 3) {
      throw new Error('Maximum 3 competitor URLs allowed');
    }

    console.log(`Analyzing ${competitorUrls.length} competitors:`, competitorUrls);
    
    // Use the comprehensive Competitor Analysis Service
    const competitorService = new CompetitorAnalysisService();
    const analysisResult = await competitorService.analyzeCompetitors(
      competitorUrls, 
      input.industry || 'Business', 
      input.analysisFocus || 'Comprehensive'
    );
    
    console.log('✅ Competitor analysis completed successfully');
    return analysisResult;
    
  } catch (error) {
    console.error('❌ Error in competitor analysis service:', error);
    
    // Fallback to OpenAI if service fails
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-...') {
      try {
        console.log('🔄 Falling back to OpenAI for competitor analysis...');
        return await generateCompetitorAnalysisWithOpenAI(input);
      } catch (openaiError) {
        console.error('❌ OpenAI fallback also failed:', openaiError);
        throw error;
      }
    } else {
      throw error;
    }
  }
}

// Fallback OpenAI function for competitor analysis
async function generateCompetitorAnalysisWithOpenAI(input) {
  const prompt = `Generate a comprehensive competitor analysis in JSON format for:
  
  Business: ${input.yourBusiness || 'Your business'}
  Industry: ${input.industry || 'Business industry'}
  Competitors: ${input.competitors || 'Competitor 1, Competitor 2, Competitor 3'}
  Analysis Focus: ${input.analysisFocus || 'Marketing strategy'}
  
  Generate a JSON object with this structure:
  {
    "competitorProfiles": [
      {
        "competitorName": "Competitor Name",
        "strengths": ["strength1", "strength2"],
        "weaknesses": ["weakness1", "weakness2"],
        "opportunities": ["opportunity1", "opportunity2"],
        "threats": ["threat1", "threat2"],
        "marketPosition": "Market position description",
        "uniqueValueProposition": "Value proposition description"
      }
    ],
    "swotAnalysis": {
      "yourStrengths": ["strength1", "strength2"],
      "yourWeaknesses": ["weakness1", "weakness2"],
      "opportunities": ["opportunity1", "opportunity2"],
      "threats": ["threat1", "threat2"]
    },
    "competitiveAdvantages": {
      "priceAdvantage": "Price advantage description",
      "qualityAdvantage": "Quality advantage description",
      "serviceAdvantage": "Service advantage description",
      "innovationAdvantage": "Innovation advantage description"
    },
    "marketGaps": ["gap1", "gap2"],
    "strategicRecommendations": [
      {
        "recommendation": "Strategic advice",
        "impact": "High/Medium/Low - Description",
        "effort": "High/Medium/Low - Description",
        "timeline": "Expected timeline"
      }
    ],
    "performanceMetrics": {
      "marketShare": "Estimated market share",
      "customerSatisfaction": "Satisfaction score",
      "retentionRate": "Customer retention rate",
      "growthRate": "Growth rate"
    }
  }`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 3000,
      temperature: 0.7
    });

    const response = completion.choices[0].message.content;
    console.log('OpenAI response received for competitor analysis');
    
    try {
      const output = JSON.parse(response);
      console.log('JSON parsed successfully for competitor analysis');
      return output;
    } catch (parseError) {
      console.error('JSON parsing error for competitor analysis:', parseError);
      throw new Error('Failed to parse OpenAI response');
    }
  } catch (error) {
    console.error('OpenAI API error for competitor analysis:', error);
    throw error;
  }
}
