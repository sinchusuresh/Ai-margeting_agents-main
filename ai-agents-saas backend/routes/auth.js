const express = require("express")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const User = require("../models/User")
const { body, validationResult } = require("express-validator")
const rateLimit = require("express-rate-limit")
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const AIToolUsage = require("../models/AIToolUsage");

const Notification = require("../models/Notification");
const NotificationService = require("../services/notificationService");

const router = express.Router()

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { message: "Too many authentication attempts, please try again later." },
})

// Helper function to check rate limiting
const loginAttempts = new Map()
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS = 5

const checkRateLimit = (identifier) => {
  const now = Date.now()
  const attempts = loginAttempts.get(identifier) || { count: 0, firstAttempt: now }

  if (now - attempts.firstAttempt > RATE_LIMIT_WINDOW) {
    // Reset window
    loginAttempts.set(identifier, { count: 1, firstAttempt: now })
    return true
  }

  if (attempts.count >= MAX_ATTEMPTS) {
    return false
  }

  attempts.count++
  loginAttempts.set(identifier, attempts)
  return true
}

// Validation middleware
const validateRegistration = [
  body("firstName").trim().isLength({ min: 2 }).withMessage("First name must be at least 2 characters"),
  body("lastName").trim().isLength({ min: 2 }).withMessage("Last name must be at least 2 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("phone").isMobilePhone().withMessage("Please provide a valid phone number"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    ),
  body("company").optional().trim(),
]

const validateLogin = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
]

// Generate JWT Token
const generateToken = (userId, role = "user") => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: "7d" })
}

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
      })
    }

    const { firstName, lastName, email, phone, password, company } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    })

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email or phone already exists",
      })
    }

    // Create new user (password will be hashed by the pre-save middleware)
    const user = new User({
      firstName,
      lastName,
      email,
      phone,
      password,
      company: company || "",
      role: "user",
      subscription: {
        plan: "free_trial",
        status: "trial",
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      isActive: true,
    })

    await user.save()

    // Generate welcome notifications for new user
    try {
      await NotificationService.generateAllNotifications(user._id);
    } catch (notificationError) {
      console.error('Error generating welcome notifications:', notificationError);
    }

    // Generate token
    const token = generateToken(user._id, user.role)

    // Remove password from response
    const userResponse = user.toObject()
    delete userResponse.password

    // After user.save()
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    await user.save();

    console.log('Verification token generated for user:', user.email);
    console.log('Verification token:', verificationToken);

    // Set up nodemailer transporter (use your real SMTP credentials)
    const transporter = nodemailer.createTransport({
      service: 'Gmail', // or your email provider
      auth: {
        user: 'rathodreena677@gmail.com',
        pass: 'xjgd plto fvnf ybch',
      },
    });

    const verificationUrl = `http://localhost:5000/api/auth/verify-email?token=${verificationToken}`;
    console.log('Verification URL:', verificationUrl);

    try {
      await transporter.sendMail({
        to: user.email,
        subject: 'Verify your email',
        html: `<a href="${verificationUrl}">Click here to verify your email</a>`,
      });
      console.log('Verification email sent successfully to:', user.email);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: userResponse,
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ message: "Server error during registration" })
  }
})

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
      })
    }

    const { email, password } = req.body

    // Rate limiting
    if (!checkRateLimit(email)) {
      return res.status(429).json({
        message: "Too many login attempts. Please try again later.",
      })
    }

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: "Account is deactivated" })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate notifications for user (check for trial expiry, usage limits, etc.)
    try {
      await NotificationService.generateAllNotifications(user._id);
    } catch (notificationError) {
      console.error('Error generating notifications on login:', notificationError);
    }

    // Generate token
    const userResponse = user.toObject()
    delete userResponse.password

    res.json({
      message: "Login successful",
      token: generateToken(user._id, user.role),
      user: userResponse,
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error during login" })
  }
})

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ message: "No token provided" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decoded.userId).select("-password")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({ user })
  } catch (error) {
    console.error("Token verification error:", error)
    res.status(401).json({ message: "Invalid token" })
  }
})

// Logout (optional - mainly for clearing server-side sessions if needed)
router.post("/logout", (req, res) => {
  // In a JWT-based system, logout is typically handled client-side
  // by removing the token from storage
  res.json({ message: "Logout successful" })
})

router.get('/verify-email', async (req, res) => {
  try {
    console.log('Email verification attempt with token:', req.query.token ? 'Token provided' : 'No token');
    
    const { token } = req.query;
    
    if (!token) {
      console.log('No verification token provided');
      return res.status(400).send(`
        <html>
          <head><title>Email Verification Failed</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #e74c3c;">❌ Email Verification Failed</h2>
            <p>Invalid verification link. No token provided.</p>
            <p><a href="http://localhost:3000" style="color: #3498db;">Go to Login</a></p>
          </body>
        </html>
      `);
    }
    
    const user = await User.findOne({ verificationToken: token });
    
    if (!user) {
      console.log('Invalid or expired verification token:', token);
      return res.status(400).send(`
        <html>
          <head><title>Email Verification Failed</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #e74c3c;">❌ Email Verification Failed</h2>
            <p>Invalid or expired verification link.</p>
            <p><a href="http://localhost:3000" style="color: #3498db;">Go to Login</a></p>
          </body>
        </html>
      `);
    }
    
    console.log('User found for verification:', user.email);
    
    // Update user verification status
    user.verified = true;
    user.isEmailVerified = true;
    user.verificationToken = undefined;
    await user.save();
    
    console.log('Email verified successfully for:', user.email);
    
    // Send success response with redirect
    res.send(`
      <html>
        <head><title>Email Verified Successfully</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #27ae60;">✅ Email Verified Successfully!</h2>
          <p>Your email has been verified. You can now log in to your account.</p>
          <p><a href="http://localhost:3000" style="color: #3498db; text-decoration: none; padding: 10px 20px; background: #ecf0f1; border-radius: 5px;">Go to Login</a></p>
          <script>
            // Auto-redirect after 3 seconds
            setTimeout(function() {
              window.location.href = 'http://localhost:3000';
            }, 3000);
          </script>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).send(`
      <html>
        <head><title>Email Verification Error</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #e74c3c;">❌ Email Verification Error</h2>
          <p>An error occurred during email verification. Please try again.</p>
          <p><a href="http://localhost:3000" style="color: #3498db;">Go to Login</a></p>
        </body>
      </html>
    `);
  }
});

// @route   GET /api/user/analytics
// @desc    Get analytics for the current user
// @access  Private
router.get("/user/analytics", async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId = decoded.userId || decoded.id;

    // Generations: count AIToolUsage for this user
    const generations = await AIToolUsage.countDocuments({ userId: userId });
    // Last Activity: find the latest AIToolUsage for this user
    const lastUsage = await AIToolUsage.findOne({ userId: userId }).sort({ createdAt: -1 });
    let lastActivity = null;
    if (lastUsage && lastUsage.createdAt) {
      lastActivity = lastUsage.createdAt;
    }

    res.json({ generations, lastActivity });
  } catch (error) {
    console.error("User analytics error:", error);
    res.status(500).json({ message: "Server error fetching analytics" });
  }
});

// @route   GET /api/auth/check-admin
// @desc    Check if current user has admin privileges
// @access  Private
router.get("/check-admin", async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ 
        isAdmin: false, 
        message: "No token provided" 
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId).select("-password")

    if (!user) {
      return res.status(401).json({ 
        isAdmin: false, 
        message: "Invalid token" 
      })
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        isAdmin: false, 
        message: "Account is deactivated" 
      })
    }

    res.json({
      isAdmin: user.role === "admin",
      role: user.role,
      message: user.role === "admin" ? "User has admin privileges" : "User does not have admin privileges"
    })
  } catch (error) {
    console.error("Check admin error:", error)
    res.status(401).json({ 
      isAdmin: false, 
      message: "Token is not valid" 
    })
  }
})


module.exports = router