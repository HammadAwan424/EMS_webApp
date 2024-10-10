import {arrayRemove, deleteField, doc, FieldPath, writeBatch} from "firebase/firestore"
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

export { deleteClass }