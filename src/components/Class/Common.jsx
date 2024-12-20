import { createSelector } from "@reduxjs/toolkit"
import { useImmerReducer } from "use-immer"
import { classEditReducer, classEditReducerInitialState, dispatchWrapper } from "./reducer"
import { useDeleteClassMutation, useEditClassMutation } from "src/api/apiSlice"
import { useMemo } from "react"
import isEqual from "lodash.isequal"
import { usePopup } from "../CommonUI/Popup"

const staticRefArr = []
const staticRefObj = {}

const selectStudentEntitiesEdit = state => state?.students?.entities ?? staticRefObj
const selectStudentIdsArray = state => state?.students?.ids ?? staticRefArr
const selectStudentIdsEdit = createSelector(
    selectStudentEntitiesEdit,
    selectStudentIdsArray,
    (entities, studentIds) => {
        return studentIds.toSorted((a, b) => entities[a].rollNo - entities[b].rollNo)
    }
)
const selectStudentIdsFromUpdates = createSelector(
    selectStudentEntitiesEdit,
    selectStudentIdsArray,
    (state) => state?.students?.meta ?? staticRefObj,
    (entities, studentIds, metaObj) => 
        studentIds.filter(id => metaObj[id] != "removed")
    
)

function useFormupdates({resetFunc, classId, classGroupId}) {
    
    // const reducerInitialState = isJoined ? {
    //     ...classEditReducerInitialState,
    //     ui: {
    //         ...classEditReducerInitialState.ui,
    //         expanded: true,
    //         hasExpandedOnce: true
    //     }
    // } : classEditReducerInitialState
    const reducerInitialState = classEditReducerInitialState

    const [formUpdates, realDispatch] = useImmerReducer(classEditReducer, reducerInitialState)
    const [deleteClass, {isLoading: isDeleting}] = useDeleteClassMutation()
    const [editClass, {isLoading: isMutating}] = useEditClassMutation()
    const dispatch = useMemo(() => dispatchWrapper(realDispatch, resetFunc), [realDispatch, resetFunc])

    // currently one usePopup is assinged to only one loadingState
    const { close, popup } = usePopup({isLoading: isMutating})

    const {ui, ...formUpdatesNoUi} = formUpdates
    const {ui: _, ...initialStateNoUi} = classEditReducerInitialState
    const hasModifications = !isEqual(formUpdatesNoUi, initialStateNoUi)
    // unique case when they are not equal, user types something and clear it back
    // now other group is still locked (true) but hasModifications is false
    const showSaveChanges = ui.lockedInput.length > 0 || hasModifications
    
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
                await editClass({...formUpdatesNoUi, classId, classGroupId}).unwrap()
                dispatch({type: "reset"})
            } catch (e) {
                console.log("Coundn't apply changes due to: ", e)
            }
            close()
        }

        if (count.added == 0 && formUpdates.students.ids.length == 0) {
            popup({isLoading: isMutating, text: "You didn't added any new student", handler: func})
        } else if (count.added == 0 && formUpdates.students.ids.length == count.removed) {
            popup({isLoading: isMutating, text: "The class will be empty after the update", handler: func})
        } else  {
            await func()
        }
    }

    return {
        formUpdates, dispatch, handleSaveChangesClick, 
        hasModifications, showSaveChanges, isMutating, isDeleting
    }
}

export {selectStudentEntitiesEdit, selectStudentIdsEdit, selectStudentIdsFromUpdates, useFormupdates}