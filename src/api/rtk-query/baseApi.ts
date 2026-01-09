import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({baseUrl: "/"})
const reducerPath = "myApi" as const
const tagTypes = ["AttendanceWithRecentData"] as const

// These are required for creating types
export type BaseQuery = typeof baseQuery
export type ReducerPath = typeof reducerPath
export type TagTypes = typeof tagTypes[number]


export const baseApi = createApi({
    baseQuery,
    reducerPath,
    tagTypes,
    endpoints: (builder) => ({})
})

export type BaseApi = typeof baseApi