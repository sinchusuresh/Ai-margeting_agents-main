const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    company: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    subscription: {
      plan: {
        type: String,
        enum: ["free_trial", "starter", "pro", "agency"],
        default: "free_trial",
      },
      status: {
        type: String,
        enum: ["active", "cancelled", "expired", "trial", "past_due"],
        default: "trial",
      },
      trialStartDate: {
        type: Date,
        default: Date.now,
      },
      trialEndDate: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      subscriptionStartDate: Date,
      subscriptionEndDate: Date,
      stripeCustomerId: String,
      stripeSubscriptionId: String,
    },
    usage: {
      totalGenerations: {
        type: Number,
        default: 0,
      },
      monthlyGenerations: {
        type: Number,
        default: 0,
      },
      lastResetDate: {
        type: Date,
        default: Date.now,
      },
      toolsUsed: [
        {
          toolId: String,
          toolName: String,
          usageCount: {
            type: Number,
            default: 0,
          },
          lastUsed: Date,
        },
      ],
    },
    preferences: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      marketingEmails: {
        type: Boolean,
        default: false,
      },
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
    verified: { type: Boolean, default: false },
    verificationToken: String,
  },
  {
    timestamps: true,
  },
)

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Check if trial is expired
userSchema.methods.isTrialExpired = function () {
  return new Date() > this.subscription.trialEndDate
}

// Get available tools based on subscription
userSchema.methods.getAvailableTools = function () {
  // If user is admin, return all tools regardless of subscription
  if (this.role === "admin") {
    console.log(`🔑 Admin user detected, returning all tools`)
    return [
      "seo-audit",
      "social-media",
      "blog-writing",
      "email-marketing",
      "ad-copy",
      "client-reporting",
      "landing-page",
      "competitor-analysis",
      "cold-outreach",
      "reels-scripts",
      "product-launch",
      "blog-to-video",
      "local-seo",
    ]
  }

  const toolsByPlan = {
    free_trial: ["seo-audit", "social-media"],
    starter: ["seo-audit", "social-media", "blog-writing", "email-marketing", "ad-copy"],
    pro: [
      "seo-audit",
      "social-media",
      "blog-writing",
      "email-marketing",
      "ad-copy",
      "client-reporting",
      "landing-page",
      "competitor-analysis",
      "cold-outreach",
      "reels-scripts",
      "product-launch",
      "blog-to-video",
      "local-seo",
    ],
    agency: [
      "seo-audit",
      "social-media",
      "blog-writing",
      "email-marketing",
      "ad-copy",
      "client-reporting",
      "landing-page",
      "competitor-analysis",
      "cold-outreach",
      "reels-scripts",
      "product-launch",
      "blog-to-video",
      "local-seo",
    ],
  }

  // Check if user is on trial
  if (this.subscription.status === "trial" && !this.isTrialExpired()) {
    console.log(`🧪 Trial user detected, returning ${toolsByPlan.free_trial.length} tools`)
    return toolsByPlan.free_trial
  }

  // Check if user has a valid subscription plan (active, trialing, etc.)
  if (this.subscription.plan && this.subscription.status !== "cancelled" && this.subscription.status !== "expired") {
    console.log(`💳 Subscription user detected: plan=${this.subscription.plan}, status=${this.subscription.status}, returning ${toolsByPlan[this.subscription.plan]?.length || 0} tools`)
    return toolsByPlan[this.subscription.plan] || []
  }

  // If no valid plan or status, return empty array
  console.log(`❌ No valid subscription found: plan=${this.subscription.plan}, status=${this.subscription.status}`)
  return []
}

module.exports = mongoose.model("User", userSchema)