import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { doc, getDoc } from "firebase/firestore";
import { firestore, auth } from "#config";

export const userSlice = createSlice({
    name: "user",
    initialState: {
        details: {},
        status: "idle",
        error: null,
        classes: {}
    },
    reducers: {
        setDetails(state, action) {
            state.details = action.payload
        },
        setClasses(state, action) {
            state.classes = action.payload
        }
    },
    extraReducers(builder) {
        builder
          .addCase(fetchUser.pending, (state, action) => {
            state.status = 'loading'
          })
          .addCase(fetchUser.fulfilled, (state, action) => {
            state.status = 'succeeded'
            // Add any fetched posts to the array
            state.classes = state.classes = action.payload
          })
          .addCase(fetchUser.rejected, (state, action) => {
            state.status = 'failed'
            state.error = action.error.message
          })
      }
})


const fetchUser = createAsyncThunk("/user/classes", async () => {
    const teacherDocSnapshot = await getDoc(
        doc(firestore, "teachers", auth.currentUser.uid)
    );
    return teacherDocSnapshot.data()
});

export {fetchUser}




export const getClasses = state => state.classes


export const selectUser = state => state.details

export default userSlice.reducer
