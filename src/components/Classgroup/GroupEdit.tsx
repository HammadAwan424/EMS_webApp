import {  IconAlertCircle, IconArrowLeft, IconCirclePlus  } from "src/IconsReexported.jsx"
import getValueFactory from "../util/getValueFactory.ts"
import { useNavigate, useParams } from "react-router-dom"
import { useGetAuthQuery, useGetClassGroupsQuery, useEditClassGroupMutation } from "src/api/rtk-query/extendedApi.ts"
import Button from "../CommonUI/Button.jsx"
import ClassEdit from "../Class/ClassEdit.jsx"
import { getReducer, initialUiState, inputClasses, NewClass, reducer, uiReducer, useSubmitChanges } from "./GroupCommon.jsx"
import { useImmerReducer } from "use-immer"
import { useAppAuthContext } from "../Auth/AuthRequired.tsx"
import { ClassGroupAppModel, ClassGroupAppPatch } from "#src/api/rtk-query/classgroups/util.ts"
import { ClassAppModel } from "#src/api/rtk-query/class/util.ts"
import { deepDiff, isEmptyObj } from "#src/api/util/diff/index.ts"


function ClassGroupEdit() {

    const appAuth = useAppAuthContext()
    const {data: classGroups, isSuccess} =  useGetClassGroupsQuery(appAuth.uid)

    // the data is not yet loaded
    if (!isSuccess) {
        return null
    }

    const {Id: classGroupId = ""} = useParams()
    const navigate = useNavigate()
    const classGroup = classGroups.entities[classGroupId]

    const [updatedClassGroup, dispatch] = useImmerReducer(getReducer(classGroup), classGroup)
    const [ui, uiDispatch] = useImmerReducer(uiReducer, initialUiState) 
    const [editClassGroup, { isLoading: isMutating }] = useEditClassGroupMutation()
    
    const patch = deepDiff(classGroup, updatedClassGroup) as ClassGroupAppPatch
    const [existingClassCount, resultingClassCount] = [
        Object.keys(classGroup.classes).length,
        Object.keys(updatedClassGroup.classes).length
    ]
    const newClasses = resultingClassCount > existingClassCount

    const mutationFunc = () => 
        editClassGroup({classGroupId, newClasses, patch}).unwrap()
    const handleSubmit = useSubmitChanges({
        resultingClassCount, patch,
        mutationFunc, reset
    })

    function reset() {
        dispatch({type: 'reset'})
        uiDispatch({type: 'reset'})
    }

    const getValue = getValueFactory(classGroup, patch)

    return (
        <>
        <div className="flex flex-col gap-3">
            <IconArrowLeft onClick={() => navigate(-1)} />
            <form className="grid grid-cols-[auto,1fr] gap-2 items-center" onSubmit={(e) => handleSubmit(e)}>
                
                <div className="flex">
                    <span className="text-xl text-[--text-secondary-col]">Name</span>
                </div>
                
                <input className={[
                        "font-medium text-2xl",
                        inputClasses({editing: ui.activeEdits.classGroupName})
                    ].join(" ")}
                    onFocus={() => uiDispatch({type: "editToggle", specific: "classGroupName"})}
                    name="classGroupName" value={getValue("classGroupName").c} required 
                    onChange={(e) => dispatch({type: "fieldUpdate", event: e})}
                    placeholder="ClassGroup Name" autoComplete="off"
                />

                <span className="text-xl text-[--text-secondary-col]">Classes</span>
                <span className="justify-self-end">Has {resultingClassCount==0 ? "no" : resultingClassCount} classes</span>
                <div className="col-span-2 flex gap-2 flex-col">
                    {newClasses && (
                        <div>
                            {Object.keys(patch.classes as NonNullable<typeof patch.classes>).map(
                                id => <NewClass id={id} getValue={getValue} dispatch={dispatch} key={id} />)
                            }
                        </div>
                    )}
                    
                    <div className="flex self-stretch w-full items-center">

                        {resultingClassCount == 0 && (
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


                    {(ui.activeEdits.classGroupName || !isEmptyObj(patch)) && (
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


            {Object.entries(classGroup.classes).map(
                ([id, sampleData]) => <ClassEdit sampleData={sampleData} classGroupId={classGroupId} classId={id} key={id} />)
            }
        
        </div>
        </>
    )
}



export default ClassGroupEdit