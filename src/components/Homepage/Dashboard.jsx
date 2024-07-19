import { useRef, useState } from "react"
import Track from "./Track.jsx"
import { IconMenu2 } from "@tabler/icons-react"
import { deleteDoc, doc } from "firebase/firestore"
import { firestore } from "src/firebase/config.js"
import Alert from "../reusableComponents/Alert.jsx"
import { Link } from "react-router-dom"


function DashBoard({querySnapshot}) {

    const classGroups = querySnapshot.docs.map((doc) => {
        return (
            <ClassGroup document={doc} key={doc.id}></ClassGroup>
        )
    })

    return (
        <div className="p-2">
            <h1 className="pb-3">ClassGroups</h1>
            <hr className="py-2" />
            {classGroups}
            {/* <ClassGroup doc={FirstCLassGroup} /> */}
        </div>
    )
}


function ClassGroup({document}) {
    const [dropdown, setDropdown] = useState(false)
    const classGroupRef = useRef(null)
    const [exists, setExists] = useState(true)
    const [sensitive, showSensitive] = useState(false)



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
        <div id="ClassGroup" className="flex flex-col gap-4 border p-2" ref={classGroupRef} data-id={document.id}>
            <div className="flex items-center gap-2 relative">
                <h2 className="font-semibold text-xl">{document.get("name")}</h2>
                <div className="flex-auto"></div>
                <IconMenu2 onClick={() => setDropdown(true)} className="cursor-pointer" />
                    {dropdown && (
                        <div id="Dropdown" className="absolute bg-slate-600 cursor-pointer min-w-20 rounded-md select-none top-6 right-6" onClick={() => setDropdown(false)}>
                            <div className="border-b p-2"><Link className="text-inherit hover:text-inherit" to={`edit/classgroup/${document.id}`}>Edit</Link></div>
                            <div className="border-b p-2" onClick={() => showSensitive(true)}>Delete</div>
                            <div className="p-2">Close</div>
                        </div>
                    )}
            </div>

            <div className="grid overflow-hidden gap-3 grid-cols-1 md:grid-cols-2 auto-rows-[minmax(200px,auto)]">
                {document.get("classes") ? (
                    // document.get("classes").map(
                    //     classData => <Class key={classData.id} classData={classData} />
                    // )
                    <h1>There are some classes</h1>
                ) : (
                    <div>
                        <p>No data exists for this ClassGroup</p>
                    </div>
                    
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


function Class({classData}) {

    return(
        <div id="class" data-id={classData.id} className="p-4 flex group overflow-hidden flex-col transition h-full
                border-solid border-2 items-start rounded-md hover:bg-[--bg-hover-col]"
        >
            <div className="wrapper">
                <div className="font-semibold text-2xl"> {classData.name} </div>
                {/* <div className="text-sm"> {} </div> */}     
            </div>

            <div id="All Space" className="flex-auto self-stretch text-center flex justify-center">
                <Track data={1} totalItems={1} startAt={1}>
                    <div className="bg-gray-600 rounded-full border w-full h-full inline-block relative select-none">
                        <h1 className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 absolute">35</h1>
                    </div>
                </Track>
            </div>

            <div>
                Includes {classData.students} Students
            </div>
        </div>
    )
}

export default DashBoard