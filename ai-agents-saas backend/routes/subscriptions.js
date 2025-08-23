const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");
const NotificationService = require("../services/notificationService");
const router = express.Router();

// Get current user's subscription info
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("subscription");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.subscription);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Change user's subscription plan
router.post("/change", auth, async (req, res) => {
  try {
    const { plan } = req.body;
    const validPlans = ["free_trial", "starter", "pro", "agency"];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ message: "Invalid plan" });
    }
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.subscription.plan = plan;
    user.subscription.status = plan === "free_trial" ? "trial" : "active";
    user.subscription.subscriptionStartDate = new Date();
    user.subscription.subscriptionEndDate = null;
    await user.save();
    
    // Generate notifications after subscription change
    try {
      await NotificationService.generateAllNotifications(user._id);
    } catch (notificationError) {
      console.error('Error generating notifications:', notificationError);
    }
    
    res.json({ message: "Plan changed successfully", subscription: user.subscription });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Cancel subscription
router.post("/cancel", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.subscription.status = "cancelled";
    user.subscription.subscriptionEndDate = new Date();
    await user.save();
    res.json({ message: "Subscription cancelled", subscription: user.subscription });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Pause subscription
router.post("/pause", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.subscription.status = "paused";
    await user.save();
    res.json({ message: "Subscription paused", subscription: user.subscription });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router; 