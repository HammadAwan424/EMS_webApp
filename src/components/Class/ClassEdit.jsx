import { IconEdit, IconCircleMinus, IconCircleArrowDownFilled, IconCircleArrowUpFilled, IconAlertCircle, IconCirclePlus } from "@tabler/icons-react"
import { writeBatch, doc, arrayUnion, collection, deleteField, updateDoc } from "firebase/firestore"
import { useState } from "react"
import { redirect, useLoaderData, useNavigation, useParams, useRouteLoaderData, useSubmit } from "react-router-dom"
import { getPublicTeacherByEmail, getClassById } from "src/api/Teacher"
import { firestore, auth } from "src/firebase/config"

async function loader({request, params}) {
    const { classGroupId, classId } = params
    return getClassById(classGroupId, classId)
}
async function action({request, params}) {
    const { classGroupId, classId } = params

    const classGroupDoc = doc(firestore, "classGroups", classGroupId)
    const classesColection = collection(classGroupDoc, "classes")
    const classDoc = doc(classesColection, classId)

    const {intent, classData, requester} = await request.json()

    console.log("Action received data as: ", classData)

    if (intent == "classEdit" && requester == "classTeacher") {
        const toFirestoreClass = {}
        classData.students.map(studentId => {
            toFirestoreClass[`students.${studentId}`] = classData[studentId]
        }) 
        await updateDoc(classDoc, toFirestoreClass)
        return "successful"
    }

    else if (intent == "classEdit" && requester == "cgAdmin") {
        const batch = writeBatch(firestore)
        const toFirestoreGroup = {} 
        const toFirestoreClass = {}
        
        classData.students.map(studentId => {
            toFirestoreClass[`students.${studentId}`] = classData[studentId]
        }) 
        toFirestoreClass["className"] = classData.className
        toFirestoreGroup[`classes.${classId}.className`] = classData.className

        batch.update(classGroupDoc, toFirestoreGroup)
        batch.update(classDoc, toFirestoreClass)
        await batch.commit()
        return redirect(`/edit/classgroup/${classGroupId}`)
    }

    else if (intent == "assignTeacher") {
        const value = classData?.assignedTeacher || ""
        const regex = /^\w+@\w+\.com$/
        try {
            if (!regex.test(value)) {
                throw new Error("The format is incorrect for an email")
            }            
            const snapshot = await getPublicTeacherByEmail(value)

            if (snapshot.empty) {
                const error = new Error("No teacher exists with this email")
                throw error
            }

            const invitedTeacherUid = snapshot.docs[0].id
    
            const batch = writeBatch(firestore)
            batch.update(doc(firestore, "classGroups", classGroupId), {[`editors.${invitedTeacherUid}`]: arrayUnion(classData.Id), [`classes.${classData.Id}.assignedTeacher`]: value})
            batch.update(doc(firestore, "teachers", invitedTeacherUid), {
                invitations: arrayUnion({
                    email: auth.currentUser.email,
                    classId: classData.Id,
                    classGroupId: classGroupId,
                    className: classData.className
                })})
            await batch.commit()

        } catch (error) {
            if (error.code == "permission-denied") {
                return "You don't have any permission to do this"
            }
            else return error.message
        }
        return null
    }

    

   


    return getClassById(classGroupId, classId)
}


function ClassInput() {

    const documentSnapshot = useLoaderData()
    const classData = documentSnapshot.data()
    const {classId, classGroupId} = useParams()

    const [classObject, setClassObject] = useState(() => {
        const studentIds = []
        const studentData = {}
        for (let studentId of Object.keys(classData.students)) {
            studentIds.push(studentId)
            studentData[studentId] =  classData.students[studentId]
        }

        return {
            Id: classId, 
            className: classData.className || null, 
            status: "unModified", 
            students: studentIds,
            ...studentData
        }
    })

    console.log("class object is: ", classObject)

    const [expanded, setExpanded] = useState(true)
    const [inititalState, setInitialState] = useState(null)
    const [editStates, setEditStates] = useState({studentEdit: false})

    const submit = useSubmit()

    const classNameField = classObject.className || ""
    const hasStudents = classObject.students.length > 0
    const status = classObject.status
    

    const onChange = (event) => {   
        setClassObject({...classObject, [event.target.name]: event.target.value})
    }


    const addStudent = (e) => {
        const randId = Math.random().toString().slice(2, 8)
        setClassObject({...classObject, students: [...classObject.students, randId], [randId]: {studentName: "", rollNo: ""}})
        if (editStates.studentEdit == false) {
            handleEdit(e)
        }
    }

    function studentChange(e, studentId) {
        const prevStudent = classObject[studentId]
        setClassObject({...classObject, [studentId]: {...prevStudent, [e.target.name]: e.target.value}})
          
    }

    function resetClass(cancelEditType) {
        setClassObject(inititalState)
        const newEditStates = {}
        for (let key of Object.keys(editStates)) {
            newEditStates[key] = false
        }
        setEditStates(newEditStates)
    }

    function toggleExpand() {
        setExpanded(!expanded)
    }

    function handleEdit(e) {
        setInitialState(classObject)
        const editType = e.currentTarget.dataset.editType
        setEditStates({...editStates, [editType]: true})
    }


    function saveChanges() {
        submit({intent: "classEdit", classData: classObject, requester: "classTeacher"}, {method: "post", encType: "application/json"})
    }

    const navigation = useNavigation()

    return (
        <>
        {navigation.state == "loading" ? (<h1>This is inside classs</h1>) : 
        <div className="p-4">
            <div className="border rounded-md border-[--text-disabled]">
                <div className="flex items-center gap-2 p-2">
                    <input className={`text-[--text-primary-col] p-1 border rounded-md px-2 outline-none font-bold w-40 min-w-0
            group-[.isDeleted]:text-red-600 bg-transparent border-[--theme-tertiary]`}
                        required disabled type="text" placeholder="Class Name" value={classNameField} name="className" onChange={(e) => onChange(e)} autoComplete="off" />
                    <hr className="flex-auto border-[--text-disabled]" />
                    {expanded ? <IconCircleArrowDownFilled onClick={toggleExpand} /> : <IconCircleArrowUpFilled onClick={toggleExpand} />    }
                </div>


                {expanded && (
                    <div className="p-2 flex flex-col border-t gap-2  border-[--text-disabled]">
                        <div className="flex gap-2">
                            <div className="font-medium">Students</div>
                            {hasStudents && (
                                <IconEdit data-edit-type="studentEdit" onClick={(e) => hasStudents && handleEdit(e)} />
                            )}
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


                {status != "new" && Object.values(editStates).some(bool => bool) && (
                    <div className="p-2 flex items-center gap-2">
                        <button type="button" className="flex-1 bg-[--theme-secondary]" onClick={resetClass}>Cancel</button>
                        <button type="button" className="flex-1 bg-[--theme-secondary]" onClick={saveChanges}>Save Changes</button>
                    </div>
                )}

            </div>
        </div>
        }
        </>
    )
}

export default ClassInput
export {action, loader}