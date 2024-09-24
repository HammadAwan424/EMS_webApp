import classNames from "classnames"
import { useState, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useGetAttendanceQuery, useGetClassByIdQuery, useSetAttendanceMutation } from "src/api/apiSlice"
import { useImmer } from "use-immer"
import Popup from "../CommonUI/Popup"
import Student from "./Student"

function Set() {

    const { classId, classGroupId, date: dateStr } = useParams()
    const navigate = useNavigate()

    const { data: classData, isFetching } = useGetClassByIdQuery({ classId, classGroupId })
    const [attendanceMutation, { isLoading }] = useSetAttendanceMutation()
    const allStudents = classData.students

    const [renderWarning, setRenderWarning] = useState(false)
    const dialogRef = useRef(null);

    const [attendance, setAttendance] = useImmer(() => {
        const students = {}
        const ids = []
        for (let [id, student] of Object.entries(allStudents)) {
            students[id] = { studentName: student.studentName, rollNo: student.rollNo, status: -1 }
            ids.push(id)
        }
        const initialState = { students, ids }
        return initialState
    })

    const markStudent = (status, id) => {
        setAttendance(draft => {
            draft.students[id].status = status
        })
    }


    const unMarkedCount = Object.values(attendance.students).filter(v => v.status == -1).length
    const presentCount = Object.values(attendance.students).filter(v => v.status == 1).length
    const absentCount = attendance.ids.length - presentCount - unMarkedCount
    const isUnMarked = unMarkedCount > 0

    const [popup, setPopup] = useState({
        text: "",
        handler: () => {},
        visible: false,
    })




    function initialSubmitHandler() {
        if (isUnMarked) {
            setRenderWarning(true);
        } else {
            setPopup({
                visible: true,
                handler: confirmSubmitHandler,
                text: status(absentCount)
            })
        }
    }

    async function confirmSubmitHandler() {
        console.log(attendance);
        try {
            const cmb = { classId, classGroupId, dateStr, ...attendance }
            console.log("combined object: ", cmb)
            await attendanceMutation(cmb).unwrap()
            return navigate("/", {replace: true})
        } catch (e) {
            console.log("couldn't set attendence due to: ", e)
        }

    }

    const buttonClasses = classNames(
        "w-full",
        { "opacity-75": isUnMarked }
    )

    return (
        <>
            <Popup
                text={popup.text} visible={popup.visible} confirmHandler={popup.handler}
                setVisible={(boolean) => setPopup({ ...popup, visible: boolean })} isLoading={isLoading}
            />

            <div className="flex items-center gap-2 flex-col sm:w-[--student-width-for-desktop] p-2">
                {attendance.ids.map((id) =>
                    <Student details={attendance.students[id]} id={id} key={id} markStudent={markStudent} />
                )}
                {renderWarning &&
                    <div className="w-full bg-red-900 text-red-400 rounded-lg p-1">
                        <p>
                            Please mark all the students above
                        </p>
                    </div>}

                <button className={buttonClasses} onClick={initialSubmitHandler}>
                    Submit
                </button>
            </div>
        </>
    );
}

function status(absentCount) {
    switch (absentCount) {
        case 0:
            return "No student is absent";
        case 1:
            return "1 student is absent";
        default:
            return `${absentCount} students are absent`;
    }
}

export default Set