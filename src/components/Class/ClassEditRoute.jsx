import { useParams } from "react-router-dom"
import ClassEdit from "./ClassEdit"
import { useGetAuthQuery, useGetClassByIdQuery, useGetUserQuery } from "src/api/apiSlice"
import { classInvitationSelector } from "src/api/invitation"
import { useGetClassGroup } from "../Index/ClassGroups"
import { skipToken } from "@reduxjs/toolkit/query"

function ClassEditRoute() {
    const {classId, classGroupId} = useParams()

    const {data: Auth} = useGetAuthQuery()
    const {data: User} = useGetUserQuery(Auth.uid)
    const { acceptedAllowed } = classInvitationSelector(User)
    const isJoined = acceptedAllowed.includes(classId)
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