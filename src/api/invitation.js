import { writeBatch, arrayRemove, arrayUnion, doc, collection, getDocs, limit, query, where } from "firebase/firestore"

const getTeacherUid = async (firestore, email) => {
    const teacherQuery = query(
        collection(firestore, "teachersPublic"),
        where("email", "==", email),
        limit(1)
    );

    const querySnapshot = await getDocs(teacherQuery);

    // const data = {
    //     exists: !querySnapshot.empty,
    //     ...querySnapshot.docs[0]?.data(),
    //     id: querySnapshot.docs[0]?.id
    // };
    if (querySnapshot.empty) {
        const error = new Error(
            "No teacher exists with this email",
        );
        throw error;
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
        
        const recepientId = await getTeacherUid(recepientEmail)
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
        console.log("Error: ", error);
        if (error.code == "permission-denied") {
            return {
                error: "You don't have any permission to do this",
                code: "permission-denied"
            };
        } else return { error: error.message };
    }
    return { data: "" };
}

const removeTeacher  = async ({ firestore, classGroupId, classId, getTeacherUid }) => {
    const recepientId = await getTeacherUid()
    try {
        const batch = writeBatch(firestore)
        const batchWithRemove =  removeInvite(batch, firestore, recepientId, classGroupId, classId);
        await batchWithRemove.commit()
        return { data: "" };
    } catch (err) {
        return { error: err.message };
    }
}

export {inviteTeacher, removeTeacher, getTeacherUid}