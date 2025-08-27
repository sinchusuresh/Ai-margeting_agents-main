const express = require('express');
const router = express.Router();
const { generateContent, isOpenAIConfigured } = require('../utils/openai-client');

// POST /api/openai/generate
router.post('/generate', async (req, res) => {
  try {
    const { prompt, model = 'gpt-4', temperature = 0.7, maxTokens = 3000 } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt is required'
      });
    }

    // Check if OpenAI API key is configured
    if (!isOpenAIConfigured()) {
      console.error('OpenAI API key not configured');
      return res.status(500).json({
        error: 'OpenAI API key not configured on the server'
      });
    }

    console.log(`Generating content with prompt: ${prompt.substring(0, 100)}...`);

    // Generate content using the centralized client
    const content = await generateContent(prompt, {
      model,
      maxTokens,
      temperature
    });

    if (!content) {
      throw new Error('No content generated from OpenAI API');
    }

    console.log('Content generated successfully');

    res.json({
      success: true,
      content,
      model,
      temperature,
      maxTokens
    });

  } catch (error) {
    console.error('Error generating content:', error);
    
    let errorMessage = 'Failed to generate content';
    let statusCode = 500;

    if (error.message.includes('rate limit')) {
      errorMessage = 'Rate limit exceeded. Please try again later.';
      statusCode = 429;
    } else if (error.message.includes('API key')) {
      errorMessage = 'Invalid or expired API key.';
      statusCode = 401;
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      errorMessage = 'Network error. Please check your connection and try again.';
      statusCode = 503;
    }

    res.status(statusCode).json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
