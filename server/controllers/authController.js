import bcrypt from "bcryptjs";
import User from "../models/UserModel.js"
import { sendToken,generateToken } from "../utils/jwtToken.js";
import cloudinary from "../utils/cloudinary.js";
import crypto from "crypto";
import jwt from 'jsonwebtoken'
import nodemailer from "nodemailer";
import dotenv from 'dotenv'
dotenv.config();

const sendOtpEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"THhi" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email - OTP Code",
    text: `Your OTP is ${otp}. It expires in 10 minutes.`,
  });
};

// ✅ Register User
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, bio, location } = req.body;
    const file = req.file;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    let avatarUrl = "https://i.ibb.co/placeholder-avatar.png";
    if (file) {
      const uploaded = await cloudinary.uploader.upload(file.path, {
        folder: "avatars",
      });
      avatarUrl = uploaded.secure_url;
    }

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    user = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      bio,
      location,
      avatar: avatarUrl,
      otp: { code: otpCode, expiresAt: otpExpires },
    });

    await sendOtpEmail(email, otpCode);

    res.status(201).json({
      message: "User registered. OTP sent to email.",
      userId: user._id,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Verify OTP
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email }).select('+otp'); // Ensure otp field is included

    if (!user) return res.status(400).json({ message: "User not found" });

    // Atomic check and update
    if (
      user.otp.code !== otp ||
      !user.otp.expiresAt ||
      user.otp.expiresAt < Date.now()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Update user in a single operation to avoid race conditions
    const updatedUser = await User.findOneAndUpdate(
      { email, "otp.code": otp, "otp.expiresAt": { $gt: Date.now() } },
      { isVerified: true, $unset: { otp: 1 } },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    sendToken(res, updatedUser);

   const token = generateToken(updatedUser._id); // also return for frontend state mgmt
res.json({
  message: "OTP verified. Logged in.",
  user: {
    _id: updatedUser._id,
    email: updatedUser.email,
    name: updatedUser.name,
    avatar: updatedUser.avatar,
  },
  token, // <-- include token in JSON response
});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Resend OTP
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found" });

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    user.otp = { code: otpCode, expiresAt: otpExpires };
    await user.save();

    await sendOtpEmail(email, otpCode);

    res.status(200).json({ message: "New OTP sent to your email." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// authController.js - Update loginUser function
// authController.js - FIXED DOMAIN HANDLING
// authController.js - ADD THESE DEBUG LOGS
export const loginUser = async (req, res) => {
  try {
    // console.log('=== LOGIN REQUEST START ===');
    // console.log('Request origin:', req.headers.origin);
    // console.log('Request headers:', {
    //   'user-agent': req.headers['user-agent'],
    //   'content-type': req.headers['content-type']
    // });

    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      console.log('User not verified:', email);
      return res.status(403).json({ message: "Please verify your email first" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);
    // console.log('Token generated:', token.substring(0, 20) + '...');
    
    const isProduction = process.env.NODE_ENV === 'production';
    // console.log('Environment - Production:', isProduction);
    // console.log('Cookie settings:', {
    //   secure: isProduction,
    //   sameSite: isProduction ? 'lax' : 'lax',
    //   httpOnly: true
    // });

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'lax' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // console.log('Cookie set in response headers');
    // console.log('=== LOGIN REQUEST END ===');

    res.json({ 
      message: "Login successful", 
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      token
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: err.message });
  }
};
// ✅ Logout


// authController.js - ADD THIS FUNCTION
// authController.js - BETTER VERIFY ENDPOINT
export const verifyToken = async (req, res) => {
  try {
    // console.log('=== TOKEN VERIFICATION REQUEST ===');
    
    const token = req.cookies.token;
    if (!token) {
      return res.status(200).json({ 
        isValid: false, 
        message: "No token provided",
        shouldLogout: true
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    
    if (!user) {
      return res.status(200).json({ 
        isValid: false, 
        message: "User not found",
        shouldLogout: true
      });
    }

    res.json({ 
      isValid: true, 
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      }
    });
  } catch (error) {
    console.error('Token verification error:', error.message);
    res.status(200).json({ 
      isValid: false, 
      message: "Invalid or expired token",
      shouldLogout: true
    });
  }
};

// authController.js - ADD THIS FUNCTION
export const refreshToken = async (req, res) => {
  try {
    // console.log('=== TOKEN REFRESH REQUEST ===');
    // console.log('Request cookies:', req.cookies);
    
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    // Generate new token
    const newToken = generateToken(user._id);
    
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Set new cookie
    res.cookie("token", newToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'lax' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ 
      success: true, 
      message: "Token refreshed successfully"
    });
  } catch (error) {
    console.error('Token refresh error:', error.message);
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// authController.js - ENHANCED LOGOUT
export const logoutUser = (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'lax' : 'lax',
    path: '/', // IMPORTANT: Clear cookie from all paths
  });
  
  res.json({ message: "Logged out successfully" });
};