import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, firestore } from "#src/firebase/config.js";
import {
    getDoc, doc, collection, getDocs, query, where, 
    onSnapshot, writeBatch, deleteField, documentId, orderBy, startAfter, 
    limitToLast,
} from "firebase/firestore";
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
import { deleteClass } from "./classes.js";
import { attendanceConverter, getAttendance, setAttendance, updateAttendance } from "./attendance.js";
import { createEntityAdapter } from "@reduxjs/toolkit";
import { produce } from "immer";


export const attendanceAdapter = createEntityAdapter({
    sortComparer: (a, b) => a.id.localeCompare(b.id)
})
export const { selectAll, selectTotal, selectIds} = attendanceAdapter.getSelectors()
export const attendanceInitialState = attendanceAdapter.getInitialState()

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
            queryFn: async ({ classId, classGroupId, meta, ...patch }) => {
                const document = doc( firestore, "classGroups", classGroupId, "classes", classId );
                console.log("DOCUEMTN PATH IS : ", document.path);
                const batch = writeBatch(firestore);
                const { students, ...other } = patch;

                // Other fields
                const updates = { ...other, students: {} };

                // Student field on patch could be Added | Modified | Removed
                for (let studentId of meta.studentIds) {
                    const type = meta.students[studentId];
                    const student = patch.students[studentId];
                    switch (type) {
                        case "added": {
                            updates.students[studentId] = student;
                            break;
                        }
                        case "removed": {
                            console.log("REMOVIND STUDENT", studentId);
                            updates.students[studentId] = deleteField();
                            break;
                        }
                        case "modified": {
                            updates.students[studentId] = student;
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
            queryFn: async (path) => {
                const docPath = doc( firestore, "classGroups", path.classGroupId, "classes", path.classId );
                try {
                    const docSnapshot = await getDoc(docPath);
                    return { data: { id: docSnapshot.id, ...docSnapshot.data() } };
                } catch (err) {
                    console.error("error in getClassById: ", err.message)
                    return {error: err.message}
                }
                
            },
            onCacheEntryAdded: async (path, cacheLifecycleApi) => {
                const docRef = doc( firestore, "classGroups", path.classGroupId, "classes", path.classId );
                await cachedDocumentListener(docRef, cacheLifecycleApi);
            },
        }),


        setAttendance: builder.mutation({
            queryFn: async ({ ids, classId, classGroupId, dateStr, ...patch }) => {
                console.log("SET attendance mutation is here")
                return await setAttendance({firestore, ids, classId, classGroupId, dateStr, ...patch})
            },
        }),

        updateAttendance: builder.mutation({
            queryFn: async ({ ids, classId, classGroupId, dateStr, ...patch }) => {
                return await updateAttendance({firestore, ids, classId, classGroupId, dateStr, ...patch})
            },
        }),

        getAttendance: builder.query({
            queryFn: async ({ classId, classGroupId, dateStr }) => {
                // expects dateStr to be utc +05:00 (without hyphen) because 
                // server maintians +05:00, will use day, month and year as is
                return await getAttendance({firestore, classId, classGroupId, dateStr})
            },
            async onCacheEntryAdded( { classId, classGroupId, dateStr }, cacheLifecycleApi ) {
                const docRef = doc( firestore, "attendance", `${classId}${dateStr}` );
                await cachedDocumentListener(
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

                let newRecord;
                let newUniqueParams;
                if (querySnapshot.empty) {
                    newRecord = attendanceInitialState;
                    newUniqueParams = dateStr
                } else {
                    const document = querySnapshot.docs[0]
                    const [id, data] = [document.id, document.data()]
                    const [month, year] = [id.slice(-2,), id.slice(-6, -2)]
                    const entities = Object.keys(data.stats).map(day => ({...data.stats[day], id: year+month+day}))
                    newRecord = attendanceAdapter.setAll(attendanceInitialState, entities)
                    newUniqueParams = year+month
                }
                const newItemsCount = selectTotal(newRecord)
                return {data: produce(newRecord, (draft) => {
                    draft.newUniqueParams = newUniqueParams,
                    draft.noMoreData = newItemsCount == 0
                })}
            },
            serializeQueryArgs({queryArgs}) {
                const {classId, classGroupId} = queryArgs
                return {classId, classGroupId}
            },
            merge(currentCache, newRecord) {
                attendanceAdapter.setMany(currentCache, newRecord.entities)
                currentCache.newUniqueParams = newRecord.newUniqueParams
                currentCache.noMoreData = newRecord.noMoreData
            },
            forceRefetch({currentArg, previousArg}) {
                const condition = previousArg == undefined || currentArg.dateStr != previousArg.dateStr
                console.log("Force refect is in action", currentArg, previousArg, condition)
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

async function cachedDocumentListener(
    docRef,
    { cacheDataLoaded, cacheEntryRemoved, updateCachedData },
    converter
) {
    let unsubscribe = null;

    try {
        unsubscribe = onSnapshot(docRef, { source: "cache" }, (snapshot) => {
            updateCachedData((draft) => {
                console.log("RUNNING SINGLE UPDATER, path: ", docRef.path);
                if (converter) {
                    console.log("CONVERTER WAS PRESENT");
                    return converter(snapshot);
                } else {
                    console.log("ABSENT CONVERTER");
                    return {
                        ...snapshot.data({ serverTimestamps: "estimate" }),
                        id: snapshot.id,
                    };
                }
            });
        });
        await cacheDataLoaded;
    } catch {
        unsubscribe ?? unsubscribe();
    }
    await cacheEntryRemoved;
    unsubscribe ?? unsubscribe();
}

async function cachedQueryListener(
    query,
    { cacheDataLoaded, cacheEntryRemoved, updateCachedData }
) {
    let unsubscribe = null;
    try {
        unsubscribe = onSnapshot(query, { source: "cache" }, (snapshot) => {
            // console.log("Initial: ", snapshot.docs[0].data(),
            //  snapshot.metadata.fromCache, snapshot.metadata.hasPendingWrites)
            // console.log("Changed: ", snapshot.docChanges().length, snapshot.docChanges())
            // console.log("ONSNAPSHOT RAN: ", snapshot.docChanges().length)
            updateCachedData((draft) => {
                console.log("RUNNING MULTIPLE UPDATES");

                snapshot.docChanges().forEach((docChange) => {
                    if (docChange.type == "added") {
                        draft.push({
                            ...docChange.doc.data(),
                            id: docChange.doc.id,
                        });
                    } else if (docChange.type == "modified") {
                        const updatedIndex = draft.findIndex(
                            (doc) => doc.id == docChange.doc.id
                        );
                        draft[updatedIndex] = {
                            id: docChange.doc.id,
                            ...docChange.doc.data(),
                        };
                    } else {
                        draft.filter((doc) => doc.id != docChange.doc.id);
                    }
                });
            });
        });
        await cacheDataLoaded;
    } catch {
        unsubscribe ?? unsubscribe();
    }
    await cacheEntryRemoved;
    unsubscribe ?? unsubscribe();
}
