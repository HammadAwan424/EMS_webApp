import { configureStore } from "@reduxjs/toolkit";
import userReducer from './../features/user/userSlice'
import { apiSlice } from "src/api/apiSlice";

const store = configureStore({
    reducer: {
        user: userReducer,
        [apiSlice.reducerPath]: apiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(apiSlice.middleware),
});

export default store