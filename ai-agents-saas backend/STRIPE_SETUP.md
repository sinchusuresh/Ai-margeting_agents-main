# Stripe Integration Setup Guide

## Required Environment Variables

Add these variables to your `.env` file in the `ai-agents-saas backend` directory:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...JJCj
STRIPE_PUBLISHABLE_KEY=pk_live_51Kmc49SBApTLbwEDgEUG6zIA2th6tc8QeQrMearqZ0mP2d5rrpDA8kV3CZSToxcdR4J0kK0Slky6heD31mBDYbJe003L40a4m5
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Stripe Price IDs - Replace with your actual price IDs from Stripe Dashboard
STRIPE_STARTER_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_STARTER_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PRO_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_AGENCY_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_AGENCY_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx
```

## How to Get Your Stripe Price IDs

1. **Log into your Stripe Dashboard**
2. **Go to Products** → Select your subscription products
3. **For each plan (Starter, Pro, Agency):**
   - Find the monthly price ID (starts with `price_`)
   - Find the yearly price ID (starts with `price_`)
4. **Copy these IDs** and replace the placeholder values in your `.env` file

## Webhook Setup

1. **In Stripe Dashboard**, go to **Developers** → **Webhooks**
2. **Add endpoint**: `https://your-domain.com/api/stripe/webhook`
3. **Select events** to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. **Copy the webhook secret** and add it to `STRIPE_WEBHOOK_SECRET`

## Installation

Run this command in the backend directory to install Stripe:

```bash
npm install stripe
```

## API Endpoints Created

- `POST /api/stripe/create-checkout-session` - Creates Stripe checkout session
- `POST /api/stripe/webhook` - Handles Stripe webhooks
- `GET /api/stripe/subscription-status` - Get user's subscription status
- `POST /api/stripe/cancel-subscription` - Cancel subscription
- `POST /api/stripe/reactivate-subscription` - Reactivate subscription

## Frontend Integration

The frontend has been updated to:
- Call the checkout API when users click "Subscribe"
- Handle success/cancel redirects
- Show loading states and error messages
- Redirect to success/cancel pages

## Testing

1. **Test with Stripe test keys first** before switching to live keys
2. **Use Stripe's test card numbers** for testing payments
3. **Check webhook delivery** in Stripe Dashboard
4. **Verify subscription status** updates in your database

## Security Notes

- ✅ `.env` file is in `.gitignore` (secure)
- ✅ Webhook signature verification implemented
- ✅ User authentication required for checkout
- ✅ Proper error handling and logging
- ⚠️ Make sure to use HTTPS in production
- ⚠️ Keep your Stripe keys secure and never commit them to version control 