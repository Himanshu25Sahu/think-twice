// routes/decisionRoutes.js
import express from 'express';
import { isAuthenticated } from '../utils/isAuthenticated.js';
import {
  createDecision,
  updateDecision,
  getDecision,
  getUserDecisions,
  getPublicDecisions,
  deleteDecision,
  toggleLike,
  addComment,
  getDecisionsForReview,
  getDecisionAnalytics,
  enablePoll,
  votePoll,
  getMyDecisions
} from '../controllers/decisionController.js';

export const decisionRouter = express.Router();

decisionRouter.use(isAuthenticated);

decisionRouter.post('/', createDecision); 
decisionRouter.get('/public', getPublicDecisions);
decisionRouter.get('/review', getDecisionsForReview);
decisionRouter.get('/my',getMyDecisions)
decisionRouter.get('/analytics/:userId', getDecisionAnalytics);
decisionRouter.get('/user/:userId', getUserDecisions);
decisionRouter.get('/:id', getDecision);
decisionRouter.post('/:id', updateDecision);
decisionRouter.delete('/:id', deleteDecision);
decisionRouter.post('/:id/like', toggleLike);
decisionRouter.post('/:id/comment', addComment);

decisionRouter.put('/:id/poll/enable', enablePoll);
decisionRouter.post('/:id/poll/vote', votePoll);