import { createSlice } from "@reduxjs/toolkit";

export const userSlice = createSlice({
    name: "user",
    initialState: {
        lastVisited: {
            groupId: "",
            classId: "",
        }
    },
    reducers: {
        setLastVisited: (state, action) => {
            state.lastVisited = {...state.lastVisited, ...action.payload}
        }
    },
    selectors: {
        getLastVisited: (state) => {
            return state.lastVisited
        }
    }
})

export const { setLastVisited, setLastVisitedClass, setLastVisitedGroup } = userSlice.actions
export const { getLastVisited } = userSlice.selectors
export default userSlice.reducer
