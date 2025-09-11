// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice.js';

// Load persisted auth state from localStorage
const loadAuthState = () => {
  try {
    if (typeof window === 'undefined') return undefined;
    
    const serializedState = localStorage.getItem("auth");
    if (!serializedState) return undefined;
    
    const state = JSON.parse(serializedState);
    
    // Check if token exists and is not expired (you might want to add JWT expiration check)
    if (state.token) {
      return state;
    }
    return undefined;
  } catch (err) {
    console.error("Error loading auth state:", err);
    return undefined;
  }
};

// Initialize store with persisted state
export const store = configureStore({
  reducer: {
    user: authSlice,
  },
  preloadedState: { 
    user: loadAuthState() || {
      userData: null,
      token: null,
      isAuthorized: false,
      loading: false,
      error: null,
    }
  },
});

// Save state to localStorage whenever it changes
store.subscribe(() => {
  try {
    const state = store.getState().user;
    localStorage.setItem("auth", JSON.stringify(state));
  } catch (err) {
    console.error("Error saving auth state:", err);
  }
});