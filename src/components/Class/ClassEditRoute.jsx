import { useLocation, useParams } from "react-router-dom"
import ClassEdit from "./ClassEdit"
import { useGetAuthQuery, useGetClassByIdQuery, useGetUserQuery } from "src/api/apiSlice"
import { useGetClassGroup } from "../Index/ClassGroups"
import { skipToken } from "@reduxjs/toolkit/query"
import { joinedClass } from "src/api/Utility"

function ClassEditRoute() {
    const {classId, classGroupId} = useParams()

    const {data: Auth} = useGetAuthQuery()
    const {data: User} = useGetUserQuery(Auth.uid)
    // check whether the classId is in joined class list
    const {search} = useLocation()
    const isJoined = joinedClass(search)
    // if joined, then copy data from invitations else mark as admin (if not joined -> then admin)
    const admin = isJoined ? User.invitations[classId] : false

    
    const {data: classData, isLoading} = useGetClassByIdQuery({classId, classGroupId})
    const {classGroup} = useGetClassGroup(
        isJoined ? skipToken : {userId: Auth.uid, classGroupId}
    )

    if (isLoading) {
        return null
    }

    const { className } = classData

    // null because the user itself is the assignedTeacher in case of isJoined
    const sampleData = {
        ...classData,
        assignedTeacher: isJoined ? null :  classGroup.classes[classId].assignedTeacher
    }

    return (
        <div className="flex flex-col gap-4">
            <span className="title-100">Class {className}</span>
            <ClassEdit classId={classId} classGroupId={classGroupId} sampleData={sampleData} isJoined={admin} />
        </div>
    )
}

export default ClassEditRoute