import classNames from "classnames"
import { useState, useRef, useEffect } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { useGetClassByIdQuery, useSetAttendanceMutation } from "src/api/apiSlice"
import { useImmer } from "use-immer"
import Popup from "../CommonUI/Popup"
import Student from "./Student"
import Apology from "../Apology/Apology"
import { parseDateStr } from "src/api/Utility"
import { selectStudentsEntities, selectStudentsIds } from "../Class/ClassEdit"
import { produce } from "immer"


function Set({isValid}) {
    // date represents utc +5:00 date
    const {date: dateStr} = useParams()
    const dateObj = parseDateStr(dateStr)
    const urlReadable = dateObj.toLocaleString("en-GB", {
        "day": "numeric", "month": 
        "long", "year": "numeric", "timeZone": "UTC"
    })

    return (
        <>
        <span className="title-100">{"Set Attendance"}</span>
        <span>For {urlReadable.slice(0,-5)}</span>
        {isValid ? (
            <Main /> 
        ) : (
            // User requesting attendance for some previous day that doesn't exist
            <Apology text={`No record found for ${urlReadable}`} />
        )}
        </>
    )
}

function Main() {
    const { classId, classGroupId, date: dateStr } = useParams()
    const navigate = useNavigate()

    const { data: classData, isFetching } = useGetClassByIdQuery({ classId, classGroupId })
    const [attendanceMutation, { isLoading }] = useSetAttendanceMutation()

    const [renderWarning, setRenderWarning] = useState(false)
    const dialogRef = useRef(null);
    const location = useLocation()

    const [attendance, setAttendance] = useImmer(() => {
        const ids = selectStudentsIds(classData)
        const students = produce(selectStudentsEntities(classData), draft => {
            ids.forEach(id => draft[id].status = 0)
        })
        return {students, ids}
    })
    console.log("INSIDE SET MAIN: ", isLoading)

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
            await attendanceMutation(cmb).unwrap()
            return navigate(location.state || "/")
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

            
            {hasStudents ? (
                <div className="flex gap-2 flex-col p-2">
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
                    <Link to={`/classgroup/${classGroupId}`}>{"Add them here"}</Link>
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