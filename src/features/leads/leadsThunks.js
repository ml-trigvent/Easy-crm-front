import { createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../services/apiClient';
import { API_URLS } from '../../services/apiUrls';

export const fetchAllLeads = createAsyncThunk(
  'leads/fetchAllLeads', 
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(API_URLS.leads.list);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to fetch leads';
      return rejectWithValue(message);
    }
  }
);

export const fetchPipeline = createAsyncThunk(
  'leads/fetchPipeline', 
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(API_URLS.pipeline.list);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to fetch pipeline';
      return rejectWithValue(message);
    }
  }
);

export const fetchChatsList = createAsyncThunk(
  'leads/fetchChatsList', 
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(API_URLS.chats.list);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to fetch chats list';
      return rejectWithValue(message);
    }
  }
);

export const updateLeadStageAsync = createAsyncThunk(
  'leads/updateLeadStage', 
  async ({ leadId, stageId }, { rejectWithValue }) => {
    try {
      await apiClient.post(API_URLS.pipeline.move, { leadId, newStage: stageId });
      return { leadId, stageId };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update lead stage';
      return rejectWithValue(message);
    }
  }
);

export const createDealAsync = createAsyncThunk(
  'leads/createDeal', 
  async (dealData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(API_URLS.pipeline.createDeal, dealData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create deal';
      return rejectWithValue(message);
    }
  }
);

export const createLeadAsync = createAsyncThunk(
  'leads/createLead', 
  async (leadData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(API_URLS.leads.create, leadData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create lead';
      return rejectWithValue(message);
    }
  }
);

export const deleteDealAsync = createAsyncThunk(
  'leads/deleteDeal', 
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(API_URLS.leads.delete(id));
      return id;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete deal';
      return rejectWithValue(message);
    }
  }
);

export const fetchLeadProfile = createAsyncThunk(
  'leads/fetchLeadProfile', 
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(API_URLS.leads.profile(id));
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to fetch lead profile';
      return rejectWithValue(message);
    }
  }
);

export const fetchLeadMessages = createAsyncThunk(
  'leads/fetchLeadMessages', 
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(API_URLS.leads.messages(id));
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to fetch lead messages';
      return rejectWithValue(message);
    }
  }
);

export const updateLeadNotes = createAsyncThunk(
  'leads/updateLeadNotes', 
  async ({ id, notes }, { rejectWithValue }) => {
    try {
      await apiClient.post(API_URLS.leads.notes(id), { notes });
      return { notes };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update lead notes';
      return rejectWithValue(message);
    }
  }
);

export const sendLeadMessage = createAsyncThunk(
  'leads/sendLeadMessage', 
  async ({ id, message }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(API_URLS.leads.messages(id), { message });
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to send lead message';
      return rejectWithValue(message);
    }
  }
);
