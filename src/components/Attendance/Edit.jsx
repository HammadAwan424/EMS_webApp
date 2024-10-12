import classNames from "classnames"
import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useGetAttendanceQuery, useUpdateAttendanceMutation } from "src/api/apiSlice"
import { useImmer } from "use-immer"
import Popup from "../CommonUI/Popup"
import Student from "./Student"
import dot from "dot-object"
import { parseDateStr } from "src/api/Utility"

function Edit() {
    const { classId, classGroupId, date: dateStr } = useParams()
    const navigate = useNavigate()
    
    const dateObj = parseDateStr(dateStr)
    const urlReadable = dateObj.toLocaleString("en-GB", {
        "day": "numeric", "month": 
        "long", "year": "numeric", "timeZone": "UTC"
    })

    const {data: todayAttendance} = useGetAttendanceQuery({classId, classGroupId, dateStr})
    const [attendanceMutation, { isLoading }] = useUpdateAttendanceMutation()

    const allStudents = todayAttendance.students

    const [renderWarning, setRenderWarning] = useState(false)

    const [popup, setPopup] = useState({
        text: "",
        handler: () => {},
        visible: false,
    })

    const [attendance, setAttendance] = useImmer(() => {
        const students = {}
        const ids = []
        for (let [id, student] of Object.entries(allStudents)) {
            students[id] = { studentName: student.studentName, rollNo: student.rollNo, status: student.status}
            ids.push(id)
        }
        const initialState = { students, ids }
        return initialState
    })

    const [attendanceUpdates, setUpdates] = useImmer({students: {}, ids: []})

    const getCurrentStatus = id => attendanceUpdates.students[id]?.status ?? attendance.students[id].status

    console.log(attendanceUpdates)

    const markStudent = (status, id) => {
        setUpdates(draft => {
            if (getCurrentStatus(id) != status) { // Prevents Clicking on already marked icon (either check or cross)
                if (attendance.students[id].status == status) {
                    console.log("first", " draft is: ", draft.students[id]?.status, status)
                    const index = draft.ids.findIndex(entryId => entryId == id)
                    draft.ids.splice(index, 1)
                    delete draft.students[id]
                }
                else {
                    console.log("second", " draft is: ", draft.students[id]?.status, status)
                    draft.ids.push(id)
                    const name = `students.${id}.status`
                    dot.str(name, status, draft)
                }
                
            }
        })
    }


    const unMarkedCount = Object.values(attendanceUpdates.students).filter(v => v.status == -1).length
    const presentCount = Object.values(attendanceUpdates.students).filter(v => v.status == 1).length
    const absentCount = attendanceUpdates.ids.length - presentCount - unMarkedCount
    const updatesCount = attendanceUpdates.ids.length
    const hasUpdates = updatesCount > 0




    function initialSubmitHandler() {
        if (!hasUpdates) {
            setRenderWarning(true);
        } else {
            setPopup({
                visible: true,
                handler: confirmSubmitHandler,
                text: status(absentCount, presentCount)
            })
        }
    }

    async function confirmSubmitHandler() {
        console.log(attendance);
        try {
            const cmb = { classId, classGroupId, dateStr, ...attendanceUpdates }
            console.log("combined object: ", cmb)
            await attendanceMutation(cmb).unwrap()
            return navigate("/", {replace: true})
        } catch (e) {
            console.log("couldn't set attendence due to: ", e)
        }

    }

    const buttonClasses = classNames(
        "w-full",
        { "opacity-75": !hasUpdates }
    )

    return (
        <>         
            <span className="title">{"Edit Attendance"}</span> 
            <span>For {urlReadable.slice(0,-5)}</span>  
            <Popup
                text={popup.text} visible={popup.visible} confirmHandler={popup.handler}
                setVisible={(boolean) => setPopup({ ...popup, visible: boolean })} isLoading={isLoading}
            />
            <div className="flex gap-2 flex-col p-2">
                <div className="studentLayout">
                    {attendance.ids.map((id) =>
                        <Student 
                        details={{
                            ...attendance.students[id], ...attendanceUpdates.students[id],
                            edited: (attendanceUpdates.students[id] != undefined)
                        }} 
                        id={id} key={id} markStudent={markStudent} />
                    )}
                </div>

                {renderWarning &&
                    <div className="self-start bg-red-900 text-red-400 rounded-lg p-1">
                        <p>
                            Please do atleast one single update
                        </p>
                    </div>}

                <button className={buttonClasses} onClick={initialSubmitHandler}>
                    Submit
                </button>
            </div>
        </>
    );
}

function status(absentCount, presentCount) {
    // if (presentCount == 0) {
    //     return <div>You updated all students as absent</div>
    // } else if (absentCount == 0) {
    //     return <div>You updated all students as present</div>
    // } else {
        return `Updates include ${absentCount} absent students and ${presentCount} present students`
    }
// }

export default Edit