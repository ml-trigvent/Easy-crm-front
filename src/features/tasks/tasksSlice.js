import { createSlice } from '@reduxjs/toolkit';
import { fetchTasks, createTask, completeTaskAsync, deleteTaskAsync } from './tasksThunks';

const initialState = {
  tasks: [],
  loading: false,
  error: null,
};

export const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.push(action.payload);
      })
      .addCase(completeTaskAsync.fulfilled, (state, action) => {
        const taskId = action.payload;
        const task = state.tasks.find(t => t.id === taskId);
        if (task) {
          task.completed = true;
        }
      })
      .addCase(deleteTaskAsync.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(t => t.id !== action.payload);
      });
  },
});

export default tasksSlice.reducer;
