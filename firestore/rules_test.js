import {
    assertFails,
    assertSucceeds,
    initializeTestEnvironment
} from "@firebase/rules-unit-testing"
import { setDoc, getDoc, updateDoc, doc, writeBatch, deleteDoc } from "firebase/firestore"
import fs from "fs"
import { setLogLevel } from "firebase/app"
import path from "path"
import { update } from "firebase/database"

setLogLevel("error")

// test1()
async function test1() {

    let env = await getEnv()

    // await env.withSecurityRulesDisabled(masterContext => {
    //     const data = {
    //         classGroupName: "Initial ClassGroup",
    //         classes: {
    //             className: "First Class"
    //         }
    //     }
    //     return setDoc(doc(masterContext.firestore(), "classGroup/123"), data)
    // })

    const alice = env.authenticatedContext("alice")
    const aliceFirestore = alice.firestore()
    // Prevent creating documents with id that isn't on auth
    await assertSucceeds(setDoc(doc(aliceFirestore, "teachers", "alice"), {name: "alice is adding data for himself"}))
    await assertFails(setDoc(doc(aliceFirestore, "teachers", "randomUid"), {name: "someone is hacking alice account"}))


    const jake = env.authenticatedContext("jake")
    const jakeFirestore = jake.firestore()
    const jakeInvitations = "teachers/jake/invitations/jake"
    await setDoc(doc(jakeFirestore, jakeInvitations), {name: "I am jake, setting my data"})
    // Can accept invitation
    await assertSucceeds(updateDoc(doc(jakeFirestore, jakeInvitations), {rand: "I am accepting invitation"}))
    // alice can only change fields with key == alice.uid
    await assertFails(updateDoc(doc(aliceFirestore, jakeInvitations), {"invitation_by_other": "I am changing other person's invitations maliciously"}))


    

    // Classes can be joined only if invited
    // await assertFails(updateDoc(doc(jakeFirestore, aliceClass), {teacher: "jake", data: "Joining class without invitation will assertFails"}))



    await env.cleanup()
}



// classInClassGroupTests()
async function classInClassGroupTests() {
    let env = await getEnv()
    const alice = env.authenticatedContext("alice")
    const aliceFirestore = alice.firestore()
    const jake = env.authenticatedContext("jake")
    const jakeFirestore = jake.firestore()

    // Creating classes
    const aliceGroup = "classGroups/aliceGroup"
    const aliceClassWithClassGroup = "classGroups/aliceGroup/classes/classByAlice"
    const aliceClassWithoutClassGroup = "classGroups/THIS_DOES_NOT_EXIST/classes/classByAlice"

    await env.withSecurityRulesDisabled(context => {
        return setDoc(doc(context.firestore(), aliceGroup), {By: "Security_RULES_DISABLED", cgAdmin: "alice"})
    })

    // Creating class without classGroup fails, Creating class with classGroup succeeds
    await assertFails(setDoc(doc(aliceFirestore, aliceClassWithoutClassGroup), {"className": "classByAlice"}))
    await assertSucceeds(setDoc(doc(aliceFirestore, aliceClassWithClassGroup), {"className": "classByAlice"}))

    // Updating class succeeds if user created classGroup
    await assertSucceeds(updateDoc(doc(aliceFirestore, aliceClassWithClassGroup), {"update": "updating data"}))
    
    // Updating some other class fails if not invited and succeeds if invited
    await assertFails(updateDoc(doc(jakeFirestore, aliceClassWithClassGroup), {"update": "Jake is updating alice class without invitation"}))
    
    // Alice is inviting jake
    await env.withSecurityRulesDisabled(context => {
        return updateDoc(doc(context.firestore(), aliceGroup), {"editors.jake": "classByAlice"})
    })

    await assertSucceeds(updateDoc(doc(jakeFirestore, aliceClassWithClassGroup), {"update": "Jake is updating alice class after invitation"}))

    // Invited person can't delete class but the one who created can delete it
    await assertFails(deleteDoc(doc(jakeFirestore, aliceClassWithClassGroup)))
    await assertSucceeds(deleteDoc(doc(aliceFirestore, aliceClassWithClassGroup)))

    await env.cleanup()

}


invitationsTest()
async function invitationsTest() {
    // Invitations work by updating two docs simultaneously
    // 1) As soon as someone is invited, he is given access to modify class data by updating classGroupDoc
    // 2) Invited person's invitations list is also chagned so to notify him

    let env = await getEnv()

    const alice = env.authenticatedContext("alice", {email: "alice@gmail.com"})
    const aliceFirestore = alice.firestore()
    const jake = env.authenticatedContext("jake", {email: "jake@gmail.com"})
    const jakeFirestore = jake.firestore()
    const mike = env.authenticatedContext("mike", {email: "mike@gmail.com"})
    const mikeFirestore = mike.firestore()

    // Creating classes
    const aliceGroup = "classGroups/aliceGroup"
    const aliceClassWithClassGroup = "classGroups/aliceGroup/classes/classByAlice"
    await env.withSecurityRulesDisabled(context => {
        return setDoc(doc(context.firestore(), aliceGroup), {By: "Security_RULES_DISABLED", cgAdmin: "alice"})
    })
    await assertSucceeds(setDoc(doc(aliceFirestore, aliceClassWithClassGroup), {"className": "classByAlice"}))

    // Invitation fail if invited person doesn't exists (no notification but access)
    const jakeInvitations = 'teachers/jake'
    await assertFails(setDoc(doc(aliceFirestore, jakeInvitations), {'invitations.alice': {alice: {email: "alice@gmail.com"}}}))

    // Teacher now exists
    await setDoc(doc(jakeFirestore, "teachers/jake"), {"msg": "hi I am adding data for myself", invitations: {}})
    
    // Invitations now works
    await assertSucceeds(updateDoc(doc(mikeFirestore, jakeInvitations), {"invitations.mike": {email: "mike@gmail.com"}}))
    await assertSucceeds(updateDoc(doc(aliceFirestore, jakeInvitations), {"invitations.alice": {email: "alice@gmail.com"}}))

    // Can't send invitation at place of some other person (can't modify any other field except auth.uid and use own email)
    await assertFails(updateDoc(doc(aliceFirestore, jakeInvitations), {'invitations.mike': {email: "I am using mike id for invitation"}}))
    await assertFails(updateDoc(doc(aliceFirestore, jakeInvitations), {'invitations.alice': {email: "someOtherPerson@gmail.com"}}))
    await assertFails(updateDoc(doc(aliceFirestore, jakeInvitations), {'invitations.alice': {email: "alice@gmail.com"}, otherField: "Modifying other field fails"}))


    await env.cleanup()
}



teacherPublicTests() 
async function teacherPublicTests() {
    let env = await getEnv()

    const alice = env.authenticatedContext("alice", {email: "alice@gmail.com"})
    const aliceFirestore = alice.firestore()

    const publicTeacher = doc(aliceFirestore, "teachersPublic/alice")
    const privateTeacher = doc(aliceFirestore, "teachers/alice")

    // To create public teacher doc, 1) private doc must exist already or 2) included in batch operation  
    // else public doc creation fails
    await assertFails(setDoc(publicTeacher, {hi: "some data"}))

    // 1) private doc must exist already
    await setDoc(privateTeacher, {hi: "some data"}) // Now private doc exists
    await assertSucceeds(setDoc(publicTeacher, {hi: "some data"}))
    await env.clearFirestore()

    // 2) private doc is included in batch operation  
    const batchFails = writeBatch(aliceFirestore)
    batchFails.set(publicTeacher, {data: "sdfsd"})
    await assertFails(batchFails.commit())

    const batchSucceeds = writeBatch(aliceFirestore)
    batchSucceeds.set(privateTeacher, {data: "batched data"})
    batchSucceeds.set(publicTeacher, {data: "batched data"})
    await assertSucceeds(batchSucceeds.commit())

    await env.cleanup()
}



// classGroupTests()
async function classGroupTests() {
    let env = await getEnv()

    const alice = env.authenticatedContext("alice")
    const aliceFirestore = alice.firestore()

    const jake = env.authenticatedContext("jake")
    const jakeFirestore = jake.firestore()

    const aliceGroup = "classGroups/alicegrou"
    await assertFails(getDoc(doc(aliceFirestore, aliceGroup))) // Reading before creating Fails

    // Creating for someone else fails, missing name field fails
    await assertFails(setDoc(doc(aliceFirestore, aliceGroup), {cgAdmin: "some one else", name: "sfsd"})) 
    await assertFails(setDoc(doc(aliceFirestore, aliceGroup), {cgAdmin: "alice", noName: "sfsd"})) 
    await assertSucceeds(setDoc(doc(aliceFirestore, aliceGroup), {cgAdmin: "alice", name: "sfsd"})) 

    // Updating on behalf of other fails
    await assertFails(updateDoc(doc(jakeFirestore, aliceGroup), {data: "jake can't edit alice data"}))
    await assertSucceeds(updateDoc(doc(aliceFirestore, aliceGroup), {data: "alice can edit own data"}))

    // Can only get doucment that he owns
    await assertFails(getDoc(doc(jakeFirestore, aliceGroup)))
    await assertSucceeds(getDoc(doc(aliceFirestore, aliceGroup)))

    await env.cleanup()
}






async function arbitraryLogs() {
    let env = await getEnv()
    let jadeContext = env.authenticatedContext("jade")

    const firestore = jadeContext.firestore()
    await setDoc(doc(firestore, "test/first"), {"key": "value"})
    const docSnapshot = await getDoc(doc(firestore, "test/first"))
    console.log(docSnapshot.exists())
}
// arbitraryLogs()





async function getEnv() {
    let env = await initializeTestEnvironment({
        projectId: "uplifted-env-416417",
        firestore: {
            host: "127.0.0.1",
            port: 8080,
            rules: fs.readFileSync(path.join(import.meta.dirname, "../", "storage.rules"), "utf-8")
        }
    })
    await env.clearFirestore()
    return env
}



