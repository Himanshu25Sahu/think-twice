// redux/slices/decisionSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { decisionService } from "../../services/decisionService";

export const createDecision = createAsyncThunk(
  "decisions/create",
  async (decisionData, { rejectWithValue }) => {
    try {
      const response = await decisionService.createDecision(decisionData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create decision");
    }
  }
);

export const addComment = createAsyncThunk(
  "decisions/addComment",
  async ({ decisionId, text }, { rejectWithValue }) => {
    try {
      const response = await decisionService.addComment(decisionId, text);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to add comment");
    }
  }
);

const initialState = {
  decisions: [],
  loading: false,
  error: null,
};

const decisionSlice = createSlice({
  name: "decisions",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createDecision.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDecision.fulfilled, (state, action) => {
        state.loading = false;
        state.decisions.push(action.payload);
      })
      .addCase(createDecision.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addComment.fulfilled, (state, action) => {
        state.loading = false;
        const decision = state.decisions.find(d => d._id === action.payload.decisionId);
        if (decision) {
          decision.comments = [...(decision.comments || []), action.payload];
        }
      })
      .addCase(addComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = decisionSlice.actions;
export default decisionSlice.reducer;