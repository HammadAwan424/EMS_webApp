import { onAuthStateChanged } from "firebase/auth";
import { BaseApi } from "../baseApi.ts";
import { ThunkExtra } from "#src/api/redux/getStore.ts";
import { cacheWrapper } from "../util/cachedHandler.ts";
import { doc, DocumentReference, getDoc } from "firebase/firestore";
import { AppAuth, User } from "./util.ts";

export const endpointsToInject = ((api: BaseApi) => ({
    endpoints: builder => ({
        getAuth: builder.query<AppAuth | null, void>({
            queryFn: async (undefined, { extra }) => {
                return new Promise((resolve, _) => {
                    const unsubscribe = onAuthStateChanged((extra as ThunkExtra).auth, (user) => {
                        if (user) {
                            resolve({
                                // type assertion here cuz 
                                // i know the resultatnt type definitely
                                data: user.toJSON() as AppAuth
                            });
                        } else resolve({ data: null });
                        unsubscribe();
                    });
                });
            },
            onCacheEntryAdded: async (_, { updateCachedData, cacheDataLoaded, extra } ) => { 
                let unsubscribe = null;
                try {
                    await cacheDataLoaded;
                    unsubscribe = onAuthStateChanged((extra as ThunkExtra).auth, (user) => {
                        if (user) {
                            updateCachedData(_ => (user.toJSON() as Auth));
                        }
                    });
                } catch {
                    if (unsubscribe) unsubscribe()
                }
            },
        }),
        // DONE: define user type
        // TODO: verify how getDocRef is working, what if the doc doesn't exist??
        getUser: cacheWrapper.query<User, string>(builder, {
            queryFn: async (uid, { extra }) => {                 
                const document = await getDoc(doc((extra as ThunkExtra).firestore, "teachers", uid));
                const data = document.data()
                if (data == undefined) {
                    return {error: {
                        status: "FETCH_ERROR",
                        error: "No user exists with this uid"
                    }}
                }
                // converter would be unnecessary as there is
                // no work to be done, except type casting
                return {data} as {data: User};
            },
            listenerType: "single",
            getDocRef: (uid, extra) => (
                doc((extra as ThunkExtra).firestore, "teachers", uid) as DocumentReference<User>
            )
        }),
    })
})) satisfies (api: BaseApi) => Parameters<BaseApi['injectEndpoints']>[0]