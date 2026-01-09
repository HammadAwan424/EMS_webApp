import valueDiff, { ValueDiffReturnType, ValueDiffStates } from "#src/api/util/diff/valueDiff.ts"
import dot from "dot-object"

type GetValueStates = ValueDiffStates
type GetValue = (key: string) => ValueDiffReturnType<unknown, unknown> & { baseValue: unknown }
type GetValueFactory = (
    baseState: Record<string, unknown>, 
    patch: Record<string, unknown>, 
) => GetValue


const getValueFactory: GetValueFactory = (baseState, patch) => (name) => {
    const updatedValue = dot.pick(name, patch)
    const baseValue = dot.pick(name, baseState)
    const diff =  valueDiff(baseValue, updatedValue)
    return { ...diff, baseValue }
}

export default getValueFactory
export type { GetValue, GetValueStates }