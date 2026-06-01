import { createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../services/apiClient";
import { API_URLS } from "../../services/apiUrls";

// LOGIN THUNK
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(API_URLS.auth.login, credentials);
      return response.data; // must contain { success, user, token }
    } catch (error) {
      // Extract backend error message
      const message = error.response?.data?.error || "Login failed";
      return rejectWithValue(message);
    }
  }
);
