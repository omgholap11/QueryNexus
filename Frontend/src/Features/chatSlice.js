import { createSlice } from '@reduxjs/toolkit';

const MESSAGES_LIMIT = 10;

const initialState = {
    activeSessionId: null,
    activeSessionTitle: null,
    messages: [],
    isLoadingMessages: false,
    isLoadingOlderMessages: false,
    messagesOffset: 0,
    hasMoreMessages: true,
};

export const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setActiveSession: (state, action) => {
            state.activeSessionId = action.payload.sessionId;
            state.activeSessionTitle = action.payload.title;
            // Reset pagination on session change
            state.messagesOffset = 0;
            state.hasMoreMessages = true;
        },
        setMessages: (state, action) => {
            // Map backend format to frontend format
            // Backend: { role: 'User'/'VMS-AI', content, created_at }
            // Frontend: { type: 'user'/'ai', content }
            const mappedMessages = action.payload.map(msg => ({
                type: msg.role === 'User' ? 'user' : 'ai',
                content: msg.content,
            }));
            // Backend sends most recent first, we need to reverse for display (oldest at top)
            state.messages = mappedMessages.reverse();
            state.messagesOffset = action.payload.length;
            state.hasMoreMessages = action.payload.length === MESSAGES_LIMIT;
        },
        prependMessages: (state, action) => {
            // Prepend older messages at the beginning
            const mappedMessages = action.payload.map(msg => ({
                type: msg.role === 'User' ? 'user' : 'ai',
                content: msg.content,
            }));
            // Reverse because backend sends newest first in each chunk
            state.messages = [...mappedMessages.reverse(), ...state.messages];
            state.messagesOffset += action.payload.length;
            state.hasMoreMessages = action.payload.length === MESSAGES_LIMIT;
        },
        addMessage: (state, action) => {
            state.messages.push(action.payload);
            // Increment offset to account for new message when loading older messages
            state.messagesOffset += 1;
        },
        setIsLoadingMessages: (state, action) => {
            state.isLoadingMessages = action.payload;
        },
        setIsLoadingOlderMessages: (state, action) => {
            state.isLoadingOlderMessages = action.payload;
        },
        clearChat: (state) => {
            state.activeSessionId = null;
            state.activeSessionTitle = null;
            state.messages = [];
            state.messagesOffset = 0;
            state.hasMoreMessages = true;
        },
    },
});

export const {
    setActiveSession,
    setMessages,
    prependMessages,
    addMessage,
    setIsLoadingMessages,
    setIsLoadingOlderMessages,
    clearChat,
} = chatSlice.actions;

export const MESSAGES_LIMIT_CONST = MESSAGES_LIMIT;

export default chatSlice.reducer;

