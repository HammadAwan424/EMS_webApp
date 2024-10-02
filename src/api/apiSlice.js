import { createApi, fetchBaseQuery, retry } from "@reduxjs/toolkit/query/react";
import {
    createUserWithEmailAndPassword,
    EmailAuthProvider,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, firestore } from "#src/firebase/config.js";
import {
    getDoc, doc, collection, getDocs, limit, query, where, 
    onSnapshot, updateDoc, writeBatch, deleteField, DocumentSnapshot, setDoc, 
    addDoc, Timestamp, serverTimestamp, documentId, orderBy, endAt, startAfter, 
    limitToLast, endBefore, arrayUnion, deleteDoc, FieldPath,
} from "firebase/firestore";
import { flatten } from "flat";
import { getDateStr } from "./Utility.js";
import { signupFirestoreInteraction } from "./signup.js";
import { getTeacherUid, inviteTeacher, removeTeacher } from "./invitation.js";
import classGroups from "./classGroups.js";


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
            queryFn: async (path) => {
                const classDocPath = doc( firestore, "classGroups", path.classGroupId, "classes", path.classId );
                const batch = writeBatch(firestore);
                const fp = new FieldPath("classes", path.classId);
                batch.update( doc(firestore, "classGroups", path.classGroupId), fp, deleteField() );
                batch.delete(classDocPath);
                
                await batch.commit();
                return { data: "" };
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
                const dateObj = new Date(dateStr);
                const dateStrUnhyphenated = getDateStr({
                    dateObj,
                    hyphenated: false,
                });
                await setDoc(
                    doc( firestore, "attendance", `${classId}${dateStrUnhyphenated}` ),
                    {
                        ...patch,
                        classId,
                        classGroupId,
                        createdAt: Timestamp.fromMillis(dateObj.getTime()),
                        lastModified: serverTimestamp(),
                    }
                );

                return { data: "" };
            },
        }),

        updateAttendance: builder.mutation({
            queryFn: async ({ ids, classId, classGroupId, dateStr, ...patch }) => {
                const flattened = flatten(patch);
                const dateObj = new Date(dateStr);
                const dateStrUnhyphenated = getDateStr({
                    dateObj,
                    hyphenated: false,
                });

                await updateDoc(
                    doc( firestore, "attendance", `${classId}${dateStrUnhyphenated}` ),
                    {
                        ...flattened,
                        lastModified: serverTimestamp(),
                    }
                );

                return { data: "" };
            },
        }),

        getAttendance: builder.query({
            queryFn: async ({ classId, classGroupId, dateStr }) => {
                const dateObj = new Date(dateStr);
                const dateStrUnhyphenated = getDateStr({
                    dateObj,
                    hyphenated: false,
                });
                const document = await getDoc(
                    doc( firestore, "attendance", `${classId}${dateStrUnhyphenated}` )
                );
                // console.clear()
                // console.log("CONVERTED IS: ", document.data())
                return { data: attendanceConverter(document) };
            },
            async onCacheEntryAdded( { classId, classGroupId, dateStr }, cacheLifecycleApi ) {
                const dateObj = new Date(dateStr);
                const dateStrUnhyphenated = getDateStr({ dateObj, hyphenated: false, });
                const docRef = doc( firestore, "attendance", `${classId}${dateStrUnhyphenated}` );
                await cachedDocumentListener(
                    docRef,
                    cacheLifecycleApi,
                    attendanceConverter
                );
            },
        }),

        getMonthlyAttendance: builder.query({
            queryFn: async ({ classId, classGroupId, dateStr }) => {
                const dateObj = new Date(dateStr);
                const dateStrUnhyphenated = getDateStr({
                    dateObj,
                    hyphenated: false,
                }).slice(0, -2);
                console.log("For query: ", `${classId}${dateStrUnhyphenated}`);
                const q = query(
                    collection(firestore, "monthlyAttendance"),
                    where("classGroupId", "==", classGroupId),
                    where("classId", "==", classId),
                    where(
                        documentId(),
                        "<",
                        `${classId}${dateStrUnhyphenated}`
                    ),
                    orderBy(documentId()),
                    startAfter(`${classId}`),
                    limitToLast(1)
                );
                const querySnapshot = await getDocs(q);
                if (querySnapshot.empty) {
                    return { data: { exists: false } };
                } else {
                    return {
                        data: {
                            ...querySnapshot.docs[0].data(),
                            id: querySnapshot.docs[0].id,
                            exists: !querySnapshot.empty,
                        },
                    };
                }
            },
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
                        const {data: id, isError, error} = await promise
                        if (isError) {
                            throw error
                        } else return id
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
                        const {data, isError, error} = await promise
                        if (isError) {
                            throw error
                        } else return data.id
                    }
                })
            },
        }),
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
            // console.log("Initial: ", snapshot.docs[0].data(), snapshot.metadata.fromCache, snapshot.metadata.hasPendingWrites)
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

function attendanceConverter(snapshot) {
    console.log("CONVERTER OF ENTRYADDED");
    console.log("Data is: ", snapshot.data());
    const data = snapshot.data({ serverTimestamps: "estimate" });
    if (snapshot.exists()) {
        return {
            ...data,
            id: snapshot.id,
            exists: snapshot.exists(),
            createdAt: data.createdAt.toJSON(),
            lastModified: data.lastModified.toJSON(),
        };
    } else {
        return { exists: false };
    }
}
