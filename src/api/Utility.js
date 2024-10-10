import { doc, collection, arrayUnion, writeBatch, arrayRemove } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { redirect } from "react-router-dom";

function createClassGroupLink(firestore) {
    const classGroupid = doc(collection(firestore, "classGroups")).id
    return `/edit/classgroup/${classGroupid}?create=true`
}


async function signOutAction(auth) {
    await signOut(auth)
    return redirect("/")
}


function getDateStr({dateObj=new Date(), hyphenated=false, utc=false}) {
    let month, day, year;
    if (utc) {
        month = String(dateObj.getUTCMonth()+1).padStart(2, "0")
        day = String(dateObj.getUTCDate()).padStart(2, "0")
        year = String(dateObj.getUTCFullYear())
    } else {
        month = String(dateObj.getMonth()+1).padStart(2, "0")
        day = String(dateObj.getDate()).padStart(2, "0")
        year = String(dateObj.getFullYear())
    }

    if (hyphenated) {
        return year + "-" + month + "-" + day
    } else {
        return year + month + day
    } 
}

function getUTCPlusFive(dateDiff=0) {
    const dateObj = new Date()
    const plusFiveTimestamp = new Date(dateObj.getTime() + (5  * 60 * 60 * 1000))
    plusFiveTimestamp.setDate(plusFiveTimestamp.getDate() + dateDiff)
    const month = String(plusFiveTimestamp.getUTCMonth()+1).padStart(2, "0")
    const day = String(plusFiveTimestamp.getUTCDate()).padStart(2, "0")
    const year = String(plusFiveTimestamp.getUTCFullYear())
    return year + month + day
}

function dateHyphen(dateStr, boolean) {
    if (boolean == true) {
        return "her"
    }
}

export {createClassGroupLink, signOutAction, getDateStr, getUTCPlusFive}


