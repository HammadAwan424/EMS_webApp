import apiSlice from "../apiSlice";
import { doc } from "firebase/firestore"
import { auth, firestore } from "src/firebase/config"
import { cachedDocumentListener } from "../rtk-helpers/cachedHandler"
import { editClass, deleteClass, getClassById, classByIdConverter } from "../rtk-helpers/class";


const extendedApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        editClass: builder.mutation({
            queryFn: async ({classId, classGroupId, ...patch}) => 
                editClass({firestore, classId, classGroupId, ...patch})
        }),
        deleteClass: builder.mutation({
            queryFn: async (path, {getState}) => {
                const uid = auth.currentUser.uid
                // get classGroup from cached data, it must have been loaded
                const group = apiSlice.endpoints.getClassGroups.select(uid)(
                    getState()).data.find(ele => ele.id == path.classGroupId
                )
                const recepientId = group.editors[path.classId] && group.editors[path.classId][0]
                return await deleteClass(firestore, path.classId, path.classGroupId, recepientId)
            },
        }),
        getClassById: builder.query({
            queryFn: async (path) => getClassById(firestore, path),
            onCacheEntryAdded: async (path, cacheLifecycleApi) => {
                const docRef = doc( firestore, "classGroups", path.classGroupId, "classes", path.classId );
                await cachedDocumentListener(docRef, cacheLifecycleApi, classByIdConverter);
            },
        }),
    })
})

export const {
    useGetClassByIdQuery,
    useDeleteClassMutation,
    useEditClassMutation
} = extendedApi