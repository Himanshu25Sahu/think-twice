import express from 'express'
export const analyticsRoutes=express.Router();
import { isAuthenticated } from '../utils/isAuthenticated.js';
import { getAnalytics } from '../controllers/getAnalytics.js';

analyticsRoutes.get('/get-analytics',isAuthenticated,getAnalytics);

