import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { 
  persistStore, 
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
const customStorage = {
  getItem: (key) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key, value) => {
    localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key) => {
    localStorage.removeItem(key);
    return Promise.resolve();
  },
};

import authReducer from '../features/auth/authSlice';
import ticketsReducer from '../features/tickets/ticketsSlice';
import stagesReducer from '../features/stages/stagesSlice';
import tasksReducer from '../features/tasks/tasksSlice';
import leadsReducer from '../features/leads/leadsSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  tickets: ticketsReducer,
  stages: stagesReducer,
  tasks: tasksReducer,
  leads: leadsReducer,
});

const persistConfig = {
  key: 'easy_crm_root',
  version: 1,
  storage: customStorage,
  whitelist: ['auth'], // Only persist the auth slice by default (can add more if needed)
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
