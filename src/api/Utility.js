import { auth, firestore } from "src/firebase/config";
import { doc, collection, arrayUnion, writeBatch, arrayRemove } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { redirect } from "react-router-dom";

function createClassGroupLink() {
    const classGroupid = doc(collection(firestore, "classGroups")).id
    return `/edit/classgroup/${classGroupid}?create=true`
}


async function signOutAction() {
    await signOut(auth)
    return redirect("/")
}

function getDateStr({dateObj=new Date(), hyphenated=false}) {

    dateObj.setUTCHours(0, 0, 0, 0)
    const month = String(dateObj.getMonth()+1).padStart(2, "0")
    const day = String(dateObj.getDate()).padStart(2, "0")
    const year = String(dateObj.getFullYear())

    if (hyphenated) {
        return year + "-" + month + "-" + day
    } else {
        return year + month + day
    }
}

const invitation = (cid, email, cgid, cname) => ({
    meta: {metaId: cid},
    [`invitations.${cid}`]: {
        classGroupId: cgid,
        className: cname,
        email,
        status: true
    }
})

const invite = (recepientId, recepientEmail, hostEmail, classGroupId, classId, className) => {
    const batch = writeBatch(firestore)
    batch.update(doc(firestore, "teachers", recepientId), invitation(classId, hostEmail, classGroupId, className))
    batch.update(doc(firestore, "classGroups", classGroupId), {
        [`editors.${recepientId}`]: arrayUnion(classId),
        [`classes.${classId}.assignedTeacher`]: recepientEmail,
        meta: {metaId: recepientId}
    })
    return batch
}
const removeInvite = (recepientId, classGroupId, classId) => {
    const batch = writeBatch(firestore)
    batch.update(doc(firestore, "teachers", recepientId), {[`invitations.${classId}.status`]: false, meta: {metaId: classId}})
    batch.update(doc(firestore, "classGroups", classGroupId), {
        [`editors.${recepientId}`]: arrayRemove(classId),
        [`classes.${classId}.assignedTeacher`]: "",
        meta: {metaId: recepientId}
    })
    return batch
}


export {createClassGroupLink, signOutAction, getDateStr, invite, removeInvite}