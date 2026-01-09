import { baseApi } from "./baseApi.ts"

import { endpointsToInject as classGroupEndpoints } from "./classgroups/index.ts" 
import { endpointsToInject as classEndpoints } from "./class/index.ts"
import { endpointsToInject as authEndpoints } from "./auth/index.ts"

// TODO: Find out why it doesn't work with arrays???
// const extensions = [
//     classEndpoints,
//     classGroupEndpoints
// ] as const

// extensions.reduce((extendedApi, extension) => 
//     extendedApi.injectEndpoints(extension), baseApi)

const authExtended = baseApi.injectEndpoints(authEndpoints(baseApi))
export type AuthExtendedApi = typeof authExtended
const classGroupExtended = authExtended.injectEndpoints(classGroupEndpoints)
export type ClassGroupExtendedApi = typeof classGroupExtended
const classExtended = classGroupExtended.injectEndpoints(classEndpoints(classGroupExtended))
export type ClassExtendedApi = typeof classExtended
const extendedApi = classExtended

export { extendedApi }
export const { 
    useGetUserQuery,
    useGetAuthQuery,

    useGetClassByIdQuery,
    useEditClassMutation,
    useDeleteClassMutation,

    useGetClassGroupsQuery,
    useEditClassGroupMutation
} = extendedApi