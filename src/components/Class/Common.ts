import { createSelector } from "@reduxjs/toolkit"
import valueDiff from "#src/api/util/diff/valueDiff.ts"
import { useEditClassMutation } from "#src/api/rtk-query/extendedApi.ts"

import type { ClassAppModel, ClassAppPatch, ClassIdentifier } from "#src/api/rtk-query/class/util.ts"
import type { UsePopup } from "../CommonUI/Popup.tsx"
import type { ValueDiffStates } from "#src/api/util/diff/valueDiff.ts"
import type { ClassState } from "./reducer.ts"


const selectStudentsFactory = (types: Set<ValueDiffStates>) => createSelector(
    (baseState: ClassAppModel, _: ClassAppPatch, isSorted: boolean) => [baseState.students, isSorted] as const,
    (_: ClassAppModel, updatedState: ClassAppPatch) => [updatedState.students],
    ([baseStudents, isSorted], [updatedStudents]) => {
        // assumes updates don't exist on patch
        const students: Pick<ClassAppModel['students'], "entities"> & { 
            types: Record<string, ValueDiffStates> 
            ids: Array<number>
        } = {
            ids: [],
            entities: {},
            types: {}
        }

        if (updatedStudents) {
            const allIds = baseStudents.ids.union(updatedStudents.ids)
            allIds.forEach(id => {
                const baseValue = baseStudents.entities[id]
                const updatedValue = updatedStudents?.entities[id]
                const diff = valueDiff(baseValue, updatedValue)
                if (types.has(diff.s)) {
                    students.ids.push(parseInt(id))
                    students.entities[id] = diff.c
                    students.types[id] = diff.s
                }   
            })
        } else {
            if (types.has("idle"))
                baseStudents.ids.forEach(id => {
                    students.ids.push(parseInt(id))
                    students.types[id] = "idle"
                })
        }

/*      // assumes updates don't exist on patch
        const updatedIds: Set<string> = new Set()
        if (updatedStudents) updatedIds.union(updatedStudents.ids)
        
        const students: ClassAppModel['students'] = {
            ids: new Set(),
            entities: {}
        }

        const allIds = baseStudents.ids.union(updatedIds)
        allIds.forEach(id => {
            const baseValue = baseStudents.entities[id]
            const updatedValue = updatedStudents?.entities[id]
            const diff = valueDiff(baseValue, updatedValue)
            if (diff.s == type) {
                students.ids.add(id)
                students.entities[id] = diff.c as NonNullable<typeof diff.c>
            }   
        }) */

        // sorts when the sorting flag is provided
        // TODO: directly sort the set instead of converting it first to array
        if (isSorted)
            students.ids = students.ids.toSorted((a, b) => 
                parseInt(students.entities[a].rollNo) - parseInt(students.entities[b].rollNo)
            )
        return students
    } 
)


export const selectNotAddedStudents = selectStudentsFactory(new Set(["deleted", "edited", "idle"]))
export const selectAddedStudents = selectStudentsFactory(new Set(["new"]))


export const getHandleSaveChanges = (
    updatedClassState: ClassState, 
    classIdentifier: ClassIdentifier, 
    overriddenReset: () => void,
    editClass: ReturnType<typeof useEditClassMutation>[0],
    { popup, close }: ReturnType<UsePopup>
) => async () => {
    const count = {
        added: 0,
        removed: 0
    }
    updatedClassState.students.ids.forEach(id => {
        const updateType = updatedClassState.students.meta[id]
        if (updateType == "added") {
            count.added += 1
        } else if (updateType == "removed") {
            count.removed += 1
        }
    })

    const onPopupConfirm = async () => {
        try {
            await editClass({ ...classIdentifier, ...updatedClassState }).unwrap()
            overriddenReset()
        } catch (e) {
            console.log("Coundn't apply changes due to: ", e)
        }
        close()
    }

    if (count.added == 0 && updatedClassState.students.ids.size == 0) {
        popup({ text: "You didn't added any new student", handler: onPopupConfirm })
    } else if (count.added == 0 && updatedClassState.students.ids.size == count.removed) {
        popup({ text: "The class will be empty after the update", handler: onPopupConfirm })
    } else {
        await onPopupConfirm()
    }
}