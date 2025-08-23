const Notification = require("../models/Notification");
const User = require("../models/User");
const AIToolUsage = require("../models/AIToolUsage");

class NotificationService {
  // Generate subscription-related notifications
  static async generateSubscriptionNotifications(user) {
    const notifications = [];
    
    // Check trial status
    if (user.subscription.status === 'trial') {
      const trialDaysRemaining = Math.max(0, Math.ceil((user.subscription.trialEndDate - new Date()) / (1000 * 60 * 60 * 24)));
      
      // Check if trial has expired
      if (trialDaysRemaining <= 0) {
        notifications.push({
          title: "Free Trial Expired!",
          message: "Your free trial has expired. Upgrade now to continue using all AI tools and unlock unlimited features.",
          type: "error",
          category: "trial",
          actionUrl: "/upgrade"
        });
      } else if (trialDaysRemaining <= 1) {
        notifications.push({
          title: "Trial Expires Tomorrow!",
          message: "Your free trial expires tomorrow. Upgrade now to continue using all AI tools without interruption.",
          type: "warning",
          category: "trial",
          actionUrl: "/upgrade"
        });
      } else if (trialDaysRemaining <= 3) {
        notifications.push({
          title: "Trial Ending Soon",
          message: `Your free trial will expire in ${trialDaysRemaining} days. Upgrade now to unlock all features.`,
          type: "warning",
          category: "trial",
          actionUrl: "/upgrade"
        });
      }
    }
    
    // Check if user just upgraded
    if (user.subscription.status === 'active' && user.subscription.plan !== 'free_trial') {
      // Check if this is a recent upgrade (within last 24 hours)
      const recentUpgrade = await Notification.findOne({
        user: user._id,
        category: 'subscription',
        title: { $regex: /upgraded|activated/i },
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
      
      if (!recentUpgrade) {
        notifications.push({
          title: "Subscription Activated!",
          message: `Your ${user.subscription.plan} plan is now active. Enjoy unlimited access to all AI tools!`,
          type: "success",
          category: "subscription",
          actionUrl: "/dashboard"
        });
      }
    }
    
    return notifications;
  }
  
  // Generate usage-related notifications
  static async generateUsageNotifications(user) {
    const notifications = [];
    
    // Get current month usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const monthlyUsage = await AIToolUsage.countDocuments({
      userId: user._id,
      createdAt: { $gte: startOfMonth }
    });
    
    // Check usage limits based on plan
    const planLimits = {
      'free_trial': 10,
      'starter': 30,
      'pro': 100,
      'agency': -1 // unlimited
    };
    
    const limit = planLimits[user.subscription.plan] || 10;
    
    if (limit > 0) {
      const usagePercentage = (monthlyUsage / limit) * 100;
      
      if (usagePercentage >= 90) {
        notifications.push({
          title: "Usage Limit Warning",
          message: `You've used ${monthlyUsage}/${limit} generations this month. Consider upgrading for unlimited access.`,
          type: "warning",
          category: "usage",
          actionUrl: "/upgrade"
        });
      } else if (usagePercentage >= 75) {
        notifications.push({
          title: "Usage Update",
          message: `You've used ${monthlyUsage}/${limit} generations this month. ${limit - monthlyUsage} remaining.`,
          type: "info",
          category: "usage"
        });
      }
    }
    
    // Milestone notifications
    const totalUsage = await AIToolUsage.countDocuments({ userId: user._id });
    const milestones = [10, 25, 50, 100, 250, 500];
    
    for (const milestone of milestones) {
      if (totalUsage === milestone) {
        notifications.push({
          title: "Usage Milestone!",
          message: `Congratulations! You've generated ${milestone} pieces of content with AI Marketing Agents.`,
          type: "success",
          category: "usage"
        });
        break;
      }
    }
    
    return notifications;
  }
  
  // Generate feature notifications
  static async generateFeatureNotifications(user) {
    const notifications = [];
    
    // Check if user hasn't used certain features
    const usedTools = await AIToolUsage.distinct('toolName', { userId: user._id });
    const availableTools = user.getAvailableTools();
    
    // Suggest unused tools
    const unusedTools = availableTools.filter(tool => 
      !usedTools.some(used => used.toLowerCase().includes(tool.toLowerCase()))
    );
    
    if (unusedTools.length > 0 && usedTools.length > 0) {
      const suggestedTool = unusedTools[0];
      notifications.push({
        title: "Try New Features",
        message: `You haven't tried ${suggestedTool} yet. Discover how it can boost your marketing!`,
        type: "info",
        category: "feature",
        actionUrl: `/tools/${suggestedTool.toLowerCase().replace(/\s+/g, '-')}`
      });
    }
    
    return notifications;
  }
  
  // Generate system notifications
  static async generateSystemNotifications(user) {
    const notifications = [];
    
    // Welcome notification for new users (first 7 days)
    const daysSinceRegistration = Math.ceil((new Date() - user.createdAt) / (1000 * 60 * 60 * 24));
    
    if (daysSinceRegistration <= 7) {
      const welcomeNotification = await Notification.findOne({
        user: user._id,
        title: "Welcome to AI Marketing Agents!",
        category: 'system'
      });
      
      if (!welcomeNotification) {
        notifications.push({
          title: "Welcome to AI Marketing Agents!",
          message: "Your free trial has started. You now have access to powerful AI tools for the next 7 days.",
          type: "success",
          category: "system"
        });
      }
    }
    
    return notifications;
  }
  
  // Main method to generate all notifications for a user
  static async generateAllNotifications(userId) {
    try {
      console.log('🔍 Starting notification generation for user:', userId);
      
      const user = await User.findById(userId);
      if (!user) {
        console.log('❌ User not found:', userId);
        return;
      }
      
      console.log('✅ User found:', user.email, 'Plan:', user.subscription?.plan, 'Status:', user.subscription?.status);
      
      // ALWAYS create a welcome notification for new users
      const welcomeNotification = await Notification.findOne({
        user: userId,
        title: "Welcome to AI Marketing Agents!",
        category: 'system'
      });
      
      if (!welcomeNotification) {
        console.log('📝 Creating welcome notification...');
        await Notification.create({
          user: userId,
          title: "Welcome to AI Marketing Agents!",
          message: "Your free trial has started. You now have access to powerful AI tools for the next 7 days.",
          type: "success",
          category: "system",
          read: false
        });
        console.log('✅ Welcome notification created');
      } else {
        console.log('ℹ️ Welcome notification already exists');
      }
      
      // Create trial status notification
      if (user.subscription?.status === 'trial') {
        const trialDaysRemaining = Math.max(0, Math.ceil((user.subscription.trialEndDate - new Date()) / (1000 * 60 * 60 * 24)));
        console.log('📅 Trial days remaining:', trialDaysRemaining);
        
        const trialNotification = await Notification.findOne({
          user: userId,
          title: { $regex: /trial/i },
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });
        
        if (!trialNotification) {
          console.log('📝 Creating trial notification...');
          await Notification.create({
            user: userId,
            title: `Free Trial Active - ${trialDaysRemaining} Days Left`,
            message: `Your free trial is active with ${trialDaysRemaining} days remaining. Upgrade anytime to unlock unlimited features.`,
            type: "info",
            category: "trial",
            actionUrl: "/upgrade",
            read: false
          });
          console.log('✅ Trial notification created');
        }
      }
      
      console.log('🎉 Notification generation completed');
      return true;
      
    } catch (error) {
      console.error('❌ Error generating notifications:', error);
      throw error;
    }
  }
  
  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { read: true },
      { new: true }
    );
  }
  
  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    return await Notification.updateMany(
      { user: userId, read: false },
      { read: true }
    );
  }
  
  // Get unread notification count
  static async getUnreadCount(userId) {
    return await Notification.countDocuments({
      user: userId,
      read: false
    });
  }
}

module.exports = NotificationService; 