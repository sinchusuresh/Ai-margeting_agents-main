/**
 * Shared OpenAI client utility for all AI tools
 * Provides a unified interface for content generation across the application
 */

export interface OpenAIOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ContentGenerationResult {
  success: boolean;
  content: string | null;
  error?: string;
}

/**
 * Generate content using OpenAI API
 * @param prompt - The prompt to send to OpenAI
 * @param options - Optional parameters for the API call
 * @returns Promise with the generation result
 */
export async function generateContent(
  prompt: string, 
  options: OpenAIOptions = {}
): Promise<ContentGenerationResult> {
  try {
    // Check if API key is available
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your-openai-api-key-here') {
      console.error('OpenAI API key not configured');
      return {
        success: false,
        content: null,
        error: 'OpenAI API key not configured. Please set NEXT_PUBLIC_OPENAI_API_KEY in your environment.'
      };
    }

    // Default options
    const {
      model = 'gpt-4',
      temperature = 0.7,
      maxTokens = 3000
    } = options;

    // Make the API call to our backend
    const response = await fetch('/api/openai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model,
        temperature,
        maxTokens
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      return {
        success: false,
        content: null,
        error: data.error
      };
    }

    return {
      success: true,
      content: data.content
    };

  } catch (error) {
    console.error('OpenAI API call failed:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return {
          success: false,
          content: null,
          error: 'Invalid or expired API key. Please check your configuration.'
        };
      } else if (error.message.includes('rate limit')) {
        return {
          success: false,
          content: null,
          error: 'Rate limit exceeded. Please wait a moment and try again.'
        };
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        return {
          success: false,
          content: null,
          error: 'Network error. Please check your connection and try again.'
        };
      }
    }

    return {
      success: false,
      content: null,
      error: 'Failed to generate content. Please try again.'
    };
  }
}

/**
 * Generate content with retry logic
 * @param prompt - The prompt to send to OpenAI
 * @param options - Optional parameters for the API call
 * @param maxRetries - Maximum number of retry attempts
 * @returns Promise with the generation result
 */
export async function generateContentWithRetry(
  prompt: string,
  options: OpenAIOptions = {},
  maxRetries: number = 2
): Promise<ContentGenerationResult> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await generateContent(prompt, options);
      
      if (result.success) {
        return result;
      }
      
      // If it's a rate limit error and we have retries left, wait and retry
      if (result.error?.includes('rate limit') && attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt + 1) * 1000; // Exponential backoff
        console.log(`Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // For other errors, return immediately
      return result;
      
    } catch (error) {
      if (attempt === maxRetries) {
        console.error('All retry attempts failed:', error);
        return {
          success: false,
          content: null,
          error: 'Failed to generate content after multiple attempts.'
        };
      }
      
      // Wait before retrying
      const waitTime = Math.pow(2, attempt + 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  return {
    success: false,
    content: null,
    error: 'Failed to generate content after multiple attempts.'
  };
}

/**
 * Check if OpenAI is available and configured
 * @returns Promise that resolves to true if OpenAI is available
 */
export async function isOpenAIAvailable(): Promise<boolean> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your-openai-api-key-here') {
      return false;
    }
    
    // Test with a simple prompt
    const result = await generateContent('Test', { maxTokens: 10 });
    return result.success;
  } catch {
    return false;
  }
}
