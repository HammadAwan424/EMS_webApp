import { ClassAppModel } from "#src/api/rtk-query/class/util.ts";
import { selectAddedStudents } from "./Common.ts";


const mockData = {
    className: "tmp",
    exists: true as const,
    id: "abc"
}
const baseState: ClassAppModel = {
    students: {
        entities: {
            3: {
                studentName: "hammad",
                rollNo: "32"
            }
        },
        ids: new Set("3"),
    }, ...mockData
}
const updatedState: ClassAppModel = {
    students: {
        entities: {
            3: {
                studentName: "changed",
                rollNo: "32"
            },
            4: {
                studentName: "newStudent",
                rollNo: "54"
            }
        },
        ids: new Set(["3", "4"]),
    }, ...mockData
}

const result = selectAddedStudents(baseState, updatedState, false)
console.log(result)