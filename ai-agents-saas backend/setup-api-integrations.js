#!/usr/bin/env node

/**
 * AI Marketing Agents - API Integration Setup Script
 * This script helps you quickly configure all the new API integrations
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 AI Marketing Agents - API Integration Setup');
console.log('==============================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created successfully!\n');
  } else {
    console.log('❌ env.example not found. Please create .env manually.\n');
  }
}

// Function to ask for input
function askQuestion(question, defaultValue = '') {
  return new Promise((resolve) => {
    const defaultText = defaultValue ? ` (default: ${defaultValue})` : '';
    rl.question(`${question}${defaultText}: `, (answer) => {
      resolve(answer || defaultValue);
    });
  });
}

// Main setup function
async function setupAPIs() {
  console.log('🔑 Let\'s configure your API keys:\n');

  try {
    // OpenAI API Key
    const openaiKey = await askQuestion('Enter your OpenAI API key');
    if (openaiKey && !openaiKey.startsWith('sk-')) {
      console.log('⚠️  Warning: OpenAI API key should start with "sk-"\n');
    }

    // Publer API Key
    const publerKey = await askQuestion('Enter your Publer API key (or press Enter to skip)');
    
    // Buffer API Key
    const bufferKey = await askQuestion('Enter your Buffer API key (or press Enter to skip)');
    
    // Canva API Key
    const canvaKey = await askQuestion('Enter your Canva API key (or press Enter to skip)');
    
    // Canva Brand Kit ID
    const canvaBrandKit = await askQuestion('Enter your Canva Brand Kit ID (or press Enter to skip)');

    // Update .env file
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Replace API keys
      if (openaiKey) {
        envContent = envContent.replace(/OPENAI_API_KEY=.*/g, `OPENAI_API_KEY=${openaiKey}`);
      }
      if (publerKey) {
        envContent = envContent.replace(/PUBLER_API_KEY=.*/g, `PUBLER_API_KEY=${publerKey}`);
      }
      if (bufferKey) {
        envContent = envContent.replace(/BUFFER_API_KEY=.*/g, `BUFFER_API_KEY=${bufferKey}`);
      }
      if (canvaKey) {
        envContent = envContent.replace(/CANVA_API_KEY=.*/g, `CANVA_API_KEY=${canvaKey}`);
      }
      if (canvaBrandKit) {
        envContent = envContent.replace(/CANVA_BRAND_KIT_ID=.*/g, `CANVA_BRAND_KIT_ID=${canvaBrandKit}`);
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log('\n✅ .env file updated successfully!');
    }

    // Summary
    console.log('\n📊 Configuration Summary:');
    console.log('========================');
    console.log(`OpenAI API: ${openaiKey ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`Publer API: ${publerKey ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`Buffer API: ${bufferKey ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`Canva API: ${canvaKey ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`Canva Brand Kit: ${canvaBrandKit ? '✅ Configured' : '❌ Not configured'}`);

    // Next steps
    console.log('\n🚀 Next Steps:');
    console.log('==============');
    console.log('1. Install dependencies: npm install');
    console.log('2. Start the server: npm run dev');
    console.log('3. Test the integrations with the provided endpoints');
    console.log('4. Check the INSTALLATION.md file for detailed instructions');

    // API status check
    if (publerKey || bufferKey || canvaKey) {
      console.log('\n🔍 To test your API integrations:');
      console.log('curl "http://localhost:5000/api/ai-tools/social-media/validate-credentials?platform=all"');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

// Check if dependencies are installed
function checkDependencies() {
  const packageJsonPath = path.join(__dirname, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log('❌ package.json not found. Please run this script from the backend directory.');
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredDeps = ['axios', 'node-cron', 'canvas', 'jimp'];
  const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);

  if (missingDeps.length > 0) {
    console.log('⚠️  Missing dependencies detected:');
    missingDeps.forEach(dep => console.log(`   - ${dep}`));
    console.log('\nPlease run: npm install\n');
  } else {
    console.log('✅ All required dependencies are available!\n');
  }
}

// Run setup
async function main() {
  checkDependencies();
  await setupAPIs();
}

// Handle command line arguments
if (process.argv.includes('--check-only')) {
  checkDependencies();
  process.exit(0);
} else if (process.argv.includes('--help')) {
  console.log('Usage: node setup-api-integrations.js [options]');
  console.log('\nOptions:');
  console.log('  --check-only    Only check dependencies');
  console.log('  --help          Show this help message');
  console.log('\nExamples:');
  console.log('  node setup-api-integrations.js');
  console.log('  node setup-api-integrations.js --check-only');
  process.exit(0);
} else {
  main();
}
