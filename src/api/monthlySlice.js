import { createSlice } from "@reduxjs/toolkit";

export const monthlySlice = createSlice({
    name: "monthlyAttendance",
    initialState: {
        noMoreData: false,
        lastFetchedMonth: "12",
        lastFetchedYear: "10000"
    },
    reducers: {
        setLastFetchedMonth: (state, action) => {
            state.lastFetchedMonth = action.payload
        },
        setLastFetchedYear: (state, action) => {
            state.lastFetchedYear = action.payload
        }
    }
})