import { createSlice } from '@reduxjs/toolkit';
import { fetchStages, saveStages } from './stagesThunks';

const initialState = {
  stages: [],
  loading: false,
  error: null,
};

export const stagesSlice = createSlice({
  name: 'stages',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStages.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStages.fulfilled, (state, action) => {
        state.loading = false;
        state.stages = action.payload;
      })
      .addCase(fetchStages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(saveStages.fulfilled, (state, action) => {
        state.stages = action.payload;
      });
  },
});

export default stagesSlice.reducer;
