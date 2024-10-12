import { useParams } from "react-router-dom"
import { useGetAttendanceQuery, useGetClassByIdQuery } from "src/api/apiSlice"
import Edit from "./Edit"
import View from "./View"
import Set from "./Set"
import { getDateStr } from "src/api/Utility"


function Attendance() {

    const {classId, classGroupId, type, date: dateStrUrl} = useParams()


    const dateStrToday = getDateStr()

    const {data: attendance, isFetching: loadingAttendance} = useGetAttendanceQuery({
        classId, classGroupId, dateStr: dateStrUrl
    })
    const {data, isFetching} = useGetClassByIdQuery({classId, classGroupId})


    if (isFetching || loadingAttendance) {
        return <h1>Loading please wait a second</h1>
    }

    console.log("attendance is : ", attendance)
    const dateStrDoc = attendance.exists ? attendance.createdAt : "00000000"
    const isTodayDoc = dateStrDoc == dateStrToday
    const isTodayUrl = dateStrUrl == dateStrToday 

    console.log(dateStrToday, dateStrDoc, dateStrUrl)

    if (attendance.exists) {
        if (isTodayDoc) {
            return <Edit />
        } else {
            // type == view || edit, then edit or view but for now, it just supports viewing previous documents
            return <View />
        }
    } else {
        return <Set isValid={isTodayUrl}/>
    }
}


export default Attendance