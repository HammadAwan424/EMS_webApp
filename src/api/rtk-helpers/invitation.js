import { writeBatch, arrayRemove, arrayUnion, doc, collection, getDocs, limit, query, where, updateDoc, deleteField } from "firebase/firestore"

const getTeacherUid = async (firestore, email) => {
    const teacherQuery = query(
        collection(firestore, "teachersPublic"),
        where("email", "==", email),
        limit(1)
    );
    const querySnapshot = await getDocs(teacherQuery);
    if (querySnapshot.empty) {
        throw Error(
            "No teacher exists with this email",
        );
    } else {
        return querySnapshot.docs[0].id
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


const invite = (firestore, recepientId, recepientEmail, hostEmail, classId, classGroupId, className) => {
    const batch = writeBatch(firestore)
    batch.update(doc(firestore, "teachers", recepientId), invitation(classId, hostEmail, classGroupId, className))
    batch.update(doc(firestore, "classGroups", classGroupId), {
        [`editors.${classId}`]: arrayUnion(recepientId),
        [`classes.${classId}.assignedTeacher`]: recepientEmail,
        meta: {metaId: classId}
    })
    return batch.commit()
}


const removeInvite = (batch, firestore, recepientId, classGroupId, classId) => {
    batch.update(doc(firestore, "teachers", recepientId), {
        [`invitations.${classId}.status`]: false, meta: {metaId: classId}
    })
    batch.update(doc(firestore, "classGroups", classGroupId), {
        [`editors.${classId}`]: arrayRemove(recepientId),
        [`classes.${classId}.assignedTeacher`]: "",
        meta: {metaId: classId}
    })
    return batch
}


const inviteTeacher = async ({
    firestore,
    recepientEmail,
    hostEmail,
    getTeacherUid,
    classId,
    classGroupId,
    className,
}) => {
    const value = recepientEmail || "";
    const regex = /^\w+@[a-z]+\.com$/;
    try {
        if (!regex.test(value)) {
            throw new Error("The format is incorrect for an email");
        } else if (value == hostEmail) {
            throw new Error("You can't use you own email");
        }
        
        const recepientId = await getTeacherUid()
        await invite(
            firestore,
            recepientId,
            recepientEmail,
            hostEmail,
            classId,
            classGroupId,
            className
        )
    } catch (error) {
        console.log("Error at right place: ", error.message);
        if (error.code == "permission-denied") {
            return {
                error: {
                    message: "You don't have any permission to do this",
                    code: "permission-denied"
                } 
            };
        } else return { error: error.message };
    }
    return { data: "" };
}


const removeTeacher  = async ({ firestore, classGroupId, classId, getTeacherUid }) => {
    try {
        const recepientId = await getTeacherUid()
        const batch = writeBatch(firestore)
        const batchWithRemove = removeInvite(batch, firestore, recepientId, classGroupId, classId);
        await batchWithRemove.commit()
        return { data: "" };
    } catch (err) {
        return { error: err.message };
    }
}


const acceptInvitation = async ({firestore, uid, invitationId}) => {
    const batch = writeBatch(firestore)
    batch.update(doc(firestore, "teachers", uid), {
        [`classes.${invitationId}`]: true
    })
    await batch.commit()
    return {data: ""}
}


const rejectInvitation = async ({firestore, uid, invitationId}) => {
    const batch = writeBatch(firestore)
    batch.update(doc(firestore, "teachers", uid), {
        [`classes.${invitationId}`]: false
    })
    await batch.commit()  
    return {data: ""}
}


const clearNotifications = async ({firestore, uid, listOfIds}) => {
    const updates = {}
    listOfIds.forEach(id => {
        updates[`invitations.${id}`] = deleteField()
        updates[`classes.${id}`] = deleteField()
    });
    await updateDoc(doc(firestore, "teachers", uid), updates)
    return {data: ""}
}


const getAllClassesStatus = (User) => {
    // invitationsKeyArray.remove(classesKeyArray) gives new invitations
    // Inform the user about the new invitations by checking their status if it is true or false
    // Take each id marked as true (user joined) from classesKeyArray and compare against invitationsKeyArray if some class is removed by host
    // Add all the remaining classes to query if user wants them
    const invitationsObj = User?.invitations ?? {}
    const classesObj = User?.classes ?? {}
    const invitationsKeyArray = Object.keys(invitationsObj);
    const classesKeyArray = Object.keys(classesObj);

    const invitationsAllowed = invitationsKeyArray.filter(
        idFromInvitation => !classesKeyArray.includes(idFromInvitation) && invitationsObj[idFromInvitation].status == true
    );
    const invitationsRevoked = invitationsKeyArray.filter(
        idFromInvitation => !classesKeyArray.includes(idFromInvitation) && invitationsObj[idFromInvitation].status == false
    );
    
    
    const [acceptedAllowed, acceptedRevoked, rejectedRevoked] = [[], [], []];

    classesKeyArray.forEach(knownId => {
        const revoked = invitationsObj[knownId].status == false;
        // User joined classes
        if (classesObj[knownId] == true) { 
            if (revoked) {
                // Access revoked by host/admin
                // TODO: Prompt the user to update his doc to remove knownId from invitations as well as classes map, these shouldn't be fetched
                acceptedRevoked.push(knownId);
            } else {
                acceptedAllowed.push(knownId);
            }
        // User rejected classes
        } else {
            // classesObj[knownId] == false i.e., Classes rejected by user
            if (revoked) {
                // Access revoked for classes that user is not interested in
                // TODO: No need to tell user, silently remove the knownId from invitations as well as classes map
                // This is just to cleanup user doc from unnecessary invitation after access has been revokes for security rules to work
                rejectedRevoked.push(knownId)
            }
            // No need for else, wait until the access is revoked so above it lies in above revoked == true

        }
    });
    return {acceptedAllowed, acceptedRevoked, rejectedRevoked, invitationsAllowed, invitationsRevoked}
};


export {
    inviteTeacher, removeTeacher, getTeacherUid, removeInvite,
    acceptInvitation, rejectInvitation, clearNotifications, 
    getAllClassesStatus
}