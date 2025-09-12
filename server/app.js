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
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'https://think-twice-six.vercel.app' // ADD YOUR ACTUAL VERCEL URL
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Set-Cookie"] // This is crucial!
};

app.use(cors(corsOptions));

// Explicitly handle OPTIONS (preflight)


app.use(express.json());
app.use(cookieParser());

app.use('/auth',authRoutes);
app.use('/decisions',decisionRouter);
app.use('/user',userRoutes);
app.use('/analytics',analyticsRoutes)