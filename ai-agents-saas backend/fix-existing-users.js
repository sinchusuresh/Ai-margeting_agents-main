const mongoose = require('mongoose');
const User = require('./models/User');
const Notification = require('./models/Notification');
const NotificationService = require('./services/notificationService');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-marketing-agents', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixExistingUsers() {
  try {
    console.log('Fixing existing users for notifications...');
    
    // Find all users
    const users = await User.find();
    console.log(`Found ${users.length} users`);
    
    for (const user of users) {
      console.log(`\nProcessing user: ${user.email}`);
      
      // Clear existing notifications for this user
      await Notification.deleteMany({ user: user._id });
      console.log(`- Cleared existing notifications`);
      
      // Generate fresh notifications
      await NotificationService.generateAllNotifications(user._id);
      console.log(`- Generated new notifications`);
      
      // Check what notifications were created
      const notifications = await Notification.find({ user: user._id });
      console.log(`- Created ${notifications.length} notifications:`);
      notifications.forEach(n => {
        console.log(`  * ${n.title}: ${n.message}`);
      });
    }
    
    console.log('\n✅ All users processed successfully!');
    
  } catch (error) {
    console.error('Error fixing users:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixExistingUsers(); 