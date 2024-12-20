import classGroups from "src/api/rtk-helpers/classGroups";
import { updateDoc, doc, deleteDoc, setDoc } from "firebase/firestore";
import { getEnv } from "./helper";



let alice; 
let byAlice;
let jake;
let byJake;
let env;

beforeAll(async () => {
    env = await getEnv({older: false})
    alice = env.authenticatedContext("alice", {email: "alice@gmail.com"})
    byAlice = alice.firestore()
    jake = env.authenticatedContext("jake", {email: "jake@gmail.com"})
    byJake = jake.firestore()
})
afterAll(async () => {
    await env.cleanup()
})
afterEach(async () => env.clearFirestore())


const setMockData = async () => {
    return await classGroups.editClassGroup({
        firestore: byAlice,
        classGroupId: "aliceGroup", 
        classGroupName: "aliceGroupName",
        create: true, 
        meta: {},
        classes: {
            "aliceClassId": {
                className: "aliceClass",
                students: {},
                assignedTeacher: ""
            }
        },
        editors: {},
        cgAdmin: "alice"
    })
}

let mockData;
beforeEach(async () => {
    mockData = await setMockData()
})


test("Mock data is compatible with security rules", async () => {
    expect(mockData).toEqual({data: ""})
})

test("Classgroup Admin can't change the uid for classGroup", async () => {
    expect.assertions(1)
    try {
        await updateDoc(doc(byAlice, "classGroups", "aliceGroup"), {cgAdmin: "someoneElse"})
    } catch (err) {
        expect(err.code).toBe("permission-denied")
    }
})

//TODO: fix this behaviour
test("Class fields inside classgroup doc can be added without really creating class docs", () => {
    return updateDoc(doc(byAlice, "classGroups", "aliceGroup"), {
        'classes.alice2ndClassId': {
            className: "alice2ndClass",
            students: {},
            assignedTeacher: "",
        },
    });
})

//TODO: fix this behaviour
test("Class docs can be created or deleted independantly without updating classgroup doc", async () => {
    await setDoc(doc(byAlice, "classGroups/aliceGroup/classes/someClass"), {className: "Required Fields"})
    await deleteDoc(doc(byAlice, "classGroups/aliceGroup/classes/aliceClassId"))
})