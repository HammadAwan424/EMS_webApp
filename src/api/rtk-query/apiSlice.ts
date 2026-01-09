import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    updateProfile,
} from "firebase/auth";
import {
    getDoc, doc,
} from "firebase/firestore";
import { apiSliceOptions, cacheWrapper } from "./util/cachedHandler.js";
import { signupFirestoreInteraction } from "../rtk-helpers/signup.js";
import {
    acceptInvitation,
    clearNotifications,
    getTeacherUid,
    inviteTeacher,
    rejectInvitation,
    removeTeacher,
} from "./teacher/invitation.ts";
import classGroups from "../rtk-helpers/classGroup.js"; 


export const apiSlice = createApi({
    ...apiSliceOptions,
    keepUnusedDataFor: 9999999999,
    endpoints: (builder) => ({
        getClassGroups: builder.query<{id: string}[], string>({
            queryFn: async (uid) => classGroups.getClassGroups({firestore, uid}),
            async onCacheEntryAdded(uid, cacheLifecycleApi) {
                await cachedQueryListener(classGroups.getClassGroupsQuery({firestore, uid}), cacheLifecycleApi);
            },
            providesTags: ["AttendanceWithRecentData"]
        }),
        editClassGroup: builder.mutation<string, any>({
            queryFn: async ({ classGroupId, create, meta, ...patch }) => {
                return classGroups.editClassGroup({
                    firestore, uid:auth.currentUser.uid, 
                    classGroupId, create,
                    meta, ...patch
                })
            },
        }),
        getPublicTeacherByEmail: builder.query({
            queryFn: async (email) => {
                try {
                    const id = await getTeacherUid(firestore, email)
                    return {data: id}
                } catch (err) {
                    // cosole.log("ERROR in getPublicTeacherByEmail: ", err.message)
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
                // cosole.log("SIGN IN CALLED");
                try {
                    const creds = await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );
                    return { data: "" };
                } catch (err) {
                    // cosole.log("INTO EXCEPTION: ", err);
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
            queryFn: async (listOfIds, {extra}) => {
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
    useAssignTeacherMutation,
    useUnAssignTeacherMutation,
    useEditClassGroupMutation,
    useRegisterMutation,
    useSignInMutation,
    useAcceptInvitationMutation,
    useRejectInvitationMutation,
    useClearNotificationsMutation
} = apiSlice;

export default apiSlice