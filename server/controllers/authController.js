import bcrypt from "bcryptjs";
import User from "../models/UserModel.js"
import { sendToken,generateToken } from "../utils/jwtToken.js";
import cloudinary from "../utils/cloudinary.js";
import crypto from "crypto";
import nodemailer from "nodemailer";

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
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified)
      return res.status(403).json({ message: "Please verify your email first" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const isProduction = process.env.NODE_ENV === 'production';
    const token = generateToken(user._id);
    
    // Get the origin from the request to set proper domain
    const origin = req.headers.origin || '';
    let domain = undefined;
    
    if (isProduction && origin) {
      try {
        const url = new URL(origin);
        domain = url.hostname;
        // Remove www. if present for broader domain matching
        domain = domain.replace(/^www\./, '');
      } catch (err) {
        console.log('Error parsing origin:', err);
      }
    }

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      domain: domain
    });

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
    res.status(500).json({ message: err.message });
  }
};
// ✅ Logout
export const logoutUser = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
};
