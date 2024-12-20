import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    updateProfile,
} from "firebase/auth";
import { auth, firestore } from "#src/firebase/config.js";
import {
    getDoc, doc, 
    writeBatch, deleteField,
} from "firebase/firestore";
import { cachedDocumentListener, cachedQueryListener } from "./rtk-helpers/cachedHandler.js";
import { flatten } from "flat";
import { signupFirestoreInteraction } from "./rtk-helpers/signup.js";
import {
    acceptInvitation,
    clearNotifications,
    getTeacherUid,
    inviteTeacher,
    rejectInvitation,
    removeTeacher,
} from "./rtk-helpers/invitation.js";
import classGroups from "./rtk-helpers/classGroups.js";
import { classByIdConverter, deleteClass, getClassById } from "./rtk-helpers/classes.js";



export const apiSlice = createApi({
    baseQuery: fetchBaseQuery({ baseUrl: "/" }),
    reducerPath: "myApi",
    keepUnusedDataFor: 9999999999,
    tagTypes: ["AttendanceWithRecentData"],
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
        getPublicTeacherByEmail: builder.query({
            queryFn: async (email) => {
                try {
                    const id = await getTeacherUid(firestore, email)
                    return {data: id}
                } catch (err) {
                    console.log("ERROR in getPublicTeacherByEmail: ", err.message)
                    return {error: {message: err.message}} // err my be unserializable, so can't do return {error: err}
                }
            }
        }),
        register: builder.mutation({
            queryFn: async ({ email, password, displayName }) => {
                try {
                    const creds = await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );
                    const p1 = updateProfile(auth.currentUser, {displayName})
                    const p2 = signupFirestoreInteraction(firestore, creds.user.uid, creds.user.email)
                    await Promise.allSettled([p1, p2])
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
            queryFn: async ({ 
                recepientEmail, 
                classGroupId, 
                classId 
            }, {dispatch}) => {
                return await removeTeacher({
                    firestore, classGroupId, classId,
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
    useGetPublicTeacherByEmailQuery,
    useGetClassByIdQuery,
    useAssignTeacherMutation,
    useUnAssignTeacherMutation,
    useEditClassMutation,
    useEditClassGroupMutation,
    useRegisterMutation,
    useSignInMutation,
    useDeleteClassMutation,
    useAcceptInvitationMutation,
    useRejectInvitationMutation,
    useClearNotificationsMutation
} = apiSlice;

export default apiSlice