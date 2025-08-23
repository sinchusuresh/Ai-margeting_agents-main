import { authenticatedFetch, handleApiResponse } from '@/hooks/use-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// User API services
export const userApi = {
  // Get user profile
  getProfile: async () => {
    const response = await authenticatedFetch(`${API_BASE_URL}/users/profile`);
    return handleApiResponse(response);
  },

  // Update user profile
  updateProfile: async (profileData: any) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    return handleApiResponse(response);
  },

  // Get usage statistics
  getUsageStats: async () => {
    const response = await authenticatedFetch(`${API_BASE_URL}/users/usage-stats`);
    return handleApiResponse(response);
  },

  // Change password
  changePassword: async (passwordData: { currentPassword: string; newPassword: string }) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/users/change-password`, {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
    return handleApiResponse(response);
  },
};

// Analytics API services
export const analyticsApi = {
  // Get analytics data
  getAnalytics: async () => {
    const response = await authenticatedFetch(`${API_BASE_URL}/analytics`);
    return handleApiResponse(response);
  },
};

// Dashboard API services
export const dashboardApi = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await authenticatedFetch(`${API_BASE_URL}/dashboard`);
    return handleApiResponse(response);
  },
};

// AI Tools API services
export const aiToolsApi = {
  // Generate content with a specific tool
  generateContent: async (toolId: string, input: any) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/ai-tools/${toolId}/generate`, {
      method: 'POST',
      body: JSON.stringify({ input }),
    });
    return handleApiResponse(response);
  },

  // Get tool usage history
  getToolUsage: async (toolId: string) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/ai-tools/${toolId}/usage`);
    return handleApiResponse(response);
  },

  // Check tool access
  checkToolAccess: async (toolId: string) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/ai-tools/${toolId}/access`);
    return handleApiResponse(response);
  },
};

// Subscription API services
export const subscriptionApi = {
  // Get subscription details
  getSubscription: async () => {
    const response = await authenticatedFetch(`${API_BASE_URL}/subscriptions/current`);
    return handleApiResponse(response);
  },

  // Get available plans
  getAvailablePlans: async () => {
    const response = await authenticatedFetch(`${API_BASE_URL}/subscriptions/plans`);
    return handleApiResponse(response);
  },
};

// Notifications API services
export const notificationsApi = {
  // Get user notifications
  getNotifications: async () => {
    const response = await authenticatedFetch(`${API_BASE_URL}/notifications`);
    return handleApiResponse(response);
  },

  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
    return handleApiResponse(response);
  },

  // Delete notification
  deleteNotification: async (notificationId: string) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
    });
    return handleApiResponse(response);
  },
};
