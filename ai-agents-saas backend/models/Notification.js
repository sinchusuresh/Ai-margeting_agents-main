const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['success', 'warning', 'info', 'error'], 
      default: 'info' 
    },
    category: { 
      type: String, 
      enum: ['subscription', 'usage', 'feature', 'system', 'trial'], 
      default: 'system' 
    },
    read: { type: Boolean, default: false },
    actionUrl: { type: String }, // URL to navigate to when clicked
    expiresAt: { type: Date }, // Optional expiration date
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema); 