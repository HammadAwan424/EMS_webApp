import { collection, where, limit, query, getDocs, getDoc, doc } from "firebase/firestore"
import { firestore, auth } from "src/firebase/config"

async function getClassGroupById(classGroupId) {
    return getDoc(doc(firestore, `classGroups/${classGroupId}`))
}
function getCurrentClassGroups() {
    if (auth.currentUser) {
        const classGroupsQuery = query(
            collection(firestore, "classGroups"),
            where("cgAdmin", "==", auth.currentUser.uid),
            limit(10))
        return getDocs(classGroupsQuery)   
        .then(snapshot => {
            return snapshot
        })
    } else {
        return null
    }
}


async function getPublicTeacherByEmail(email) {
    const teacherQuery = query(
        collection(firestore, "teachersPublic"),
        where("email", "==", email),
        limit(1)
    );
    return getDocs(teacherQuery)
}

const Teacher =  {
    getInvitationId(classId, invitations) {
        return invitations[classId].classGroupId + classId
    },
    hasInvitations(user) {
        return Object.keys(user.invitations).length > 0
    },
    hasClasses(user) {
        return Object.keys(user.classes).length > 0
    },
    getClassIdArray(user) {
        return Object.keys(user.classes)
    },
    hasClassGroups(classGroup) {
        return classGroup.length > 0
    }
}

export { Teacher }



async function getClassById(classGroupId, classId) {
    return getDoc(doc(firestore, "classGroups", classGroupId, "classes", classId))
}

export {getClassGroupById, getClassById, getPublicTeacherByEmail, getCurrentClassGroups}