const mongoose = require("mongoose")

const aiToolUsageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toolId: {
      type: String,
      required: true,
    },
    toolName: {
      type: String,
      required: true,
    },
    input: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    output: {
      type: mongoose.Schema.Types.Mixed,
      required: false, // Allow null output for failed requests
    },
    processingTime: {
      type: Number, // in milliseconds
      required: true,
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
    cost: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["success", "error", "pending"],
      default: "success",
    },
    errorMessage: String,
    metadata: {
      userAgent: String,
      ipAddress: String,
      sessionId: String,
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
aiToolUsageSchema.index({ userId: 1, createdAt: -1 })
aiToolUsageSchema.index({ toolId: 1, createdAt: -1 })

module.exports = mongoose.model("AIToolUsage", aiToolUsageSchema)
