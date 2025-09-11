// middleware/isAuthenticated.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from '../models/UserModel.js'

dotenv.config();

export const isAuthenticated = async (req, res, next) => {
  try {
    // Get token from cookie
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authenticated, please login" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to req
    req.user = await User.findById(decoded.id).select("-password"); // don’t send password

    if (!req.user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    next(); // move to next middleware or controller
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
