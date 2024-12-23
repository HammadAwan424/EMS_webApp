import { getEnv } from "./helper";
import { signupFirestoreInteraction } from "src/api/rtk-helpers/signup";
import classGroups from "src/api/rtk-helpers/classGroups";
import { inviteTeacher, removeTeacher, getTeacherUid } from "src/api/rtk-helpers/invitation";
import path from "path"
import { arrayRemove, deleteDoc, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { deleteClass } from "src/api/rtk-helpers/class";
import { setLogLevel } from "firebase/app";
import { getAttendance, setAttendance, updateAttendance } from "src/api/rtk-helpers/attendance";
import { dateUTCPlusFive, getDateStr } from "#src/api/Utility";

setLogLevel("error")

let alice; 
let byAlice;
let jake;
let byJake;
let mike;
let byMike;
let env;

const [classId, className, aliceName] = ["aliceClassId12121212", "aliceClass", "aliceName"]


beforeAll(async () => {
    env = await getEnv()
    alice = env.authenticatedContext("alice", {email: "alice@gmail.com", name: "aliceName"})
    byAlice = alice.firestore()
    jake = env.authenticatedContext("jake", {email: "jake@gmail.com"})
    byJake = jake.firestore()
    mike = env.authenticatedContext("mike", {email: "mike@gmail.com"})
    byMike = mike.firestore()
})
afterAll(async () => {
    await env.cleanup()
})


const setMockData = async () => {
    await signupFirestoreInteraction(byAlice, "alice", "alice@gmail.com")
    await signupFirestoreInteraction(byJake, "jake", "jake@gmail.com")
    await signupFirestoreInteraction(byMike, "mike", "mike@gmail.com")
    return await classGroups.editClassGroup({
        firestore: byAlice,
        classGroupId: "aliceGroup", 
        classGroupName: "aliceGroupName",
        uid: "alice",
        create: true, 
        meta: {},
        classes: {
            [classId]: {
                className,
                students: {},
                assignedTeacher: ""
            }
        },
        editors: {},
        cgAdmin: "alice"
    })
}
let mockDataResult;
beforeEach(async () => {
    mockDataResult = await setMockData()
})
afterEach(async () => {
    await env.clearFirestore()
})
test(`Mock data is valid for rules, ready to proceed`, async () => {
    await expect(mockDataResult).toEqual({data: ""})
})

const mockAttendance = {
    students: {
        1: { studentName: "mockName", rollNo: "mockRollNo", status: 1},
        2: { studentName: "mockName2", rollNo: "mockRollNo2", status: -1}
    }, 
    ids: [1, 2]
}

const mockUpdates = {
    students: {
        1: { studentName: "mockName", rollNo: "mockRollNo", status: -1},
    },
    ids: [1]
}

const setAliceAttendance = {
    editedBy: {
        name: aliceName,
        uid: "alice",
        email: "alice@gmail.com"
    }
}

test('Alice can set attendance', async () => {
    expect(await setAttendance({
        firestore: byAlice, ...mockAttendance, ...setAliceAttendance,
        classId: classId, classGroupId: "aliceGroup",
        dateStr: undefined
    })).toEqual({data: ""})
})

describe("Alice had set attendance for today", () => {
    beforeEach(async () => {
        const result = await setAttendance({
            firestore: byAlice, ...mockAttendance, ...setAliceAttendance,
            classId: classId, classGroupId: "aliceGroup",
            dateStr: undefined
        })
        expect(result).toEqual({data: ""})
    })


    test("getAttendance func works as expected or mock data is set correctly", async () => {
        const result = await getAttendance({
            firestore: byAlice, classId,
            classGroupId: "aliceGroup", 
            dateStr: getDateStr() // getting for today in utc plus 5 offset
        })
        expect(result.data.students.entities).toEqual(mockAttendance.students)
        // createdAt is equal to whatever date is in utc +05:00
        expect(result.data.createdAt).toBe(getDateStr())
    })

    test("Alice can update today Attendance", async () => {
        expect(await updateDoc(doc(byAlice, "attendance", `${classId}${getDateStr()}`), {
            "students.1.status": 1, lastEdited: serverTimestamp(), createdAt: getDateStr()
        })).toBeUndefined()
    })

    
    test("updateAttendance func works as expected by updating today attendance", async () => {
        await updateAttendance({
            firestore: byAlice, ...mockUpdates, 
            classId: classId, classGroupId: "aliceGroup",
            dateStr: undefined
        })
        const result = await getAttendance({
            firestore: byAlice, classId,
            classGroupId: "aliceGroup", 
            dateStr: getDateStr()
        })
        expect(result.data.students.entities[1]).toEqual(mockUpdates.students[1]) //updated
    })

    test("We can get dateStr yyyymm for previous day in utc +5:00 offset using utility funcs", () => {
        const dateObj = dateUTCPlusFive()
        const dateStr = getDateStr(-1, dateObj, true)
        // all of the below code is not required if i use getDateStr with -1 for previous day
        const requiredOffset = +5 // hours
        const todayDate = new Date()
        todayDate.setDate(todayDate.getDate()-1) // previuos day
        const utcPlusFiveHours = todayDate.getHours() + (todayDate.getTimezoneOffset()/60) + requiredOffset
        todayDate.setHours(utcPlusFiveHours)
        expect(todayDate.getDate()).toBe(parseInt(dateStr.slice(-2,)))
        expect(todayDate.getMonth()+1).toBe(parseInt(dateStr.slice(-4, -2))) // added 1 for month from 1 to 12
    })

    test("getAttendance when fallback is previous || next returns the nearest doc earlier or later in time", async () => {
        const dateObj = dateUTCPlusFive()
        const dateStrTomorrow = getDateStr(+1, dateObj, true)
        const resultWithTomorrowArg = await getAttendance({
            firestore: byAlice, classId,
            classGroupId: "aliceGroup", 
            dateStr: dateStrTomorrow, fallback: "previous"
        })

        const dateObj2 = dateUTCPlusFive()
        const dateStrYesterday = getDateStr(-1, dateObj2, true)
        const resultWithYesterdayArg = await getAttendance({
            firestore: byAlice, classId,
            classGroupId: "aliceGroup", 
            dateStr: dateStrYesterday, fallback: "next"
        })
        
        // both results are same, their respective fallback cause them to fetch today doc (it exists)
        expect(resultWithYesterdayArg).toEqual(resultWithTomorrowArg)
        expect(resultWithYesterdayArg.data.students.entities).toEqual(mockAttendance.students)
        expect(resultWithYesterdayArg.data.createdAt).toBe(getDateStr()) // confirms that it fetched today doc
    })

    test("getAttendance when fallback is provided but doc exists, fallback has no effect", async () => {
        const dateObj = dateUTCPlusFive()
        const nextDay = getDateStr(+1, dateObj, true)
        // setting attendance for the next day
        await env.withSecurityRulesDisabled(context => {
            const f = context.firestore()
            return setAttendance({
                firestore: f, ...mockAttendance, ...setAliceAttendance,
                classId: classId, classGroupId: "aliceGroup",
                dateStr: nextDay
            })
        })
        // fetching attendance for next day
        const result = await getAttendance({
            firestore: byAlice, classId,
            classGroupId: "aliceGroup", 
            dateStr: nextDay
        })
        // make sure attendance for next day has been set correctly
        expect(result.data.exists).toBe(true)
        expect(result.data.students.entities).toEqual(mockAttendance.students)
        expect(result.data.createdAt).toBe(nextDay)
        expect(result.data.createdAt).not.toBe(getDateStr()) // not today

        // Now the real test
        const resultWithFallback = await getAttendance({
            firestore: byAlice, classId,
            classGroupId: "aliceGroup", 
            dateStr: nextDay, fallback: "previous" // fallback is previous but dateStr is of next day
        })
        // fallback doesn't have an effect if doc is found for given dateStr, result is same as above
        expect(resultWithFallback.data.createdAt).toBe(nextDay)
    })

    test("not providing correct display name for update/set fails", async () => {
        const wrongEditedBy = {name: "wrongName"}
        const correctEditedBy = {name: aliceName}
        expect(await updateAttendance({
            firestore: byAlice, ...mockUpdates, editedBy: wrongEditedBy,
            classId: classId, classGroupId: "aliceGroup",
            dateStr: undefined
        })).toHaveProperty("error")
        expect(await updateAttendance({
            firestore: byAlice, ...mockUpdates, editedBy: correctEditedBy,
            classId: classId, classGroupId: "aliceGroup",
            dateStr: undefined
        })).toHaveProperty("data")
    })
})

// describe("Attendance for yesterday day exists", () => {
//     const dateObj = new Date()
//     dateObj.setDate(new Date().getDate() - 1) // Yesterday
//     const yesterdayNohyphen = getDateStr({dateObj, hyphenated: false})

//     // Set mock data for yesterday
//     beforeEach(async () => {
//         await env.withSecurityRulesDisabled(context => {
//             const f = context.firestore()
//             return setAttendance({
//                 firestore: f, ...mockAttendance, 
//                 classId: classId, classGroupId: "aliceGroup",
//                 dateStr: getDateStr({dateObj, hyphenated: true})
//             })
//         })
//     })

//     test("Mock data is set for yesterday and Alice can read it", async () => {
//         const docu = await getDoc(doc(byAlice, "attendance", `${classId}${yesterdayNohyphen}`))
//         expect(docu.data().students).toEqual(mockAttendance.students)
//     })

//     test("Alice can't update yesterday attendance", async () => {
//         return expect(updateDoc(doc(byAlice, "attendance", `${classId}${yesterdayNohyphen}`), {
//             "students.1.status": 1, lastModified: serverTimestamp()
//         })).rejects.toHaveProperty("code", "permission-denied")
//     })

// })

