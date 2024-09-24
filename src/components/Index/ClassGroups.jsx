import { createSelector } from "@reduxjs/toolkit"
import { IconMenu2 } from "@tabler/icons-react"
import { firestore } from "src/firebase/config"
import { deleteDoc, doc } from "firebase/firestore"
import { useState, useRef } from "react"
import { Link } from "react-router-dom"
import { useGetAuthQuery, useGetClassGroupsQuery } from "src/api/apiSlice"
import { Teacher } from "src/api/classGroups"
import Alert from "../CommonUI/Alert"
import { Class } from "./Classes"

function ClassGroups() {
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
            <div>You don't have any classGroups</div>
        )

    )
}

const selectClassGroup = createSelector(
    (classGroups) => classGroups,
    (classGroups, id) => id,
    (classGroups, id) => classGroups.find(group => group.id == id)
)


function ClassGroup({classGroupId}) {
    const [dropdown, setDropdown] = useState(false)
    const classGroupRef = useRef(null)
    const [exists, setExists] = useState(true)
    const [sensitive, showSensitive] = useState(false)
    const {data: Auth} = useGetAuthQuery()

    const {classGroup} = useGetClassGroupsQuery(Auth.uid, {
        selectFromResult(result) {
            const data = result.data ?? {}
            return {
                ...result, 
                classGroup: selectClassGroup(data, classGroupId)
            }
        }
    })



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
        <div className="CLASSGROUP flex flex-col gap-4 bg-[--theme-secondary] rounded-md p-4" ref={classGroupRef} data-id={classGroupId}>
            <div className="flex items-center gap-2 relative">
                <h2 className="font-semibold text-2xl">{classGroup.classGroupName}</h2>
                <div className="flex-auto"></div>
                <IconMenu2 onClick={() => setDropdown(true)} className="cursor-pointer" />
                    {dropdown && (
                        <div id="Dropdown" className="absolute bg-slate-600 cursor-pointer min-w-20 rounded-md select-none top-6 right-6" onClick={() => setDropdown(false)}>
                            <div className="border-b p-2"><Link className="text-inherit hover:text-inherit" to={`classgroup/${classGroupId}`}>Edit</Link></div>
                            <div className="border-b p-2" onClick={() => showSensitive(true)}>Delete</div>
                            <div className="p-2">Close</div>
                        </div>
                    )}
            </div>

            <div className="CLASSGROUP-CLASSES grid overflow-hidden gap-3 grid-cols-2 auto-rows-[minmax(200px,auto)]  lg:auto-rows-[minmax(250px,auto)]">
                {Teacher.hasClasses(classGroup) ? (
                    Teacher.getClassIdArray(classGroup).map(classId => 
                        <Class classGroupId={classGroupId} classId={classId} key={classId} />
                    )
                ) : (
                    <div>This class Group is empty</div>
                )}
            </div>
            
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
        <hr className="w-1/2 mx-auto my-4" />
        </>
    )

}

export default ClassGroups