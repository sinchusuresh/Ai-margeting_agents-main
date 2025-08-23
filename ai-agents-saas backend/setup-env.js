const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up environment variables for AI Marketing Agents...\n');

// Check if .env file already exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists. Backing up to .env.backup...');
  fs.copyFileSync(envPath, path.join(__dirname, '.env.backup'));
}

// Create .env file content
const envContent = `# OpenAI API Configuration
OPENAI_API_KEY=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

# JWT Secret (you should change this to a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/ai-marketing-agents

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Environment
NODE_ENV=development

# Port
PORT=5000

# Stripe Configuration (optional - add your Stripe keys if you have them)
# STRIPE_SECRET_KEY=your_stripe_secret_key
# STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
# STRIPE_STARTER_MONTHLY_PRICE_ID=price_xxx
# STRIPE_STARTER_YEARLY_PRICE_ID=price_xxx
# STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx
# STRIPE_PRO_YEARLY_PRICE_ID=price_xxx
# STRIPE_AGENCY_MONTHLY_PRICE_ID=price_xxx
# STRIPE_AGENCY_YEARLY_PRICE_ID=price_xxx
`;

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('✅ OpenAI API key configured');
  console.log('✅ JWT secret configured');
  console.log('✅ MongoDB connection configured');
  console.log('\n📝 Next steps:');
  console.log('1. Restart your backend server');
  console.log('2. Test the SEO audit tool with a real website URL');
  console.log('3. The tool should now generate real AI-powered SEO analysis');
  console.log('\n🔒 Security note: Make sure .env is in your .gitignore file');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  console.log('\n📝 Manual setup:');
  console.log('1. Create a .env file in the backend directory');
  console.log('2. Add the content above to the file');
  console.log('3. Restart your server');
} 