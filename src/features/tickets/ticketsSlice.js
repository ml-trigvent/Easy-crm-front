import { createSlice } from '@reduxjs/toolkit';
import {
  fetchTickets,
  fetchAgents,
  fetchTicketHistory,
  createTicket,
  updateTicket,
  addTicketComment,
} from './ticketsThunks';

const initialState = {
  tickets: [],
  agents: [],
  history: [],
  selectedTicket: null,
  loading: false,
  saving: false,
  error: null,
};

export const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    setSelectedTicket: (state, action) => {
      state.selectedTicket = action.payload;
      state.history = [];
    },
    clearSelectedTicket: (state) => {
      state.selectedTicket = null;
      state.history = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
      })

      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload;
      })

      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchAgents.fulfilled, (state, action) => {
        state.agents = action.payload;
      })

      .addCase(fetchTicketHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      })

      .addCase(createTicket.pending, (state) => {
        state.saving = true;
      })

      .addCase(createTicket.fulfilled, (state, action) => {
        state.saving = false;
        state.tickets.unshift(action.payload);
      })

      .addCase(createTicket.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(updateTicket.pending, (state) => {
        state.saving = true;
      })
      .addCase(updateTicket.fulfilled, (state, action) => {
        state.saving = false;
        const updated = action.payload;
        state.tickets = state.tickets.map((t) => (t.id === updated.id ? updated : t));
        if (state.selectedTicket && state.selectedTicket.id === updated.id) {
          state.selectedTicket = updated;
        }
      })

      .addCase(updateTicket.rejected, (state, action) => {
        state.saving = false;
      })

      .addCase(addTicketComment.pending, (state) => {
        state.saving = true;
      })

      .addCase(addTicketComment.fulfilled, (state, action) => {
        state.saving = false;
        state.history = action.payload;
      })
      
      .addCase(addTicketComment.rejected, (state, action) => {
        state.saving = false;
      });
  },
});

export const { setSelectedTicket, clearSelectedTicket } = ticketsSlice.actions;
export default ticketsSlice.reducer;
