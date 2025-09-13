// middleware/isAuthenticated.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from '../models/UserModel.js'

dotenv.config();
// isAuthenticated.js - ADD DEBUG LOGS
export const isAuthenticated = async (req, res, next) => {
  try {
    console.log('=== AUTH MIDDLEWARE CHECK ===');
    console.log('Request URL:', req.url);
    console.log('Request cookies:', req.cookies);
    console.log('Request origin:', req.headers.origin);

    const token = req.cookies.token;
    console.log('Token from cookie:', token ? token.substring(0, 20) + '...' : 'MISSING');

    if (!token) {
      console.log('❌ No token found in cookies');
      return res.status(401).json({ success: false, message: "Not authenticated, please login" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully for user ID:', decoded.id);

    req.user = await User.findById(decoded.id).select("-password");
    
    if (!req.user) {
      console.log('❌ User not found for ID:', decoded.id);
      return res.status(401).json({ success: false, message: "User not found" });
    }

    console.log('✅ Authentication successful for user:', req.user.email);
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};