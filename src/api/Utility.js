import { firestore } from "src/firebase/config";
import { doc, collection } from "firebase/firestore";

function createClassGroupLink() {
    const classGroupid = doc(collection(firestore, "classGroups")).id
    return `/edit/classgroup/${classGroupid}?create=true`
}

export {createClassGroupLink}