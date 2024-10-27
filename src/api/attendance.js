import { createSelector } from "@reduxjs/toolkit";
import { getDateStr } from "./Utility";
import { setDoc, updateDoc, getDoc, doc, serverTimestamp, query, collection, where, orderBy, getDocs, limitToLast, limit } from "firebase/firestore";
import { flatten } from "flat";

const setAttendance = async ({firestore, ids, classId, classGroupId, dateStr, ...patch }) => {
    const utcPlusFive = dateStr ? dateStr : getDateStr()
    try {
        await setDoc(
            doc( firestore, "attendance", `${classId}${utcPlusFive}` ),
            {
                ...patch,
                classId,
                createdAt: utcPlusFive,
                classGroupId,
                lastEdited: serverTimestamp(),
            }
        );
        return { data: "" };
    } catch (err) {
        console.error("Error inside updateAttendance: ", err)
        return {error: err.message}
    }
     
}

const updateAttendance = async ({ firestore, ids, classId, classGroupId, dateStr, ...patch }) => {
    const utcPlusFive = getDateStr()
    const flattened = flatten(patch);
    
    try {
        await updateDoc(
            doc( firestore, "attendance", `${classId}${utcPlusFive}`),
            {
                ...flattened,
                lastEdited: serverTimestamp(),
            }
        );
        return {data: ''};
    } catch (err) {
        console.error("Error inside updateAttendance: ", err)
        return {error: err.message}
    }
     


}

const getAttendance = async ({ firestore, classId, classGroupId, dateStr, fallback="" }) => {
    try {
        if (fallback) {
            const q = query(
                collection(firestore, "attendance"),
                where("classId", "==", classId),
                where("classGroupId", "==", classGroupId),
                orderBy("createdAt", "asc"),
            )
            let conditionedQuery;
            if (fallback == "previous") {
                conditionedQuery = query(q, where("createdAt", "<=", dateStr), limitToLast(1))
            } else if (fallback == "next") {
                conditionedQuery = query(q, where("createdAt", ">=", dateStr), limit(1))
            } else {
                throw Error(`Fallback value was provided but not valid, received: ${fallback}`)
            }
            const snapshot = await getDocs(conditionedQuery)
            if (snapshot.empty) {
                return {data: {exists: false}}
            } else {
                const document = snapshot.docs[0]
                return {data: attendanceConverter(document)}
            }
        } else {
            const document = await getDoc(
                doc( firestore, "attendance", `${classId}${dateStr}` )
            );
            return { data: attendanceConverter(document) };
        }
    } catch (err) {
        return {error: err.message}
    }

}

function attendanceConverter(snapshot) {
    const data = snapshot.data({ serverTimestamps: "estimate" }) ?? {students: {}};
    const studentIds = Object.keys(data.students)
    const entities = {}
    studentIds.forEach(id => entities[id] = data.students[id])
    if (snapshot.exists()) {
        return {
            ...data,
            students: {entities, ids: studentIds},
            id: snapshot.id,
            exists: snapshot.exists(),
            lastEdited: data.lastEdited.toJSON(),
        };
    } else {
        return { exists: false };
    }
}

const staticRefArr = []
const staticRefObj = {}

const selectStudentEntitiesDaily = state => state?.students?.entities ?? staticRefObj
const selectStudentIdsArray = (state) => state?.students?.ids ?? staticRefArr
const selectStudentIdsDaily = createSelector(
    selectStudentEntitiesDaily,
    selectStudentIdsArray,
    (entities, studentIds) => {
        return studentIds.toSorted((a, b) => entities[a].rollNo - entities[b].rollNo)
    }
)

export {
    setAttendance, getAttendance, updateAttendance, attendanceConverter,
    selectStudentEntitiesDaily, selectStudentIdsDaily
}