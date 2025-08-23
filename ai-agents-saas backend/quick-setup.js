const fs = require('fs');
const path = require('path');

console.log('🚀 QUICK SETUP: Configuring OpenAI API for Real AI-Powered SEO Audits...\n');

const envPath = path.join(__dirname, '.env');

// Your new OpenAI API key
const newApiKey = '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';

// Create .env content
const envContent = `# OpenAI API Configuration - UPDATED WITH NEW KEY
OPENAI_API_KEY=${newApiKey}

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/ai-marketing-agents

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Environment
NODE_ENV=development

# Port
PORT=5000
`;

try {
  // Backup existing .env if it exists
  if (fs.existsSync(envPath)) {
    fs.copyFileSync(envPath, path.join(__dirname, '.env.backup'));
    console.log('✅ Backed up existing .env file to .env.backup');
  }

  // Create new .env file
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ .env file created/updated successfully!');
  console.log('✅ NEW OpenAI API key configured');
  console.log('✅ Ready for real AI-powered SEO audits');
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. RESTART your backend server (Ctrl+C then npm start)');
  console.log('2. You should see: "✅ OpenAI API key configured"');
  console.log('3. Test SEO audit tool with any website URL');
  console.log('4. Get REAL AI-generated data every time!');
  
  console.log('\n🧪 TEST IT:');
  console.log('- Go to your SEO audit tool');
  console.log('- Enter: https://example.com');
  console.log('- Click "Start SEO Audit"');
  console.log('- See dynamic AI-generated results!');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\n📝 Manual setup:');
  console.log('1. Create .env file in backend directory');
  console.log('2. Add: OPENAI_API_KEY=' + newApiKey);
  console.log('3. Restart server');
} 