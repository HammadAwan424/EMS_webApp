import { useParams } from "react-router-dom"
import { useGetClassByIdQuery } from "src/api/apiSlice"
import { useGetAttendanceQuery } from "src/api/rtk-query/attendance"
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
    if (loadingAttendance || loadingClassData) {
        return null
    }

    if (attendance.exists) {
        return <Edit dateStr={dateStrToday} />
    } else {
        return <Set dateStr={dateStrToday} />
    }

}

export default TodayAttendanceWrapper