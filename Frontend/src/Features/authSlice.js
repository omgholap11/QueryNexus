import {createSlice} from '@reduxjs/toolkit'

const initialState = {
    user : {
        name : "",
        email : "",
        id : ""
    },
    isAuthenticated : false,    
}

export const authSlice = createSlice({
    name : 'auth',     // just the name of the store 
    initialState,
    reducers: {
        setIsAuthenticated : (state,action) =>{
            state.isAuthenticated = action.payload;
        },
        setUser : (state,action) =>{
            state.user = action.payload;
        }
    }
})

export const {setIsAuthenticated , setUser} = authSlice.actions;

export default authSlice.reducer;
