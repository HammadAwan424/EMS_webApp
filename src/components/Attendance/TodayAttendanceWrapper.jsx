import { useParams } from "react-router-dom"
import { useGetAttendanceQuery, useGetClassByIdQuery } from "src/api/apiSlice"
import { getDateStr } from "src/api/Utility"
import Set from "./Set"
import Edit from "./Edit"

function TodayAttendanceWrapper() {
    const {classId, classGroupId} = useParams()
    const dateStrToday = getDateStr()

    const {data: attendance, isLoading: loadingAttendance} = useGetAttendanceQuery({
        classId, classGroupId, dateStr: dateStrToday 
    })
    const { isLoading: loadingClassData } = useGetClassByIdQuery({classId, classGroupId})

    // Waiting here so child comp doesn't have to do also
    // but Set still has a wrapper that waits for query to get loaded -> TODO
    if (loadingAttendance || loadingClassData) {
        return null
    }

    console.log("ATTENDANCE: ", attendance)

    if (attendance.exists) {
        return <Edit dateStr={dateStrToday} />
    } else {
        return <Set dateStr={dateStrToday} />
    }

}

export default TodayAttendanceWrapper