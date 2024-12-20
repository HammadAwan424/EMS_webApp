import { writeBatch, doc } from "firebase/firestore";

const signupFirestoreInteraction = (firestore, uid, email) => {
    const batch = writeBatch(firestore);
    batch.set(doc(firestore, "teachers", uid), {
        invitations: {},
        classes: {},
        classGroups: {}
    });
    batch.set(
        doc(firestore, "teachersPublic", uid),
        { email }
    );
    return batch.commit()
}

export {signupFirestoreInteraction}