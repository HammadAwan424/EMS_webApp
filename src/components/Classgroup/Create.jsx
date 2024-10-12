import { useNavigate } from "react-router-dom"
import { inputClasses, NewClass, reducer, reducerInitState, uiReducer, useSubmitChanges } from "./Common"
import { useEffect } from "react"
import { useImmerReducer } from "use-immer"
import { useEditClassGroupMutation, useGetAuthQuery } from "src/api/apiSlice"
import Popup from "../CommonUI/Popup"
import { IconAlertCircle, IconCirclePlus } from "@tabler/icons-react"
import dot from "dot-object"
import isEqual from "lodash.isequal"
import Button from "../CommonUI/Button"
import { firestore } from "src/firebase/config"
import { collection, doc } from "firebase/firestore"


function ClassGroupCreate() {

    const navigate = useNavigate()
    const {data: Auth} = useGetAuthQuery()
    const [updates, dispatch] = useImmerReducer(reducer, {
        classes: {}, 
        editors: {},
        meta: {classIds: []},
        cgAdmin: Auth.uid 
    })
    const [ui, uiDispatch] = useImmerReducer(uiReducer, {
        activeEdits: {
            classGroupName: true
        }
    })  
    const [editClassGroup, { isLoading: mutating, data, isUninitialized, isSuccess }] = useEditClassGroupMutation()
    const CLASS_GROUP_ID =  doc(collection(firestore, "classGroups")).id

    const CLASS_COUNT = updates.meta.classIds.length

    
    const {popup, setPopup, handleSubmit} = useSubmitChanges({
        CLASS_COUNT, reset, updates,
        mutationFunc: () => editClassGroup({classGroupId: CLASS_GROUP_ID, create: true, ...updates})
    })
    

    const getValue = (name) => {
        return dot.pick(name, updates) ?? ""
    }

    function reset() {
        dispatch({type: "reset"})
        uiDispatch({type: "reset"})
    }
    const hasNewClasses = updates.meta.classIds.length > 0

    useEffect(() => {
        if (isSuccess) {
            navigate("/")
        } 
    }, [isSuccess])

    if (isSuccess) {
        return null
    }

    return(
        <>
        <div className="p-4 flex flex-col gap-3" onSubmit={(e) => handleSubmit({event: e})}>
            <form className="grid grid-cols-[auto,1fr] gap-2 items-center">
                
                <div className="flex">
                    <span className="text-xl text-[--text-secondary-col]">Name</span>
                </div>
                
                <input className={[
                        "font-medium text-2xl",
                        inputClasses({editing: ui.activeEdits.classGroupName})
                    ].join(" ")}
                    name="classGroupName" value={getValue("classGroupName")} required 
                    onChange={(e) => dispatch({type: "fieldUpdate", event: e})}
                    placeholder="ClassGroup Name" autoComplete="off" disabled={!ui.activeEdits.classGroupName}
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
                    
                    <div className="flex flex-col md:flex-row self-stretch w-full items-end md:items-center">

                        {CLASS_COUNT == 0 && (
                            <div className="flex gap-2 text-yellow-400">
                                <IconAlertCircle />
                                <div>This classGroup has no classes, click on Add Class button to do so</div>
                            </div>
                        )}

                        <div className="flex-1"></div>

                        <button className="flex p-2 gap-1 bg-[--theme-secondary]" type="button"
                            onClick={() => dispatch({ type: "addClass", classGroupId: CLASS_GROUP_ID })}
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
                                states={{isLoading: mutating}} text={{idleText: "Save Changes"}} 
                            />
                        </div>
                    )}
                </div>
            </form>
        
        </div>
       
        <Popup
            text={popup.text} visible={popup.visible} confirmHandler={popup.handler} 
            setVisible={(boolean) => setPopup({...popup, visible: boolean})} isLoading={mutating}
        />
        </>
    )
}

export default ClassGroupCreate