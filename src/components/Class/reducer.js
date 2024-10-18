import dot from "dot-object"

const classEditReducerInitialState = {
    students: {
        entities: {},
        ids: [],
        meta: {}
    },
    ui: {
        lockedInput: []
    }
}


function classEditReducer(draft, action) {
    switch (action.type) {
        case "add_student": {
            const randId = Math.random().toString().slice(2, 8)
            draft.students.entities[randId] = {studentName: "", rollNo: ""}
            draft.students.meta[randId] = "added"
            draft.students.ids.push(randId)
            break
        }
        case "remove_student": {
            const {id} = action
            const newStudent = draft.students.meta[id] == "added"
            if (newStudent) {
                draft.students.ids = draft.students.ids.filter(studentId => studentId != id)
                delete draft.students.entities[id]
                delete draft.students.meta[id]
            } else {
                const alreadyThere = draft.students.ids.includes(id) 
                if (!alreadyThere) {
                    draft.students.ids.push(id)
                }
                draft.students.meta[id] = "removed"
            }
            break
        }
        case "restore_student": {
            const {id, isStudentModified} = action // isStudentModified represent overall changes in both fields
            if (isStudentModified) {
                draft.students.meta[id] = "modified" // don't touch ids or changes in entities
            } else {
                draft.students.ids = draft.students.ids.filter(idInList => idInList != id)
                delete draft.students.meta[action.id] // remove deleted field
            }
            break
        }
        case "update_student": {
            const { id, isStudentModified } = action // isStudentModified represent overall changes 
            if (draft.students.meta[id] != "added") { // because an empty field on added has isStudentModified == false
                // and we don't want to lose added status
                if (isStudentModified) {
                    draft.students.meta[id] = "modified"
                    !draft.students.ids.includes(id) && draft.students.ids.push(id)
                } else {
                    delete draft.students.meta[id]  
                    delete draft.students.entities[id]
                    draft.students.ids = draft.students.ids.filter(idInList => idInList != id)
                }
            }
            break
        }
        case "input_change": {
            const { path, value, isModified } = action
            isModified ? dot.str(path, value, draft) : dot.remove(path, draft)
            break
        }
        case "lockInput": { // unlock is done only by presseing cancel (dispatching reset)
            // Each group has its own save button 
            // giving input to some group locks other
            const allInputGroups = ['teacher', 'general']
            const valueToLock = action.value
            if (allInputGroups.includes(valueToLock)) {
                !draft.ui.lockedInput.includes(valueToLock) && draft.ui.lockedInput.push(valueToLock)
            } else {
                throw Error(`Can lock ${valueToLock}, valid values are ${allInputGroups}`)
            }
            break
        }
        case "reset": {
            return classEditReducerInitialState
        }
        default: {
            throw Error(`No corresponding case for action type: ${action.type}.`)
        }
    }
}


const dispatchWrapper = (realDispatch, resetFuncOutsideRealDispatch) => (action) => {
    if (action.type == "reset") {
        resetFuncOutsideRealDispatch()
        realDispatch(action)
    } else if (action.type == "input_change")  { // all input related actions
        action.path == "assignedTeacher" ? realDispatch({type: "lockInput", value: "general"})
            : realDispatch({type: "lockInput", value: "teacher"})
        realDispatch(action)
    } else {
        realDispatch(action)
    }
}

export {dispatchWrapper, classEditReducer, classEditReducerInitialState}