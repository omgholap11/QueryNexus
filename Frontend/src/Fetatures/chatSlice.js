import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    activeSessionId: null,
    activeSessionTitle: null,
    messages: [],
    isLoadingMessages: false,
};

export const chatSlice = createSlice({   
    name: 'chat',
    initialState,
    reducers: {
        setActiveSession: (state, action) => {
            state.activeSessionId = action.payload.sessionId;
            state.activeSessionTitle = action.payload.title;
        },
        setMessages: (state, action) => {
            // Map backend format to frontend format
            // Backend: { role: 'User'/'VMS-AI', content, created_at }
            // Frontend: { type: 'user'/'ai', content }
            state.messages = action.payload.map(msg => ({
                type: msg.role === 'User' ? 'user' : 'ai',
                content: msg.content,
            }));
        },
        addMessage: (state, action) => {
            state.messages.push(action.payload);
        },
        setIsLoadingMessages: (state, action) => {
            state.isLoadingMessages = action.payload;
        },
        clearChat: (state) => {
            state.activeSessionId = null;
            state.activeSessionTitle = null;
            state.messages = [];
        },
    },
});

export const {
    setActiveSession,
    setMessages,
    addMessage,
    setIsLoadingMessages,
    clearChat,
} = chatSlice.actions;

export default chatSlice.reducer;
