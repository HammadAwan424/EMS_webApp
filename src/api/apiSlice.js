import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, firestore } from "#src/firebase/config.js";
import {
    getDoc, doc, collection, getDocs, query, where, 
    writeBatch, deleteField, documentId, orderBy, startAfter, 
    limitToLast,
} from "firebase/firestore";
import { cachedDocumentListener, cachedDocumentListenerWithWait, cachedQueryListener } from "./cachedHandler.js";
import { flatten } from "flat";
import { signupFirestoreInteraction } from "./signup.js";
import {
    acceptInvitation,
    clearNotifications,
    getTeacherUid,
    inviteTeacher,
    rejectInvitation,
    removeTeacher,
} from "./invitation.js";
import classGroups from "./classGroups.js";
import { classByIdConverter, deleteClass, getClassById } from "./classes.js";
import { attendanceConverter, getAttendance, setAttendance, updateAttendance } from "./attendance.js";
import { createEntityAdapter, createSelector } from "@reduxjs/toolkit";
import { bringBackDoc } from "./customSlice.js";

// Attendance
const attendanceAdapter = createEntityAdapter({
    sortComparer: (a, b) => a.id.localeCompare(b.id)
})
export const { selectAll, selectTotal, selectIds} = attendanceAdapter.getSelectors(state => state.monthly)
export const attendanceInitialState = attendanceAdapter.getInitialState()

// Students
const studentAdapter = createEntityAdapter({
    sortComparer: (a, b) => a.id.localeCompare(b.id)
})
export const { 
    selectAll: selectAllStudents, selectIds: selectStudentIds, selectTotal: selectStudentsCount
} = studentAdapter.getSelectors(state => state.students)
export const selectStudentsForYearMonth = createSelector(
    (state, _) => selectAllStudents(state),
    (_, yearMonth) => yearMonth,
    (allStudents, yearMonth) => {
        console.log("Running output selector with args: ", yearMonth, allStudents)
        return allStudents.filter(studentRecord => studentRecord.id.includes(yearMonth))
    }
) 
export const studentInitialState = studentAdapter.getInitialState()

export const apiSlice = createApi({
    baseQuery: fetchBaseQuery({ baseUrl: "/" }),
    reducerPath: "myApi",
    endpoints: (builder) => ({
        getAuth: builder.query({
            queryFn: async () => {
                return new Promise((resolve, _) => {
                    const unsubscribe = onAuthStateChanged(auth, (user) => {
                        if (user) {
                            resolve({
                                data: {
                                    email: user.email,
                                    uid: user.uid,
                                    displayName: user.displayName,
                                },
                            });
                        } else resolve({ data: user });
                        unsubscribe();
                    });
                });
            },
            onCacheEntryAdded: async ( _, { updateCachedData, cacheDataLoaded } ) => { 
                try {
                    await cacheDataLoaded;
                    onAuthStateChanged(auth, (user) => {
                        if (user) {
                            updateCachedData((draft) => ({
                                email: user.email,
                                uid: user.uid,
                                displayName: user.displayName,
                            }));
                        } else {
                            updateCachedData((draft) => user);
                        }
                    });
                } catch {
                    console.log("No no")
                    // No-op
                }
            },
        }),
        getUser: builder.query({
            queryFn: async (uid) => {
                console.log("getUser: ", uid)
                try {
                    const document = await getDoc(doc(firestore, "teachers", uid));
                    return { data: document.data() };
                } catch (err) {
                    console.error("error in getUser: ", err.message)
                    return {error: err.message}
                }
      
            },
            async onCacheEntryAdded(uid, cacheLifecycleApi) {
                await cachedDocumentListener(doc(firestore, "teachers", uid), cacheLifecycleApi)
            }
        }),
        getClassGroups: builder.query({
            queryFn: async (uid) => classGroups.getClassGroups({firestore, uid}),
            async onCacheEntryAdded(uid, cacheLifecycleApi) {
                await cachedQueryListener(classGroups.getClassGroupsQuery({firestore, uid}), cacheLifecycleApi);
            },
        }),
        editClassGroup: builder.mutation({
            queryFn: async ({ classGroupId, create, meta, ...patch }) => {
                return classGroups.editClassGroup({
                    firestore, uid:auth.currentUser.uid, 
                    classGroupId, create,
                    meta, ...patch
                })
            },
        }),
        editClass: builder.mutation({
            queryFn: async ({ classId, classGroupId, ...patch }) => {
                const document = doc( firestore, "classGroups", classGroupId, "classes", classId );
                console.log("DOCUEMTN PATH IS : ", document.path);
                const batch = writeBatch(firestore);
                const { students, ...other } = patch;

                // Other fields
                const updates = { ...other, students: {} };

                // Student field on patch could be Added | Modified | Removed
                for (let studentId of students.ids) {
                    const type = students.meta[studentId];
                    const student = students.entities[studentId];
                    switch (type) {
                        case "added":
                        case "modified": {
                            updates.students[studentId] = student;
                            break;
                        }
                        case "removed": {
                            updates.students[studentId] = deleteField();
                            break;
                        }
                    }
                }

                const deleteFieldInstance = deleteField();
                const flattened = flatten(updates, {
                    safe: true,
                    except: (key, value) =>
                        value.constructor == deleteFieldInstance.constructor,
                });

                batch.update( doc( firestore, "classGroups", classGroupId, "classes", classId ), flattened );

                other.className &&
                    batch.update(doc(firestore, "classGroups", classGroupId), {
                        [`classes.${classId}.className`]: other.className,
                    });

                await batch.commit();

                return { data: "" };
            },
        }),
        deleteClass: builder.mutation({
            queryFn: async (path, {getState}) => {
                const uid = auth.currentUser.uid
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


        setAttendance: builder.mutation({
            queryFn: async ({ ids, classId, classGroupId, dateStr, ...patch }) => {
                return await setAttendance({firestore, ids, classId, classGroupId, dateStr, ...patch})
            },
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
            queryFn: async ({ ids, classId, classGroupId, dateStr, ...patch }, mutation) => {
                return await updateAttendance({firestore, ids, classId, classGroupId, dateStr, ...patch})
            },
        }),

        getAttendance: builder.query({
            queryFn: async ({ classId, classGroupId, dateStr }, baseQuery) => {
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
                const newRecord = {students: studentInitialState, monthly: attendanceInitialState}
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
                    const studentEntities = Object.keys(data.students).map(stuId => ({...data.students[stuId], id: year+month+stuId}))
                    return {data: {
                        noMoreData: false, newUniqueParams: `${year}${month}`, queryArgsWithValue: [`${year}${month}`],
                        monthly: attendanceAdapter.setAll(newRecord.monthly, attendanceEntities),
                        students: studentAdapter.setAll(newRecord.students, studentEntities)
                    }}
                }
            },
            serializeQueryArgs({queryArgs}) {
                const {classId, classGroupId} = queryArgs
                return {classId, classGroupId}
            },
            merge(currentCache, newRecord) {
                console.log("New record is: ", newRecord)
                currentCache.monthly = attendanceAdapter.setMany(currentCache.monthly, newRecord.monthly.entities)
                currentCache.students = studentAdapter.setMany(currentCache.students, newRecord.students.entities)
                currentCache.newUniqueParams = newRecord.newUniqueParams
                currentCache.noMoreData = newRecord.noMoreData
                currentCache.queryArgsWithValue.push(...newRecord.queryArgsWithValue)
                currentCache.queryArgsWithValue.sort((a, b) => a.localeCompare(b))
            },
            forceRefetch({currentArg, previousArg}) {
                const condition = previousArg == undefined || (currentArg.dateStr != previousArg.dateStr && currentArg.dateStr.localeCompare(previousArg.dateStr) == -1)
                console.log("Force refect is in action", currentArg?.dateStr, previousArg?.dateStr, condition)
                return condition
            }
        }),
        getPublicTeacherByEmail: builder.query({
            queryFn: async (email) => {
                try {
                    const id = await getTeacherUid(firestore, email)
                    return {data: id}
                } catch (err) {
                    return {error: err.message}
                }
            }
        }),
        register: builder.mutation({
            queryFn: async ({ email, password }) => {
                try {
                    const creds = await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );
                    await signupFirestoreInteraction(firestore, creds.user.uid, creds.user.email)
                    return { data: "" };
                } catch (err) {
                    return { error: err.code };
                }
            },
        }),
        signIn: builder.mutation({
            queryFn: async ({ email, password }) => {
                console.log("SIGN IN CALLED");
                try {
                    const creds = await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );
                    return { data: "" };
                } catch (err) {
                    console.log("INTO EXCEPTION: ", err);
                    return { error: err.code };
                }
            },
        }),
        assignTeacher: builder.mutation({
            queryFn: async ({
                recepientEmail,
                hostEmail,
                classId,
                classGroupId,
                className,
            }, {dispatch}) => {
                return await inviteTeacher({
                    firestore,
                    recepientEmail, hostEmail,
                    classId, classGroupId,
                    className, 
                    getTeacherUid: async () => {
                        const promise = dispatch(apiSlice.endpoints.getPublicTeacherByEmail.initiate(recepientEmail))
                        promise.unsubscribe()
                        const {isSuccess, ...other} = await promise
                        if (isSuccess) {
                            return other.data
                        } else {
                            throw other.error
                        }
                    }
                })
            },
        }),
        unAssignTeacher: builder.mutation({
            queryFn: async ({ recepientEmail, classGroupId, classId }, {dispatch}) => {
                removeTeacher({
                    firestore, classGroupId, classId,
                    getTeacherUid: async () => {
                        const promise = dispatch(apiSlice.endpoints.getPublicTeacherByEmail.initiate(recepientEmail))
                        promise.unsubscribe()
                        const {isSuccess, ...other} = await promise
                        console.log("OTHER IS: ", other)
                        if (isSuccess) {
                            return other.data
                        } else {
                            throw other.error
                        }
                    }
                })
            },
        }),
        acceptInvitation: builder.mutation({
            queryFn: async (invitationId) => {
                const uid = auth.currentUser.uid
                return acceptInvitation({firestore, uid, invitationId})
            }
        }),
        rejectInvitation: builder.mutation({
            queryFn: async (invitationId) => {
                const uid = auth.currentUser.uid
                return rejectInvitation({firestore, uid, invitationId})
            }
        }),
        clearNotifications: builder.mutation({
            queryFn: async (listOfIds) => {
                const uid = auth.currentUser.uid
                return clearNotifications({firestore, uid, listOfIds})
            }
        })
    }),
});

export const {
    useGetAuthQuery,
    useGetUserQuery,
    useGetClassGroupsQuery,
    useGetAttendanceQuery,
    useGetMonthlyAttendanceQuery,
    useGetPublicTeacherByEmailQuery,
    useGetClassByIdQuery,
    useAssignTeacherMutation,
    useUnAssignTeacherMutation,
    useEditClassMutation,
    useEditClassGroupMutation,
    useRegisterMutation,
    useSignInMutation,
    useSetAttendanceMutation,
    useUpdateAttendanceMutation,
    useDeleteClassMutation,
    useAcceptInvitationMutation,
    useRejectInvitationMutation,
    useClearNotificationsMutation
} = apiSlice;

