import { configureStore } from "@reduxjs/toolkit";
import userReducer from './userActivity.js'
import { extendedApi } from "src/api/rtk-query/extendedApi.ts";
import { waitingAreaSlice } from "src/api/rtk-helpers/customSlice.js";
import type { Auth } from "firebase/auth"
import type { Firestore } from "firebase/firestore"

export type ThunkExtra = {
    firestore: Firestore,
    auth: Auth
}

const getStore = (thunkExtra: ThunkExtra) => configureStore({
    reducer: {
        user: userReducer,
        [extendedApi.reducerPath]: extendedApi.reducer,
        waitingArea: waitingAreaSlice.reducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            thunk: {
                extraArgument: thunkExtra
            }
        }).concat(extendedApi.middleware),
});

export default getStore

export type AppStore = ReturnType<typeof getStore>
export type AppDispatch = AppStore['dispatch']
export type AppGetState = AppStore['getState']
export type AppState = ReturnType<AppStore['getState']>