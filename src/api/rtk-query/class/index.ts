import {deleteField, doc, getDoc, writeBatch} from "firebase/firestore"
import { removeInvite } from "../teacher/invitation.ts";
import { flatten } from "flat";
import { type BaseApi } from "../baseApi.js";
import { cacheWrapper } from "../util/cachedHandler.js";
import { ClassAppModel, ClassIdentifier, getClassByIdConverter } from "./util.js";
import { ThunkExtra } from "src/api/redux/getStore.js";
import { ClassGroupExtendedApi } from "../extendedApi.ts";
import { FetchBaseQueryError, QueryStatus } from "@reduxjs/toolkit/query";
import { NoOpData } from "#src/api/util/Utility.ts";

export type GetClassByIdValue = ClassAppModel | {exists: false}

export const endpointsToInject = ((api: ClassGroupExtendedApi) => ({
    endpoints: builder => ({
        getClassById: cacheWrapper.query<GetClassByIdValue, ClassIdentifier>(builder, {
            queryFn: async ({classId, classGroupId}, {extra}) => {
                const { firestore } = extra as ThunkExtra
                const docPath = doc(
                    firestore, "classGroups", classGroupId, "classes", classId
                ).withConverter(getClassByIdConverter); // the magic goes here
                try {
                    const data = (await getDoc(docPath)).data()
                    if (data == undefined) {
                        return {data: {exists: false}}
                    } else {
                        return {data: {...data, exists: true}}
                    }
                } catch (err) {
                    return {error: {
                        status: "CUSTOM_ERROR",
                        error: "Couldn't get class data."
                    }}
                }
            },
            
        }),
        editClass: builder.mutation<NoOpData, ClassIdentifier & Record<string, any>>({
            queryFn: async ({classId, classGroupId, ...patch}, { extra }) => {
                const firestore = (extra as ThunkExtra).firestore
                const batch = writeBatch(firestore);
                const { students, ...other } = patch;

                // Other fields
                const updates = { ...other, students: {} as Record<string, any> };

                // Student field on patch could be Added | Modified | Removed
                for (const studentId of students.ids) {
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
                    except: (_, value) =>
                        value.constructor == deleteFieldInstance.constructor,
                });
                batch.update(doc( firestore, "classGroups", classGroupId, "classes", classId ), flattened as Record<string, any>);
                if (other.className) 
                    batch.update(doc(firestore, "classGroups", classGroupId), {
                        [`classes.${classId}.className`]: other.className,
                    });
                await batch.commit();
                return { data: "" };
            }
        }),
        deleteClass: builder.mutation<NoOpData, ClassIdentifier>({
            queryFn: async ({classId, classGroupId}, {dispatch, extra}) => {
                const {firestore, auth} = extra as ThunkExtra
                // get classGroup from cached data, else fetch it live
                const queryResult = await dispatch(
                    api.endpoints.getClassGroups.initiate(auth?.currentUser?.uid ?? "")
                )
                if (queryResult.status != QueryStatus.fulfilled) 
                    return {error: queryResult.error as FetchBaseQueryError}
                const classEditors = queryResult.data.entities[classGroupId].editors[classId]
                const classDocPath = doc(firestore, "classGroups", classGroupId, "classes", classId);
                const batch = writeBatch(firestore);
                batch.delete(classDocPath);
                if (classEditors.length > 0) 
                    removeInvite(batch, firestore, classEditors[0], classGroupId, classId) 
                batch.update(doc(firestore, "classGroups", classGroupId), {
                    [`classes.${classId}`]: deleteField(),
                    [`editors.${classId}`]: deleteField()
                });
                await batch.commit();
                return { data: "" };
            },
        }),
    })
})) satisfies (api: BaseApi) => Parameters<BaseApi['injectEndpoints']>[0]