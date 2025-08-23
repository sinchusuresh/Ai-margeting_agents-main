const express = require("express");
const User = require("../models/User");
const Subscription = require("../models/Subscription");
const AIToolUsage = require("../models/AIToolUsage");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const monthlyRevenue = null; // No hardcoded values - calculate from real subscription data if needed
    const activeSubscriptions = await Subscription.countDocuments({ status: "active" });
    const apiUsage = await AIToolUsage.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });
    res.json({
      totalUsers,
      monthlyRevenue,
      activeSubscriptions,
      apiUsage,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching dashboard stats", error });
  }
});

module.exports = router; 