import classNames from "classnames"
import { useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { useGetClassByIdQuery } from "src/api/rtk-query/class"
import { useSetAttendanceMutation } from "src/api/rtk-query/attendance"
import { useImmer } from "use-immer"
import { usePopup } from "../CommonUI/Popup"
import Student from "./Student"
import Apology from "../Apology/Apology"
import { getPath, joinedClass } from "src/api/Utility"
import { selectStudentEntitiesDaily, selectStudentIdsDaily } from "src/api/rtk-helpers/attendance"
import { produce } from "immer"
import Alert from "../CommonUI/Alert"
import { states } from "./Common"


// classData will be loaded by TodayAttendanceWrapper
function Set({dateStr}) {
    const { classId, classGroupId } = useParams()
    const navigate = useNavigate()
    const {search} = useLocation()
    const isJoined = joinedClass(search)

    const { data: classData } = useGetClassByIdQuery({ classId, classGroupId })
    const [attendanceMutation, { isLoading: isMutating }] = useSetAttendanceMutation()
    const { popup } = usePopup({isLoading: isMutating})


    const [renderWarning, setRenderWarning] = useState(false)
    const location = useLocation()

    const [attendance, setAttendance] = useImmer(() => {
        const ids = selectStudentIdsDaily(classData)
        // set each entity status = 0 as unmarked initially
        const students = produce(selectStudentEntitiesDaily(classData), draft => {
            ids.forEach(id => draft[id].status = 0)
        })
        return {students, ids}
    })

    const markStudent = (status, id) => {
        setAttendance(draft => {
            draft.students[id].status = status
        })
    }

    const hasStudents = attendance.ids.length > 0
    const unMarkedCount = Object.values(attendance.students).filter(v => v.status == 0).length
    const presentCount = Object.values(attendance.students).filter(v => v.status == 1).length
    const absentCount = attendance.ids.length - presentCount - unMarkedCount
    const isUnMarked = unMarkedCount > 0



    function initialSubmitHandler() {
        if (isUnMarked) {
            setRenderWarning(true);
        } else {
            popup({
                handler: confirmSubmitHandler,
                text: status(absentCount)
            })
        }
    }

    async function confirmSubmitHandler() {
        console.log(attendance);
        try {
            const cmb = { classId, classGroupId, dateStr, ...attendance }
            await attendanceMutation(cmb).unwrap()
            return navigate(location.state || getPath.attendance({classId, classGroupId}).view({dateStr}))
        } catch (e) {
            console.log("couldn't set attendence due to: ", e)
        }

    }

    const buttonClasses = classNames(
        "w-full",
        { "opacity-75": isUnMarked }
    )

    const setAllPresent = () => {
        selectStudentIdsDaily(classData).forEach((id) => markStudent(states.present, id))
    }

    console.log(attendance)

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
            <span className="title-100">{"Set Attendance"}</span>
            {hasStudents && (
                <button className="bg-theme-100 text-sm" onClick={setAllPresent}>All present</button>
            )}
            </div>
            {hasStudents ? (
                <div className="flex gap-2 flex-col">
                    <div className="studentLayout">
                        {attendance.ids.map((id) =>
                            <Student details={attendance.students[id]} id={id} key={id} markStudent={markStudent} />
                        )}
                    </div>

                    <Alert
                        show={renderWarning}
                        setter={setRenderWarning}
                        text="Please mark all the students above"
                        type="warning"
                    />
                    <button className={buttonClasses} onClick={initialSubmitHandler}>
                        Submit
                    </button>
                </div>
            ) : (
                <Apology>
                    <span>{"It look's like you forgot to add students for this class. "}</span>
                <Link to={getPath.class({classId, classGroupId, isJoined}).edit}>{"Add them here"}</Link>
                </Apology>
            )}

        </div>
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