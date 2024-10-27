import { createSlice } from "@reduxjs/toolkit"

export const waitingAreaSlice = createSlice({
    initialState: {},
    name: "waitingArea",
    reducers: {
        "moveThere": (state, action) => {
            const {documentData, identifier} = action.payload
            state[identifier] = documentData
        },
        "clear": (state, action) => {
            const identifier = action.payload
            delete state[identifier]
        }
    }
})
export const { moveThere, clear } = waitingAreaSlice.actions

export const bringBackDoc = (identifier) => (dispatch, getState) => {
    const docToMove = selectFromWaitingArea(getState(), identifier)
    dispatch(clear(identifier))
    return docToMove
}
const selectFromWaitingArea = (state, identifier) => state.waitingArea[identifier] 