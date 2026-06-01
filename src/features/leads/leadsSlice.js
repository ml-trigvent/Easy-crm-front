import { createSlice } from '@reduxjs/toolkit';
import {
  fetchAllLeads,
  fetchPipeline,
  fetchChatsList,
  updateLeadStageAsync,
  createDealAsync,
  createLeadAsync,
  deleteDealAsync,
  fetchLeadProfile,
  fetchLeadMessages,
  updateLeadNotes,
  sendLeadMessage,
} from './leadsThunks';

const initialState = {
  leads: [], // Deals in pipeline
  allLeads: [], // Full list
  chatsList: [], // Chats preview list
  currentLead: null,
  currentLeadMessages: [],
  loading: false,
  error: null,
};

export const leadsSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    appendMessage: (state, action) => {
      const msg = action.payload;
      // Deduplicate to avoid rendering duplicates
      const exists = state.currentLeadMessages.some(m => m.id === msg.id);
      if (!exists) {
        state.currentLeadMessages.push(msg);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllLeads.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.allLeads = action.payload;
      })
      .addCase(fetchAllLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchPipeline.fulfilled, (state, action) => {
        state.leads = action.payload;
      })
      .addCase(fetchChatsList.fulfilled, (state, action) => {
        state.chatsList = action.payload;
      })
      .addCase(updateLeadStageAsync.fulfilled, (state, action) => {
        const { leadId, stageId } = action.payload;
        const lead = state.leads.find(l => l.leadId === leadId || l.id === leadId);
        if (lead) {
          lead.stage = stageId;
        }
        if (state.currentLead && state.currentLead.id.toString() === leadId.toString()) {
          state.currentLead.stage_id = stageId;
        }
      })
      .addCase(createDealAsync.fulfilled, (state, action) => {
        state.leads.push(action.payload.data);
      })
      .addCase(createLeadAsync.fulfilled, (state, action) => {
        state.allLeads.unshift(action.payload.data);
      })
      .addCase(deleteDealAsync.fulfilled, (state, action) => {
        const deletedId = action.payload.toString();
        state.leads = state.leads.filter(l => (l.leadId || '').toString() !== deletedId && (l.id || '').toString() !== deletedId);
        state.allLeads = state.allLeads.filter(l => (l.id || '').toString() !== deletedId);
        state.chatsList = state.chatsList.filter(c => (c.id || '').toString() !== deletedId && (c.leadId || '').toString() !== deletedId);
      })
      .addCase(fetchLeadProfile.fulfilled, (state, action) => {
        state.currentLead = action.payload;
      })
      .addCase(fetchLeadMessages.fulfilled, (state, action) => {
        state.currentLeadMessages = action.payload;
      })
      .addCase(updateLeadNotes.fulfilled, (state, action) => {
        if (state.currentLead) {
          state.currentLead.notes = action.payload.notes;
        }
      })
      .addCase(sendLeadMessage.fulfilled, (state, action) => {
        state.currentLeadMessages.push(action.payload);
      });
  },
});

export const { appendMessage } = leadsSlice.actions;

export default leadsSlice.reducer;
