/**
 * Shared OpenAI client utility for backend AI tools
 * Provides a unified interface for OpenAI API calls across the backend
 */

const axios = require('axios');

/**
 * OpenAI API configuration and options
 */
const OPENAI_CONFIG = {
  baseURL: 'https://api.openai.com/v1',
  defaultModel: 'gpt-4',
  defaultMaxTokens: 3000,
  defaultTemperature: 0.7,
  maxRetries: 3
};

/**
 * Check if OpenAI API key is configured
 * @returns {boolean} True if API key is available
 */
function isOpenAIConfigured() {
  const apiKey = process.env.OPENAI_API_KEY;
  return apiKey && apiKey !== 'your-openai-api-key-here' && apiKey.trim() !== '';
}

/**
 * Get OpenAI API key from environment
 * @returns {string} The API key
 * @throws {Error} If API key is not configured
 */
function getOpenAIAPIKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in your environment.');
  }
  return apiKey;
}

/**
 * Make a request to OpenAI API with retry logic
 * @param {Object} options - Request options
 * @param {Array} options.messages - Array of message objects
 * @param {string} options.model - Model to use (default: gpt-4)
 * @param {number} options.maxTokens - Maximum tokens (default: 3000)
 * @param {number} options.temperature - Temperature (default: 0.7)
 * @param {number} options.retries - Number of retries (default: 3)
 * @returns {Promise<string>} Generated content
 */
async function makeOpenAIRequest(options = {}) {
  const {
    messages,
    model = OPENAI_CONFIG.defaultModel,
    maxTokens = OPENAI_CONFIG.defaultMaxTokens,
    temperature = OPENAI_CONFIG.defaultTemperature,
    retries = OPENAI_CONFIG.maxRetries
  } = options;

  if (!messages || !Array.isArray(messages)) {
    throw new Error('Messages array is required');
  }

  const apiKey = getOpenAIAPIKey();

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`OpenAI API attempt ${attempt + 1}/${retries + 1}`);
      
      const response = await axios.post(
        `${OPENAI_CONFIG.baseURL}/chat/completions`,
        {
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );
      
      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content generated from OpenAI API');
      }
      
      console.log('OpenAI API call successful');
      return content;
      
    } catch (error) {
      console.error(`OpenAI API attempt ${attempt + 1} failed:`, error.message);
      
      // Handle rate limiting
      if (error.response && error.response.status === 429) {
        if (attempt < retries) {
          const waitTime = Math.pow(2, attempt + 1) * 2000; // Exponential backoff
          console.log(`Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        } else {
          throw new Error('Rate limit exceeded after all retries. Please try again later.');
        }
      }
      
      // Handle authentication errors
      if (error.response && error.response.status === 401) {
        throw new Error('Invalid or expired OpenAI API key. Please check your configuration.');
      }
      
      // Handle quota exceeded
      if (error.response && error.response.status === 429 && error.response.data?.error?.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please check your account balance.');
      }
      
      // If it's the last attempt, throw the error
      if (attempt === retries) {
        throw error;
      }
      
      // For other errors, wait and retry
      const waitTime = Math.pow(2, attempt + 1) * 1000;
      console.log(`Waiting ${waitTime}ms before retry ${attempt + 1}`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw new Error('All retry attempts failed');
}

/**
 * Generate content using OpenAI API
 * @param {string} prompt - The prompt to send to OpenAI
 * @param {Object} options - Optional parameters
 * @returns {Promise<string>} Generated content
 */
async function generateContent(prompt, options = {}) {
  const messages = [
    {
      role: 'system',
      content: 'You are a helpful AI assistant that generates high-quality, professional content.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];
  
  return makeOpenAIRequest({
    messages,
    ...options
  });
}

/**
 * Generate content with specific system prompt
 * @param {string} systemPrompt - System prompt to set the AI's role
 * @param {string} userPrompt - User prompt for content generation
 * @param {Object} options - Optional parameters
 * @returns {Promise<string>} Generated content
 */
async function generateContentWithRole(systemPrompt, userPrompt, options = {}) {
  const messages = [
    {
      role: 'system',
      content: systemPrompt
    },
    {
      role: 'user',
      content: userPrompt
    }
  ];
  
  return makeOpenAIRequest({
    messages,
    ...options
  });
}

/**
 * Check if OpenAI is available and configured
 * @returns {Promise<boolean>} True if OpenAI is available
 */
async function isOpenAIAvailable() {
  try {
    if (!isOpenAIConfigured()) {
      return false;
    }
    
    // Test with a simple prompt
    await generateContent('Test', { maxTokens: 10 });
    return true;
  } catch (error) {
    console.error('OpenAI availability check failed:', error.message);
    return false;
  }
}

module.exports = {
  isOpenAIConfigured,
  getOpenAIAPIKey,
  makeOpenAIRequest,
  generateContent,
  generateContentWithRole,
  isOpenAIAvailable,
  OPENAI_CONFIG
};
