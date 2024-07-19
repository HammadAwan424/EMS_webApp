import { collection, where, limit, query, getDocs, getDoc, doc } from "firebase/firestore"
import { firestore, auth } from "src/firebase/config"

async function getClassGroupById(classGroupId) {
    return getDoc(doc(firestore, `classGroups/${classGroupId}`))
}

function getClassGroupByUser(userId) {
    const classGroupsQuery = query(
        collection(firestore, "classGroups"),
        where("cgAdmin", "==", userId),
        limit(10))
    return getDocs(classGroupsQuery)   
    .then(snapshot => {
        if (snapshot.empty) return null 
        else return snapshot
    })
}


async function getPublicTeacherByEmail(email) {
    const teacherQuery = query(
        collection(firestore, "teachersPublic"),
        where("email", "==", email),
        limit(1)
    );
    return getDocs(teacherQuery)
}


function getClassById(classGroupId, classId) {
    return getDoc(doc(firestore, "classGroups", classGroupId, "classes", classId))
}

export {getClassGroupById, getClassGroupByUser, getClassById, getPublicTeacherByEmail}