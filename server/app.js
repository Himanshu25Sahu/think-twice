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
connectDB()

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'https://think-twice-six.vercel.app'
];

// Custom CORS middleware - MORE RELIABLE than the cors package
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Handle preflight (OPTIONS) requests
  if (req.method === 'OPTIONS') {
    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Expose-Headers', 'Set-Cookie');
      res.header('Access-Control-Max-Age', '86400'); // 24 hours
      return res.status(200).end();
    } else {
      return res.status(403).end(); // Not allowed
    }
  }
  
  // Handle regular requests
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'Set-Cookie');
  }
  
  next();
});

// Keep the cors package as backup (it won't interfere)
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
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
  console.log('Request:', {
    method: req.method,
    url: req.url,
    origin: req.headers.origin,
    hasCookies: !!req.cookies.token
  });
  next();
});

app.use('/auth', authRoutes);
app.use('/decisions', decisionRouter);
app.use('/user', userRoutes);
app.use('/analytics', analyticsRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    allowedOrigins: allowedOrigins
  });
});

// Handle specific OPTIONS for auth routes (extra assurance)
app.options('/auth/login', (req, res) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'Set-Cookie');
    return res.status(200).end();
  }
  res.status(403).end();
});


// Add this route for testing
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