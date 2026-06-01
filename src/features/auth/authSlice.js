import { createSlice } from '@reduxjs/toolkit';
import { loginUser } from './authThunks';

const initialState = {
    user: JSON.parse(localStorage.getItem('crm_user')) || null,
    token: localStorage.getItem('crm_token') || null,
    isAuthenticated: !!localStorage.getItem('crm_token'),
    loading: false,
    error: null,
};

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            const { user, token } = action.payload;
            state.user = user;
            state.token = token;
            state.isAuthenticated = true;
            localStorage.setItem('crm_user', JSON.stringify(user));
            localStorage.setItem('crm_token', token);
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = null;
            localStorage.removeItem('crm_user');
            localStorage.removeItem('crm_token');
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                const { user, token } = action.payload;
                state.user = user;
                state.token = token;
                state.isAuthenticated = true;
                localStorage.setItem('crm_user', JSON.stringify(user));
                localStorage.setItem('crm_token', token);
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Login failed";
            });
    }
});

export const { setCredentials, logout, clearError } = authSlice.actions;

export default authSlice.reducer;
