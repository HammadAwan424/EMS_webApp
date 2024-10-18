import { skipToken } from "@reduxjs/toolkit/query"
import {  IconEdit, IconCircleArrowDownFilled, IconCircleArrowUpFilled, IconAlertCircle, IconCirclePlus, IconMenu2, IconTrashOff, IconTrash, IconCheckbox  } from "src/IconsReexported.jsx"
import classNames from "classnames"
import dot from "dot-object"
import isEqual from "lodash.isequal"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { selectStudentIds, useAssignTeacherMutation, useDeleteClassMutation, useEditClassMutation, useGetAuthQuery, useGetClassByIdQuery, useUnAssignTeacherMutation } from "src/api/apiSlice"
import { useImmerReducer } from "use-immer"
import Button from "../CommonUI/Button"
import { Cross } from "../CommonUI/Icons"
import Popup from "../CommonUI/Popup"
import MediaQuery from "react-responsive"
import { Input, useInput } from "../CommonUI/Input"
import { createSelector } from "@reduxjs/toolkit"
import { classEditReducer, classEditReducerInitialState, dispatchWrapper } from "./reducer"

const staticRefArr = []
const staticRefObj = {}

const selectStudentsEntities = state => state?.students?.entities ?? staticRefObj
const selectStudentsIdsArray = (state) => state?.students?.ids ?? staticRefArr
const selectStudentsIds = createSelector(
    selectStudentsEntities,
    selectStudentsIdsArray,
    (entities, studentIds) => {
        return studentIds.toSorted((a, b) => entities[a].rollNo - entities[b].rollNo)
    }
)
const selectStudentsIdsFromUpdates = createSelector(
    selectStudentsEntities,
    selectStudentsIdsArray,
    (state) => state?.students?.meta ?? staticRefObj,
    (entities, studentIds, metaObj) => 
        studentIds.filter(id => metaObj[id] != "removed").toSorted((a, b) => entities[a].rollNo - entities[b].rollNo)
    
)
export {selectStudentsEntities, selectStudentsIds}

const ClassEditContext = createContext(null)

function ClassEdit({sampleData, id}) {

    const { Id: classGroupId } = useParams()
    const {data: auth} = useGetAuthQuery()
    const [expanded, setExpanded] = useState(false)
    const [hasExpandedOnce, setHasExpandedOnce] = useState(false)
    const [dropdown, setDropdown] = useState(false)
    
    const {uiToggle, uiGetter, uiReset} = useInput()
    const [deleteClass, {isLoading: deleting}] = useDeleteClassMutation()
    const [editClass, {isLoading: mutating}] = useEditClassMutation()
    const [formUpdates, realDispatch] = useImmerReducer(classEditReducer, classEditReducerInitialState)
    const dispatch = useMemo(() => dispatchWrapper(realDispatch, uiReset), [realDispatch, uiReset])
    const {data: details} = useGetClassByIdQuery(hasExpandedOnce ? {classGroupId, classId: id} : skipToken) 
    const [popup, setPopup] = useState({
        text: "",
        handler: () => {},
        visible: false,
        loadingType: -1
    })
    
    const {ui, ...formUpdatesNoUi} = formUpdates
    const {ui: _, ...initialStateNoUi} = classEditReducerInitialState
    const hasModifications = !isEqual(formUpdatesNoUi, initialStateNoUi)
    console.log("Has hasModifications: ", hasModifications, ui.lockedInput)
    // unique case when they are not equal, user types something and clear it back
    // now other group is still locked (true) but hasModifications is false
    const showSaveChanges = ui.lockedInput.length > 0 || hasModifications
    const generalLocked = ui.lockedInput.includes("general")

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
    const loadingMap = {
        0: mutating,
        1: deleting
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
        formUpdates.students.ids.forEach(id => {
            const updateType = formUpdates.students.meta[id]
            if (updateType == "added") {
                count.added += 1
            } else if (updateType == "removed") {
                count.removed += 1
            }
        })
        const func = async () => {
            try {
                await editClass({...formUpdatesNoUi, classId: id, classGroupId}).unwrap()
                dispatch({type: "reset"})
            } catch (e) {
                console.log("Coundn't apply changes due to: ", e)
            }
            setPopup({...popup, visible: false})
            }
        if (count.added == 0 && formUpdates.students.ids.length == 0) {
            setPopup({loadingType: 0, text: "You didn't added any new student", visible: true, handler: func})
        } else if (count.added == 0 && formUpdates.students.ids.length == count.removed) {
            setPopup({loadingType: 0, text: "The class will be empty after the update", visible: true, handler: func})
        } else  {
            await func()
        }
    }
    
    console.log("UPDATES: ", formUpdates, "PREVIOUS STATE: ", details)

    return (
        <form className="border rounded-md border-[--text-disabled]">
            {/* <div className="w-40 h-40">
                <Pie percentage={20} stroke={5}></Pie>
            </div> */}

            <div className="flex items-center gap-2 px-2 py-2 relative">
                <Input {...inputProps} name="className" className="flex-grow-0 basis-auto w-40" disabled={generalLocked} />
                {/* Below one is changed to above by extracting input and ui logic input Input.jsx 
                    Replacing it everywhere not only here */}
                {/* <input className={inputClasses({editing:activeEdits.className})} 
                required type="text" placeholder="Class Name" 
                value={getValue("className")} name="className" 
                onChange={(e) => dispatch({e: e, type: "input_change"})} 
                onFocus={() => dispatch({type: "editToggle", broad: "generalUpdates", specific: "className"})}
                autoComplete="off"/> */}
                <MediaQuery minWidth={640}>
                    {matches => matches ? <hr className="flex-auto border-[--text-disabled]" /> 
                        : <div className="flex-1"></div>}
                </MediaQuery>
                {/* <IconMenu2 style={{"anchorName": "--menuBtn"}} onClick={() => setDropdown(true)} className="cursor-pointer" /> */}
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
                <IconCircleArrowUpFilled className={"transition " + (expanded && "-rotate-180") } onClick={handleExpand} />
            </div>

            <ClassEditContext.Provider  value={{inputProps, classId: id, classGroupId, formUpdates, dispatch}}>
                <TeacherEdit hostEmail={auth.email} hasModifications={hasModifications} showSaveChanges={showSaveChanges} />
                {expanded && (
                    <StudentEdit formUpdates={formUpdates} dispatch={dispatch} />
                )}
            </ClassEditContext.Provider>

            {showSaveChanges && !generalLocked && (
                <div className="p-2 flex items-stretch gap-2">
                    <button type="button" className="flex-1 bg-[--theme-secondary]" onClick={() => dispatch({ type: "reset" })}>Cancel</button>
                    <Button className={"flex-1 bg-[--theme-secondary] max-[330px]:p-0"}
                        type="button" text={{idleText: "Save Changes"}} disabled={!hasModifications}
                        onClick={handleSaveChangesClick} states={{isLoading: mutating}} 
                    />
                </div>
            )}

            <Popup
                text={popup.text} visible={popup.visible} confirmHandler={popup.handler}
                setVisible={(boolean) => setPopup({ ...popup, visible: boolean })} isLoading={loadingMap[popup.loadingType]}
            />
        </form>
    )
}



function TeacherEdit({hostEmail, showSaveChanges, hasModifications}) {
    const [assignTeacher, {isLoading: assigning, isError: isAssignError, error: assignError}] = useAssignTeacherMutation()
    const [unassignTeacher, {isLoading: unassigning, isError: isUnassignError, error: unAssignError}] = useUnAssignTeacherMutation()
    const {inputProps, classId, classGroupId, dispatch, formUpdates} = useContext(ClassEditContext) 
    const [userWantsChange, setUserWantsChange] = useState(false)

    const currentValue = inputProps.getValue("assignedTeacher")
    const defaultValue = inputProps.getDefaultValue('assignedTeacher')
    const isAssignedAlready = !!defaultValue
    const teacherLocked = formUpdates.ui.lockedInput.includes("teacher")

    const reset = () => {
        dispatch({type: "reset"})
        setUserWantsChange(false)
    }
    
    async function myAssing() {
        try {
            if (isAssignedAlready) {
                await unassignTeacher({recepientEmail: defaultValue, classGroupId, classId})
            } else {
                await assignTeacher({
                    recepientEmail: currentValue, hostEmail, 
                    classGroupId, classId, className: inputProps.getValue("className")
                }).unwrap()
            }
            reset()
        } catch (error) {
            console.log("THere was error while assigning: ", error)
        }
    }
    return (
        <>
        <div className="p-2 flex items-center gap-x-2 gap-y-1 border-t border-[--text-disabled] flex-wrap">
            {isAssignedAlready || userWantsChange ? (
                <>
                    <div className="font-semibold px-2 w-40">Assigned Teacher</div>
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
            <div className="flex flex-col items-end">
                <div className={"p-2 flex items-center gap-2 justify-end"}>
                    <button
                        className="rounded-3xl bg-[--theme-secondary] py-1 px-3" type="button"
                        onClick={reset}
                    >Cancel</button>
                    <Button className={"rounded-3xl py-1 px-3"}  disabled={!hasModifications}
                        states={{ isLoading: assigning, isError: assignError }}
                        text={{ idleText: isAssignedAlready ? "Unassign" : "Assign" }}
                        onClick={myAssing}
                    />
                </div>
                {assignError && (
                    <div className="px-2 pb-1 text-red-500">{assignError}</div>
                )}
            </div>
        )}
        </>
    )
}



function StudentEdit({formUpdates, dispatch}) {
    const {classId, classGroupId} = useContext(ClassEditContext) 
    const {data: details, isLoading: loadingDetails} = useGetClassByIdQuery({classId, classGroupId})
    const oldStudentIds = selectStudentsIds(details)
    const hasStudents = oldStudentIds.length > 0

    return (
        <div className="p-2 flex flex-col border-t gap-2  border-[--text-disabled]">
            <div className="flex gap-2">
                <div className="font-medium">Students</div>
                <IconEdit onClick={() => hasStudents && dispatch({type: "editToggle", specific: "students"})}  />    
            </div>
            {selectStudentsIdsFromUpdates(formUpdates).filter(id => formUpdates.students.meta[id] == "added").map(studentId => 
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
            <Input {...newInputProps} className={getClassname(rollNoUi.isFocused)} name={fields[0]} placeholder="Roll No" />
            <Input {...newInputProps} className={getClassname(nameUi.isFocused)} name={fields[1]} placeholder="Name" />
        </div>
    )
}

export default ClassEdit