const mongoose = require("mongoose")

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plan: {
      type: String,
      enum: ["free_trial", "starter", "pro", "agency"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "expired", "trial", "past_due"],
      required: true,
    },
    pricing: {
      amount: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: "USD",
      },
      interval: {
        type: String,
        enum: ["month", "year"],
        default: "month",
      },
    },
    limits: {
      monthlyGenerations: {
        type: Number,
        required: true,
      },
      toolsAccess: [String],
      teamMembers: {
        type: Number,
        default: 1,
      },
    },
    stripe: {
      customerId: String,
      subscriptionId: String,
      priceId: String,
      invoiceId: String,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: Date,
    cancelledAt: Date,
    cancelReason: String,
    trialEnd: Date,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
  },
  {
    timestamps: true,
  },
)

subscriptionSchema.methods.isActive = function () {
  return this.status === "active" || (this.status === "trial" && new Date() < this.trialEnd)
}

subscriptionSchema.methods.daysRemaining = function () {
  if (this.status === "trial" && this.trialEnd) {
    const now = new Date()
    const diffTime = this.trialEnd - now
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
  return 0
}

module.exports = mongoose.model("Subscription", subscriptionSchema)
