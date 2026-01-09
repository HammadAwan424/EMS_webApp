type ValueDiffReturnType<B, U> = {
    s: "idle" | "deleted",
    c: B
} | {
    s: "new" | "edited",
    c: Exclude<U, "deleted">
}
type ValueDiffStates = ValueDiffReturnType<unknown, unknown>['s']

function valueDiff<B, U>(baseValue: B, updatedValue: U): ValueDiffReturnType<B, U> {
    if (updatedValue == undefined) 
        return {
            c: baseValue,
            s: "idle"
        } 
    else if (updatedValue == "deleted")
        return {
            c: baseValue,
            s: "deleted"
        }
    else if (baseValue == undefined) // updated != undefined
        return {
            c: updatedValue as Exclude<typeof updatedValue, "deleted">,
            s: "new"
        }
    else // updated != undefined && updated != "deleted" && baseValue != undefined 
        return {
            c: updatedValue as Exclude<typeof updatedValue, "deleted">,
            s: "edited"
        }
}

export default valueDiff
export type { ValueDiffStates, ValueDiffReturnType }