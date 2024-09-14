import { arrayRemove, deleteField, doc, writeBatch } from "firebase/firestore"
import { auth, firestore } from "src/firebase/config"

async function acceptInvitation({request}) {
    const teacherId = auth.currentUser.uid
    const invitation = await request.json()
  
    const batch = writeBatch(firestore)

    batch.update(doc(firestore, "teachers", teacherId), {
        [`invitations.${invitation.invitationId}`]: deleteField(),
        [`classes.${invitation.invitationId}`]: {
            className: invitation.className,
            classGroupId: invitation.classGroupId,
            cgAdminEmail: invitation.email,
            classId: invitation.invitationId
        }
    })

    await batch.commit()
    return "successful" 
}


async function rejectInvitation({request}) {
    const teacherId = auth.currentUser.uid
    const invitation = await request.json()
  
    const batch = writeBatch(firestore)

    batch.update(doc(firestore, "teachers", teacherId), {
        invitations: arrayRemove(invitation)
    })

    await batch.commit()  
    return "successful" 
}


export {rejectInvitation, acceptInvitation}