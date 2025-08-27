const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");
const router = express.Router();

// Initialize Stripe properly
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Stripe price IDs configuration
const STRIPE_PRICE_IDS = {
  starter: {
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID,
  },
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
  },
  agency: {
    monthly: process.env.STRIPE_AGENCY_MONTHLY_PRICE_ID,
    yearly: process.env.STRIPE_AGENCY_YEARLY_PRICE_ID,
  },
};

// Create checkout session
router.post("/create-checkout-session", auth, async (req, res) => {
  try {
    const { plan, billingPeriod } = req.body;
    
    // Validate plan and billing period
    const validPlans = ["starter", "pro", "agency"];
    const validBillingPeriods = ["monthly", "yearly"];
    
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ message: "Invalid plan" });
    }
    
    if (!validBillingPeriods.includes(billingPeriod)) {
      return res.status(400).json({ message: "Invalid billing period" });
    }
    
    // Get the appropriate price ID
    const priceId = STRIPE_PRICE_IDS[plan][billingPeriod];
    
    if (!priceId) {
      return res.status(400).json({ 
        message: `Price ID not configured for ${plan} ${billingPeriod} plan` 
      });
    }
    
    // Get user details
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Create or get Stripe customer
    let customerId = user.subscription.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user._id.toString(),
        },
      });
      
      customerId = customer.id;
      
      // Update user with Stripe customer ID
      user.subscription.stripeCustomerId = customerId;
      await user.save();
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.FRONTEND_URL}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/upgrade/cancel`,
      metadata: {
        userId: user._id.toString(),
        plan: plan,
        billingPeriod: billingPeriod,
      },
      subscription_data: {
        metadata: {
          userId: user._id.toString(),
          plan: plan,
          billingPeriod: billingPeriod,
        },
      },
    });
    
    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ message: "Error creating checkout session" });
  }
});

// Handle Stripe webhook
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;
        
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object);
        break;
        
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;
        
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;
        
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// Webhook handlers
async function handleCheckoutSessionCompleted(session) {
  const userId = session.metadata?.userId;
  if (!userId) return;
  
  const user = await User.findById(userId);
  if (!user) return;
  
  // Update user subscription status
  user.subscription.status = "active";
  user.subscription.subscriptionStartDate = new Date();
  user.subscription.plan = session.metadata.plan;
  
  await user.save();
}

async function handleSubscriptionCreated(subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;
  
  const user = await User.findById(userId);
  if (!user) return;
  
  user.subscription.stripeSubscriptionId = subscription.id;
  user.subscription.status = "active";
  user.subscription.plan = subscription.metadata.plan;
  user.subscription.subscriptionStartDate = new Date();
  
  await user.save();
}

async function handleSubscriptionUpdated(subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;
  
  const user = await User.findById(userId);
  if (!user) return;
  
  user.subscription.status = subscription.status;
  user.subscription.plan = subscription.metadata.plan;
  
  if (subscription.cancel_at_period_end) {
    user.subscription.subscriptionEndDate = new Date(subscription.current_period_end * 1000);
  }
  
  await user.save();
}

async function handleSubscriptionDeleted(subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;
  
  const user = await User.findById(userId);
  if (!user) return;
  
  user.subscription.status = "cancelled";
  user.subscription.subscriptionEndDate = new Date();
  
  await user.save();
}

async function handlePaymentSucceeded(invoice) {
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  const userId = subscription.metadata?.userId;
  
  if (!userId) return;
  
  const user = await User.findById(userId);
  if (!user) return;
  
  user.subscription.status = "active";
  await user.save();
}

async function handlePaymentFailed(invoice) {
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  const userId = subscription.metadata?.userId;
  
  if (!userId) return;
  
  const user = await User.findById(userId);
  if (!user) return;
  
  user.subscription.status = "past_due";
  await user.save();
}

// Get subscription status
router.get("/subscription-status", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (!user.subscription.stripeSubscriptionId) {
      return res.json({ 
        hasSubscription: false,
        subscription: user.subscription 
      });
    }
    
    const subscription = await stripe.subscriptions.retrieve(
      user.subscription.stripeSubscriptionId
    );
    
    res.json({
      hasSubscription: true,
      subscription: user.subscription,
      stripeSubscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    res.status(500).json({ message: "Error fetching subscription status" });
  }
});

// Cancel subscription
router.post("/cancel-subscription", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.subscription.stripeSubscriptionId) {
      return res.status(404).json({ message: "No active subscription found" });
    }
    
    const subscription = await stripe.subscriptions.update(
      user.subscription.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );
    
    user.subscription.subscriptionEndDate = new Date(subscription.current_period_end * 1000);
    await user.save();
    
    res.json({ 
      message: "Subscription will be cancelled at the end of the current period",
      subscription: user.subscription 
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    res.status(500).json({ message: "Error cancelling subscription" });
  }
});

// Reactivate subscription
router.post("/reactivate-subscription", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.subscription.stripeSubscriptionId) {
      return res.status(404).json({ message: "No subscription found" });
    }
    
    const subscription = await stripe.subscriptions.update(
      user.subscription.stripeSubscriptionId,
      { cancel_at_period_end: false }
    );
    
    user.subscription.subscriptionEndDate = null;
    await user.save();
    
    res.json({ 
      message: "Subscription reactivated",
      subscription: user.subscription 
    });
  } catch (error) {
    console.error("Error reactivating subscription:", error);
    res.status(500).json({ message: "Error reactivating subscription" });
  }
});

// Get payment methods
router.get("/payment-methods", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (!user.subscription.stripeCustomerId) {
      return res.json({ paymentMethods: [] });
    }
    
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.subscription.stripeCustomerId,
      type: 'card',
    });
    
    res.json({ 
      paymentMethods: paymentMethods.data.map(pm => ({
        id: pm.id,
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
        isDefault: pm.metadata.isDefault === 'true',
      }))
    });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    res.status(500).json({ message: "Error fetching payment methods" });
  }
});

// Get billing history
router.get("/billing-history", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (!user.subscription.stripeCustomerId) {
      return res.json({ invoices: [] });
    }
    
    const invoices = await stripe.invoices.list({
      customer: user.subscription.stripeCustomerId,
      limit: 10,
    });
    
    res.json({ 
      invoices: invoices.data.map(invoice => ({
        id: invoice.id,
        amount: invoice.amount_paid / 100, // Convert from cents
        currency: invoice.currency,
        status: invoice.status,
        created: invoice.created,
        periodStart: invoice.period_start,
        periodEnd: invoice.period_end,
        description: invoice.lines.data[0]?.description || 'Subscription',
        invoicePdf: invoice.invoice_pdf,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
      }))
    });
  } catch (error) {
    console.error("Error fetching billing history:", error);
    res.status(500).json({ message: "Error fetching billing history" });
  }
});

// Test endpoint to check Stripe configuration
router.get("/test", (req, res) => {
  try {
    const config = {
      stripeInitialized: !!stripe,
      secretKeyConfigured: !!process.env.STRIPE_SECRET_KEY,
      priceIdsConfigured: {
        starter: {
          monthly: !!process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
          yearly: !!process.env.STRIPE_STARTER_YEARLY_PRICE_ID,
        },
        pro: {
          monthly: !!process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
          yearly: !!process.env.STRIPE_PRO_YEARLY_PRICE_ID,
        },
        agency: {
          monthly: !!process.env.STRIPE_AGENCY_MONTHLY_PRICE_ID,
          yearly: !!process.env.STRIPE_AGENCY_YEARLY_PRICE_ID,
        },
      },
      priceIds: STRIPE_PRICE_IDS,
    };
    
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: "Configuration check failed" });
  }
});

module.exports = router; 