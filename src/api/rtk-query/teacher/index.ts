import { firestore } from "#src/api/firebase/config.ts";
import { ThunkExtra } from "#src/api/redux/getStore.ts";
import { inviteTeacher, makeInviteDB, removeInviteDB, removeTeacher } from "#src/api/rtk-query/teacher/invitation.ts";
import { doc, getDoc, writeBatch } from "firebase/firestore";
import { BaseApi } from "../baseApi.ts";
import { GetClassByIdValue } from "../class/index.ts";
import { ClassIdentifier, getClassByIdConverter } from "../class/util.ts";
import { ClassGroupExtendedApi } from "../extendedApi.ts";
import { cacheWrapper } from "../util/cachedHandler.ts";
import { NoOpData } from "#src/api/util/Utility.ts";

export const endpointsToInject = ((api: ClassGroupExtendedApi) => ({
    endpoints: builder => ({
        assignTeacher: builder.mutation<NoOpData, {classIdentifier: ClassIdentifier, recepientEmail: string}>({
            queryFn: async ({
                classIdentifier,
                recepientEmail
            }, { dispatch, extra }) => {
                const { auth, firestore } = (extra as ThunkExtra)
                const { email: hostEmail } = auth.currentUser as NonNullable<typeof auth.currentUser>
                try {
                    const promise = dispatch(api.endpoints.getPublicTeacherByEmail.initiate(recepientEmail))
                    promise.unsubscribe()
                    const { isSuccess, ...other } = await promise
                    if (!isSuccess) {
                        throw other.error
                    }
                    const recepientId = other.data

                    const value = recepientEmail || "";
                    const regex = /^\w+@[a-z]+\.com$/;

                    if (!regex.test(value)) {
                        throw new Error("The format is incorrect for an email");
                    } else if (value == hostEmail) {
                        throw new Error("You can't use you own email");
                    }

                    const batch = makeInviteDB({ 
                        firestore, classIdentifier, recepientId, 
                        recepientEmail, hostEmail, className
                    })
                    await batch.commit()
                    return { data: "" };
                } catch (error) {
                    console.log("Error at right place: ", error.message);
                    if (error.code == "permission-denied") {
                        return {
                            status: "CUSTOM_ERROR",
                            error: {
                                message: "You don't have any permission to do this",
                                code: "permission-denied"
                            }
                        };
                    } else return { error: error.message };
                }
            },
        }),
        unAssignTeacher: builder.mutation<NoOpData, { classIdentifier: ClassIdentifier, recepientEmail: string }>({
            queryFn: async ({
                recepientEmail,
                classIdentifier,
            }, { dispatch }) => {

                const promise = dispatch(api.endpoints.getPublicTeacherByEmail.initiate(recepientEmail))
                promise.unsubscribe()
                const { isSuccess, ...other } = await promise
                if (!isSuccess) {
                    throw other.error
                }
                const recepientId = other.data

                const batch = removeInviteDB({ firestore, classIdentifier, recepientId });
                await batch.commit()
                return { data: "" };
            },
            // unAssignTeacher: builder.mutation({
            //     queryFn: async ({
            //         recepientEmail,
            //         classGroupId,
            //         classId
            //     }, { dispatch }) => {
            //         return await removeTeacher({
            //             firestore, classGroupId, classId,
            //             getTeacherUid: async () => {
            //                 const promise = dispatch(api.endpoints.getPublicTeacherByEmail.initiate(recepientEmail))
            //                 promise.unsubscribe()
            //                 const { isSuccess, ...other } = await promise
            //                 if (isSuccess) {
            //                     return other.data
            //                 } else {
            //                     throw other.error
            //                 }
            //             }
            //         })
            //     },
        }),
    })
})) satisfies (api: BaseApi) => Parameters<BaseApi['injectEndpoints']>[0]