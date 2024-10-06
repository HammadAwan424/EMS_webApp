import { useSelector } from "react-redux"
import { useAcceptInvitationMutation, useClearNotificationsMutation, useGetAuthQuery, useGetUserQuery, useRejectInvitationMutation } from "src/api/apiSlice.js"
import { getAllClassIds } from "src/api/userSlice"
import Button from "../CommonUI/Button.jsx"
import { useNavigate } from "react-router-dom"
import { classInvitationSelector } from "src/api/invitation.js"

// Deals with inactive classes, newInvitations (both with status == true || false)
function Notifications() {
    const allClassIds = useSelector(getAllClassIds)
    console.log("ALL CLASS IDS INSIDE: ", allClassIds)
    const {data: Auth} = useGetAuthQuery()
    const {data: User} = useGetUserQuery(Auth.uid)

    const {
        acceptedRevoked, rejectedRevoked, 
        invitationsAllowed, invitationsRevoked
    } = classInvitationSelector(User)

    // Clear all -> clear rejectedRevoked (both), acceptedRevoked (both), inactiveInvitations (single)
    // just send array of ids
    const [clearAll, {isLoading}] = useClearNotificationsMutation()

    const showClearAll = acceptedRevoked.length > 0 || invitationsRevoked.length > 0

    return (
        <div className="p-2 gap-2 flex flex-col">
            <div className="flex justify-between items-center p-2">
                <span className="title">Notifications</span>
                {showClearAll && 
                    <span 
                        onClick={() => {clearAll([...acceptedRevoked, ...rejectedRevoked, ...invitationsRevoked])}} 
                        className="cursor-pointer"
                    >Clear All
                    </span>
                }
            </div>
            
            {invitationsAllowed.map((id) => 
                <Invitation id={id} key={id} className={User.invitations[id].className} email={User.invitations[id].email} acceptable />
            )}
            
            {invitationsRevoked.map((id) => 
                <Invitation id={id} key={id} className={User.invitations[id].className} email={User.invitations[id].email} />
            )}
            
            {acceptedRevoked.map(id => (
                <div key={id} className="p-4 flex bg-[--theme-secondary] rounded-md items-center gap-2">
                    <span>You have been removed from the class {User.invitations[id].className} by {User.invitations[id].email}</span>
                </div>  
            ))}
        </div>
        
    )
}

function Invitation({id, className, email, acceptable=false}) {
    
    const [accept, {isLoading: accepting}] = useAcceptInvitationMutation()
    const [reject, {isLoading: rejecting}] = useRejectInvitationMutation()

    return (
        <div className="p-4 flex bg-[--theme-secondary] rounded-md items-center gap-2">
            <span>{email} {acceptable ? "has" : "had"} invited you to their class {className}</span>
            <div className="flex-1"></div>
            {acceptable && (
                <>
                    <Button className="px-3 py-1" onClick={() => accept(id)}
                        text={{idleText: "Accept"}} states={{isLoading: accepting}}
                    ></Button>
                    <Button className="px-3 py-1" onClick={() => reject(id)}
                        text={{idleText: "Reject"}} states={{isLoading: rejecting}}
                    ></Button>
                </>
            )}

        </div>
    )
}



export default Notifications