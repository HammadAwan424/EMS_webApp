import { useParams } from "react-router-dom"
import { useGetAttendanceQuery, useGetClassByIdQuery } from "src/api/apiSlice"
import Edit from "./Edit"
import View from "./View"
import Set from "./Set"
import { getDateStr } from "src/api/Utility"


function Attendance() {

    const {classId, classGroupId, dateStr: dateStrUrl} = useParams()


    const dateStrToday = getDateStr()

 
    const {data: attendance, isLoading: loadingAttendance} = useGetAttendanceQuery({
        classId, classGroupId, dateStr: dateStrUrl 
    })

    const {isLoading} = useGetClassByIdQuery({classId, classGroupId})



    if (isLoading || loadingAttendance) {
        return null
    }

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