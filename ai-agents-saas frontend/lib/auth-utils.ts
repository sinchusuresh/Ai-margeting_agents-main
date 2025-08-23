/**
 * Authentication utilities for frontend API calls
 * Supports both JWT tokens and API keys for local development
 */

export interface AuthConfig {
  headers: Record<string, string>;
  isApiKey: boolean;
}

/**
 * Get authentication configuration for API requests
 * @returns Object with headers and authentication type
 */
export function getAuthConfig(): AuthConfig {
  // Try to get JWT token first
  const token = localStorage.getItem('token');
  
  if (token) {
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      isApiKey: false
    };
  }
  
  // For local development, try to use API key
  const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'your-openai-api-key-here';
  if (apiKey && apiKey !== 'your-openai-api-key-here') {
    console.log('🔑 Using API key for local development');
    return {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      isApiKey: true
    };
  }
  
  // No authentication available
  throw new Error('No authentication token or API key found. Please log in or set up your API key.');
}

/**
 * Handle API response errors with proper error messages
 * @param response - Fetch Response object
 * @returns Promise that rejects with appropriate error message
 */
export async function handleApiError(response: Response): Promise<never> {
  const errorData = await response.json().catch(() => ({}));
  
  switch (response.status) {
    case 401:
      throw new Error('Authentication failed. Please check your token or API key.');
    case 403:
      throw new Error('Access denied. Please upgrade your subscription or check your API key.');
    case 429:
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    case 500:
      throw new Error('Server error. Please try again in a moment.');
    default:
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Unknown error'}`);
  }
}

/**
 * Make an authenticated API request
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @returns Promise with response data
 */
export async function makeAuthenticatedRequest<T = any>(
  url: string, 
  options: RequestInit = {}
): Promise<T> {
  try {
    const authConfig = getAuthConfig();
    
    // Get the backend URL from environment variables
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    // If the URL starts with /api, prepend the backend URL
    const fullUrl = url.startsWith('/api') ? `${backendUrl}${url}` : url;
    
    console.log('🌐 Making request to:', fullUrl);
    
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        ...authConfig.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * Get stored JWT token from localStorage
 * @returns JWT token or null if not found
 */
export function getStoredToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

/**
 * Check if the current user has admin status
 * @returns Promise that resolves to admin status and role
 */
export async function checkAdminStatus(): Promise<{ isAdmin: boolean; role: string }> {
  try {
    const token = getStoredToken();
    if (!token) {
      return { isAdmin: false, role: 'user' };
    }

    const response = await fetch('/api/auth/check-admin', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return { isAdmin: false, role: 'user' };
    }

    const data = await response.json();
    return {
      isAdmin: data.isAdmin || false,
      role: data.role || 'user'
    };
  } catch (error) {
    console.error('Error checking admin status:', error);
    return { isAdmin: false, role: 'user' };
  }
} 