import { useGetAuthQuery, useGetUserQuery } from "src/api/apiSlice"
import { AttendanceCardsList } from "../Attendance/AttendanceCard"
import Apology from "../Apology/Apology"
import DetailedClass from "./DetailedClass"

function ClassView({id}) {
    
    const {data: Auth} = useGetAuthQuery()
    const {data: User} = useGetUserQuery(Auth.uid)
    console.log("RECEIVED VALUE: ", id)

    return (
        <>
        {
            id == "all" ? <AttendanceCardsList />
                : id == "noclass" ? <Apology text={`You don't have any classes for now. 
                    Classes that you join will appear here.`} /> 
                : <DetailedClass classId={id} classGroupId={User.invitations[id].classGroupId} />
        }
        </>
    )
}

export default ClassView