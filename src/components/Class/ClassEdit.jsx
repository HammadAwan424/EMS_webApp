import { skipToken } from "@reduxjs/toolkit/query"
import {  IconEdit, IconCircleArrowDownFilled, IconCircleArrowUpFilled, IconAlertCircle, IconCirclePlus, IconMenu2, IconTrashOff, IconTrash, IconCheckbox  } from "src/IconsReexported.jsx"
import classNames from "classnames"
import dot from "dot-object"
import isEqual from "lodash.isequal"
import { useState } from "react"
import { useParams } from "react-router-dom"
import { useAssignTeacherMutation, useDeleteClassMutation, useEditClassMutation, useGetAuthQuery, useGetClassByIdQuery, useUnAssignTeacherMutation } from "src/api/apiSlice"
import { useImmerReducer } from "use-immer"
import Button from "../CommonUI/Button"
import { Cross } from "../CommonUI/Icons"
import Popup from "../CommonUI/Popup"

const initialState = {
    students: {},
    meta: {
        studentIds: [],
        students: {}
    },
    ui: {
        activeEdits: {
            teacher: false,
            students: false,
            className: false
        }
    }
}

function classReducer(draft, action) {
    switch (action.type) {
        case "add_student": {
            const randId = Math.random().toString().slice(2, 8)
            draft.students[randId] = {studentName: "", rollNo: ""}
            draft.meta.students[randId] = "added"
            draft.meta.studentIds.push(randId)
            break
        }
        case "remove_student": {
            const id = action.id
            const newStudent = draft.meta.students[id] == "added"
            if (newStudent) {
                draft.meta.studentIds = draft.meta.studentIds.filter(studentId => studentId != id)
                delete draft.students[id]
                delete draft.meta.students[id]
            } else {
                const notThere = draft.meta.studentIds.indexOf(id) == -1
                if (notThere) {
                    draft.meta.studentIds.push(id)
                }
                draft.meta.students[id] = "removed"
            }
            break
        }
        case "restore": {
            const index = draft.meta.studentIds.findIndex(id => id == action.id)
            draft.meta.studentIds.splice(index, 1)
            delete draft.meta.students[action.id]
            delete draft.students[action.id]
            break
        }
        case "input_change": {
            const { name, value } = action.e.target
            if (action.hasMeta) {
                const metaPath = action.metaPath
                const id = action.id
                const current = draft.meta[metaPath][id]
                if (current != "modified") {
                    draft.meta[metaPath][id] = "modified"
                    const newPath = metaPath.slice(0, -1)+"Ids"
                    console.log(newPath)
                    draft.meta[newPath].push(id)
                }
                dot.str(name, value, draft)
            } else {
                dot.str(name, value, draft)
            }
            break
        }
        case "editToggle": {
            const activeEdits = draft.ui.activeEdits
            if (action.specific == "teacher") {
                if (activeEdits.students == false && activeEdits.className == false) {
                    draft.ui.activeEdits["teacher"] = true
                }
            } else {
                if (activeEdits.teacher == false)  {
                    draft.ui.activeEdits[action.specific] = true
                }
            }
            break
        }
        case "reset": {
            return initialState
        }
        default: {
            throw Error("No corresponding case for action type")
        }
    }
}


function ClassEdit({sampleData, id}) {

    const { Id: classGroupId } = useParams()
    const [expanded, setExpanded] = useState(false)
    const [hasExpandedOnce, setHasExpandedOnce] = useState(false)
    const {data: auth} = useGetAuthQuery()

    const [formUpdates, dispatch] = useImmerReducer(classReducer, initialState)
    const [editClass, {isLoading: mutating}] = useEditClassMutation()
    const [assignTeacher, {isLoading: assigning, isError: assignError, error}] = useAssignTeacherMutation()
    const [unassignTeacher, {isLoading: unassigning, isError: isUnassignError, error: unAssignError}] = useUnAssignTeacherMutation()

    const {data: details, isFetching: loadingDetails, isUninitialized} = useGetClassByIdQuery(
        hasExpandedOnce ? {classGroupId, classId: id} : skipToken
    ) 
    const unsortedIds = Object.keys(details?.students ?? {})
    const studentIds = unsortedIds.sort((a, b) => details.students[a].rollNo - details.students[b].rollNo)
    const hasStudents = studentIds.length > 0
    const activeEdits = formUpdates.ui.activeEdits
    console.log(activeEdits)

    const {ui, assignedTeacher, ...generalUpdates} = formUpdates
    const {ui: initialUi, ...initialGeneral} = initialState
    const modified = {
        teacher: formUpdates.assignedTeacher != undefined,
        general: !isEqual(initialGeneral, generalUpdates)
    }

    const getValue = (name, type) => {
        // Don't show edits/formUpdates on 'marked as deleted'
        if (type == "removed") {
            return dot.pick(name, {...sampleData, ...details}) ?? ""
        } else {
            return dot.pick(name, formUpdates) ?? dot.pick(name, {...sampleData, ...details}) ?? ""
        }
    }

    function handleExpand() {
        if (!hasExpandedOnce) {
            setHasExpandedOnce(true)
        }
        setExpanded(!expanded)
    }

    

    async function handleSaveChangesClick() {
        let count = {
            added: 0,
            removed: 0
        }
        formUpdates.meta.studentIds.forEach(id => {
            const updateType = formUpdates.meta.students[id]
            if (updateType == "added") {
                count.added += 1
            } else if (updateType == "removed") {
                count.removed += 1
            }
        })
        const func = async () => {
            try {
                await editClass({...generalUpdates, classId: id, classGroupId}).unwrap()
                dispatch({type: "reset"})
            } catch (e) {
                console.log("Coundn't apply changes due to: ", e)
            }
            setPopup({...popup, visible: false})
        }
        if (modified.general == false) {
            dispatch({type: "reset"})
        }
        else if (count.added == 0 && studentIds.length == 0) {
            setPopup({loadingType: 0, text: "You didn't added any new student", visible: true, handler: func})
        } else if (count.added == 0 && studentIds.length == count.removed) {
            setPopup({loadingType: 0, text: "The class will be empty after the update", visible: true, handler: func})
        } else  {
            await func()
        }

        
    }

    function inputClasses({editing=false, type=""}) {
        return classNames(
            "text-[--text-primary-col] p-1 rounded-md border flex-1 px-2 outline-none min-w-0",
            {"border-green-500 bg-transparent": type=="added"},
            { "border-red-500 bg-transparent": type == "removed" },
            { "border-yellow-500 bg-transparent": type == "modified"},
            {"border-[--theme-tertiary] bg-transparent" : !editing && type == ""},
            {"bg-[--theme-tertiary] border-transparent": editing && type==""}
        )
    }

    

    console.log("UPDATES: ", formUpdates, "PREVIOUS STATE: ", details)


    const isAssignedAlready = !!sampleData.assignedTeacher
    async function myAssing() {
        
        
        try {
            if (isAssignedAlready) {
                const recepientEmail = sampleData.assignedTeacher
                await unassignTeacher({recepientEmail, classGroupId, classId: id})
            } else {
                const recepientEmail = getValue("assignedTeacher")
                await assignTeacher({recepientEmail, hostEmail: auth.email, classGroupId, classId: id, className: getValue("className")}).unwrap()
            }
            dispatch({type: "reset"})
        } catch (error) {
            console.log("THere was error while assigning: ", error)
        }
    }

    const [dropdown, setDropdown] = useState(false)
    const [deleteClass, {isLoading: deleting}] = useDeleteClassMutation()
    const [popup, setPopup] = useState({
        text: "",
        handler: () => {},
        visible: false,
        loadingType: -1
    })
    const loadingMap = {
        0: mutating,
        1: deleting
    }

    console.log("HEIII", getValue("assignedTeacher"), "sdf")

    return (
        <>
        <form className="border rounded-md border-[--text-disabled]">
            {/* <div className="w-40 h-40">
                <Pie percentage={20} stroke={5}></Pie>
            </div> */}

            <div className="flex items-center gap-2 p-2 relative">
                <input className={`text-[--text-primary-col] p-1 border rounded-md px-2 outline-none font-bold 
                    w-40 min-w-0 ${activeEdits.className ? `bg-[--theme-tertiary] 
                    border-transparent` : 'bg-transparent border-[--theme-tertiary]'}`} 
                    required disabled={!activeEdits.className } type="text" placeholder="Class Name" 
                    value={getValue("className")} name="className" 
                    onChange={(e) => dispatch({e: e, type: "input_change"})} 
                    autoComplete="off"/>
                <IconEdit onClick={() => dispatch({type: "editToggle", broad: "generalUpdates", specific: "className"})} />
                <hr className="flex-auto border-[--text-disabled]" />
                <IconMenu2 style={{"anchorName": "--menuBtn"}} onClick={() => setDropdown(true)} className="cursor-pointer" />
                {dropdown && (
                    <div id="Dropdown" className="absolute bg-slate-600 cursor-pointer min-w-20 rounded-md select-none top-0 right-6" 
                        onClick={() => setDropdown(false)} style={{"positionAnchor": "--menuBtn", top: "anchor(bottom)", right: "anchor(left)"}}>
                        <div className="border-b p-2"
                        onClick={() => setPopup({
                            text: "Are you sure you want to delete the selected class, this can't be undone", 
                            visible: true, handler: () => deleteClass({classGroupId, classId: id}), loadingType: 1})}
                        >
                            <div className="text-inherit hover:text-inherit">Delete</div>
                        </div>
                        <div className="p-2">Close</div>
                    </div>
                )}
                {expanded ? <IconCircleArrowDownFilled onClick={handleExpand} /> 
                    : <IconCircleArrowUpFilled onClick={handleExpand} />}
            </div>

            
            <div className="p-2 flex items-center gap-x-2 gap-y-1 border-t border-[--text-disabled] flex-wrap">
                <div className="font-semibold px-2 w-40">Assigned Teacher</div>
                <IconEdit onClick={() => dispatch({type: "editToggle", specific: "teacher"})} />
                    {isAssignedAlready || activeEdits.teacher ? (
                        <>
                        <input
                            className={[
                                inputClasses({ editing: activeEdits.teacher && !isAssignedAlready}),
                            ].join(" ")}
                            required disabled={!activeEdits.teacher || isAssignedAlready} type="email"
                            placeholder="Teacher's Id or their mail address" name="assignedTeacher"
                            value={getValue("assignedTeacher")}
                            onChange={(e) => dispatch({ e: e, type: "input_change" })} autoComplete="off" />
                            {!activeEdits.teacher && <IconCheckbox className="text-green-500"  />}
                        </>

                ) : (
                    <div className="flex items-center gap-2 text-yellow-400">
                        <IconAlertCircle />
                        <div className="p-1 border-transparent border">No Teacher assigned to this class</div>
                    </div>
                )}

            </div>

           

            {(modified.teacher || activeEdits.teacher) && (
                // TODO: MUTATION
                <div className="flex flex-col items-end">
                    <div className={"p-2 flex items-center gap-2 justify-end"}>
                        <button className="rounded-3xl bg-[--theme-secondary] py-1 px-3" type="button"
                            onClick={() => dispatch({ type: "reset" })}
                        >Cancel</button>
                        <Button className="rounded-3xl bg-[--theme-secondary] py-1 px-3"
                            states={{ isLoading: assigning, isError: assignError }} 
                            text={{ idleText: isAssignedAlready ? "Unassign" : "Assign" }}
                            onClick={myAssing}
                        />
                    </div>
                    {assignError && (
                        <div className="px-2 pb-1 text-red-500">{error}</div>
                    )}
                </div>
        
            )}


            {expanded && (
                <div className="p-2 flex flex-col border-t gap-2  border-[--text-disabled]">
                    <div className="flex gap-2">
                        <div className="font-medium">Students</div>
                        <IconEdit onClick={() => hasStudents && dispatch({type: "editToggle", specific: "students"})}  />    
                    </div>

                   {formUpdates.meta.studentIds.filter(id => formUpdates.meta.students[id] == "added").map(studentId => {
                        return(
                            <div className="flex items-center gap-2" key={studentId}>
                            
                                <Cross size={24} className="stroke-red-500" onClick={() => dispatch({ type: "remove_student", id: studentId })}/>
                           
                                <input className={inputClasses({editing: true, type: "added"})}
                                    required value={getValue(`students.${studentId}.rollNo`)} type="number" min={0} placeholder="Roll No"
                                    name={`students.${studentId}.rollNo`} onChange={(e) => dispatch({ e: e, type: "input_change" })} autoComplete="off" />

                                <input className={inputClasses({editing: true, type: "added"})}
                                    required value={getValue(`students.${studentId}.studentName`)} type="text" placeholder="Name"
                                    name={`students.${studentId}.studentName`} onChange={(e) => dispatch({ e: e, type: "input_change" })} autoComplete="off" />
                            </div>
                        )
                   })}

                   


                    {loadingDetails ? (
                        <div>Loading students data ...</div>
                    ) : hasStudents ? studentIds.map(studentId => {
                        const type = formUpdates.meta.students[studentId]

                        // if (getValue(`students.${studentId}.rollNo`, type) == undefined) {
                        //     console.log("Undefined for Roll no id is: ", studentId, " type is : ", type)
                        // }
                        // if (getValue(`students.${studentId}.studentName`, type) == undefined) {
                        //     console.log("Undefined for Name id is: ", studentId, " type is: ", type)
                        // }
                        console.log("TYPE IS: ", type)
                        const arg = type ? {type, editing: activeEdits.students} : {editing: activeEdits.students}
                        
                        return(
                            <div className={`flex items-center gap-2`} key={studentId}>
                                {type == "removed" ? (
                                    <IconTrashOff className="text-red-500" onClick={() => dispatch({ type: "restore", id: studentId })} />
                                ) : (
                                    activeEdits.students && <IconTrash className="text-white" stroke={1} onClick={() => dispatch({ type: "remove_student", id: studentId })} />
                                )}
                                <input className={inputClasses(arg)}
                                    required disabled={!activeEdits.students} value={getValue(`students.${studentId}.rollNo`, type)} type="number" min={0} placeholder="Roll No"
                                    name={`students.${studentId}.rollNo`} onChange={(e) => dispatch({ e: e, type: "input_change", hasMeta: true, metaPath: "students", id: studentId})} autoComplete="off" />

                                <input className={inputClasses(arg)}
                                    required disabled={!activeEdits.students} value={getValue(`students.${studentId}.studentName`, type)} type="text" placeholder="Name"
                                    name={`students.${studentId}.studentName`} onChange={(e) => dispatch({ e: e, type: "input_change", hasMeta: true, metaPath: "students", id: studentId})} autoComplete="off" />
                            </div>
                        )
                    } 
                    ) : (
                        <div className="flex gap-2 text-yellow-400">  
                            <IconAlertCircle />
                            <div>This class has no student, click on the edit icon to add</div>
                        </div>
                    )}
                    
                    <button data-edit-type="studentEdit" className="self-start flex p-2 gap-1 bg-[--theme-secondary]" 
                        type="button" onClick={() => dispatch({type: "add_student"})}>
                        <IconCirclePlus className="self-end text-green-400" /> 
                        <span>Add Student</span>
                    </button>
               
                </div>
            )}
            

            {(modified.general || activeEdits.students || activeEdits.className) && (
                <div className="p-2 flex items-center gap-2">
                    <button type="button" className="flex-1 bg-[--theme-secondary]" onClick={() => dispatch({ type: "reset" })}>Cancel</button>
                    {/* TODO: Mutation for class edit */}
                    <Button className="flex-1 bg-[--theme-secondary]" type="button"
                        onClick={handleSaveChangesClick} states={{isLoading: mutating}} 
                        text={{idleText: "Save Changes"}} 
                    />
                </div>
            )}

            <Popup
                text={popup.text} visible={popup.visible} confirmHandler={popup.handler}
                setVisible={(boolean) => setPopup({ ...popup, visible: boolean })} isLoading={loadingMap[popup.loadingType]}
            />

           
        </form>
        </>
    )
}

export default ClassEdit