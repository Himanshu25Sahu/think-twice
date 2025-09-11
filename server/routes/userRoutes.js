import express from 'express'
export const userRoutes=express.Router();
import {isAuthenticated} from '../utils/isAuthenticated.js'
import { getMyProfile } from '../controllers/userController.js';


userRoutes.get('/my-profile',isAuthenticated,getMyProfile);