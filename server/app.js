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
export const app = express();

app.set("trust proxy", 1); // Trust first proxy
connectDB()

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'https://think-twice-six.vercel.app'
];

// SIMPLE AND RELIABLE CORS CONFIGURATION
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  exposedHeaders: ['Set-Cookie']
}));

app.use(express.json());
app.use(cookieParser());

// Debug middleware
app.use((req, res, next) => {
  console.log('🌐 Incoming Request:', {
    method: req.method,
    url: req.url,
    origin: req.headers.origin,
    hasCookies: !!req.cookies.token,
    cookies: req.cookies,
    'user-agent': req.headers['user-agent']?.substring(0, 50) + '...'
  });
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/decisions', decisionRouter);
app.use('/user', userRoutes);
app.use('/analytics', analyticsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// Debug endpoint for auth testing
app.get('/debug/auth', (req, res) => {
  console.log('Auth debug - Cookies:', req.cookies);
  console.log('Auth debug - Headers:', req.headers);
  
  res.json({
    cookies: req.cookies,
    headers: {
      origin: req.headers.origin,
      'user-agent': req.headers['user-agent'],
      authorization: req.headers.authorization
    },
    timestamp: new Date().toISOString()
  });
});

// Test CORS endpoint
app.get('/test-cors', (req, res) => {
  res.cookie('test-cookie', 'working', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 3600000
  });
  res.json({ 
    message: 'CORS test successful',
    cookieSet: true,
    origin: req.headers.origin
  });
});
