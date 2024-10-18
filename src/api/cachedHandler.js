import { onSnapshot } from "firebase/firestore";
import { moveThere } from "./customSlice";

async function cachedDocumentListener(
    docRef,
    { cacheDataLoaded, cacheEntryRemoved, updateCachedData },
    converter
) {
    let unsubscribe = null;

    try {
        unsubscribe = onSnapshot(docRef, { source: "cache", includeMetadataChanges: true }, (snapshot) => {
            updateCachedData((draft) => {
                console.log("RUNNING SINGLE UPDATER, path: ", docRef.path);
                console.log("Metadata: ", snapshot.metadata)
                if (converter) {
                    console.log("CONVERTER WAS PRESENT");
                    return converter(snapshot);
                } else {
                    console.log("ABSENT CONVERTER");
                    return {
                        ...snapshot.data({ serverTimestamps: "estimate" }),
                        id: snapshot.id,
                    };
                }
            });
        });
        await cacheDataLoaded;
    } catch {
        unsubscribe ?? unsubscribe();
    }
    await cacheEntryRemoved;
    unsubscribe ?? unsubscribe();
}

async function cachedQueryListener(
    query,
    { cacheDataLoaded, cacheEntryRemoved, updateCachedData }
) {
    let unsubscribe = null;
    try {
        unsubscribe = onSnapshot(query, { source: "cache" }, (snapshot) => {
            // console.log("Initial: ", snapshot.docs[0].data(),
            //  snapshot.metadata.fromCache, snapshot.metadata.hasPendingWrites)
            // console.log("Changed: ", snapshot.docChanges().length, snapshot.docChanges())
            // console.log("ONSNAPSHOT RAN: ", snapshot.docChanges().length)
            updateCachedData((draft) => {
                console.log("RUNNING MULTIPLE UPDATES");

                snapshot.docChanges().forEach((docChange) => {
                    if (docChange.type == "added") {
                        draft.push({
                            ...docChange.doc.data(),
                            id: docChange.doc.id,
                        });
                    } else if (docChange.type == "modified") {
                        const updatedIndex = draft.findIndex(
                            (doc) => doc.id == docChange.doc.id
                        );
                        draft[updatedIndex] = {
                            id: docChange.doc.id,
                            ...docChange.doc.data(),
                        };
                    } else {
                        draft.filter((doc) => doc.id != docChange.doc.id);
                    }
                });
            });
        });
        await cacheDataLoaded;
    } catch {
        unsubscribe ?? unsubscribe();
    }
    await cacheEntryRemoved;
    unsubscribe ?? unsubscribe();
}

async function cachedDocumentListenerWithWait(
    docRef,
    { cacheDataLoaded, cacheEntryRemoved, dispatch },
    converter
) {
    let unsubscribe = null;

    try {
        unsubscribe = onSnapshot(docRef, { source: "cache", includeMetadataChanges: true }, (snapshot) => {
            let doc;
            console.log("RUNNING SINGLE UPDATER, path: ", docRef.path);
            if (converter) {
                console.log("CONVERTER WAS PRESENT");
                doc = converter(snapshot);
            } else {
                console.log("ABSENT CONVERTER");
                doc = {
                    ...snapshot.data({ serverTimestamps: "estimate" }),
                    id: snapshot.id,
                };
            }
            dispatch(moveThere({documentData: doc, identifier: snapshot.id}))
        });
        await cacheDataLoaded;
    } catch {
        unsubscribe ?? unsubscribe();
    }
    await cacheEntryRemoved;
    unsubscribe ?? unsubscribe();
}

export {cachedDocumentListener, cachedQueryListener, cachedDocumentListenerWithWait}