import { useGetAuthQuery, useGetClassGroupsQuery, useGetUserQuery } from "src/api/apiSlice"
import { skipToken } from "@reduxjs/toolkit/query"
import { IconArrowBadgeDownFilled, IconArrowBadgeRightFilled } from "@tabler/icons-react"
import { useState } from "react"
import { Link, Form, useFetcher } from "react-router-dom"
import { createClassGroupLink } from "src/api/Utility"
import { Teacher } from "src/api/classGroups"
import { useSelector } from "react-redux"
import { getAllClassIds } from "src/features/user/userSlice"

export default function Sidebar({myRef}) {

    const [classExpanded, setClassExpanded] = useState(false)
    const [groupExpanded, setGroupExpanded] = useState(false)
    const { data: Auth } = useGetAuthQuery()
    const { data: User } = useGetUserQuery(Auth ? Auth.uid : skipToken)
    const { data: classGroups } = useGetClassGroupsQuery(Auth ? Auth.uid : skipToken)

    return (
        <div ref={myRef} id="sidebar" className="fixed overflow-auto top-0 transition z-50 bg-[--theme-primary] sm:bg-[--theme-secondary]
          left-0 bottom-0 flex flex-col gap-2 px-8 md:px-4 py-10 max-sm:-translate-x-full max-sm:w-[calc(100vw-80px)] sm:w-48 md:w-60">
            <span className="font-semibold text-lg">Hello {Auth ? Auth.email : "Stranger"}</span>
            
            {/* <Link to={createClassGroupLink()}>Create</Link> */}
            {Auth ? (
                <Form action="/signout" method="post">
                    <button>Sign out</button>
                </Form>
            ) : <Link to="/login"><button>Sign in</button></Link>}

            <hr />
            {Auth && (
                <>
                <div className="self-stretch flex flex-col border-[--text-disabled]">
                    <div className="flex justify-start items-center select-none" onClick={() => setClassExpanded(!classExpanded)}>
                        {classExpanded ? <IconArrowBadgeDownFilled /> : <IconArrowBadgeRightFilled />}
                        <h2 className="font-medium">Classes</h2>
                    </div>
                    {classExpanded && (
                        <div className="pl-2 flex flex-col text-[--text-secondary-col]">
                            {Teacher.hasClasses(User) ? (
                                Teacher.getClassIdArray(User).map(id =>
                                    <Link key={id} to="/">{User.classes[id].className}</Link>
                                )
                            ) : (
                                <div className="text-sm">You don't have any classes :(</div>
                            )}
                        </div>
                    )}
                </div>
                <hr />
                </>
            )}

            
            {Auth && (
                <>
                <div className="self-stretch flex flex-col border-[--text-disabled]">
                    <div className="flex justify-start items-center select-none" onClick={() => setGroupExpanded(!groupExpanded)}>
                        {classExpanded ? <IconArrowBadgeDownFilled /> : <IconArrowBadgeRightFilled />}
                        <h2 className="font-medium">ClassGroups</h2>
                    </div>
                    {groupExpanded && (
                        <div className="pl-2 flex flex-col text-[--text-secondary-col]">
                            {Teacher.hasClassGroups(classGroups) ? (
                                classGroups.map(documentData => (
                                    <Link key={documentData.id} to={`/classgroup/${documentData.id}`}>{documentData.classGroupName}</Link>
                                ))
            
                            ) : (
                                <div className="text-sm">You don't have any classGroups :(</div>
                            )}
                        </div>
                    )}
                </div>
                <hr />
                </>
            )}
            
            {Auth && <Invitations User={User} />}
        </div>
    )
}



function Invitations({ User }) {

    const [expanded, setExpanded] = useState(false)
    const allClassIds = useSelector(getAllClassIds)

    const hasInvitations = allClassIds.new.some(id => User.invitations[id].status == true)


    return (
        <div className="self-stretch flex flex-col">
            <div className="flex justify-start items-center select-none" onClick={() => setExpanded(!expanded)}>
                {expanded ? <IconArrowBadgeDownFilled /> : <IconArrowBadgeRightFilled />}
                <h2 className="font-medium">Invitations</h2>
            </div>
            <div className="flex flex-col gap-2 pl-2 text-[--text-secondary-col]">
                {expanded && (
                    hasInvitations ? (
                        allClassIds.new.map((classId) =>
                            // TODO: Show notification for invitations that are taken back
                            User.invitations[classId].status == true && (
                            <div className="" key={Teacher.getInvitationId(classId, User.invitations)}>
                                <div className="flex-col bg-[--theme-tertiary] rounded-md p-2 gap-1 flex">
                                    <span>{User.invitations[classId].email} has invited you to {User.invitations[classId].className}</span>
                                    <InvitationForm invitationId={classId} />
                                </div>
                            </div>)
                        )

                    ) : <div className="text-sm">{"No invitaions for now :)"}</div>

                )}
            </div>

        </div>

    )
}



function InvitationForm({ invitationId }) {

    const acceptFetcher = useFetcher()
    const rejectFetcher = useFetcher()
    const {data: Auth} = useGetAuthQuery()
    const {data: User} = useGetUserQuery(Auth.uid)
    const toSubmit = {id: invitationId, ...User.invitations[invitationId]}

    function acceptInvitation() {
        acceptFetcher.submit(toSubmit, { action: "/invitations/accept", method: "post", encType: "application/json" })
    }

    function rejectInvitation() {
        rejectFetcher.submit(toSubmit, { action: "/invitations/reject", method: "post", encType: "application/json" })
    }


    return (
        < div className="flex gap-2" >
            <button className="px-2 py-1 rounded-2xl bg-red-800" onClick={rejectInvitation}>Cancel</button>
            <button className="px-2 py-1 rounded-2xl bg-green-800" onClick={acceptInvitation}>Accept</button>
        </div >
    )
}
