import { deepDiff, isEmptyObj } from "./index.ts";


test("isEmptyObj works fine", () => {
    expect(isEmptyObj({data: "someData"})).toBe(false)
    expect(isEmptyObj({})).toBe(true)
})


const a = {
    name: "alice",
    height: "32cm"
}
const b = {
    name: "alice",
    height: "changed"
}
test("deepDiff works for modified fields on flat objects", () => {
    expect(deepDiff(a, b)).toStrictEqual({height: "changed"})
})


const c = {
    name: "this_got_removed",
    age: 32
}
const d = {
    age: 32,
    address: "newField"
}
test("deepDiff works for deleted and added fields on flat objects", () => {
    expect(deepDiff(c, d)).toStrictEqual({name: "__deleted__", address: "newField"})
})


const base = {
    details: {
        height: 10,
        name: "ali",
        address: "this_got_removed"
    },
    primitive: 3,
    obj: {
        alive: true
    }
}
const updated = {
    details: {
        height: 10,
        name: "changedName",
        company: "joinedTheCompany"
    },
    newDetails: {
        isMarried: true
    },
    achievements: null
}
test("deepDiff works well on nested objects", () => {
    expect(deepDiff(base, updated)).toStrictEqual({
        details: { // height stayed the same
            name: "changedName",
            address: "__deleted__",
            company: "joinedTheCompany"
        },
        newDetails: {
            isMarried: true
        },
        primitive: "__deleted__",
        obj: "__deleted__",
        achievements: null
    })
})


// >>> Arrays/Sets Funtionality <<<
// Assumtions about operations on arrays (from how firestore works):
// 1) elements can be deleted at any index 
// 2) elements can only be appended (can't be added to random poisitons)
// 3) No duplicates
// These operations makes sense for deepDiff to not take 
// into account the ordering or arrays. SO IT DOESN'T
// and leaves the implementation of uniqueness to the client e.g., Sets

const initialState = {
    s: new Set([1, 2]),
    a: new Set([1, 2])
}
const finalState = {
    s: new Set([3, 4]),
    a: new Set([3, 4])
}
test("deepDiff on arrays and sets", () => {
    const diff = deepDiff(initialState, finalState)
    expect(diff.s).toBe(finalState.s)
    expect(diff.a).toBe(finalState.a)
})