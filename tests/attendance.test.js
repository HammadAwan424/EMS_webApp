import { getEnv } from "./helper";
import { signupFirestoreInteraction } from "#src/api/signup";
import classGroups from "#src/api/classGroups";
import { inviteTeacher, removeTeacher, getTeacherUid } from "#src/api/invitation";
import path from "path"
import { arrayRemove, deleteDoc, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { deleteClass } from "#src/api/classes";
import { setLogLevel } from "firebase/app";
import { getAttendance, setAttendance, updateAttendance } from "#src/api/attendance";
import { getDateStr, getUTCPlusFive } from "#src/api/Utility";

setLogLevel("error")

let alice; 
let byAlice;
let jake;
let byJake;
let mike;
let byMike;
let env;

const [classId] = ["aliceClassId12121212"]


beforeAll(async () => {
    env = await getEnv()
    alice = env.authenticatedContext("alice", {email: "alice@gmail.com"})
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
                className: "aliceClass",
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

test('Alice can set attendance', async () => {
    expect(await setAttendance({
        firestore: byAlice, ...mockAttendance, 
        classId: classId, classGroupId: "aliceGroup",
        dateStr: undefined
    })).toEqual({data: ""})
})

describe("Alice had set attendance for today", () => {
    beforeEach(async () => {
        const result = await setAttendance({
            firestore: byAlice, ...mockAttendance, 
            classId: classId, classGroupId: "aliceGroup",
            dateStr: undefined
        })
        expect(result).toEqual({data: ""})
    })


    test("getAttendance func works as expected or mock data is set correctly", async () => {
        const result = await getAttendance({
            firestore: byAlice, classId,
            classGroupId: "aliceGroup", 
            dateStr: getUTCPlusFive() // getting for today in utc plus 5 offset
        })
        expect(result.data.students).toEqual(mockAttendance.students)
        // createdAt is equal to whatever date is in utc +05:00
        expect(result.data.createdAt).toBe(getUTCPlusFive())
    })

    test("Alice can update today Attendance", async () => {
        expect(await updateDoc(doc(byAlice, "attendance", `${classId}${getUTCPlusFive()}`), {
            "students.1.status": 1, lastModified: serverTimestamp(), createdAt: getUTCPlusFive()
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
            dateStr: getUTCPlusFive()
        })
        expect(result.data.students[1]).toEqual(mockUpdates.students[1]) //updated
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

