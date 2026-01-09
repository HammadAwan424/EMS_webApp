import {  IconCircleMinus, IconCircleArrowUpFilled  } from "src/IconsReexported.jsx"
import classNames from "classnames"
import dot from "dot-object"
import { doc, collection } from "firebase/firestore"
import { firestore } from "src/api/firebase/config.ts"
import MediaQuery from "react-responsive"
import { usePopup } from "../CommonUI/Popup.jsx"
import { ClassGroupAppModel, ClassGroupAppPatch, ClassGroupId } from "#src/api/rtk-query/classgroups/util.ts"
import { ClassId } from "#src/api/rtk-query/class/util.ts"
import React from "react"
import { AsyncNoOp, NoOpData } from "#src/api/util/Utility.ts"
import { isEmptyObj } from "#src/api/util/diff/index.ts"
import { GetValue } from "../util/getValueFactory.ts"

// record updates directly on a copy of ClassGroupAppModel
// do a deep diff 
// implement a mechanism for reading those changes
type ReducerInitialState = ClassGroupAppModel

type ReducerActionType = {
    type: "addClass",
    classGroupId: ClassGroupId
}  | {
    type: "removeClass",
    classId: ClassId
} | {
    type: "fieldUpdate",
    event: React.ChangeEvent<HTMLInputElement>
} | {
    type: "reset",
}
const getReducer = (initialState: ClassGroupAppModel) => (draft: ReducerInitialState, action: ReducerActionType) => {
    switch (action.type) {
        case "addClass": {
            const classId = doc(collection(firestore, "classGroups", action.classGroupId, "classes")).id
            const newClass = {className: "", assignedTeacher: ""}
            draft.classes[classId] = newClass
            break
        }
        case "removeClass": {
            delete draft.classes[action.classId]
            delete draft.editors[action.classId]
            break
        }
        case "fieldUpdate": {
            const { name, value } = action.event.target
            dot.str(name, value, draft)
            break
        }
        case "reset": {
            return initialState
        }
    }
}


const initialUiState = {
    activeEdits: {
        classGroupName: false
    }
}
type InitialUiState = typeof initialUiState
type UiReducerActionType = {
    type: "editToggle",
    specific: keyof InitialUiState['activeEdits']
} | {
    type: "reset"
}
function uiReducer(draft: InitialUiState, action: UiReducerActionType) {
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

// TODO: implement it using cva
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
type NewClassProps = {
    dispatch: React.Dispatch<ReducerActionType>,
    getValue: GetValue
    id: ClassId,
}
function NewClass({dispatch, getValue, id}: NewClassProps) {
    return (
        <div className="flex items-center gap-2 py-2">
            <IconCircleMinus className="text-red-500" onClick={() => dispatch({type: "removeClass", classId: id})} />
            <input className={`text-[--text-primary-col] py-1 border rounded-md px-2 outline-none font-bold 
                flex-grow sm:w-40 sm:flex-grow-0 min-w-0 bg-[--theme-tertiary] border-transparent`}
                name={`classes.${id}.className`}
                required type="text" placeholder="New Class Name"
                value={getValue(`classes.${id}.className`)} onChange={(e) => dispatch({type: "fieldUpdate", event: e})}
                autoComplete="off" />
            {/* unexpected behaviour */}
            <MediaQuery minWidth={640}>
                    {matches => matches && <hr className="flex-auto border-[--text-disabled]" />}
            </MediaQuery>
            <IconCircleArrowUpFilled />
        </div>
    )
}

type useSubmitChangesArgs = {
    resultingClassCount: number,
    patch: ClassGroupAppPatch,
    mutationFunc: () => Promise<NoOpData>,
    reset: () => void,
}
const useSubmitChanges = ({
    resultingClassCount,
    patch,
    reset,
    mutationFunc
}: useSubmitChangesArgs) => {
    // TODO: add loading, for now, no loading because listeners are fired immediately 
    const { popup, close } = usePopup() 
    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const func = async () => {
            try {
                await mutationFunc()
                reset()
            } catch (err) {
                console.error("Couldn't save changes", err)
            }
            close() // needed only for edit, it doesn't navigate
            // in case of navigate, parent unmounts and popup automatically closes 
        }
        
        if (isEmptyObj(patch)) {
            reset()
        } else if (resultingClassCount == 0) {
            popup({handler: func, text: "You have not added any class yet, want to proceed?"})
        } else {
            await func()
        }
    }

    return handleSubmit
}

export {getReducer, uiReducer, initialUiState, NewClass, inputClasses, useSubmitChanges}