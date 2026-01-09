import type { Primitive } from "firebase/firestore"
import { NestedPartial } from "../types.ts"


// Currently not used anywhere :/
const shallowDiff = (baseState: Record<string, any>, updatedState: Record<string, any>) => {
    const diffState: Record<string, any> = {}
    Object.keys(updatedState).forEach(updatedKey => 
        updatedState[updatedKey] == baseState[updatedKey] 
            ? 0 // no operation
            : diffState[updatedKey] = updatedState[updatedKey]
    )
    Object.keys(baseState).forEach(baseKey => 
        // if the key is already considered as changed, then skip
        // we dont' want to overwrite updated value with initial value
        updatedState[baseKey] == baseState[baseKey] || diffState[baseKey] != undefined  
            ? 0
            : diffState[baseKey] = "__deleted__" 
    )
}
type NestedRecord<T> = {
    [index: string]: T | NestedCollection<T> | NestedRecord<T>
}
type NestedCollection<T> = 
    | Set<T | NestedRecord<T> | NestedCollection<T>> 
    | Array<T | NestedRecord<T> | NestedCollection<T>>
type NestedPrimitiveRecord = NestedRecord<Primitive>


// inspired from : https://stackoverflow.com/a/32108184/22444974
const isEmptyObj = (value: Record<string | number | symbol, unknown>) => {
    for (const key in value) {
        if (Object.hasOwn(value, key)) return false
    } 
    return true
}
const isPlainObject = (value: any): value is NestedPrimitiveRecord => {
    return typeof value == "object" && value != null && !(value instanceof Set)
}

// a type that takes two object types, and checks for common properties
// for any missing value if the first type, it allows the deleted 
const deepDiff = <T extends NestedPrimitiveRecord>(baseState: T, updatedState: T) => {
    const diffObj: NestedPrimitiveRecord = {};

    // iterates over updatedState keys, doesn't consider keys that are only in baseState (1)
    (Object.entries(updatedState)).forEach(([updatedKey, updatedValue]) => {
        const baseValue = baseState[updatedKey]
        if (updatedValue === baseValue) return
        if (isPlainObject(updatedValue) && isPlainObject(baseValue)) {
            const innerDeepDiff = deepDiff(baseValue, updatedValue)
            if (isEmptyObj(innerDeepDiff))
                diffObj[updatedKey] = innerDeepDiff as T[keyof T]
        } else {
            // this executes when any of the unequal values was primitive:
            //  the other was also a primitive: set the updated primitive
            //  the other was object: set the updated value as type changed completely
            diffObj[updatedKey] = updatedValue as T[keyof T]
        }
    })

    // (1) iterates over baseState keys, to account for keys unique to baseState
    Object.entries(baseState).forEach(([baseKey, baseValue]) => {
        // skip if the key is already seen, 
        // where value has already been taken from updatedState
        if (baseValue == updatedState[baseKey] || Object.hasOwn(diffObj, baseKey)) return
        diffObj[baseKey] = "__deleted__"
    })
    return diffObj
}


export { deepDiff }
export { isEmptyObj } // for the sake of tests