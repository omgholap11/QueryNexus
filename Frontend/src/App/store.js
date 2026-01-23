import { configureStore } from "@reduxjs/toolkit"
import authReducer from "../Features/authSlice.js"
import chatReducer from "../Features/chatSlice.js"

export const store = configureStore({
    reducer: {
        auth: authReducer,
        chat: chatReducer,
    }
}); 