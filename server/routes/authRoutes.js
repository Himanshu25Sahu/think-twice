import express from 'express'
import { loginUser, registerUser, verifyOtp,logoutUser} from '../controllers/authController.js';
import multer from 'multer'
import { isAuthenticated } from '../utils/isAuthenticated.js';

export const authRoutes=express.Router();
const upload = multer({ dest: "uploads/" });

authRoutes.post('/login',loginUser);
authRoutes.post('/register',upload.single("avatar"),registerUser)
authRoutes.post('/verify-otp',verifyOtp)
authRoutes.post('/logout',isAuthenticated,logoutUser)
