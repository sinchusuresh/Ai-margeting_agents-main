const mongoose = require("mongoose");
const User = require("./models/User");
const Notification = require("./models/Notification");
require("dotenv").config();

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createTestData() {
  try {
    console.log('🚀 Creating test data...');
    
    // Create test user
    const testUser = new User({
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      password: "password123",
      phone: "+1234567890",
      subscription: {
        plan: "free_trial",
        status: "trial",
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      }
    });
    
    await testUser.save();
    console.log('✅ Created test user:', testUser.email);
    
    // Create test notifications
    const notifications = [
      {
        user: testUser._id,
        title: "Welcome to AI Marketing Agents!",
        message: "Your free trial has started. You now have access to powerful AI tools for the next 7 days.",
        type: "success",
        category: "system",
        read: false,
        actionUrl: "/dashboard"
      },
      {
        user: testUser._id,
        title: "Free Trial Active - 7 Days Left",
        message: "Your free trial is active with 7 days remaining. Upgrade anytime to unlock unlimited features.",
        type: "info",
        category: "trial",
        read: false,
        actionUrl: "/upgrade"
      },
      {
        user: testUser._id,
        title: "Get Started with AI Tools",
        message: "Try our AI content generator to create amazing marketing materials in seconds!",
        type: "info",
        category: "feature",
        read: false,
        actionUrl: "/tools"
      }
    ];
    
    for (const notif of notifications) {
      await Notification.create(notif);
    }
    
    console.log('✅ Created', notifications.length, 'notifications');
    console.log('🎉 Test data created successfully!');
    console.log('📧 Login with: test@example.com / password123');
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestData(); 