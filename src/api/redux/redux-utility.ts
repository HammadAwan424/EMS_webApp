import { createEntityAdapter } from "@reduxjs/toolkit"

// Adapter, selectors and initialState
// For setters, import adapter as ById and use ById.setOne etc ...
export const AdapterById = createEntityAdapter({
    sortComparer: (a, b) => a.id.localeCompare(b.id)
})
export const AdapterInitialState = AdapterById.getInitialState()
export const { 
    selectAll: selectAllById, selectTotal: selectTotalById, selectIds: selectIdsById
} = AdapterById.getSelectors()
