import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { doc, getDoc } from "firebase/firestore";
import { firestore, auth } from "#config";

export const userSlice = createSlice({
    name: "user",
    initialState: {
        details: {},
        status: "idle",
        error: null,
        classes: {
            active: [],
            inactive: [],
            new: [],
            status: false
        }
    },
    reducers: {
        setActiveClasses(state, action) {
            state.classes.active = action.payload
        },
        setInactiveClasses(state, action) {
            state.classes.inactive = action.payload
        },
        setNewClasses(state, action) {
            state.classes.new = action.payload
        },
        setClassesMarked(state, action) {
            state.classes.status = action.payload
        }
        // setDetails(state, action) {
        //     state.details = action.payload
        // },
        // setClasses(state, action) {
        //     state.classes = action.payload
        // }
    },
    // extraReducers : (builder) => {
    //     builder
    //       .addCase(fetchUser.pending, (state, action) => {
    //         state.status = 'loading'
    //       })
    //       .addCase(fetchUser.fulfilled, (state, action) => {
    //         state.status = 'succeeded'
    //         // Add any fetched posts to the array
    //         state.classes = state.classes = action.payload
    //       })
    //       .addCase(fetchUser.rejected, (state, action) => {
    //         state.status = 'failed'
    //         state.error = action.error.message
    //       })
    //   }
})


export const getAllClassIds = state => state.user.classes
export const setActiveClasses = userSlice.actions.setActiveClasses
export const setInactiveClasses = userSlice.actions.setInactiveClasses
export const setNewClasses = userSlice.actions.setNewClasses
export const setClassesMarked = userSlice.actions.setClassesMarked
export default userSlice.reducer


const fetchUser = createAsyncThunk("/user/classes", async () => {
    const teacherDocSnapshot = await getDoc(
        doc(firestore, "teachers", auth.currentUser.uid)
    );
    return teacherDocSnapshot.data()
});

export {fetchUser}

export const selectUser = state => state.details

