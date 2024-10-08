import { useGetAuthQuery, useGetClassGroupsQuery, useGetUserQuery } from "src/api/apiSlice"
import { skipToken } from "@reduxjs/toolkit/query"
import { IconArrowBadgeDownFilled, IconArrowBadgeRightFilled, IconHome, IconHome2, IconNotification } from "@tabler/icons-react"
import { useState } from "react"
import { Link, Form, useFetcher, useNavigate } from "react-router-dom"
import { createClassGroupLink } from "src/api/Utility"
import { Teacher } from "src/api/Teacher"
import { useSelector } from "react-redux"
import { getAllClassIds } from "src/api/userSlice"
import { Notification } from "../CommonUI/Icons"
import { classInvitationSelector } from "src/api/invitation"

export default function Sidebar({myRef}) {

    const [classExpanded, setClassExpanded] = useState(false)
    const [groupExpanded, setGroupExpanded] = useState(false)
    const { data: Auth } = useGetAuthQuery()
    const { data: User } = useGetUserQuery(Auth ? Auth.uid : skipToken)
    const { data: classGroups } = useGetClassGroupsQuery(Auth ? Auth.uid : skipToken)
    const navigate = useNavigate()

    // Either some invitations was sent (maybe removed now) or access from some class is revoked
    const {
        acceptedRevoked, invitationsAllowed, invitationsRevoked
    } = classInvitationSelector(User)
    const hasNotifications = acceptedRevoked.length > 0 || invitationsRevoked.length > 0 || invitationsAllowed.length > 0


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
                                <div className="text-sm">{"You don't have any classes :("}</div>
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
                                <div className="text-sm">{"You don't have any classGroups :("}</div>
                            )}
                        </div>
                    )}
                </div>
                <hr />
                </>
            )}
            
            {/* {Auth && <Invitations User={User} />} */}

            <div className="flex items-center" onClick={() => navigate("/")}>
                <IconHome/>    
                <span>Home</span>
            </div>

            <div className="flex items-center" onClick={() => navigate("/notifications")}>
                <IconNotification/>    
                <span>Notifications</span>
                {hasNotifications && (
                    <div className="w-3 ml-1 h-3 relative self-start">
                        <div className="absolute rounded-full inset-0 bg-blue-500"></div>
                        <div className="absolute rounded-full inset-0 bg-blue-500 animate-ping"></div>
                    </div>
                )}
       
            </div>
        </div>
    )
}
