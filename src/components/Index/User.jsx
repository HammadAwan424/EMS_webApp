
import { getAllClassesStatus } from "src/api/rtk-helpers/invitation.js"
import DashBoard from "./Dashboard.jsx"
import NewUser from "./NewUser.jsx"
import { useGetAuthQuery, useGetClassGroupsQuery, useGetUserQuery } from "src/api/apiSlice.js"
import { Teacher } from "src/api/Teacher.js"


function User() {

    const { data: Auth } = useGetAuthQuery()
    const { data: User } = useGetUserQuery(Auth.uid)
    const { data: classGroups } = useGetClassGroupsQuery(Auth.uid)


    const hasClassGroups = Teacher.hasClassGroups(classGroups)
    const {acceptedAllowed} = getAllClassesStatus(User)
    const hasClasses = acceptedAllowed.length > 0


    
    return (
        <>
            {
                hasClasses || hasClassGroups ? <DashBoard />
                    : <NewUser />
            }
        </>
    )

    
}



export default User

