import { doc, collection } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, firestore } from "src/api/firebase/config.js"
import { generatePath, redirect } from "react-router-dom";

function createClassGroupLink() {
    const classGroupid = doc(collection(firestore, "classGroups")).id
    return `/edit/classgroup/${classGroupid}?create=true`
}

async function signOutAction() {
    await signOut(auth)
    return redirect("/")
}


// the dateStr is already utc +5:00
// it returns dateObj's utc time (not local) with 5 hours added
// it depends upon client clock whether the clock (dateObj) represent the correct time in local timezone
// but not the timezone (as it doesn't use date.getLocalDay etc)
function getDateStr(dateDiff=0, dateObj=new Date(), skipAddition=false, hyphenated=false) {
    const plusFiveTimestamp = skipAddition ? dateObj : new Date(dateObj.getTime() + (5  * 60 * 60 * 1000))
    plusFiveTimestamp.setUTCDate(plusFiveTimestamp.getUTCDate() + dateDiff)

    const month = String(plusFiveTimestamp.getUTCMonth()+1).padStart(2, "0")
    const day = String(plusFiveTimestamp.getUTCDate()).padStart(2, "0")
    const year = String(plusFiveTimestamp.getUTCFullYear())
    
    if (hyphenated) {
        return `${year}-${month}-${day}`
    } else {
        return year + month + day
    } 
}


// it returns dateObj whose all methods return utc +5:00 time
// all methods must use .getUTC*()
// accepts seconds in utc for conversion
function dateUTCPlusFive(date=new Date()) {
    const offset = 5 * 60 * 60 * 1000
    if (typeof date == "number") {
        return new Date(date + offset)
    } else {
        const utcTime = date.getTime()
        return new Date(utcTime + offset)
    }
}


// takes a dateStr and returns dateObj which represent the same date in utc timezone
// returns Date obj by parsing dateStr, dateStr must be obtained through dateUTCPlusFive
// all get operations should use getUTC*
function parseDateStr(dateStr: string) {
    const time = "00:00:00"
    const tz = "Z"
    const [year, month, day] = [dateStr.slice(0, 4), dateStr.slice(4, 6), dateStr.slice(6, 8)]
    const date = year + "-" + month + "-" + day
    return new Date(`${date}T${time}${tz}`)
}


interface Path {
    classId: string,
    classGroupId: string,
    isJoined: boolean
}
const getPath = {
    class({classId, classGroupId, isJoined} : Path) {
        const classPath = generatePath("/classgroup/:classGroupId/class/:classId", {
            classGroupId, classId
        })
        const joined = isJoined ? "?joined=true" : "?joined=false"
        return {
            edit: classPath+"/edit"+joined,
            details: classPath+"/details"+joined,
        }
    },
    attendance({classId, classGroupId, isJoined} : Path) {
        const attendancePath = generatePath("/classgroup/:classGroupId/class/:classId/attendance", {
            classGroupId, classId
        })
        const joined = isJoined ? "?joined=true" : "?joined=false"
        return {
            today: attendancePath+"/today"+joined,
            view({dateStr} : {dateStr: string}) {
                return attendancePath+`/view/${dateStr}`+joined
            }
        }
    }
}



// undefined -> invalid id, true -> isJoined, false -> isAdmin
const joinedClass = (search: string) => {
    const searchParams = new URLSearchParams(search)
    const isJoined = searchParams.get("joined") == "true" ? true 
        : searchParams.get("joined") == "false" ? false 
        : null // for the sake of syntax
    return isJoined
}


const noOp = () => ({data: "" as const})
type NoOpData = ReturnType<typeof noOp>['data']

export {createClassGroupLink, signOutAction, getDateStr, parseDateStr, dateUTCPlusFive, getPath, joinedClass, noOp}
export type { NoOpData }


