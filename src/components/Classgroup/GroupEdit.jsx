import {  IconAlertCircle, IconCirclePlus  } from "src/IconsReexported.jsx"
import dot from "dot-object"
import isEqual from "lodash.isequal"
import { useParams } from "react-router-dom"
import { useGetAuthQuery, useGetClassGroupsQuery, useEditClassGroupMutation } from "src/api/apiSlice"
import Button from "../CommonUI/Button"
import ClassEdit from "../Class/ClassEdit"
import { initialUiState, inputClasses, NewClass, reducer, reducerInitState, uiReducer, useSubmitChanges } from "./GroupCommon"
import { useImmerReducer } from "use-immer"

function createInitialState(sampleClasses) {
    const initialState = {classes: {}, meta: {classIds: []}}
    for (const [id, sampleClass] of Object.entries(sampleClasses)) {
        const classState = {className: sampleClass.className, assignedTeacher: sampleClass.assignedTeacher, students: {}}
        initialState.classes[id] = classState
        initialState.meta.classIds.push(id)
    }
    return initialState
}


function ClassGroupEdit() {

    const {data: Auth, isLoading: loadingAuth} = useGetAuthQuery()
    const {data: classGroups, isLoading} = useGetClassGroupsQuery(Auth.uid)

    const {Id: classGroupId} = useParams()
    const classGroup = classGroups.find((entry) => entry.id == classGroupId)

    const sampleClasses = createInitialState(classGroup.classes || {})
    const [updates, dispatch] = useImmerReducer(reducer, reducerInitState)
    const [ui, uiDispatch] = useImmerReducer(uiReducer, initialUiState) 
    const [editClassGroup, { isLoading: isMutating, data, isUninitialized }] = useEditClassGroupMutation()
    
    const CLASS_COUNT = sampleClasses.meta.classIds.length + updates.meta.classIds.length

    const {handleSubmit} = useSubmitChanges({
        CLASS_COUNT, reset, updates,
        mutationFunc: () => editClassGroup({classGroupId: classGroupId, create: false, ...updates}).unwrap()
    })

    function reset() {
        dispatch({type: 'reset'})
        uiDispatch({type: 'reset'})
    }

    const getValue = (name) => {
        return dot.pick(name, {...classGroup, ...updates}) ?? ""
    }

    const hasNewClasses = updates.meta.classIds.length > 0


    return (
        <>
        <div className="flex flex-col gap-3" onSubmit={(e) => handleSubmit({event: e})}>
            <form className="grid grid-cols-[auto,1fr] gap-2 items-center">
                
                <div className="flex">
                    <span className="text-xl text-[--text-secondary-col]">Name</span>
                </div>
                
                <input className={[
                        "font-medium text-2xl",
                        inputClasses({editing: ui.activeEdits.classGroupName})
                    ].join(" ")}
                    onFocus={() => uiDispatch({type: "editToggle", specific: "classGroupName"})}
                    name="classGroupName" value={getValue("classGroupName")} required 
                    onChange={(e) => dispatch({type: "fieldUpdate", event: e})}
                    placeholder="ClassGroup Name" autoComplete="off"
                />

                <span className="text-xl text-[--text-secondary-col]">Classes</span>
                <span className="justify-self-end">Has {CLASS_COUNT==0 ? "no" : CLASS_COUNT} classes</span>
                <div className="col-span-2 flex gap-2 flex-col">
                    {hasNewClasses && (
                        <div>
                            {updates.meta.classIds.map(
                                id => <NewClass id={id} getValue={getValue} dispatch={dispatch} key={id} />)
                            }
                        </div>
                    )}
                    
                    <div className="flex self-stretch w-full items-center">

                        {CLASS_COUNT == 0 && (
                            <div className="flex gap-2 text-yellow-400">
                                <IconAlertCircle />
                                <div>This classGroup has no classes, click on Add Class button to do so</div>
                            </div>
                        )}

                        <div className="flex-1"></div>

                        <button className="flex p-2 gap-1 bg-[--theme-secondary]" type="button"
                            onClick={() => dispatch({ type: "addClass", classGroupId: classGroupId })}
                        >
                            <IconCirclePlus className="text-green-400" />
                            <span>Add Class</span>
                        </button>
                    </div>


                    {(ui.activeEdits.classGroupName || !isEqual(reducerInitState, updates)) && (
                        <div className="flex items-center gap-2">
                            <button type="button" className="flex-1 bg-[--theme-secondary]" 
                                onClick={reset}>Cancel</button>
                            <Button className="flex-1 bg-[--theme-secondary]" 
                                states={{isLoading: isMutating}} text={{idleText: "Save Changes"}} 
                            />
                        </div>
                    )}
                </div>
            </form>


            {sampleClasses.meta.classIds.map(
                id => <ClassEdit sampleData={sampleClasses.classes[id]} classGroupId={classGroupId} classId={id} key={id} />)
            }
        
        </div>
        </>
    )
}



export default ClassGroupEdit