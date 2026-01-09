import { GetClassByIdValue } from "#src/api/rtk-query/class/index.ts"
import { ClassAppModel, StudentId } from "#src/api/rtk-query/class/util.ts"
import dot from "dot-object"
import { produce } from "immer"


type ClassUIState = typeof initialClassUIState
type ClassUIActionType = {
    type: "ui/lockInput"
    value: "teacher" | "general"
} | {
    type: "ui/expand",
    value: boolean
} | {
    type: "ui/reset"
}
const initialClassUIState = {
    lockedInput: [] as string[],
    expanded: false,
    hasExpandedOnce: false,
}
function classUIReducer(draft: ClassUIState, action: ClassUIActionType) {
    switch (action.type) {
        case "ui/lockInput": { // unlock is done only by presseing cancel (dispatching reset)
            // Each group has its own save button 
            // giving input to some group locks other
            const valueToLock = action.value
            const alreadyLocked = draft.lockedInput.includes(valueToLock)
            if (!alreadyLocked) 
                draft.lockedInput.push(valueToLock)
            break
        }
        case "ui/expand": {
            const value = action.value
            draft.expanded = value
            draft.hasExpandedOnce = draft.hasExpandedOnce || value
            break
        }
        case "ui/reset": {
            const {expanded, hasExpandedOnce} = draft
            return {...initialClassUIState, expanded, hasExpandedOnce}
        }
    }
}

export type { ClassUIState, ClassUIActionType }
export { classUIReducer, initialClassUIState }


type ClassState = ClassAppModel
type ClassActionType = {
    type: "add_student",
    payload: { rollNo: string }
} | {
    type: "remove_student",
    id: string,
} | {
    type: "restore_student",
    id: string,
    entity: ClassState['students']['entities'][StudentId]
} | {
    type: "reset",
    initialState: ClassState,
} | {
    type: "input_change",
    value: string, path: string
}
function classReducer(draft: ClassState, action: ClassActionType) {
    switch (action.type) {
        case "add_student": {
            const randId = Math.random().toString().slice(2, 8)
            draft.students.entities[randId] = {studentName: "", ...action.payload}
            draft.students.ids.add(randId)
            break
        }
        case "remove_student": {
            const { id } = action
            draft.students.ids.delete(id)
            delete draft.students.entities[id]
            break
        }
        case "restore_student": {
            const { id, entity } = action
            draft.students.entities[id] = entity
            break
        }
        case "input_change": {
            const { path, value } = action
            dot.str(path, value, draft)
            break
        }
        case "reset": {
            const { initialState } = action
            return initialState
        }
        default: {
            throw Error(`No corresponding case for action type: ${action.type}.`)
        }
    }
}

export type { ClassActionType, ClassState }
export { classReducer }