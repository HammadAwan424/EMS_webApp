import { getEnv } from "./helper";
import { signupFirestoreInteraction } from "#src/api/signup";
import classGroups from "#src/api/classGroups";
import { inviteTeacher, removeTeacher, getTeacherUid } from "#src/api/invitation";
import path from "path"
import { arrayRemove, deleteDoc, doc, updateDoc } from "firebase/firestore";


let alice; 
let byAlice;
let jake;
let byJake;
let mike;
let byMike;
let env;


beforeAll(async () => {
    env = await getEnv()
    alice = env.authenticatedContext("alice", {email: "alice@gmail.com"})
    byAlice = alice.firestore()
    jake = env.authenticatedContext("jake", {email: "jake@gmail.com"})
    byJake = jake.firestore()
    mike = env.authenticatedContext("mike", {email: "mike@gmail.com"})
    byMike = mike.firestore()
})
afterAll(async () => {
    await env.cleanup()
})


const setMockData = async () => {
    await signupFirestoreInteraction(byAlice, "alice", "alice@gmail.com")
    await signupFirestoreInteraction(byJake, "jake", "jake@gmail.com")
    await signupFirestoreInteraction(byMike, "mike", "mike@gmail.com")
    return await classGroups.editClassGroup({
        firestore: byAlice,
        classGroupId: "aliceGroup", 
        classGroupName: "aliceGroupName",
        uid: "alice",
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
let mockDataResult;
beforeEach(async () => {
    mockDataResult = await setMockData()
})
afterEach(async () => {
    await env.clearFirestore()
})



test(`Mock data is valid for rules, ready to proceed`, async () => {
    await expect(mockDataResult).toEqual({data: ""})
})



describe("Alice has invited jake", () => {

    let innerMockData;
    beforeEach(async () => {
        innerMockData = await inviteTeacher({
            firestore: byAlice,
            recepientEmail: "jake@gmail.com",
            hostEmail: "alice@gmail.com",
            "classGroupId": "aliceGroup",
            "classId": "aliceClassId",
            "className": "aliceClass",
            "getTeacherUid": async () => "jake"
        })
    })
    

    test("Alice can invite jake to his class", async () => {
        expect(innerMockData).toEqual({data: ""})
    })

    test("Alice can't just delete classDoc after inviting jake without informing him", async () => {
        expect.assertions(1)
        try {
            await deleteDoc(doc(byAlice, "classGroups/aliceGroup/classes/aliceClassId"))
        } catch (err) {
            expect(err.code).toBe("permission-denied")
        }  
    })

    test("Alice can unassign jake if he wants", async () => {
        expect(await removeTeacher({
            firestore: byAlice,
            classId: "aliceClassId",
            'classGroupId': "aliceGroup",
            'getTeacherUid': async () => "jake"
        })).toEqual({data: ""})
    })

    test("Alice can only delete class if he uninvite jake", async () => {
        await removeTeacher({
            firestore: byAlice,
            classId: "aliceClassId",
            'classGroupId': "aliceGroup",
            'getTeacherUid': async () => "jake"
        })
        return deleteDoc(doc(byAlice, "classGroups/aliceGroup/classes/aliceClassId"))
    })

    test("Alice can't invite jake to class he doesn't own", () => expect(inviteTeacher({
        firestore: byAlice,
        recepientEmail: "jake@gmail.com",
        hostEmail: "alice@gmail.com",
        "classGroupId": "aliceGroup",
        "classId": "THIS CLASS IS NOT ALICE's CLASS",
        "className": "aliceClass",
        "getTeacherUid": async () => "jake"
    })).resolves.toHaveProperty("error"))

    // Can use the getTeacherUid function if required
    test("Invitation can be taken back even if some field is changed after sending invitation", async () => {
        await updateDoc(doc(byAlice, "classGroups", "aliceGroup"), {'classes.aliceClassId': "NEW NAME"})
        expect(await removeTeacher({
            firestore: byAlice,
            classId: "aliceClassId",
            'classGroupId': "aliceGroup",
            'getTeacherUid': async () => getTeacherUid(byAlice, "jake@gmail.com")
        })).toEqual({data: ""})
    })

    // TODO: Remove this behaviour
    test(`Invitation can't be send back if some field (4 sent) is changed after removingTeacher. 
        --This only happens if recepeint has not read/removed the invitation`, 
        async () => {
            // changing name and removing jake
            await updateDoc(doc(byAlice, "classGroups", "aliceGroup"), {'classes.aliceClassId': "NEW NAME"})
            await removeTeacher({
                firestore: byAlice,
                classId: "aliceClassId",
                'classGroupId': "aliceGroup",
                'getTeacherUid': async () => "jake"
            })
            // Doesn't matter if new field value or previous is provided
            expect(await inviteTeacher({
                firestore: byAlice,
                recepientEmail: "jake@gmail.com",
                hostEmail: "alice@gmail.com",
                "classGroupId": "aliceGroup",
                "classId": "aliceClassId",
                "className": "NEW NAME",
                "getTeacherUid": async () => "jake"
            })).toHaveProperty('error')
        }
    )

    //TODO: Remove this behaviour
    test("A single class can't be assigned to two persons", async () => {
        await expect(inviteTeacher({
            firestore: byAlice,
            recepientEmail: "mike@gmail.com",
            hostEmail: "alice@gmail.com",
            "classGroupId": "aliceGroup",
            "classId": "aliceClassId",
            "className": "aliceClass",
            "getTeacherUid": async () => "mike"
        })).resolves.toHaveProperty("error")
    })

    test("Alice can't take back control without telling jake", () => {
        return expect(
            updateDoc(doc(byAlice, "classGroups", "aliceGroup"), {
                "editors.aliceClassId": arrayRemove("jake"),
            })
        ).rejects.toHaveProperty("code", "permission-denied");
    })

    //The functions such as invite, removeTeacher implicitly adds a meta field and update Recepient doc
    test("The above conditions 1) metaField 2) changing recepient doc are required only when changing editors", () => {
        return updateDoc(doc(byAlice, "classGroups", "aliceGroup"), {classGroupName: "I can change these fields freely"})
    })

})