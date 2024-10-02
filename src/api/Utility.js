import { auth, firestore } from "#src/firebase/config.js";
import { doc, collection, arrayUnion, writeBatch, arrayRemove } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { redirect } from "react-router-dom";

function createClassGroupLink() {
    const classGroupid = doc(collection(firestore, "classGroups")).id
    return `/edit/classgroup/${classGroupid}?create=true`
}


async function signOutAction() {
    await signOut(auth)
    return redirect("/")
}

function getDateStr({dateObj=new Date(), hyphenated=false}) {

    dateObj.setUTCHours(0, 0, 0, 0)
    const month = String(dateObj.getMonth()+1).padStart(2, "0")
    const day = String(dateObj.getDate()).padStart(2, "0")
    const year = String(dateObj.getFullYear())

    if (hyphenated) {
        return year + "-" + month + "-" + day
    } else {
        return year + month + day
    }
}

export {createClassGroupLink, signOutAction, getDateStr}


