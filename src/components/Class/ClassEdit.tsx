import { skipToken } from "@reduxjs/toolkit/query"
import {  IconEdit, IconCircleArrowUpFilled, IconAlertCircle, IconCirclePlus, IconTrashOff, IconTrash, IconCheckbox, IconUser  } from "src/IconsReexported.jsx"
import classNames from "classnames"
import { createContext, useContext, useEffect, useState } from "react"
import Button from "../CommonUI/Button.tsx"
import { Cross } from "../CommonUI/Icons.jsx"
import MediaQuery from "react-responsive"
import { Input, InputProps, useInput } from "../CommonUI/Input.jsx"
import { getHandleSaveChanges, selectAddedStudents, selectNotAddedStudents } from "./Common.tsx"
import Alert from "../CommonUI/Alert.jsx"
import { useEditClassMutation, useGetClassByIdQuery } from "#src/api/rtk-query/extendedApi.ts"
import getValueFactory from "../util/getValueFactory.ts"
import { useAppAuthContext } from "../Auth/AuthRequired.tsx"
import { ClassGroupAppModel } from "#src/api/rtk-query/classgroups/util.ts"
import { ClassAppPatch, ClassId } from "#src/api/rtk-query/class/util.ts"
import { cva } from "class-variance-authority"
import { useImmerReducer } from "use-immer"
import { classReducer, classUIReducer, initialClassUIState, ClassActionType, ClassUIState, ClassState, ClassUIActionType } from "./reducer.ts"
import { usePopup } from "../CommonUI/Popup.tsx"
import { deepDiff, isEmptyObj } from "#src/api/util/diff/index.ts"
import { useClassLayoutContext } from "./ClassLayout.tsx"

// Context for ClassEdit child components
type ClassEditGlobals = {
    classUIState: ClassUIState,
    initialClassState: ClassState,
    diffState: ClassAppPatch,
    updatedClassState: ClassState,
    partialInputProps: Omit<InputProps, "name" | "stylesType">,
    hasModifications: boolean,
    overriddenInputChange: (action: Extract<ClassActionType, {type: "input_change"}>) => void,
    overriddenReset: () => void;
    classDispatch: React.Dispatch<ClassActionType>,
    classUIDispatch: React.Dispatch<ClassUIActionType>
}
const ClassEditContext = createContext<undefined | ClassEditGlobals>(undefined)
const useClassEditContext = () => {
    const classEditGlobals = useContext(ClassEditContext)
    if (!classEditGlobals) 
        throw new Error(
            "No provider detected for ClassEditContext"
    )
    return classEditGlobals
}


// Marks the beginning of ClassEdit (main) component
type ClassEditProps = {
    sampleData: ClassGroupAppModel['classes'][ClassId],
}
function ClassEdit({sampleData}: ClassEditProps) {
    // UI Hooks
    const {
        InputUIToggle, InputUIReset, InputUIGetter
    } = useInput()
    const [classUIState, classUIDispatch] = useImmerReducer(classUIReducer, initialClassUIState)

    
    const { classIdentifier } = useClassLayoutContext()
    // Core Hooks
    const {data: initialClassState} = useGetClassByIdQuery(classUIState.hasExpandedOnce ? classIdentifier : skipToken) 
    // TODO: Handles this outside somewhere
    if (!initialClassState || !initialClassState.exists) return ""
    // main reducer for recording changes
    const [updatedClassState, classDispatch] = useImmerReducer(classReducer, initialClassState)

    
    // UI Calculation
    const diffState = deepDiff(initialClassState, updatedClassState)
    const hasModifications = !isEmptyObj(diffState)

    const overriddenReset = () => {
        InputUIReset()
        classUIDispatch({type: "ui/reset"})
        classDispatch({type: "reset", initialState: initialClassState})
    }
    const overriddenInputChange: ClassEditGlobals['overriddenInputChange'] = (action) => {
        const _ = action.path == "assignedTeacher" 
            ? classUIDispatch({type: "ui/lockInput", value: "general"})
            : classUIDispatch({type: "ui/lockInput", value: "teacher"})
        classDispatch(action)
    }

    const getValue = getValueFactory(initialClassState, updatedClassState)
    const setValue = (value: string, path: string) => 
        classDispatch({value, path, type: "input_change"})

    const partialInputProps: ClassEditGlobals['partialInputProps']  = {
        getValue, setValue,
        InputUIToggle, InputUIGetter,
    }

    return (
        <ClassEditContext.Provider value={{
                partialInputProps, updatedClassState, classUIState, hasModifications, initialClassState, diffState, overriddenInputChange, overriddenReset, classDispatch, classUIDispatch
        }}>
            <ClassEditForm></ClassEditForm>
        </ClassEditContext.Provider>
    )
}



function ClassEditForm() {
    const { 
        hasModifications, classUIState, partialInputProps, updatedClassState,
        classUIDispatch, overriddenReset
    } = useClassEditContext()
    const { isJoined, classIdentifier } = useClassLayoutContext()

    const [editClass, { isLoading: isMutating }] = useEditClassMutation()
    // currently one usePopup is assinged to only one loadingState
    const HandlePopup = usePopup({ isLoading: isMutating })
    const handleSaveChanges = getHandleSaveChanges(
        updatedClassState, classIdentifier,
        overriddenReset, editClass,
        HandlePopup,
    )

    // unique case when they are not equal, user types something and clear it back
    // now other group is still locked (true) but hasModifications is false
    const showSaveChanges = classUIState.lockedInput.length > 0 || hasModifications
    const generalLocked = classUIState.lockedInput.includes("general")
    return (
        <form className="border rounded-md">
                {/* <div className="w-40 h-40">
                    <Pie percentage={20} stroke={5}></Pie>
                </div> */}

                <div className="flex items-center gap-2 px-2 py-2 relative" >
                    <Input {...partialInputProps} name="className" className="flex-grow-0 basis-auto w-40" 
                        disabled={isJoined || generalLocked} 
                    />
                    {/* Below one is changed to above by extracting input and ui logic input Input.jsx 
                        Replacing it everywhere not only here */}
                    {/* <input className={inputClasses({editing:activeEdits.className})} 
                    required type="text" placeholder="Class Name" 
                    value={getValue("className")} name="className" 
                    onChange={(e) => classDispatch({e: e, type: "input_change"})} 
                    onFocus={() => classDispatch({type: "editToggle", broad: "generalUpdates", specific: "className"})}
                    autoComplete="off"/> */}
                    <MediaQuery minWidth={640}>
                        {matches => matches ? <hr className="flex-auto" /> 
                            : <div className="flex-1"></div>}
                    </MediaQuery>
                    <IconCircleArrowUpFilled className={classNames(
                        "transition",
                        classUIState.expanded && "-rotate-180"
                    )} onClick={() => {classUIDispatch({type: "ui/expand", value: !classUIState.expanded})}} />
                </div>


                <hr></hr>
                <TeacherEdit />
                {classUIState.expanded && (
                    <>
                        <hr></hr>
                        <StudentEdit />
                    </>
                    
                )}
            

            {showSaveChanges && !generalLocked && (
                <div className="p-2 flex items-stretch gap-2">
                    <button type="button" className="flex-1 bg-[--theme-secondary]" onClick={overriddenReset}>Cancel</button>
                    <Button className={"flex-1 bg-[--theme-secondary] max-[330px]:p-0"}
                        type="button" text={{idleText: "Save Changes"}} disabled={!hasModifications}
                        onClick={handleSaveChanges} states={{isLoading: isMutating}} 
                    />
                </div>
            )}
        </form>
    )
}


function TeacherEdit() {
    const { classIdentifier, isJoined } = useClassLayoutContext()
    const { email } = useAppAuthContext()
    const { 
        partialInputProps, classUIState, hasModifications,
        overriddenReset, classUIDispatch
    } = useClassEditContext() 

    const [assignTeacher, {isLoading: assigning, isError: isAssignError, error: assignError}] = useAssignTeacherMutation()
    const [unassignTeacher, {isError: isUnassignError, error: unAssignError}] = useUnAssignTeacherMutation()
    const [userWantsChange, setUserWantsChange] = useState(false)

    const valueDiff = partialInputProps.getValue("assignedTeacher")
    const isAssignedAlready = !!valueDiff.baseValue
    const teacherLocked = classUIState.lockedInput.includes("teacher")
    const showTeacherEditable = isAssignedAlready || userWantsChange
    const showSaveChanges = classUIState.lockedInput.length > 0 || hasModifications

    const reset = () => {
        overriddenReset()
        setUserWantsChange(false)
    }

    
    async function myAssing() {
        try {
            if (isAssignedAlready) {
                await unassignTeacher({recepientEmail: valueDiff.baseValue, classIdentifier}).unwrap()
            } else {
                await assignTeacher({
                    recepientEmail: valueDiff.c, hostEmail: email, 
                    classIdentifier, className: partialInputProps.getValue("className")
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
                        <span className="font-medium">{ email }</span>
                    </div>
                ) : showTeacherEditable ? (
                    <>  
                        <div className="font-semibold gap-1 flex items-center justify-center">
                            <span>Assigned Teacher</span>
                            <IconEdit onClick={() => {setUserWantsChange(true); classUIDispatch({type: "ui/lockInput", value: "general"})}} />
                        </div>
                        <Input 
                            name={'assignedTeacher'} className="basis-4/5 sm:basis-0"
                            placeholder={"Enter teacher's email"} autoFocus
                            disabled={isAssignedAlready || teacherLocked} {...partialInputProps}
                        />
                        {isAssignedAlready && <IconCheckbox className="text-green-500" />}
                    </>
                ) : (
                    <div className="flex items-center gap-2 text-yellow-400">
                        <IconAlertCircle />
                        <div className="p-1 border-transparent border">No Teacher assigned to this class,
                            <span className="text-blue-500"
                                onClick={() => {setUserWantsChange(true); classUIDispatch({type: "ui/lockInput", value: "general"})}}
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
    const { classIdentifier } = useClassLayoutContext()
    const { updatedClassState, initialClassState, diffState, classDispatch, classUIDispatch } = useClassEditContext() 
    const {data: details, isLoading: loadingDetails} = useGetClassByIdQuery(classIdentifier)

    const addedStudents = selectAddedStudents(initialClassState, diffState, false)
    const addedStudentIds = addedStudents.ids
    
    const remainingStudents = selectNotAddedStudents(initialClassState, diffState, true)
    const remainingIds = remainingStudents.ids

    // for auto-incrementing id
    const newAutoRollNo = Math.max(0, remainingIds[-1], addedStudentIds[-1]) + 1

    const hasStudents = remainingIds.length > 0

    return (
        <div className="p-2 flex flex-col gap-2 ">
            <div className="flex gap-2">
                <div className="font-medium">Students</div>  
            </div>
            {addedStudentIds.map(studentId => 
                <SingleStudentEdit 
                    key={studentId} studentId={studentId} 
                    type={"added"} 
                />
            )}
            {loadingDetails ? (
                <div>Loading students data ...</div>
            ) : hasStudents ? remainingIds.map(studentId =>
                <SingleStudentEdit 
                    key={studentId} studentId={studentId}
                    type={remainingStudents.types[studentId]}
                />
            ) : (
                <div className="flex gap-2 text-yellow-400">  
                    <IconAlertCircle />
                    <div>This class has no student, click on the edit icon to add</div>
                </div>
            )}
            <button data-edit-type="studentEdit" className="self-start flex p-2 gap-1 bg-[--theme-secondary]" 
                type="button" onClick={
                    () => {classDispatch({type: "add_student", payload: {rollNo: newAutoRollNo+""}}); 
                    classUIDispatch({type: "ui/lockInput", value: "teacher"})
                }}>
                <IconCirclePlus className="self-end text-green-400" /> 
                <span>Add Student</span>
            </button>
        
        </div>
    )
}



function SingleStudentEdit({type, studentId}) {
    const {partialInputProps, updatedClassState, classDispatch} = useContext(ClassEditContext) 

    const fields = [`students.entities.${studentId}.rollNo`, `students.entities.${studentId}.studentName`]

    const [rollNoUi, nameUi] = [partialInputProps.uiGetter(fields[0]), partialInputProps.uiGetter(fields[1])]
    const modified = rollNoUi.isModified || nameUi.isModified

    const generalLocked = updatedClassState.ui.lockedInput.includes("general")
    const disabled = type == "removed" || generalLocked

    // TODO: Take away condition from reducer and try to not run effect code when type is added
    // also prevent useEffect from running when type changes
    useEffect(() => {
        classDispatch({
            type: "update_student",
            id: studentId,
            modified: rollNoUi.isModified || nameUi.isModified
        })
    }, [rollNoUi.isModified, nameUi.isModified, studentId, classDispatch])

    const newInputProps = {...partialInputProps, disabled, style: "custom"}

    // DONE: use cva (class variance authority) here
    const nonPriorityStyles = (isFocused: boolean) => classNames(
        { 'border-yellow-500 bg-transparent': modified },
        { 'border-transparent bg-theme-100': !modified && isFocused },
        { 'border-theme-100 bg-transparent': !modified && !isFocused },
    )
    const styles = (isFocused: boolean) => cva('', {
        variants: {
            priority: {
                removed: 'border-red-500 bg-transparent',
                added: 'border-green-500 bg-transparent',
                false: nonPriorityStyles(isFocused),
            },
        },
    })

    const restore = () => classDispatch({
        type: "update_student",
        id: studentId,
        modified: rollNoUi.isModified || nameUi.isModified
    })

    return (
        <div className={`flex items-center gap-2`} key={studentId}>
            {type == "removed" ? (
                <IconTrashOff className="text-red-500" onClick={restore} />
            ) : type == "added" ? (
                <Cross size={24} className="stroke-red-500" onClick={() => classDispatch({ type: "remove_student", id: studentId })} />
            ) : (
                <IconTrash className="text-white" stroke={1} onClick={
                    () => {classDispatch({ type: "remove_student", id: studentId }); classDispatch({type:"lockInput", value: "teacher"})}
                } />
            )}
            <Input {...newInputProps} className={getClassname(rollNoUi.isFocused)} name={fields[0]} type="number" placeholder="Roll No" />
            <Input {...newInputProps} className={getClassname(nameUi.isFocused)} name={fields[1]} placeholder="Name" />
        </div>
    )
}

export default ClassEdit