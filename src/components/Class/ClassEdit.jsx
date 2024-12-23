import { skipToken } from "@reduxjs/toolkit/query"
import {  IconEdit, IconCircleArrowUpFilled, IconAlertCircle, IconCirclePlus, IconTrashOff, IconTrash, IconCheckbox, IconUser  } from "src/IconsReexported.jsx"
import classNames from "classnames"
import dot from "dot-object"
import { createContext, useContext, useEffect, useState } from "react"
import { useAssignTeacherMutation, useGetAuthQuery, useUnAssignTeacherMutation } from "src/api/apiSlice"
import Button from "../CommonUI/Button"
import { Cross } from "../CommonUI/Icons"
import MediaQuery from "react-responsive"
import { Input, useInput } from "../CommonUI/Input"
import { selectStudentIdsEdit, selectStudentIdsFromUpdates, useFormupdates } from "./Common"
import Alert from "../CommonUI/Alert"
import { useGetClassByIdQuery } from "src/api/rtk-query/class"



const ClassEditContext = createContext(null)

function ClassEdit({sampleData, classId, classGroupId, isJoined=false}) {

    const {data: auth} = useGetAuthQuery()

    const {uiToggle, uiGetter, uiReset} = useInput()
    const { 
        formUpdates, dispatch, handleSaveChangesClick,
        hasModifications, showSaveChanges, isMutating
    } = useFormupdates({resetFunc: uiReset, classId, classGroupId})
    const generalLocked = formUpdates.ui.lockedInput.includes("general")
    const {data: details} = useGetClassByIdQuery(formUpdates.ui.hasExpandedOnce ? {classGroupId, classId} : skipToken) 
    
    const getInitialValue = (name) => {
        return dot.pick(name, {...sampleData, ...details}) ?? ""
    }

    const getValue = (name, type) => {
        // Don't show edits/formUpdates on 'marked as deleted'
        if (type == "removed") {
            return getInitialValue(name)
        } else {
            return dot.pick(name, formUpdates) ?? dot.pick(name, {...sampleData, ...details}) ?? ""
        }
    }

    const inputProps = {
        getValue, getDefaultValue: getInitialValue,
        uiToggle, uiGetter,
        setValue: ({path, value, isModified}) => dispatch({path, value, isModified, type: "input_change"})
    }
    
    console.log("UPDATES: ", formUpdates, "PREVIOUS STATE: ", details)

    return (
        <form className="border rounded-md">
            {/* <div className="w-40 h-40">
                <Pie percentage={20} stroke={5}></Pie>
            </div> */}

            <div className="flex items-center gap-2 px-2 py-2 relative" >
                <Input {...inputProps} name="className" className="flex-grow-0 basis-auto w-40" 
                    disabled={isJoined || generalLocked} 
                />
                {/* Below one is changed to above by extracting input and ui logic input Input.jsx 
                    Replacing it everywhere not only here */}
                {/* <input className={inputClasses({editing:activeEdits.className})} 
                required type="text" placeholder="Class Name" 
                value={getValue("className")} name="className" 
                onChange={(e) => dispatch({e: e, type: "input_change"})} 
                onFocus={() => dispatch({type: "editToggle", broad: "generalUpdates", specific: "className"})}
                autoComplete="off"/> */}
                <MediaQuery minWidth={640}>
                    {matches => matches ? <hr className="flex-auto" /> 
                        : <div className="flex-1"></div>}
                </MediaQuery>
                <IconCircleArrowUpFilled className={classNames(
                    "transition",
                    formUpdates.ui.expanded && "-rotate-180"
                )} onClick={() => {dispatch({type: "ui/expand", value: !formUpdates.ui.expanded})}} />
            </div>

            <ClassEditContext.Provider  value={{inputProps, classId, classGroupId, formUpdates, dispatch}}>
                <hr></hr>
                <TeacherEdit 
                    hostEmail={auth.email} hasModifications={hasModifications} 
                    isJoined={isJoined} showSaveChanges={showSaveChanges} 
                />
                {formUpdates.ui.expanded && (
                    <>
                        <hr></hr>
                        <StudentEdit />
                    </>
                    
                )}
            </ClassEditContext.Provider>

            {showSaveChanges && !generalLocked && (
                <div className="p-2 flex items-stretch gap-2">
                    <button type="button" className="flex-1 bg-[--theme-secondary]" onClick={() => dispatch({ type: "reset" })}>Cancel</button>
                    <Button className={"flex-1 bg-[--theme-secondary] max-[330px]:p-0"}
                        type="button" text={{idleText: "Save Changes"}} disabled={!hasModifications}
                        onClick={handleSaveChangesClick} states={{isLoading: isMutating}} 
                    />
                </div>
            )}
        </form>
    )
}



function TeacherEdit({hostEmail, showSaveChanges, hasModifications, isJoined}) {
    const [assignTeacher, {isLoading: assigning, isError: isAssignError, error: assignError}] = useAssignTeacherMutation()
    const [unassignTeacher, {isLoading: unassigning, isError: isUnassignError, error: unAssignError}] = useUnAssignTeacherMutation()
    const {inputProps, classId, classGroupId, dispatch, formUpdates} = useContext(ClassEditContext) 
    const [userWantsChange, setUserWantsChange] = useState(false)

    const currentValue = inputProps.getValue("assignedTeacher")
    const defaultValue = inputProps.getDefaultValue('assignedTeacher')
    const isAssignedAlready = !!defaultValue
    const teacherLocked = formUpdates.ui.lockedInput.includes("teacher")
    const showTeacherEditable = isAssignedAlready || userWantsChange

    const reset = () => {
        dispatch({type: "reset"})
        setUserWantsChange(false)
    }

    
    async function myAssing() {
        try {
            if (isAssignedAlready) {
                await unassignTeacher({recepientEmail: defaultValue, classGroupId, classId}).unwrap()
            } else {
                await assignTeacher({
                    recepientEmail: currentValue, hostEmail, 
                    classGroupId, classId, className: inputProps.getValue("className")
                }).unwrap()
            }
            reset()
        } catch (error) {
            console.log("There was error while assigning: ", error)
        }
    }
    return (
        <div className="p-2 flex flex-col gap-2">
            <div className="flex items-center gap-x-2 gap-y-1 flex-wrap">
                {isJoined ? (
                    <div className="gap-1 flex items-center justify-center">
                        <IconUser />
                        <span>Assigned By</span>
                        <span className="font-medium">{isJoined.email}</span>
                    </div>
                ) : showTeacherEditable ? (
                    <>  
                        <div className="font-semibold gap-1 flex items-center justify-center">
                            <span>Assigned Teacher</span>
                            <IconEdit onClick={() => {setUserWantsChange(true); dispatch({type: "lockInput", value: "general"})}} />
                        </div>
                        <Input 
                            name={'assignedTeacher'} className="basis-4/5 sm:basis-0"
                            placeholder={"Enter teacher's email"} autoFocus
                            disabled={isAssignedAlready || teacherLocked} {...inputProps}
                        />
                        {isAssignedAlready && <IconCheckbox className="text-green-500" />}
                    </>
                ) : (
                    <div className="flex items-center gap-2 text-yellow-400">
                        <IconAlertCircle />
                        <div className="p-1 border-transparent border">No Teacher assigned to this class,
                            <span className="text-blue-500"
                                onClick={() => {setUserWantsChange(true); dispatch({type: "lockInput", value: "general"})}}
                            >{" assign now."}</span>
                        </div>
                    </div>
                )}
            </div>

            {((showSaveChanges && !teacherLocked) || userWantsChange) && (
                <div className="flex flex-col items-end gap-2">
                    <div className={"flex items-center gap-2 justify-end"}>
                        <button
                            className="rounded-3xl bg-[--theme-secondary] py-1 px-3" type="button"
                            onClick={reset}
                        >Cancel</button>
                        <Button className={"rounded-3xl py-1 px-3"} type={"button"}  disabled={isAssignedAlready ? false : !hasModifications}
                            states={{ isLoading: assigning, isError: isAssignedAlready ? isUnassignError : isAssignError }}
                            text={{ idleText: isAssignedAlready ? "Unassign" : "Assign" }}
                            onClick={myAssing}
                        />
                    </div>
                    {isAssignedAlready ? (
                        isUnassignError && <Alert show={true} type="warning" text={unAssignError}></Alert>
                    ) : (
                        isAssignError && <Alert show={true} type="warning" text={assignError}></Alert>
                    )}
                </div>
            )}
        </div>
    )
}



function StudentEdit() {
    const {classId, classGroupId, formUpdates, dispatch} = useContext(ClassEditContext) 
    const {data: details, isLoading: loadingDetails} = useGetClassByIdQuery({classId, classGroupId})
    const oldStudentIds = selectStudentIdsEdit(details)
    const hasStudents = oldStudentIds.length > 0

    return (
        <div className="p-2 flex flex-col gap-2 ">
            <div className="flex gap-2">
                <div className="font-medium">Students</div>  
            </div>
            {selectStudentIdsFromUpdates(formUpdates).filter(id => formUpdates.students.meta[id] == "added").map(studentId => 
                <SingleStudentEdit 
                    key={studentId} studentId={studentId} 
                    type={"added"} 
                />
            )}
            {loadingDetails ? (
                <div>Loading students data ...</div>
            ) : hasStudents ? oldStudentIds.map(studentId =>
                <SingleStudentEdit 
                    key={studentId} studentId={studentId}
                    type={formUpdates.students.meta[studentId]}
                />
            ) : (
                <div className="flex gap-2 text-yellow-400">  
                    <IconAlertCircle />
                    <div>This class has no student, click on the edit icon to add</div>
                </div>
            )}
            <button data-edit-type="studentEdit" className="self-start flex p-2 gap-1 bg-[--theme-secondary]" 
                type="button" onClick={
                    () => {dispatch({type: "add_student"}); dispatch({type: "lockInput", value: "teacher"})
                }}>
                <IconCirclePlus className="self-end text-green-400" /> 
                <span>Add Student</span>
            </button>
        
        </div>
    )
}



function SingleStudentEdit({type, studentId}) {
    const {inputProps, formUpdates, dispatch} = useContext(ClassEditContext) 

    const fields = [`students.entities.${studentId}.rollNo`, `students.entities.${studentId}.studentName`]

    const [rollNoUi, nameUi] = [inputProps.uiGetter(fields[0]), inputProps.uiGetter(fields[1])]
    const isStudentModified = rollNoUi.isModified || nameUi.isModified

    const generalLocked = formUpdates.ui.lockedInput.includes("general")
    const disabled = type == "removed" || generalLocked

    // TODO: Take away condition from reducer and try to not run effect code when type is added
    // also prevent useEffect from running when type changes
    useEffect(() => {
        dispatch({
            type: "update_student",
            id: studentId,
            isStudentModified: rollNoUi.isModified || nameUi.isModified
        })
    }, [rollNoUi.isModified, nameUi.isModified, studentId, dispatch])

    const newInputProps = {...inputProps, disabled, style: "custom"}

    const getClassname = (isFocused) => classNames(
        { 'border-red-500 bg-transparent': type == "removed" },
        { 'border-green-500 bg-transparent': type == "added" },
        {[classNames(
            { 'border-yellow-500 bg-transparent': isStudentModified },
            { 'bg-theme-100 border-transparent': !isStudentModified && isFocused },
            { 'bg-transparent border-theme-100': !isStudentModified && !isFocused },
        )]: type != "added" && type != "removed"}
    )

    const restore = () => dispatch({
        type: "update_student",
        id: studentId,
        isStudentModified: rollNoUi.isModified || nameUi.isModified
    })

    return (
        <div className={`flex items-center gap-2`} key={studentId}>
            {type == "removed" ? (
                <IconTrashOff className="text-red-500" onClick={restore} />
            ) : type == "added" ? (
                <Cross size={24} className="stroke-red-500" onClick={() => dispatch({ type: "remove_student", id: studentId })} />
            ) : (
                <IconTrash className="text-white" stroke={1} onClick={
                    () => {dispatch({ type: "remove_student", id: studentId }); dispatch({type:"lockInput", value: "teacher"})}
                } />
            )}
            <Input {...newInputProps} className={[
                    getClassname(rollNoUi.isFocused),
                    ""
                ].join(" ")} name={fields[0]} type="number" placeholder="Roll No" />
            <Input {...newInputProps} className={getClassname(nameUi.isFocused)} name={fields[1]} placeholder="Name" />
        </div>
    )
}

export default ClassEdit