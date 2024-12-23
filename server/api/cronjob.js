import { FieldValue, Timestamp } from "firebase-admin/firestore"
import { getDateStr } from "#src/api/Utility.js";


async function cronjob(req, res, firestore) {
    const [bearerStr, token] = req.headers.authorization.split(" ")
    if (token != process.env.CRON_SECRET) {
        res.status(403)
        res.send("permission-denied")
    }

    const bulkWriter = firestore.bulkWriter()
    const utcPlusFive = getDateStr(-1)
    const day = utcPlusFive.slice(-2,)
    
    const querySnapshot = await firestore.collection("attendance").where("createdAt", "==", utcPlusFive).get()
    const attendanceDocs = querySnapshot.docs
    
    console.log("Starting Loop with attendanceDocs found: ", attendanceDocs.length)
    for (let i = 0; i < attendanceDocs.length; i++) {
        const attendanceDoc = attendanceDocs[i].data()
        const studentIds = Object.keys(attendanceDoc.students)
        const updates = {stats: {}, students: {}, classId: attendanceDoc.classId, classGroupId: attendanceDoc.classGroupId}
        let present = 0;
        // Sets overall Students Stats for one single month
        for (let j = 0; j < studentIds.length; j++) {
            const status = attendanceDoc.students[studentIds[j]]?.status ?? null
            const keyForStudent = status == 1 ? "present"
                : status == -1 ? "absent" 
                : null
            if (status == 1) present++
            if (keyForStudent == null) continue
            updates.students[studentIds[j]] = {[keyForStudent]: FieldValue.increment(1)}
        }
        // Sets overall Class Stats for one single month
        updates.stats[day] = {count: present, total: studentIds.length}

        const monthlyDocRef = firestore.doc(`monthlyAttendance/${attendanceDoc.classId}${attendanceDoc.createdAt.slice(0,-2)}`)
        bulkWriter.set(monthlyDocRef, updates, {merge: true})
    }
    try {
        await bulkWriter.close()
        res.send("success")
    } catch (err) {
        res.send("error")
    }
}

// BELOW ARE THE MOCK DATA STRUCTS
// docId will be classId202405
const monthlyMock = {
    classId: "aliceClassId12121212",
    classGroupId: "classGroupId",
    stats: {
        day1: {
            count: 32,
            total: 50
        },
        day2: {
            count: 12,
            total: 50
        } // ...
    },
    students: {
        studentId1: {
            absent: 4,
            present: 2
        },
        studentId2: {
            absent: 3,
            present: 1
        } // ...
    }
}

// docId will be classId20240523
const dailyMock = {
    students: {
        studentId1: { studentName: "mockName", rollNo: "mockRollNo", status: 1},
        studentId2: { studentName: "mockName2", rollNo: "mockRollNo2", status: -1}
    }, 
    classId: "aliceClassId12121212",
    classGroupId: "classGroupId",
    lastModified: Timestamp.fromDate(new Date()),
    createdAt: getDateStr(-1) // "20240523" aka Yesterday
}


export default cronjob