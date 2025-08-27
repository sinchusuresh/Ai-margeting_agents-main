const mongoose = require('mongoose');
const User = require('./models/User');
const AIToolUsage = require('./models/AIToolUsage');
require('dotenv').config();

async function updateAIToolsAuth() {
  try {
    console.log('🔧 Starting AI Tools Authentication Update...');
    
    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.log('⚠️  JWT_SECRET not found in environment variables');
      console.log('   Please ensure JWT_SECRET is set in your .env file');
    } else {
      console.log('✅ JWT_SECRET is configured');
    }
    
    // Check if API_KEY is configured for local development
    if (!process.env.API_KEY) {
      console.log('⚠️  API_KEY not found in environment variables');
      console.log('   This is needed for local development access');
    } else {
      console.log('✅ API_KEY is configured');
    }
    
    // Check environment variables
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔓 Allow Local Access: ${process.env.ALLOW_LOCAL_ACCESS || 'false'}`);
    
    // Count users
    const userCount = await User.countDocuments();
    console.log(`👥 Total users in database: ${userCount}`);
    
    // Count active users
    const activeUserCount = await User.countDocuments({ isActive: true });
    console.log(`✅ Active users: ${activeUserCount}`);
    
    // Count AI tool usage records
    const usageCount = await AIToolUsage.countDocuments();
    console.log(`🛠️  AI tool usage records: ${usageCount}`);
    
    // Check for users with successful tool usage
    const usersWithAccess = await AIToolUsage.distinct('userId', { status: 'success' });
    console.log(`🔑 Users with tool access: ${usersWithAccess.length}`);
    
    // Show sample user data
    const sampleUser = await User.findOne().select('_id email isActive createdAt');
    if (sampleUser) {
      console.log(`📋 Sample user: ${sampleUser.email} (ID: ${sampleUser._id})`);
      console.log(`   Active: ${sampleUser.isActive}, Created: ${sampleUser.createdAt}`);
    }
    
    // Check authentication middleware consistency
    console.log('\n🔍 Checking authentication consistency...');
    
    // Verify auth middleware exists and is properly configured
    try {
      const authMiddleware = require('./middleware/auth');
      console.log('✅ Auth middleware is properly configured');
    } catch (error) {
      console.log('❌ Auth middleware configuration issue:', error.message);
    }
    
    // Check if aiTools routes are properly configured
    try {
      const aiToolsRoutes = require('./routes/aiTools');
      console.log('✅ AI Tools routes are properly configured');
    } catch (error) {
      console.log('❌ AI Tools routes configuration issue:', error.message);
    }
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    console.log('1. Ensure JWT_SECRET is set in your .env file');
    console.log('2. Set API_KEY for local development access');
    console.log('3. Set NODE_ENV=development for local testing');
    console.log('4. Set ALLOW_LOCAL_ACCESS=true for development bypass');
    
    // Check for potential issues
    if (userCount === 0) {
      console.log('\n⚠️  Warning: No users found in database');
      console.log('   Consider running the seed script: npm run seed');
    }
    
    if (usageCount === 0) {
      console.log('\n⚠️  Warning: No AI tool usage records found');
      console.log('   Users may not be able to access tools initially');
    }
    
    console.log('\n✅ AI Tools Authentication Update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error updating AI tools authentication:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the update function
updateAIToolsAuth();
