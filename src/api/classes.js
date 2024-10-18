import {arrayRemove, deleteField, doc, FieldPath, getDoc, writeBatch} from "firebase/firestore"
import { removeInvite } from "./invitation";

const deleteClass = async (firestore, classId, classGroupId, recepientId=null) => {
    const classDocPath = doc( firestore, "classGroups", classGroupId, "classes", classId);
    const batch = writeBatch(firestore);
    batch.delete(classDocPath);
    const batchWithRemove = recepientId ? removeInvite(batch, firestore, recepientId, classGroupId, classId) : batch
    batchWithRemove.update(doc(firestore, "classGroups", classGroupId), {
        [`classes.${classId}`]: deleteField(),
        [`editors.${classId}`]: deleteField()
    });
    await batchWithRemove.commit();
    return { data: "" };
}

const getClassById = async (firestore, path) => {
    const docPath = doc( firestore, "classGroups", path.classGroupId, "classes", path.classId );
    try {
        const docSnapshot = await getDoc(docPath);
        return { data: classByIdConverter(docSnapshot) };
    } catch (err) {
        console.error("error in getClassById: ", err.message)
        return {error: err.message}
    }
}

function classByIdConverter(docSnapshot) {
    const data = docSnapshot.data()
    const studentIds = Object.keys(data.students)
    const studentEntities = {}
    studentIds.forEach(id => (studentEntities[id] = {...data.students[id]}))
    return { id: docSnapshot.id, ...data, students: {ids: studentIds, entities: studentEntities} }
}

export { deleteClass, getClassById, classByIdConverter }