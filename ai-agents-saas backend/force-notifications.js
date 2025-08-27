const mongoose = require('mongoose');
const User = require('./models/User');
const Notification = require('./models/Notification');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-marketing-agents', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function forceCreateNotifications() {
  try {
    console.log('🚀 Force creating notifications...');
    
    // Find user "darshan"
    const user = await User.findOne({ email: { $regex: /darshan/i } });
    
    if (!user) {
      console.log('❌ User "darshan" not found. Creating for any user...');
      const anyUser = await User.findOne();
      if (!anyUser) {
        console.log('❌ No users found in database');
        return;
      }
      console.log(`✅ Found user: ${anyUser.email}`);
      
      // Clear existing notifications
      await Notification.deleteMany({ user: anyUser._id });
      console.log('🗑️ Cleared existing notifications');
      
      // Create welcome notification
      await Notification.create({
        user: anyUser._id,
        title: "Welcome to AI Marketing Agents!",
        message: "Your free trial has started. You now have access to powerful AI tools for the next 7 days.",
        type: "success",
        category: "system",
        read: false
      });
      console.log('✅ Created welcome notification');
      
      // Create trial notification
      await Notification.create({
        user: anyUser._id,
        title: "Free Trial Active - 7 Days Left",
        message: "Your free trial is active with 7 days remaining. Upgrade anytime to unlock unlimited features.",
        type: "info",
        category: "trial",
        actionUrl: "/upgrade",
        read: false
      });
      console.log('✅ Created trial notification');
      
      // Check what we created
      const notifications = await Notification.find({ user: anyUser._id });
      console.log(`\n📋 Created ${notifications.length} notifications for ${anyUser.email}:`);
      notifications.forEach(n => {
        console.log(`  - ${n.title}: ${n.message}`);
      });
      
    } else {
      console.log(`✅ Found user: ${user.email}`);
      
      // Clear existing notifications
      await Notification.deleteMany({ user: user._id });
      console.log('🗑️ Cleared existing notifications');
      
      // Create welcome notification
      await Notification.create({
        user: user._id,
        title: "Welcome to AI Marketing Agents!",
        message: "Your free trial has started. You now have access to powerful AI tools for the next 7 days.",
        type: "success",
        category: "system",
        read: false
      });
      console.log('✅ Created welcome notification');
      
      // Create trial notification
      await Notification.create({
        user: user._id,
        title: "Free Trial Active - 7 Days Left",
        message: "Your free trial is active with 7 days remaining. Upgrade anytime to unlock unlimited features.",
        type: "info",
        category: "trial",
        actionUrl: "/upgrade",
        read: false
      });
      console.log('✅ Created trial notification');
      
      // Check what we created
      const notifications = await Notification.find({ user: user._id });
      console.log(`\n📋 Created ${notifications.length} notifications for ${user.email}:`);
      notifications.forEach(n => {
        console.log(`  - ${n.title}: ${n.message}`);
      });
    }
    
    console.log('\n🎉 Force notification creation completed!');
    console.log('🔄 Now refresh your dashboard to see the notifications.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

forceCreateNotifications(); 