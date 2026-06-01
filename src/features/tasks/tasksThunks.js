import { createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../services/apiClient';
import { API_URLS } from '../../services/apiUrls';

export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks', 
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(API_URLS.tasks.list);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to fetch tasks';
      return rejectWithValue(message);
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask', 
  async (taskData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(API_URLS.tasks.create, taskData);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create task';
      return rejectWithValue(message);
    }
  }
);

export const completeTaskAsync = createAsyncThunk(
  'tasks/completeTaskAsync', 
  async (taskId, { rejectWithValue }) => {
    try {
      await apiClient.put(API_URLS.tasks.complete(taskId));
      return taskId;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to complete task';
      return rejectWithValue(message);
    }
  }
);

export const deleteTaskAsync = createAsyncThunk(
  'tasks/deleteTaskAsync', 
  async (taskId, { rejectWithValue }) => {
    try {
      await apiClient.delete(API_URLS.tasks.delete(taskId));
      return taskId;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete task';
      return rejectWithValue(message);
    }
  }
);
