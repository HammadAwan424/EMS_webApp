import { DocumentData, FirestoreDataConverter } from "firebase/firestore"

const DocTypeConverter = <T>(): FirestoreDataConverter<T> => ({
    toFirestore: (model: T) => {
        return model as DocumentData
    },
    fromFirestore: (snapshot, options) => {
        return snapshot.data(options) as T
    }
})

export { DocTypeConverter }