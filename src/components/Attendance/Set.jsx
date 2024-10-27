import classNames from "classnames"
import { useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { useGetClassByIdQuery, useSetAttendanceMutation } from "src/api/apiSlice"
import { useImmer } from "use-immer"
import { usePopup } from "../CommonUI/Popup"
import Student from "./Student"
import Apology from "../Apology/Apology"
import { getPath } from "src/api/Utility"
import { selectStudentEntitiesDaily, selectStudentIdsDaily } from "src/api/attendance"
import { produce } from "immer"


function Set({dateStr}) {
    // date represents utc +5:00 date
    // const { classId, classGroupId } = useParams()

    // const dateObj = parseDateStr(dateStr)
    // const urlReadable = dateObj.toLocaleString("en-GB", {
    //     "day": "numeric", "month": 
    //     "long", "year": "numeric", "timeZone": "UTC"
    // })

    return (
        <div className="flex flex-col gap-4">
            <span className="title-100">{"Set Attendance"}</span>
            <Main dateStr={dateStr} />
            {/* {isValid ? (
                <Main /> 
            ) : (
                // User requesting attendance for some previous day that doesn't exist
                <Apology text={`No record found for ${urlReadable}`} />
            )} */}
        </div>
    )
}


// classData will be loaded by TodayAttendanceWrapper
function Main({dateStr}) {
    const { classId, classGroupId } = useParams()
    const navigate = useNavigate()

    const { data: classData } = useGetClassByIdQuery({ classId, classGroupId })
    const [attendanceMutation, { isLoading: isMutating }] = useSetAttendanceMutation()
    const { popup } = usePopup({isLoading: isMutating})


    const [renderWarning, setRenderWarning] = useState(false)
    const location = useLocation()

    const [attendance, setAttendance] = useImmer(() => {
        const ids = selectStudentIdsDaily(classData)
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

    return (
        <>
            {hasStudents ? (
                <div className="flex gap-2 flex-col">
                    <div className="studentLayout">
                        {attendance.ids.map((id) =>
                            <Student details={attendance.students[id]} id={id} key={id} markStudent={markStudent} />
                        )}
                    </div>
                    {renderWarning &&
                        <div className="bg-red-900 text-red-400 self-start rounded-lg p-1">
                            <p>
                                Please mark all the students above
                            </p>
                        </div>}

                    <button className={buttonClasses} onClick={initialSubmitHandler}>
                        Submit
                    </button>
                </div>
            ) : (
                <Apology>
                    <span>{"It look's like you forgot to add students for this class. "}</span>
                    <Link to={getPath.class({classId, classGroupId}).edit}>{"Add them here"}</Link>
                </Apology>
            )}

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