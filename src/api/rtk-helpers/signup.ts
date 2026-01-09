import { writeBatch, doc, Firestore } from "firebase/firestore";

const signupFirestoreInteraction = (firestore: Firestore, uid: string, email: string) => {
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