import {arrayRemove, deleteField, doc, FieldPath, getDoc, writeBatch} from "firebase/firestore"
import { removeInvite } from "./invitation";
import { flatten } from "flat";

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


const editClass = async ({ firestore, classId, classGroupId, ...patch }) => {
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
    studentIds.forEach(id => studentEntities[id] = {...data.students[id]})
    return { id: docSnapshot.id, ...data, students: {ids: studentIds, entities: studentEntities} }
}

export { deleteClass, getClassById, editClass, classByIdConverter }