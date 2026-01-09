import { ThunkExtra } from "#src/api/redux/getStore.ts";
import { BaseApi } from "../baseApi.ts";
import { doc, getDocs, writeBatch } from "firebase/firestore";
import { cacheWrapper } from "../util/cachedHandler.ts";
import { ClassGroupAppModel, ClassGroupAppPatch, classGroupsAdapter, getClassGroupsConverter, getClassGroupsQuery } from "./util.ts";
import { EntityState } from "@reduxjs/toolkit";
import type { NoOp, NestedPartial } from "#src/api/util/types.ts";
import { ClassDoc } from "../class/util.ts";
import { noOp } from "#src/api/util/Utility.ts";
import { flatten } from "flat";

export const endpointsToInject = {
    endpoints: builder => ({
        getClassGroups: cacheWrapper.query<EntityState<ClassGroupAppModel, string>, string>(builder, {
            queryFn: async (uid, {extra}) => {
                const query = getClassGroupsQuery({firestore: (extra as ThunkExtra).firestore, uid})
                const querySnapshot = await getDocs(query);
                const retValue = classGroupsAdapter.getInitialState(undefined, querySnapshot.docs.map(d => d.data()))
                return {data: retValue}
            },
            listenerType: "multi",
            getQuery: (queryArg, extra) => getClassGroupsQuery({firestore: extra.firestore, uid: queryArg}),
            entityAdapter: classGroupsAdapter,
            providesTags: ["AttendanceWithRecentData"]
        }),
        createClassGroup: builder.mutation<NoOp, {classGroupId: string, data: ClassGroupAppModel}>({
            queryFn: async ({classGroupId, data}, {extra}) => {
                const {firestore, auth} = extra as ThunkExtra
                const document = doc(firestore, "classGroups", classGroupId).withConverter(getClassGroupsConverter);
                const batch = writeBatch(firestore);

                batch.set(document, data);

                Object.entries(data.classes).forEach(([id, classData]) => {
                    // Creating document for each class
                    const classDoc: ClassDoc = {
                        className: classData.className,
                        students: {},
                    }
                    batch.set(doc(document, "classes", id), classDoc);
                })

                batch.update(doc(firestore, "teachers", auth.currentUser?.uid ?? ""), {
                    [`classGroups.${classGroupId}`]: data.classGroupName 
                })
                await batch.commit()
                return noOp()
            }                
        }),
        editClassGroup: builder.mutation<NoOp, {classGroupId: string, newClasses: boolean, patch: ClassGroupAppPatch}>({
            queryFn: async ({classGroupId, newClasses, patch }, {extra}) => {
                const {firestore, auth} = extra as ThunkExtra
                const document = doc(firestore, "classGroups", classGroupId).withConverter(getClassGroupsConverter);
                const batch = writeBatch(firestore);
                const classGroupUpdates: NestedPartial<ClassGroupAppModel> = {}
                classGroupUpdates.classes = {}
                if (newClasses) 
                    Object.entries(patch.classes ?? {}).forEach(([id, classData]) => {
                        // Creating document for each class
                        const classDoc = {
                            className: classData.className,
                            students: {},
                        }
                        batch.set(doc(document, "classes", id), classDoc satisfies ClassDoc);
                    })
                const flattened = flatten(classGroupUpdates, {
                    safe: true,
                }) as Record<any, any>;
                batch.update(document, flattened);

                await batch.commit();
                return noOp();
            }
        })
    })
} satisfies Parameters<BaseApi['injectEndpoints']>[0]