import { configureStore, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import userReducer from '../api/redux/userActivity.js'
import { apiSlice } from "#src/api/apiSlice.js";
import { waitingAreaSlice } from "src/api/rtk-helpers/customSlice.js";

const store = configureStore({
    reducer: {
        user: userReducer,
        [apiSlice.reducerPath]: apiSlice.reducer,
        waitingArea: waitingAreaSlice.reducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(apiSlice.middleware),
});

export default store