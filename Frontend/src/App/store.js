import { configureStore } from "@reduxjs/toolkit"
import authReducer from "../Fetatures/authSlice.js"
import chatReducer from "../Fetatures/chatSlice.js"

export const store = configureStore({
    reducer: {
        auth: authReducer,
        chat: chatReducer,
    }
}); 