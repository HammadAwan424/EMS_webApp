import { doc, query, collection, where, documentId, orderBy, startAfter, limitToLast, getDocs } from "firebase/firestore"
import { auth, firestore } from "src/firebase/config"
import { produce } from "immer"
import isEqual from "lodash.isequal"
import apiSlice from "../apiSlice"
import { setAttendance, updateAttendance, getAttendance, attendanceConverter } from "../rtk-helpers/attendance"
import { cachedDocumentListenerWithWait } from "../rtk-helpers/cachedHandler"
import { bringBackDoc } from "../rtk-helpers/customSlice"
import { AdapterById as ById, AdapterInitialState } from "../redux/redux-utility"



const extendedApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        setAttendance: builder.mutation({
            queryFn: async ({ ids, classId, classGroupId, dateStr, ...patch }) => {
                const editedBy = {
                    uid: auth.currentUser.uid, 
                    name: auth.currentUser.displayName, 
                    email: auth.currentUser.email
                }
                return await setAttendance({firestore, ids, classId, classGroupId, dateStr, editedBy, ...patch})
            },
            invalidatesTags: ["AttendanceWithRecentData"],
            onQueryStarted: async ({classId, classGroupId, dateStr}, {queryFulfilled, dispatch}) => {
                try {
                    await queryFulfilled
                    const docToSetBack = dispatch(bringBackDoc(`${classId}${dateStr}`))
                    dispatch(apiSlice.util.updateQueryData("getAttendance", {classId, classGroupId, dateStr}, _ => docToSetBack))
                } catch (e) {
                    console.log("Error while updating cache manually, ", e)
                }
            }
        }),
        
        updateAttendance: builder.mutation({
            queryFn: async ({ ids, classId, classGroupId, dateStr, ...patch }) => {
                const editedBy = {
                    uid: auth.currentUser.uid, 
                    name: auth.currentUser.displayName, 
                    email: auth.currentUser.email
                }
                return await updateAttendance({firestore, ids, classId, classGroupId, dateStr, editedBy, ...patch})
            },
            invalidatesTags: ["AttendanceWithRecentData"],
            onQueryStarted: async ({classId, classGroupId, dateStr}, {queryFulfilled, dispatch}) => {
                try {
                    await queryFulfilled
                    const docToSetBack = dispatch(bringBackDoc(`${classId}${dateStr}`))
                    dispatch(apiSlice.util.updateQueryData("getAttendance", {classId, classGroupId, dateStr}, _ => docToSetBack))
                } catch (e) {
                    console.log("Error while updating cache manually, ", e)
                }
            }
        }),
        
        getAttendance: builder.query({
            queryFn: async ({ classId, classGroupId, dateStr}) => {
                // expects dateStr to be utc +05:00 (without hyphen) because 
                // server maintians +05:00, will use day, month and year as is
                return await getAttendance({firestore, classId, classGroupId, dateStr})
            },
            
            async onCacheEntryAdded({ classId, classGroupId, dateStr }, cacheLifecycleApi ) {
                const docRef = doc( firestore, "attendance", `${classId}${dateStr}` );
                await cachedDocumentListenerWithWait(
                    docRef,
                    cacheLifecycleApi,
                    attendanceConverter
                );
            },
        }),
        
        getAttendanceWithRecentData: builder.query({
            queryFn: async ({ classId, classGroupId, dateStr, fallback="" }, {dispatch}) => {
                try {
                    const promise = dispatch(apiSlice.endpoints.getAttendance.initiate({
                        classId, classGroupId, dateStr
                    }))
                    promise.unsubscribe()
                    return await promise
                } catch (err) {
                    return {error: err.message}
                }
            },
            providesTags: ["AttendanceWithRecentData"],
            serializeQueryArgs({queryArgs}) { // queries are differentiated based on classId and classGroupId
                const {classId, classGroupId} = queryArgs
                return {classId, classGroupId}
            },
            // the first time merge runs (on second query), adds the whole previous result to __previousRecord__ field
            // the next time it runs(currentCache has __previousRecord__) then ->  
            // it adds the real previous result (without __previousRecord__) to __previousRecord__ field
            // but in case if real previous result (without __previousRecord__) is empty, then it uses its __previousRecord__ key
            // the whole work is so that data is always available on __previousRecord__ field
            // after one single successful fetch, no matter how many queries fail afterwards 
            merge(currentCache, newRecord) { 
                const newRecordUpdated = produce(newRecord, draft => {
                    const mergeIsRunningAgain = currentCache.__previousRecord__ != undefined
                    if (mergeIsRunningAgain) {
                        const previousResultExists = currentCache.exists == true
                        if (previousResultExists) {
                            const withPreviousRecord = Object.assign({}, currentCache)
                            delete withPreviousRecord.__previousRecord__
                            draft.__previousRecord__ = withPreviousRecord
                        } else {
                            draft.__previousRecord__ = currentCache.__previousRecord__
                        }
                    } else {
                        draft.__previousRecord__ = currentCache
                    }
                })
                return newRecordUpdated
            },
            forceRefetch({currentArg, previousArg}) {
                return !isEqual(currentArg, previousArg)
            }
        }),
        
        getMonthlyAttendance: builder.query({
            queryFn: async ({ classId, classGroupId, dateStr }) => {
                const q = query(
                    collection(firestore, "monthlyAttendance"),
                    where("classGroupId", "==", classGroupId),
                    where("classId", "==", classId),
                    where(
                        documentId(),
                        "<",
                        `${classId}${dateStr}`
                    ),
                    orderBy(documentId()),
                    startAfter(`${classId}`),
                    limitToLast(1)
                );
                const querySnapshot = await getDocs(q);
                const newRecord = {students: AdapterInitialState, stats: AdapterInitialState}
                if (querySnapshot.empty) {
                    return {data: {
                        noMoreData: true, newUniqueParams: dateStr, 
                        queryArgsWithValue: [], ...newRecord
                    }}
                } else {
                    const document = querySnapshot.docs[0]
                    const [id, data] = [document.id, document.data()]
                    const [month, year] = [id.slice(-2,), id.slice(-6, -2)]
                    
                    const attendanceEntities = Object.keys(data.stats).map(day => ({...data.stats[day], id: year+month+day}))
                    const studentEntities = Object.keys(data.students).map(
                        stuId => ({...data.students[stuId], studentId: stuId, id: year+month+stuId})
                    )
                    return {data: {
                        noMoreData: false, newUniqueParams: `${year}${month}`, queryArgsWithValue: [`${year}${month}`],
                        stats: ById.setAll(newRecord.stats, attendanceEntities),
                        students: ById.setAll(newRecord.students, studentEntities)
                    }}
                }
            },
            serializeQueryArgs({queryArgs}) {
                const {classId, classGroupId} = queryArgs
                return {classId, classGroupId}
            },
            merge(currentCache, newRecord) {
                currentCache.stats = ById.setMany(currentCache.stats, newRecord.stats.entities)
                currentCache.students = ById.setMany(currentCache.students, newRecord.students.entities)
                currentCache.newUniqueParams = newRecord.newUniqueParams
                currentCache.noMoreData = newRecord.noMoreData
                currentCache.queryArgsWithValue.push(...newRecord.queryArgsWithValue)
                currentCache.queryArgsWithValue.sort((a, b) => a.localeCompare(b))
            },
            forceRefetch({currentArg, previousArg}) {
                const condition = previousArg == undefined || (currentArg.dateStr != previousArg.dateStr && currentArg.dateStr.localeCompare(previousArg.dateStr) == -1)
                return condition
            }
        })

    })
})

export const { 
    useGetMonthlyAttendanceQuery, useGetAttendanceQuery, useGetAttendanceWithRecentDataQuery, 
    useSetAttendanceMutation, useUpdateAttendanceMutation, 
} = extendedApi