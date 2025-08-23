const mongoose = require('mongoose');
const User = require('./models/User');
const Notification = require('./models/Notification');
const NotificationService = require('./services/notificationService');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-marketing-agents', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testNotifications() {
  try {
    console.log('Testing notification system...');
    
    // Find a user with expired trial
    const user = await User.findOne({ 
      'subscription.status': 'trial',
      'subscription.trialEndDate': { $lt: new Date() }
    });
    
    if (!user) {
      console.log('No user with expired trial found. Creating test scenario...');
      
      // Find any user and modify their trial end date to be expired
      const anyUser = await User.findOne();
      if (anyUser) {
        anyUser.subscription.trialEndDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
        await anyUser.save();
        console.log(`Modified user ${anyUser.email} trial to be expired`);
        
        // Test notification generation
        await NotificationService.generateAllNotifications(anyUser._id);
        
        // Check if notification was created
        const notifications = await Notification.find({ user: anyUser._id });
        console.log(`Created ${notifications.length} notifications for ${anyUser.email}:`);
        notifications.forEach(n => {
          console.log(`- ${n.title}: ${n.message}`);
        });
      }
    } else {
      console.log(`Found user with expired trial: ${user.email}`);
      
      // Test notification generation
      await NotificationService.generateAllNotifications(user._id);
      
      // Check if notification was created
      const notifications = await Notification.find({ user: user._id });
      console.log(`Created ${notifications.length} notifications for ${user.email}:`);
      notifications.forEach(n => {
        console.log(`- ${n.title}: ${n.message}`);
      });
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testNotifications(); 