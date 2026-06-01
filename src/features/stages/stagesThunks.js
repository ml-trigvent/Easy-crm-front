import { createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../services/apiClient';
import { API_URLS } from '../../services/apiUrls';

export const fetchStages = createAsyncThunk(
  'stages/fetchStages', 
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(API_URLS.stages.list);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to fetch stages';
      return rejectWithValue(message);
    }
  }
);

export const saveStages = createAsyncThunk(
  'stages/saveStages', 
  async (stages, { rejectWithValue }) => {
    try {
      await apiClient.post(API_URLS.stages.update, { stages });
      return stages;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to save stages';
      return rejectWithValue(message);
    }
  }
);
