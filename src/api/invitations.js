import { arrayRemove, deleteField, doc, writeBatch } from "firebase/firestore"
import { auth, firestore } from "src/firebase/config"

async function acceptInvitation({request}) {
    const teacherId = auth.currentUser.uid
    const invitation = await request.json()
  
    const batch = writeBatch(firestore)
    const classId = invitation.id

    batch.update(doc(firestore, "teachers", teacherId), {
        [`classes.${classId}`]: true
    })

    await batch.commit()
    return "successful" 
}


async function rejectInvitation({request}) {
    const teacherId = auth.currentUser.uid
    const invitation = await request.json()
  
    const batch = writeBatch(firestore)
    const classId = invitation.id

    batch.update(doc(firestore, "teachers", teacherId), {
        [`classes.${classId}`]: false
    })

    await batch.commit()  
    return "successful" 
}


export {rejectInvitation, acceptInvitation}