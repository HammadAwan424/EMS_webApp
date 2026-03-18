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
import { StartQueryActionCreatorOptions } from "@reduxjs/toolkit/query";
import { AppAuth, User } from "../auth/util.ts";


export const endpointsToInject = ((api: ClassGroupExtendedApi) => ({
    endpoints: builder => ({
        assignTeacher: builder.mutation<NoOpData, {classIdentifier: ClassIdentifier, recepientEmail: string}>({
            queryFn: async ({
                classIdentifier,
                recepientEmail
            }, { dispatch, extra }) => {
                const { auth, firestore } = (extra as ThunkExtra)
                const appAuth = await dispatch(api.endpoints.getAuth.initiate(undefined, {subscribe: false}))
                const hostEmail = (appAuth.data as AppAuth).email
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
                            error: {
                                status: "CUSTOM_ERROR" as const,
                                data: "You don't have any permission to do this",
                                error: "permission-denied"
                            }
                        };
                    } else return { 
                        error: {
                            status: "CUSTOM_ERROR",
                            data: error.message,
                            error: "unexpected-error"
                        } 
                    };
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
        }),
    })
})) satisfies (api: BaseApi) => Parameters<BaseApi['injectEndpoints']>[0]