import { IconCircleMinus, IconEdit, IconCircleArrowUpFilled } from "@tabler/icons-react"
import classNames from "classnames"
import dot from "dot-object"
import { doc, collection } from "firebase/firestore"
import { produce } from "immer"
import isEqual from "lodash.isequal"
import { useState } from "react"
import { firestore } from "src/firebase/config"

const reducerInitState = {classes: {}, meta: {classIds: []}}
function reducer(state, action) {
    switch (action.type) {
        case "addClass": {
            const id = doc(collection(firestore, "classGroups", action.classGroupId, "classes")).id
            const newClass = {className: "", assignedTeacher: "", students: {}}
            return {...state, classes: {...state.classes, [id]: newClass}, meta: {...state.meta, classIds: [...state.meta.classIds, id]}}
        }
        case "removeClass": {
            return produce(state, draft => {
                delete draft.classes[action.classId]
                const result = draft.meta.classIds.filter(id => id != action.classId)
                draft.meta.classIds = result
            })
        }
        case "fieldUpdate": {
            const { name, value } = action.event.target
            // console.log(name, value)
            return produce(state, draftState => {
                    dot.str(name, value, draftState)
                }
            )
        }
        case "reset": {
            return reducerInitState
        }
        default: {
            throw Error("Action type didn't match")
        }
    }
}


const initialUiState = {
    activeEdits: {
        classGroupName: false
    }
}
function uiReducer(draft, action) {
    switch (action.type) {
        case "editToggle": {
            draft.activeEdits[action.specific] = true
            break
        }
        case "reset": {
            return initialUiState
        }
        default: {
            throw Error("Action type didn't match")
        }
    }
}

function inputClasses({editing=false, type=""}) {
    return classNames(
        "text-[--text-primary-col] p-1 rounded-md border flex-1 px-2 outline-none min-w-0",
        {"bg-transparent": type != ""},
        {"border-green-500": type=="added"},
        { "border-red-500": type == "removed" },
        { "border-yellow-500": type == "modified"},
        {"border-[--theme-tertiary] bg-transparent" : !editing && type == ""},
        {"bg-[--theme-tertiary] border-transparent": editing && type==""}
    )
}


function NewClass({dispatch, getValue, id}) {

    return (
        <div className="flex items-center gap-2 px-1 py-2">
            <IconCircleMinus className="text-red-500" onClick={() => dispatch({type: "removeClass", classId: id})} />
            <input className={`text-[--text-primary-col] py-1 border rounded-md px-2 outline-none font-bold 
            w-40 min-w-0 bg-[--theme-tertiary] border-transparent`}
                name={`classes.${id}.className`}
                required type="text" placeholder="New Class Name"
                value={getValue(`classes.${id}.className`)} onChange={(e) => dispatch({type: "fieldUpdate", event: e})}
                autoComplete="off" />
            <IconEdit data-edit-type="classNameEdit"/>
            <hr className="flex-auto border-[--text-disabled]" />
            <IconCircleArrowUpFilled />
        </div>
    )
}

const useSubmitChanges = ({
    CLASS_COUNT,
    reset,
    mutationFunc,
    updates
}) => {
    const [popup, setPopup] = useState({
        text: "",
        handler: () => {},
        visible: false,
    })

    async function handleSubmit({event=null}) {
        event.preventDefault()
        const func = async () => {
            try {
                await mutationFunc().unwrap()
                reset()
            } catch (err) {
                console.error("Couldn't save changes", err)
            }
            console.log("Setting popup from ", popup.visible, " to: ", !popup.visible)
            setPopup({...popup, visible: false})
        }
        
        if (isEqual(reducerInitState, updates)) {
            reset()
        } else if (CLASS_COUNT == 0) {
            setPopup({
                visible: true, handler: func,
                text: "You have not added any class yet, want to proceed?"
            })
        } else {
            await func()
        }
    }

    return {popup, setPopup, handleSubmit}
}

export {reducer, uiReducer, initialUiState, reducerInitState, NewClass, inputClasses, useSubmitChanges}