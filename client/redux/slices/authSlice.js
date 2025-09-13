// src/redux/slices/authSlice.js - UPDATED
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '@/services/api';

// Load initial state from localStorage
const storedAuth = typeof window !== 'undefined' ? localStorage.getItem('auth') : null;
const initialState = storedAuth ? JSON.parse(storedAuth) : {
  userData: null,
  isAuthorized: false,
  loading: false,
  error: null,
};

const logoutAsync = createAsyncThunk('user/logout', async (_, { rejectWithValue }) => {
  try {
    await api.post('/auth/logout');
    return true;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

const login = createAsyncThunk('user/login', async (userCredentials, { rejectWithValue }) => {
  try {
    console.log('Sending login request to:', '/auth/login');
    const response = await api.post('/auth/login', userCredentials);
    
    if (response.status !== 200) {
      return rejectWithValue(response.data.message || 'Login failed');
    }

    // For cookie-based auth, we don't need to store token in localStorage
    // The server will send it as HttpOnly cookie
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Login failed');
  }
});

const authSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    logout: (state) => {
      state.userData = null;
      state.isAuthorized = false;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('auth');
    },
    clearError: (state) => {
      state.error = null;
    },
    setAuthState: (state, action) => {
      state.userData = action.payload.userData;
      state.isAuthorized = action.payload.isAuthorized;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.userData = action.payload.user;
        state.isAuthorized = true;
        state.error = null;
        
        // Store minimal auth state in localStorage
        localStorage.setItem('auth', JSON.stringify({
          userData: action.payload.user,
          isAuthorized: true
        }));
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthorized = false;
        localStorage.removeItem('auth');
      })
      .addCase(logoutAsync.fulfilled, (state) => {
  state.userData = null;
  state.isAuthorized = false;
  state.loading = false;
  state.error = null;
  localStorage.removeItem('auth');
})
.addCase(logoutAsync.rejected, (state, action) => {
  // Still clear state even if API call fails
  state.userData = null;
  state.isAuthorized = false;
  state.loading = false;
  state.error = action.payload;
  localStorage.removeItem('auth');
});
  },
});

export { login };
export const { logout, clearError, setAuthState } = authSlice.actions;
export default authSlice.reducer;