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


// the dateStr is already utc +5:00
// it returns dateObj's utc time (not local) with 5 hours added
// it depends upon client clock whether the clock (dateObj) represent the correct time in local timezone
// but not the timezone (as it doesn't use date.getLocalDay etc)
function getDateStr(dateDiff=0, dateObj=new Date(), skipAddition=false, hyphenated=false) {
    const plusFiveTimestamp = skipAddition ? dateObj : new Date(dateObj.getTime() + (5  * 60 * 60 * 1000))
    plusFiveTimestamp.setDate(plusFiveTimestamp.getDate() + dateDiff)
    let month, day, year;

    month = String(plusFiveTimestamp.getUTCMonth()+1).padStart(2, "0")
    day = String(plusFiveTimestamp.getUTCDate()).padStart(2, "0")
    year = String(plusFiveTimestamp.getUTCFullYear())
    
    if (hyphenated) {
        return year + "-" + month + "-" + day
    } else {
        return year + month + day
    } 
}


// it returns dateObj whose all methods return utc +5:00 time
// all methods must use .getUTC*()
function dateUTCPlusFive(date=new Date()) {
    const utcTime = date.getTime()
    return new Date(utcTime + (5 * 60 * 60 * 1000))
}


// returns Date obj by parsing dateStr (utc +5:00)
// all get operations should use getUTC*
function parseDateStr(dateStr) {
    const time = "00:00:00"
    const tz = "Z"
    const [year, month, day] = [dateStr.slice(0, 4), dateStr.slice(4, 6), dateStr.slice(6, 8)]
    const date = year + "-" + month + "-" + day
    return new Date(`${date}T${time}${tz}`)
}


export {createClassGroupLink, signOutAction, getDateStr, parseDateStr, dateUTCPlusFive}


