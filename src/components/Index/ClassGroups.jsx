import { createSelector } from "@reduxjs/toolkit"
import {  IconMenu2  } from "src/IconsReexported.jsx"
import { firestore } from "src/firebase/config"
import { deleteDoc, doc } from "firebase/firestore"
import { useState, useRef } from "react"
import { Link } from "react-router-dom"
import { useGetAuthQuery, useGetClassGroupsQuery } from "src/api/apiSlice"
import { Teacher } from "src/api/Teacher"
import Alert from "../CommonUI/Alert"
import { Class } from "./Classes"
import { skipToken } from "@reduxjs/toolkit/query"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../shadcn/Dropdown"
import Apology from "../Apology/Apology"

// Currently not used anywhere
function ClassGroups({id}) {
    const {data: Auth} = useGetAuthQuery()
    const {data: classGroups } = useGetClassGroupsQuery(Auth.uid)

    return(
        Teacher.hasClassGroups(classGroups) ? (
            classGroups.map((documentData) => {
                return (
                    <ClassGroup classGroupId={documentData.id} key={documentData.id}></ClassGroup>
                )
            })
        ) : (
            <div>{"You don't have any classGroups"}</div>
        )

    )
}

const selectClassGroup = createSelector(
    (classGroups) => classGroups,
    (classGroups, id) => id,
    (classGroups, id) => classGroups.find(group => group.id == id)
)

const useGetClassGroup = (queryArg) => {
    const isSkipToken = queryArg == skipToken
    const queryResult = useGetClassGroupsQuery(isSkipToken ? queryArg : queryArg.userId, {
        selectFromResult(result) {
            const data = result.data // always available
            return {
                ...result, 
                classGroup: isSkipToken ? {} : selectClassGroup(data, queryArg.classGroupId)
            }
        }
    })
    return queryResult
}


function ClassGroup({id: classGroupId}) {
    const [dropdown, setDropdown] = useState(false)
    const classGroupRef = useRef(null)
    const [exists, setExists] = useState(true)
    const [sensitive, showSensitive] = useState(false)
    const {data: Auth} = useGetAuthQuery()

    const result = useGetClassGroup({userId: Auth.uid, classGroupId})
    const {classGroup} = result

    const hasClasses = Object.keys(classGroup.classes).length > 0

    async function handleDelete() {
        const display = classGroupRef.current.style.display
        classGroupRef.current.style.display = "none"
        deleteDoc(doc(firestore, 'classGroups', classGroupRef.current.dataset.id))
        .then(() => setExists(false))
        .catch((reason) => {
            classGroupRef.current.style.display = display
            alert(reason)
        })
    }

    if (!exists) return null

    return (
        <>
        <div className="CLASSGROUP flex flex-col gap-2 rounded-md" ref={classGroupRef} data-id={classGroupId}>
            <div className="flex items-center gap-2 relative">
                <h2 className="title-200">{classGroup.classGroupName}</h2>
                <div className="flex-auto"></div>
                
                <DropdownMenu open={dropdown} onOpenChange={setDropdown}>
                    <DropdownMenuTrigger asChild>
                        <IconMenu2/>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem>
                            <Link className="noLink w-full" to={`classgroup/${classGroupId}`}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>Close</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {hasClasses ? (
                <div className="CLASSGROUP-SECTION_CONTAINER classGrid">
                    {Object.keys(classGroup.classes).map(classId =>
                        <Class classGroupId={classGroupId} classId={classId} key={classId} />
                    )}
                </div>
            ) : (
                <Apology>
                    <span>{"It look's like you forgot to classes for this group. "}</span>
                    <Link to={`/classgroup/${classGroupId}`}>{"Add them here"}</Link>
                </Apology>
            )}

            
            {sensitive &&
                <div id="DeleteConfirmation" className='z-10 fixed inset-0 bg-opacity-60 bg-black flex items-center justify-center'>
                    <div className="text-white bg-neutral-800 w-full sm:w-80 p-5 border-stone-900 ">
                        <Alert show={true} text="This will delete all stats related to this group, are you sure?" type="warning" />
                        <div className="py-2"></div>
                        <div className="flex justify-around">
                            <button onClick={() => showSensitive(false)} className="self-start">Go back</button>
                            <button onClick={handleDelete} className="bg-red-600 hover:border-orange-800">Delete</button>
                        </div>
                    </div>
                </div>}
        </div>
        {hasClasses && <hr className="w-1/2 mx-auto my-4" />}
        </>
    )

}

export default ClassGroups
export { ClassGroup, useGetClassGroup }