import { Link, useParams } from "react-router-dom"
import { useGetAttendanceQuery, useGetClassByIdQuery } from "src/api/apiSlice"
import Edit from "./Edit"
import View from "./View"
import Set from "./Set"
import { getDateStr } from "src/api/Utility"


function Attendance() {

    const {classId, classGroupId, type, date} = useParams()


    const dateFromUrl = new Date(date)
    const dateStr = getDateStr({dateObj: dateFromUrl, hyphenated: true})
    const todayDate = new Date()
    todayDate.setUTCHours(0, 0, 0, 0)

    console.log("date str is: ", dateStr)

    const {data: attendance, isFetching: loadingAttendance} = useGetAttendanceQuery({classId, classGroupId, dateStr})
    const {data, isFetching} = useGetClassByIdQuery({classId, classGroupId})


    if (isFetching || loadingAttendance) {
        return <h1>Loading please wait a second</h1>
    }

    console.log("attendance is : ", attendance)

    const dateFromDoc = new Date(attendance.exists ? attendance.createdAt.seconds * 1000 : 0)
    const todayDoc = dateFromDoc.getTime() == todayDate.getTime()
    const todayUrl = dateFromUrl.getTime() == todayDate.getTime()

    if (attendance.exists) {
        if (todayDoc) {
            return <Edit />
        } else {
            // type == view || edit, then edit or view but for now, it just supports viewing previous documents
            return <View />
        }
    } else {
        if (todayUrl) {
            return <Set />
        } else {
            return <Apology />
        }
        
    }
}

export function Apology() {
    return (
        <h1>There is no data for this class, edit it at <Link to="/">ClassEdit</Link></h1>
    )
}

export default Attendance