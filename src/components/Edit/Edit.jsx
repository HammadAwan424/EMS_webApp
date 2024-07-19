import { addDoc, collection, deleteField, doc, getDoc, getDocs, runTransaction, setDoc, updateDoc, where, writeBatch, WriteBatch } from "firebase/firestore"
import { Form, json, useActionData, useAsyncError, useLoaderData, useLocation, useParams, useSubmit } from "react-router-dom"
import { auth, firestore } from "src/firebase/config"
import { IconCirclePlus, IconEdit, IconAlertCircle, IconCircleMinus, IconLayoutNavbarExpand, IconSquareArrowDown, IconX, IconCircleArrowDown, IconCircleArrowDownFilled, IconCircleArrowUpFilled, IconH1, IconBadgeSdFilled } from "@tabler/icons-react" 
import { useEffect, useId, useRef, useState } from "react"
import { connectAuthEmulator } from "firebase/auth"
import { serverTimestamp } from "firebase/firestore"
import { query } from "firebase/firestore"
import { getClassById, getClassGroupById, getPublicTeacherByEmail } from "src/api/classGroups"
import Student from "../Students/Student"
import Students from "../Students/Students"


async function editLoader({request, params}) {
    // const url = new URL(request.url)
    // const isNew = url.searchParams.get("create")
    // if (isNew) {
    //     // return {
    //     //     exists() {return false}
    //     // }
    //     return null
    // } else {
    //     return await getClassGroupById(params.Id)
    // }
    return await getClassGroupById(params.Id)

}

async function editAction({request, params}) {
    const jsonData = await request.json()

    console.log("jsonData: ", jsonData)

    // dataComing = {
    //     classGroupName: 
    // }

    const classGroupId = params.Id
    const currentClassGroup = doc(firestore, "classGroups", classGroupId)
    const classesColection = collection(firestore, "classGroups", classGroupId, "classes")

    const batch = writeBatch(firestore)

    const classGroupData = {}

    let classDeleteCount = 0;
    jsonData.classes.forEach(entity => {
        const classId = entity.Id
        const classDoc = doc(classesColection, classId)

        // Adds the student data to each class 
        if (entity.isDeleted) {
            classGroupData[`classes.${classId}`] = deleteField()
            batch.delete(doc(classesColection, entity.Id))
            classDeleteCount += 1;
            return
        } 
        if (entity.isNew) {
            batch.set(classDoc, {className: entity.className})
            classGroupData[`classes.${classId}.className`] = entity.className
        } else {
            const classData = {}
            entity.students.map(studentId => {
                classData[`students.${studentId}`] = entity[studentId]
            }) 
            classData["className"] = entity.className
            batch.update(classDoc, classData)
            classGroupData[`classes.${classId}.className`] = entity.className
        }
    })

    // If all classes are marked as deleted, delete the whole class map instead of class: {}
    // const deleteAll = classDeleteCount == jsonData.classes.length
    // if (deleteAll) {
    //     classGroupData['classes'] = deleteField()
    // }

    classGroupData["classGroupName"] = jsonData.header.classGroupName

    console.log("Data to  update is ", classGroupData)
    batch.update(currentClassGroup, classGroupData)

    await batch.commit()

    return "Edit Loader"
}


// Result of useLoaderData is guranteed to exist, useLoaderData() != (null || undefined) 
function Edit() {
    const documentSnapshot = useLoaderData()
    const {Id: CLASS_GROUP_ID} = useParams()
    const submit = useSubmit()
    const location = useLocation()
    const [classes, setClasses] = useState(() => classesStateInitializer())
    const [formHeader, setFormHeader] = useState({classGroupName: documentSnapshot.get("classGroupName")})
    const [popupVisible, setPopupVisible] = useState(false)
    const CLASS_COUNT = classes.length
    

    function addClass() {
        const classId = doc(collection(firestore, "classGroups", CLASS_GROUP_ID, "classes")).id
        setClasses([...classes, {Id: classId, className: "", assignedTeacher: "", isNew: true, students: []}])
    }

    function classesStateInitializer() {
        const data = documentSnapshot.data()
        const classes = data?.classes
        const tmpState = []

        if (classes) {
            for (const [classId, classData] of Object.entries(classes)) {
                tmpState.push({Id: classId, className: classData.className, assignedTeacher: classData.assignedTeacher || null, isNew: false, students: []})
            }
        }
        return tmpState
    }

    console.log(classes)



    function handleSubmit({event=null, strict=null}) {
        event?.preventDefault()
        if (strict) {
            // Checks if strict is true
            if (CLASS_COUNT == 0) {
                setPopupVisible(true)
                return
            }
        }
        submit({classes: classes, header: formHeader}, {method: "post", encType: "application/json"})
    }


    function handleConfirm() {
        handleSubmit({strict:false})
    }


    function handleFormHeaderChange(e) {
        setFormHeader({...formHeader, [e.target.name]: e.target.value})
    }
    

    return (
        <>
        <Form className="p-4 flex flex-col gap-3" method="post" onSubmit={(e) => handleSubmit({event:e, strict:true})}>
            <div className="grid grid-cols-[auto,1fr] gap-1 items-center">
                <span className="text-xl text-[--text-secondary-col]">Name</span>
                <input className="text-[--text-primary-col] font-medium text-2xl px-2 bg-[--theme-tertiary] outline-none min-w-0" 
                    name="classGroupName" defaultValue={formHeader?.classGroupName || ""} required onChange={(e) => handleFormHeaderChange(e)}
                    placeholder="Class Group Name"
                />
                
           
                <span className="text-xl text-[--text-secondary-col]">Classes</span>
                <span className="justify-self-end">Has {CLASS_COUNT==0 ? "no" : CLASS_COUNT} classes</span>
            </div>


            {classes.map(
                entry => <ClassInput classes={classes} setClasses={setClasses} classObject={entry} key={entry.Id} />)
            }
            
            <IconCirclePlus className="self-end text-green-400" onClick={addClass} /> 

            <input type="hidden" name="class_Group_Id" value={CLASS_GROUP_ID} />

            <button>Save Changes</button>

            
        </Form>
        <Popup visible={popupVisible} setVisible={setPopupVisible} handleConfirm={handleConfirm} />
        </>
    )
}


function ClassInput({classes, setClasses, classObject}) {

    const { Id: classGroupId } = useParams()
    const [expanded, setExpanded] = useState(false)
    const [inititalState, setInitialState] = useState(null)
    const [hasExpandedOnce, setHasExpandedOnce] = useState(false)
    const [students, setStudents] = useState([])
    const [editStates, setEditStates] = useState({studentEdit: false, classNameEdit: classObject.isNew})
    const [teacherEditState, setTeacherEditState] = useState(false)
    const [teacherAssignAlert, setTeacherAssignAlert] = useState({visible: false, text: ""})

    const isDeleted  = classObject.isDeleted
    const isNew = classObject.isNew
    const classNameField = classObject.className || ""
    const assignedTeacher = classObject.assignedTeacher
    const hasStudents = classObject.students.length > 0

    const onChange = (event) => {   
        setClasses(classes.map(entry => {
            if (entry.Id == classObject.Id) {
                return {...entry, [event.target.name]: event.target.value}
            } else {
                return entry
            }
        }))
    }

    const onRemove = () => {
        if (classObject.isNew == true) {
            setClasses(classes.filter(entry => entry.Id != classObject.Id))
        } else {
            setClasses(classes.map(entry => {
                if (entry.Id == classObject.Id) {
                    return {...entry, isDeleted: true}
                } else {
                    return entry
                }
            }))
        }
    }

    const addStudent = (e) => {
        const randId = Math.random().toString().slice(2, 8)
        setClasses(classes.map(entry => {
            if (entry.Id == classObject.Id) {
                return {...entry, students: [...entry.students, randId], [randId]: {studentName: "", rollNo: ""}}
            } else {
                return entry
            }
        }))
        if (editStates.studentEdit == false) {
            handleEdit(e)
        }
    }

    function studentChange(e, studentId) {
        setClasses(classes.map(entry => {
            if (entry.Id == classObject.Id) {
                const prevStudent = entry[studentId]
                return {...entry, [studentId]: {...prevStudent, [e.target.name]: e.target.value}}
            } else {
                return entry
            }
        }))
    }

    function resetClass(cancelEditType) {
        setClasses(classes.map(entry => {
            if (entry.Id == classObject.Id) {
                return inititalState
            } else {
                return entry
            }
        }))

        console.log(cancelEditType)

        if (cancelEditType == "teacherEdit") {
            setTeacherEditState(false)
        } else {
            const newEditStates = {}
            for (let key of Object.keys(editStates)) {
                newEditStates[key] = false
            }
            setEditStates(newEditStates)
        }

        
    }


    async function assignTeacher() {
        const value = assignedTeacher
        const regex = /^\w+@\w+\.com$/

        try {
            if (!regex.test(value)) {
                throw new Error("The format is incorrect for an email")
            }
            
            const snapshot = await getPublicTeacherByEmail(value)
    
            if (snapshot.empty) {
                const error = new Error("No teacher exists with this email")
                error.code = 404
                throw error
            }
    
            const invitedTeacherUid = snapshot.docs[0].id
    
            const batch = writeBatch(firestore)
            batch.update(doc(firestore, "classGroups", classGroupId), {[`editors.${invitedTeacherUid}`]: classObject.Id})
            batch.update(doc(firestore, "teachers", invitedTeacherUid), {[`invitations.${auth.currentUser.uid}`]: {email: auth.currentUser.email}})
            await batch.commit()
        } catch (error) {
            setTeacherAssignAlert({text: error.message, visible: true})
        }
        

    }


    async function handleExpand(newExpandState) {
        if (isNew == false) {
            setExpanded(newExpandState)
        } 
        if (isNew == false && hasExpandedOnce == false) {
            setHasExpandedOnce(true)
        }
        if (hasExpandedOnce == false && isNew == false) {
            try {
                const classSnapshot = await getClassById(classGroupId, classObject.Id)
                const classData = classSnapshot.data()
                console.log(classData)
                const studentIds = []
                const studentData = {}
                for (let studentId of Object.keys(classData.students)) {
                    studentIds.push(studentId)
                    studentData[studentId] =  classData.students[studentId]
                }
                console.log("Student array: ", studentIds, "Student Data: ", studentData)
                setClasses(classes.map(entry => {
                    if (entry.Id == classObject.Id) {
                        return {...entry, students: studentIds, ...studentData}
                    } else {
                        return entry
                    }
                }))
            } catch (error) {
                console.log("There was some error while fetching", error)
            }
        }
         
    }

    function handleEdit(e) {
        setInitialState(classObject)
        const editType = e.currentTarget.dataset.editType
        if (editType == "teacherEdit") {
            setTeacherEditState(true)
        } else {
            setEditStates({...editStates, [e.currentTarget.dataset.editType]: true})
        }
    }

    return (
        <>
        <div className="border rounded-md border-[--text-disabled]">
            <div className="flex items-center gap-2 p-2">
                <input className={`text-[--text-primary-col] p-1 border rounded-md px-2 outline-none font-bold w-40 min-w-0
                    group-[.isDeleted]:text-red-600 ${editStates.classNameEdit ? "bg-[--theme-tertiary] border-transparent" : 'bg-transparent border-[--theme-tertiary]'}`} 
                    required disabled={!editStates.classNameEdit } type="text" placeholder="Class Name" value={classNameField} name="className" onChange={(e) => onChange(e)} autoComplete="off"/>
                <IconEdit data-edit-type="classNameEdit" onClick={(e) => handleEdit(e)} />
                <IconCircleMinus onClick={onRemove} className="text-red-400"/>
                <hr className="flex-auto border-[--text-disabled]" />
                {expanded ? <IconCircleArrowDownFilled onClick={() => handleExpand(false)} /> : <IconCircleArrowUpFilled onClick={() => handleExpand(true)} />    }

            </div>

            {isNew == false && (
                <div className="p-2 flex items-center gap-x-2 gap-y-1 border-t border-[--text-disabled] flex-wrap">
                    <div className="font-semibold px-2 w-40">Assigned Teacher</div>
                    <IconEdit data-edit-type="teacherEdit" onClick={(e) => handleEdit(e)} />
                    {assignedTeacher || teacherEditState ? (
                        <input className={`text-[--text-primary-col] p-1 flex-1 px-2 border rounded-md outline-none min-w-0 group-[.isDeleted]:text-red-600
                    ${teacherEditState ? "bg-[--theme-tertiary] border-transparent" : 'bg-transparent border-[--theme-tertiary]'}`}
                            required disabled={!teacherEditState} type="email" placeholder="Teacher's Id or their mail address" name="assignedTeacher" value={assignedTeacher || ""} onChange={(e) => onChange(e)} autoComplete="off" />
                    ) : (
                        <div className="flex items-center gap-2 text-yellow-400">
                            <IconAlertCircle />
                            <div className="p-1 border-transparent border">No Teacher assigned to this class</div>
                        </div>
                    )}
                    {teacherAssignAlert.visible && (
                        <div className="w-full pl-2 flex justify-end items-center text-red-500">
                            {teacherAssignAlert.text}
                        </div>
                    )}

                </div>

                
            )}

            {teacherEditState && (
                <div className="p-2 flex items-center gap-2 justify-end">
                    <button className="rounded-3xl bg-[--theme-secondary] py-1 px-3" type="button" 
                        onClick={() => resetClass("teacherEdit")}
                    >Cancel</button>
                    <button className="rounded-3xl bg-green-600 py-1 px-3" type="button"
                        onClick={assignTeacher}
                    >Assign</button>
                </div>
            )}


            {expanded && (
                <div className="p-2 flex flex-col border-t gap-2  border-[--text-disabled]">
                    <div className="flex gap-2">
                        <div className="font-medium">Students</div>
                        <IconEdit data-edit-type="studentEdit" onClick={(e) => hasStudents && handleEdit(e)} />    
                    </div>

                    {hasStudents ? classObject.students.map(studentId => (
                        <div className="flex gap-2" key={studentId}>
                            <input className={`text-[--text-primary-col] p-1 rounded-md border flex-1 px-2 outline-none min-w-0 group-[.isDeleted]:text-red-600
                            ${editStates.studentEdit ? "bg-[--theme-tertiary] border-transparent" : 'bg-transparent border-[--theme-tertiary]'}`}
                                required disabled={!editStates.studentEdit} value={classObject[studentId].rollNo} type="number" min={0} placeholder="Roll No" name="rollNo" onChange={(e) => studentChange(e, studentId)} autoComplete="off" />
                            <input className={`text-[--text-primary-col] p-1 rounded-md border flex-1 px-2 outline-none min-w-0 group-[.isDeleted]:text-red-600
                            ${editStates.studentEdit ? "bg-[--theme-tertiary] border-transparent" : 'bg-transparent border-[--theme-tertiary]'}`}
                                required disabled={!editStates.studentEdit} value={classObject[studentId].studentName} type="text" placeholder="Name" name="studentName" onChange={(e) => studentChange(e, studentId)} autoComplete="off" />
                        </div>
                    )) : (
                        <div className="flex gap-2 text-yellow-400">  
                            <IconAlertCircle />
                            <div>This class has no student, click on the edit icon to add</div>
                        </div>
                    )}
                    <button data-edit-type="studentEdit" className="self-start flex p-2 gap-1 bg-[--theme-secondary]" type="button" onClick={(e) => addStudent(e)}>
                        <IconCirclePlus className="self-end text-green-400" /> 
                        <span>Add Student</span>
                    </button>
               
                </div>
            )}
            

            {isNew == false && Object.values(editStates).some(bool => bool) && (
                <div className="p-2 flex items-center gap-2">
                    <button type="button" className="flex-1 bg-[--theme-secondary]" onClick={resetClass}>Cancel</button>
                    <button type="button" className="flex-1 bg-[--theme-secondary]">Save Changes</button>
                </div>
            )}

        </div>
        </>
    )
}




function Popup({visible, setVisible, handleConfirm}) {
    if (!visible) return null

    return (
        <div className="inset-0 flex items-center justify-center fixed">
            <div className="bg-black inset-0 opacity-50 absolute"></div>
            <div id="Popup" className="bg-[--theme-primary] z-10 max-w-[90%] text-center py-4 rounded-md">
                <div id="Top" className="flex flex-col p-4">
                    <div className="flex">
                        <div className="flex-auto"></div>
                        <span className="font-bold text-xl">Confirm Action?</span>
                        <div className="flex-auto relative">
                            <IconX size={28} onClick={() => setVisible(false)} className="cursor-pointer right-0 absolute rounded-full p-1 transition hover:bg-[--theme-secondary]" />
                        </div>
                    </div>
                    <span className="text-[--text-secondary-col]">You have not added any class yet, want to proceed?</span>
                </div>


                <div id="Bottom" className="p-4 flex flex-col gap-2">
                    <button className="bg-red-600 text-white border-none" onClick={handleConfirm}>Proceed</button>
                    <button className="bg-[--theme-secondary]" onClick={() => setVisible(false)}>Cancel</button>
                </div>

                
            </div>
        
        </div>
    )
}

export default Edit
export {editAction, editLoader}