import { createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../services/apiClient';
import { API_URLS } from '../../services/apiUrls';

export const fetchTickets = createAsyncThunk(
  'tickets/fetchTickets', 
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(API_URLS.tickets.list);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to fetch tickets';
      return rejectWithValue(message);
    }
  }
);

export const fetchAgents = createAsyncThunk(
  'tickets/fetchAgents', 
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(API_URLS.agents.list);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to fetch agents';
      return rejectWithValue(message);
    }
  }
);

export const fetchTicketHistory = createAsyncThunk(
  'tickets/fetchTicketHistory', 
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(API_URLS.tickets.history(id));
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to fetch ticket history';
      return rejectWithValue(message);
    }
  }
);

export const createTicket = createAsyncThunk(
  'tickets/createTicket', 
  async (ticketData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(API_URLS.tickets.create, ticketData);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create ticket';
      return rejectWithValue(message);
    }
  }
);

export const updateTicket = createAsyncThunk(
  'tickets/updateTicket', 
  async ({ id, body }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(API_URLS.tickets.update(id), body);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update ticket';
      return rejectWithValue(message);
    }
  }
);

export const addTicketComment = createAsyncThunk(
  'tickets/addTicketComment', 
  async ({ id, comment }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(API_URLS.tickets.comments(id), { comment });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to add comment';
      return rejectWithValue(message);
    }
  }
);
