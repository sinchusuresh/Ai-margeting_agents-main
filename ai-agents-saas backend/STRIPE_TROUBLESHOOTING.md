# Stripe Integration Troubleshooting Guide

## Quick Fix Steps

### 1. Install Stripe Package
Run this command in the backend directory:
```bash
npm install stripe
```

Or double-click the `install-stripe.bat` file.

### 2. Check Your .env File
Make sure your `.env` file has all these variables:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...JJCj
STRIPE_PUBLISHABLE_KEY=pk_live_51Kmc49SBApTLbwEDgEUG6zIA2th6tc8QeQrMearqZ0mP2d5rrpDA8kV3CZSToxcdR4J0kK0Slky6heD31mBDYbJe003L40a4m5
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Stripe Price IDs - Replace with your actual price IDs
STRIPE_STARTER_MONTHLY_PRICE_ID=price_1Rqr0xSBApTLbwEDsSEPy0PR
STRIPE_STARTER_YEARLY_PRICE_ID=price_1Rqr6LSBApTLbwEDCopWCktq
STRIPE_PRO_MONTHLY_PRICE_ID=price_1Rqr38SBApTLbwEDMMbsNYor
STRIPE_PRO_YEARLY_PRICE_ID=price_1RqrEmSBApTLbwEDBYF4WDo3
STRIPE_AGENCY_MONTHLY_PRICE_ID=price_1Rqr4QSBApTLbwEDqP3l9kT1
STRIPE_AGENCY_YEARLY_PRICE_ID=price_1RqrFhSBApTLbwEDZV2eBIXn
```

### 3. Test Configuration
Visit this URL to check if everything is configured correctly:
```
http://localhost:5000/api/stripe/test
```

You should see a JSON response with configuration details.

### 4. Restart Your Servers
1. Stop both frontend and backend servers
2. Start backend: `npm run dev`
3. Start frontend: `npm run dev`

## Common Issues and Solutions

### Issue: "Error creating checkout session"
**Solution**: 
- Check if Stripe package is installed
- Verify your Stripe secret key is correct
- Make sure all price IDs are configured

### Issue: "Price ID not configured"
**Solution**:
- Add all the price IDs to your .env file
- Make sure the price IDs match your Stripe dashboard

### Issue: "Payment service not available"
**Solution**:
- Install Stripe package: `npm install stripe`
- Check if STRIPE_SECRET_KEY is set in .env

### Issue: "Token is not valid"
**Solution**:
- Log out and log back in
- Clear browser localStorage and try again

## Testing the Integration

1. **Log in** to your application
2. **Go to** `/upgrade` page
3. **Click** on any plan (Starter, Pro, Agency)
4. **Should redirect** to Stripe Checkout

## Debugging Steps

1. **Check browser console** for frontend errors
2. **Check backend terminal** for server errors
3. **Visit** `/api/stripe/test` to check configuration
4. **Verify** your Stripe dashboard has the correct price IDs

## Support

If you're still having issues:
1. Check the backend terminal for error messages
2. Check the browser console for frontend errors
3. Verify your Stripe account is active
4. Make sure you're using the correct API keys (test vs live) 