const jwt = require("jsonwebtoken")
const User = require("../models/User")

const adminAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Check if it's an admin token (hardcoded admin)
    if (decoded.role === "admin" && decoded.email) {
      req.admin = {
        email: decoded.email,
        role: decoded.role,
        loginTime: decoded.loginTime,
      }
      return next()
    }

    // Check if it's a user with admin role
    const user = await User.findById(decoded.userId).select("-password")

    if (!user) {
      return res.status(401).json({ message: "Token is not valid" })
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin privileges required." })
    }

    if (!user.isActive) {
      return res.status(401).json({ message: "Account is deactivated" })
    }

    req.user = user
    next()
  } catch (error) {
    console.error("Admin auth middleware error:", error)
    res.status(401).json({ message: "Token is not valid" })
  }
}

module.exports = adminAuth