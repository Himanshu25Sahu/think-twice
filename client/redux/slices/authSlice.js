// src/redux/slices/authSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import api from '@/services/api';
// Load initial state from localStorage (fallback to default)
const storedAuth = typeof window !== 'undefined' ? localStorage.getItem('auth') : null;
const initialState = storedAuth ? JSON.parse(storedAuth) : {
  userData: null,
  token: null,
  isAuthorized: false,
  loading: false,
  error: null,
};

const login = createAsyncThunk('user/login', async (userCredentials, { rejectWithValue }) => {
  try {
const response = await api.post('/auth/login', userCredentials);

    if (response.status !== 200) {
      return rejectWithValue(response.data.message || 'Login failed');
    }

    return response.data; // { user, token, message: "Login successful" }
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
      state.token = null;
      state.isAuthorized = false;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('auth'); // Clear localStorage on logout
    },
    clearError: (state) => {
      state.error = null;
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
        state.token = action.payload.token;
        state.isAuthorized = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthorized = false;
      });
  },
});

export { login };
export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;