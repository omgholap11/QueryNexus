import { configureStore } from "@reduxjs/toolkit"
import authReducer from "../Fetatures/authSlice.js"

export const store = configureStore({
    reducer: {
        auth: authReducer
    }
}); 