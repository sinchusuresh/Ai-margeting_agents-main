const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  platform: {
    dbConnection: { type: String, default: "" },
    apiKeys: [{ type: String }],
    envVars: { type: Map, of: String },
    payment: {
      stripe: { type: String, default: "" },
      plans: [
        {
          name: String,
          price: Number,
          features: [String],
        },
      ],
    },
    security: {
      passwordPolicy: {
        minLength: { type: Number, default: 8 },
        requireNumbers: { type: Boolean, default: false },
        requireSpecial: { type: Boolean, default: false },
      },
      sessionTimeout: { type: Number, default: 30 }, // in minutes
    },
  },
  userManagement: {
    registrationEnabled: { type: Boolean, default: true },
    trial: {
      durationDays: { type: Number, default: 7 },
      usageLimit: { type: Number, default: 100 },
    },
    plans: [
      {
        name: String,
        price: Number,
        features: [String],
      },
    ],
  },
  aiTools: {
    usageLimits: {
      free_trial: { type: Number, default: 100 },
      starter: { type: Number, default: 1000 },
      pro: { type: Number, default: 10000 },
      agency: { type: Number, default: 100000 },
    },
    enabledTools: [{ type: String }],
    tools: [
      {
        name: { type: String, required: true },
        description: { type: String, default: "" },
        category: { type: String, default: "content" },
        icon: { type: String, default: "🔧" },
        isActive: { type: Boolean, default: true }
      }
    ],
  },
});

module.exports = mongoose.model("Settings", settingsSchema); 