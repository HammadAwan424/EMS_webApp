import { ThunkExtra } from "#src/api/redux/getStore.ts"
import { where, query, collection, limit, FirestoreDataConverter } from "firebase/firestore"
import type { ClassId } from "../class/util.ts"
import type { DeletableIndex, NestedPartial, RemoveableIndex } from "#src/api/util/types.ts"
import { createEntityAdapter } from "@reduxjs/toolkit"


type TeacherId = string
type ClassGroupId = string

type ClassGroupDoc = {
    cgAdmin: string,
    classGroupName: string,
    classes: {
        [classId: ClassId]: {
            assignedTeacher: string,
            className: string
        }
    },
    editors: {
        [classId: ClassId]: TeacherId[]
    },
    meta: {
        metaId: string
    }
}

// app requires every classGropuDoc to have id key
// as it represents entities in the EntityAdapter
type ClassGroupAppModel = ClassGroupDoc & { id: string }
type ClassGroupAppPatch = DeletableIndex<ClassGroupAppModel, "editors" | "classes">

const getClassGroupsConverter: FirestoreDataConverter<ClassGroupAppModel, ClassGroupDoc> = {
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options) as ClassGroupAppModel
        data.id = snapshot.id
        return data
    },
    toFirestore: (ClassGroupAppModel, partial?) => {
        // doesn't matter whether its partial or not
        const {id, ...patch} = ClassGroupAppModel as NestedPartial<ClassGroupAppModel> | ClassGroupAppModel
        return patch as any
    }
}


const getClassGroupsQuery = ({firestore, uid}: {firestore: ThunkExtra['firestore'], uid: string}) => query(
    collection(firestore, "classGroups"),
    where("cgAdmin", "==", uid),
    limit(10)
).withConverter(getClassGroupsConverter);

const classGroupsAdapter = createEntityAdapter<ClassGroupAppModel>()


export { getClassGroupsConverter, getClassGroupsQuery, classGroupsAdapter }
export type { ClassGroupDoc, ClassGroupAppModel, ClassGroupAppPatch, ClassGroupId, TeacherId }