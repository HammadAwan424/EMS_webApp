import { getDateStr } from "./Utility";
import { setDoc, updateDoc, getDoc, doc, serverTimestamp, Timestamp } from "firebase/firestore";
import { flatten } from "flat";

const setAttendance = async ({firestore, ids, classId, classGroupId, dateStr, ...patch }) => {
    // const dateObj = dateStr ? new Date(dateStr) : new Date();
    // const dateStrUnhyphenated = getDateStr({
    //     dateObj,
    //     hyphenated: false,
    // });
    const utcPlusFive = getDateStr()

    console.log("INSIDE SET attendance with args: ", classId, utcPlusFive)

    try {
        await setDoc(
            doc( firestore, "attendance", `${classId}${utcPlusFive}` ),
            {
                ...patch,
                classId,
                createdAt: utcPlusFive,
                classGroupId,
                lastModified: serverTimestamp(),
            }
        );
        return { data: "" };
    } catch (err) {
        console.error("Error inside updateAttendance: ", err)
        return { error: "" }
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
                lastModified: serverTimestamp(),
            }
        );
        return {data: ''};
    } catch (err) {
        console.error("Error inside updateAttendance: ", err)
        return { error: "" }
    }
     


}

const getAttendance = async ({ firestore, classId, classGroupId, dateStr }) => {
    // const utcPlusFive = getDateStr({
    //     dateObj,
    //     hyphenated: false,
    //     utc: false
    // });
    const document = await getDoc(
        doc( firestore, "attendance", `${classId}${dateStr}` )
    );
    return { data: attendanceConverter(document) };
}

function attendanceConverter(snapshot) {
    const data = snapshot.data({ serverTimestamps: "estimate" }) ?? {students: {}};
    console.log("SOME DATA IS: ", data)
    const studentIds = Object.keys(data.students)
    const entities = {}
    studentIds.forEach(id => entities[id] = data.students[id])
    if (snapshot.exists()) {
        return {
            ...data,
            students: {entities, ids: studentIds},
            id: snapshot.id,
            exists: snapshot.exists(),
            lastModified: data.lastModified.toJSON(),
        };
    } else {
        return { exists: false };
    }
}

export {setAttendance, getAttendance, updateAttendance, attendanceConverter}