import classNames from "classnames"
import { useState } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { useGetClassByIdQuery } from "src/api/apiSlice"
import { useGetAttendanceQuery, useUpdateAttendanceMutation } from "src/api/rtk-query/attendance"
import { useImmer } from "use-immer"
import { usePopup } from "../CommonUI/Popup"
import Student from "./Student"
import dot from "dot-object"
import { getPath } from "src/api/Utility"
import { selectStudentEntitiesDaily, selectStudentIdsDaily } from "src/api/rtk-helpers/attendance"
import { HeaderForEditViewAttendance, PercentageBar } from "./Common"
import Alert from "../CommonUI/Alert"

// todayAttendance and classData will be loaded by TodayAttendanceWrapper
function Edit({dateStr}) {
    const { classId, classGroupId} = useParams()
    const navigate = useNavigate()

    const {data: todayAttendance} = useGetAttendanceQuery({classId, classGroupId, dateStr})
    const {data: classData} = useGetClassByIdQuery({classId, classGroupId}) 
    const [attendanceMutation, { isLoading: isMutating }] = useUpdateAttendanceMutation()
    const { popup, close } = usePopup({ isLoading: isMutating })
    const location = useLocation()

    const [renderWarning, setRenderWarning] = useState(false)

    const [attendanceUpdates, setUpdates] = useImmer({students: {}, ids: []})

    const attendance = {
        students: selectStudentEntitiesDaily(todayAttendance),
        ids: selectStudentIdsDaily(todayAttendance)
    }

    const headerProp = {
        className: classData.className,
        editedBy: todayAttendance.editedBy,
        lastEdited: todayAttendance.lastEdited 
    }


    const getCurrentStatus = id => attendanceUpdates.students[id]?.status ?? attendance.students[id].status

    const markStudent = (status, id) => {
        setUpdates(draft => {
            if (getCurrentStatus(id) != status) { // Prevents Clicking on already marked icon (either check or cross)
                if (attendance.students[id].status == status) {
                    const index = draft.ids.findIndex(entryId => entryId == id)
                    draft.ids.splice(index, 1)
                    delete draft.students[id]
                }
                else {
                    draft.ids.push(id)
                    const name = `students.${id}.status`
                    dot.str(name, status, draft)
                }
            }
        })
    }

    const presentCount = Object.values(attendance.students).filter(v => v.status == 1).length
    const totalCount = attendance.ids.length
    const presentCountInUpdates = Object.values(attendanceUpdates.students).filter(v => v.status == 1).length
    const absentCountInUpdates = attendanceUpdates.ids.length - presentCountInUpdates
    const updatesCount = attendanceUpdates.ids.length
    const hasUpdates = updatesCount > 0



    function initialSubmitHandler() {
        if (!hasUpdates) {
            setRenderWarning(true);
        } else {
            popup({
                handler: confirmSubmitHandler,
                text: status(absentCountInUpdates, presentCountInUpdates)
            })
        }
    }

    async function confirmSubmitHandler() {
        console.log(attendance);
        try {   
            const cmb = { classId, classGroupId, dateStr, ...attendanceUpdates }
            await attendanceMutation(cmb).unwrap()
            return navigate(location.state || getPath.attendance({classId, classGroupId}).view({dateStr}))
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
            <span className="title-100">{"Edit Attendance"}</span> 
            <HeaderForEditViewAttendance attendanceDoc={headerProp} dateStr={dateStr} />
            <PercentageBar 
                presentCount={presentCount+presentCountInUpdates-absentCountInUpdates} 
                totalCount={totalCount} />
                
            <div className="flex gap-2 flex-col">
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

                <Alert 
                    show={renderWarning} 
                    setter={setRenderWarning} 
                    text="Please do atleast one single update"
                    type="warning" 
                />

                <button className={buttonClasses} onClick={initialSubmitHandler}>
                    Submit
                </button>
            </div>
        </>
    );
}

function status(absentCountInUpdates, presentCountInUpdates) {
    // if (presentCountInUpdates == 0) {
    //     return <div>You updated all students as absent</div>
    // } else if (absentCountInUpdates == 0) {
    //     return <div>You updated all students as present</div>
    // } else {
        return `Updates include ${absentCountInUpdates} absent students and ${presentCountInUpdates} present students`
    }
// }

export default Edit