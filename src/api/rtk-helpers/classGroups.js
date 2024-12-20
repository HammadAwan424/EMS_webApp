import { collection, doc, getDocs, query, where, writeBatch, limit } from "firebase/firestore"
import { flatten } from "flat";

const getClassGroupsQuery = ({firestore, uid}) =>  query(
    collection(firestore, "classGroups"),
    where("cgAdmin", "==", uid),
    limit(10)
);

const getClassGroups = async ({firestore, uid}) => {
    const query = getClassGroupsQuery({firestore, uid})
    const querySnapshot = await getDocs(query);
    const returnVal = querySnapshot.docs.map((docSnapshot) => ({
        ...docSnapshot.data(),
        id: docSnapshot.id,
    }));
    return { data: returnVal };
}

const editClassGroup = async ({firestore, uid="", classGroupId, create, meta, ...patch }) => {
    const document = doc(firestore, "classGroups", classGroupId);
    const batch = writeBatch(firestore);
    const { classes, ...other } = patch;

    let classGroupUpdates = { ...other };

    if (Object.keys(classes).length > 0) {
        classGroupUpdates.classes = {};
    }

    for (const [id, classData] of Object.entries(classes)) {
        // Extracting data for classGroup updates
        const { className, assignedTeacher, ...classUpdates } =
            classData;
        classGroupUpdates.classes[id] = {
            assignedTeacher,
            className,
        };

        // Creating document for each class
        batch.set(doc(document, "classes", id), {
            ...classUpdates,
            className,
        });
    }

    if (create) {
        classGroupUpdates.classes = classGroupUpdates.classes
            ? classGroupUpdates.classes
            : {};
        batch.set(document, classGroupUpdates);
        batch.update(doc(firestore, "teachers", uid), {
            [`classGroups.${classGroupId}`]: classGroupUpdates.classGroupName 
        })
    } else {
        const flattened = flatten(classGroupUpdates, {
            safe: true,
        });
        batch.update(document, flattened);
    }

    await batch.commit();

    return { data: "" };
}


export default {
    getClassGroupsQuery,
    getClassGroups,
    editClassGroup
}