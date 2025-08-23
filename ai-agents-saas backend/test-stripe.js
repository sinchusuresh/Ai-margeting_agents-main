require('dotenv').config();

console.log('Testing Stripe Configuration...');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'EXISTS' : 'MISSING');
console.log('STRIPE_SECRET_KEY length:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.length : 0);

if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.length < 50) {
  console.log('ERROR: Stripe secret key is too short! It should be much longer.');
  console.log('Current key:', process.env.STRIPE_SECRET_KEY);
  process.exit(1);
}

try {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  console.log('✅ Stripe initialized successfully');
  
  // Test a simple API call
  stripe.customers.list({ limit: 1 })
    .then(() => {
      console.log('✅ Stripe API connection successful');
      process.exit(0);
    })
    .catch(error => {
      console.log('❌ Stripe API error:', error.message);
      process.exit(1);
    });
} catch (error) {
  console.log('❌ Failed to initialize Stripe:', error.message);
  process.exit(1);
} 