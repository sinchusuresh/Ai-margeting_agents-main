const express = require("express")
const User = require("../models/User")
const AIToolUsage = require("../models/AIToolUsage")

const auth = require("../middleware/auth")
const { body, validationResult } = require("express-validator")
const Notification = require("../models/Notification");
const jwt = require("jsonwebtoken");

const router = express.Router()

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Calculate trial days remaining
    const trialDaysRemaining =
      user.subscription.status === "trial"
        ? Math.max(0, Math.ceil((user.subscription.trialEndDate - new Date()) / (1000 * 60 * 60 * 24)))
        : 0

    // Get available tools
    const availableTools = user.getAvailableTools()
    
    // Debug logging to see what's happening
    console.log(`🔍 User ${user._id} profile request:`)
    console.log(`   Plan: ${user.subscription?.plan}`)
    console.log(`   Status: ${user.subscription?.status}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Available tools: ${availableTools.length} tools`)
    console.log(`   Tools: ${availableTools.join(', ')}`)

    // Get recent activity
    const recentActivity = await AIToolUsage.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("toolName createdAt status")

    res.json({
      user: {
        ...user.toObject(),
        trialDaysRemaining,
        availableTools,
      },
      recentActivity,
    })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put(
  "/profile",
  auth,
  [
    body("firstName").optional().trim().isLength({ min: 2 }),
    body("lastName").optional().trim().isLength({ min: 2 }),
    body("phone").optional().isMobilePhone(),
    body("company").optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { firstName, lastName, phone, company } = req.body

      const user = await User.findById(req.user.userId)
      if (!user) {
        return res.status(404).json({ message: "User not found" })
      }

      // Update fields if provided
      if (firstName) user.firstName = firstName
      if (lastName) user.lastName = lastName
      if (phone) user.phone = phone
      if (company !== undefined) user.company = company

      await user.save()

      // Remove password from response
      const userResponse = user.toObject()
      delete userResponse.password

      res.json({
        message: "Profile updated successfully",
        user: userResponse,
      })
    } catch (error) {
      console.error("Update profile error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },
)

// @route   GET /api/users/usage-stats
// @desc    Get user usage statistics
// @access  Private
router.get("/usage-stats", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Get current month usage
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const monthlyUsage = await AIToolUsage.countDocuments({
      userId: user._id,
      createdAt: { $gte: startOfMonth },
    })

    // Get total usage from database
    const totalUsage = await AIToolUsage.countDocuments({
      userId: user._id,
    })

    // Get tool usage breakdown
    const toolUsageStats = await AIToolUsage.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: "$toolName",
          count: { $sum: 1 },
          lastUsed: { $max: "$createdAt" },
        },
      },
      { $sort: { count: -1 } },
    ])

    // Get usage over time (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const dailyUsage = await AIToolUsage.aggregate([
      {
        $match: {
          userId: user._id,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    res.json({
      totalGenerations: totalUsage,
      monthlyGenerations: monthlyUsage,
      toolUsageStats,
      dailyUsage,
      subscription: {
        plan: user.subscription.plan,
        status: user.subscription.status,
        trialDaysRemaining:
          user.subscription.status === "trial"
            ? Math.max(0, Math.ceil((user.subscription.trialEndDate - new Date()) / (1000 * 60 * 60 * 24)))
            : 0,
      },
    })
  } catch (error) {
    console.error("Get usage stats error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   POST /api/users/change-password
// @desc    Change user password
// @access  Private
router.post(
  "/change-password",
  auth,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      ),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { currentPassword, newPassword } = req.body

      const user = await User.findById(req.user.userId)
      if (!user) {
        return res.status(404).json({ message: "User not found" })
      }

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword)
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" })
      }

      // Update password
      user.password = newPassword
      await user.save()

      res.json({ message: "Password changed successfully" })
    } catch (error) {
      console.error("Change password error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },
)



// Test route to check user authentication
router.get("/test-auth", auth, async (req, res) => {
  try {
    console.log('🧪 Test auth - User ID:', req.user.userId);
    console.log('🧪 Test auth - User ID type:', typeof req.user.userId);
    console.log('🧪 Test auth - User ID string:', req.user.userId.toString());
    
    // Check if user exists
    const user = await User.findById(req.user.userId);
    console.log('🧪 Test auth - User found:', user ? user.email : 'NOT FOUND');
    
    // Check notifications for this user
    const notifications = await Notification.find({ user: req.user.userId });
    console.log('🧪 Test auth - Notifications found:', notifications.length);
    
    res.json({ 
      userId: req.user.userId,
      userIdType: typeof req.user.userId,
      userExists: !!user,
      userEmail: user ? user.email : null,
      notificationsCount: notifications.length
    });
  } catch (error) {
    console.error("Test auth error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Contact form submission
router.post("/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    
    console.log('📧 Contact form submission:', { name, email, message });
    
    // Here you would integrate with your email service
    // For now, we'll just log the message and return success
    // You can integrate with services like:
    // - Nodemailer with Gmail/SMTP
    // - SendGrid
    // - Mailgun
    // - AWS SES
    
    // Example with nodemailer (you'll need to configure this)
    /*
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransporter({
      service: 'Gmail',
      auth: {
        user: 'your-email@gmail.com',
        pass: 'your-app-password'
      }
    });
    
    await transporter.sendMail({
      from: email,
      to: 'sumit786rana@gmail.com',
      subject: `Contact Form: ${name}`,
      text: message,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    });
    */
    
    // For now, just return success
    res.json({ 
      message: "Message sent successfully! We'll get back to you soon.",
      success: true 
    });
    
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ 
      message: "Failed to send message. Please try again later.",
      success: false 
    });
  }
});

// @route   GET /api/user/notifications
// @desc    Get notifications for the current user
// @access  Private
router.get("/notifications", auth, async (req, res) => {
  try {
    console.log('🔔 Fetching notifications for user:', req.user.userId);
    console.log('🔔 User ID type:', typeof req.user.userId);
    
    // Get notifications from database
    const notifications = await Notification.find({ 
      user: req.user.userId 
    }).sort({ createdAt: -1 }).limit(20);
    
    console.log('📋 Found notifications:', notifications.length);
    console.log('📋 Notifications:', notifications.map(n => ({ id: n._id, title: n.title, user: n.user })));
    
    res.json(notifications);
  } catch (error) {
    console.error("❌ User notifications error:", error);
    res.status(500).json({ message: "Server error fetching notifications" });
  }
});

// @route   POST /api/user/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.post("/notifications/:id/read", auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    res.json({ message: "Notification marked as read", notification });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/user/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.post("/notifications/read-all", auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.userId, read: false },
      { read: true }
    );
    
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/user/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get("/notifications/unread-count", auth, async (req, res) => {
  try {
    console.log('🔢 Getting unread count for user:', req.user.userId);
    
    const count = await Notification.countDocuments({ 
      user: req.user.userId, 
      read: false 
    });
    
    console.log('🔢 Unread count:', count);
    
    res.json({ count });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router
