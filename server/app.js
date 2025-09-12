import { connectDB } from './database/connection.js';
import express from 'express'
import cookieParser from 'cookie-parser'
import { authRoutes } from './routes/authRoutes.js';
import cors from 'cors'
import { decisionRouter } from './routes/decisionRoutes.js';
import { userRoutes } from './routes/userRoutes.js';
import dotenv from 'dotenv'
import { analyticsRoutes } from './routes/analyticsRoutes.js';
dotenv.config()
export const app=express();
connectDB()

const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Explicitly handle OPTIONS (preflight)
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

app.use('/auth',authRoutes);
app.use('/decisions',decisionRouter);
app.use('/user',userRoutes);
app.use('/analytics',analyticsRoutes)