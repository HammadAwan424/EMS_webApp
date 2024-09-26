import {
    assertFails,
    assertSucceeds,
    initializeTestEnvironment
} from "@firebase/rules-unit-testing"
import { setDoc, getDoc, updateDoc, doc, writeBatch, deleteDoc, deleteField, arrayUnion, arrayRemove } from "firebase/firestore"
import fs from "fs"
import { setLogLevel } from "firebase/app"
import path from "path"
// import { apiSlice } from "#src/api/apiSlice.js"
// import store from "#src/app/store.js"

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
    const jakeInvitationsPath = "teachers/jake/invitations/jake"
    await setDoc(doc(jakeFirestore, jakeInvitationsPath), {name: "I am jake, setting my data"})
    // Can accept invitation
    await assertSucceeds(updateDoc(doc(jakeFirestore, jakeInvitationsPath), {rand: "I am accepting invitation"}))
    // alice can only change fields with key == alice.uid
    await assertFails(updateDoc(doc(aliceFirestore, jakeInvitationsPath), {"invitation_by_other": "I am changing other person's invitations maliciously"}))


    

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
    const aliceClassWithClassGroup = "classGroups/aliceGroup/classes/aliceClassId"
    const aliceClassWithoutClassGroup = "classGroups/THIS_DOES_NOT_EXIST/classes/aliceClassId"

    await env.withSecurityRulesDisabled(context => {
        return setDoc(doc(context.firestore(), aliceGroup), {By: "Security_RULES_DISABLED", cgAdmin: "alice"})
    })

    // Creating class without classGroup fails, Creating class with classGroup succeeds
    await assertFails(setDoc(doc(aliceFirestore, aliceClassWithoutClassGroup), {"className": "aliceClassId"}))
    await assertSucceeds(setDoc(doc(aliceFirestore, aliceClassWithClassGroup), {"className": "aliceClassId"}))

    // Updating class succeeds if user created classGroup
    await assertSucceeds(updateDoc(doc(aliceFirestore, aliceClassWithClassGroup), {"update": "updating data"}))
    
    // Updating some other class fails if not invited and succeeds if invited
    await assertFails(updateDoc(doc(jakeFirestore, aliceClassWithClassGroup), {"update": "Jake is updating alice class without invitation"}))
    
    // Alice is inviting jake
    await env.withSecurityRulesDisabled(context => {
        return updateDoc(doc(context.firestore(), aliceGroup), {"editors.jake": "aliceClassId"})
    })

    await assertSucceeds(updateDoc(doc(jakeFirestore, aliceClassWithClassGroup), {"update": "Jake is updating alice class after invitation"}))

    // Invited person can't delete class but the one who created can delete it
    await assertFails(deleteDoc(doc(jakeFirestore, aliceClassWithClassGroup)))
    await assertSucceeds(deleteDoc(doc(aliceFirestore, aliceClassWithClassGroup)))

    await env.cleanup()

}

// someTests()
async function someTests() {
    let env = await getEnv({older: true})

    const alice = env.authenticatedContext("alice", {email: "alice@gmail.com"})
    const byAlice = alice.firestore()

    await deleteDoc(doc(byAlice, "teachers/sfsdfsdf"))

    await env.cleanup()
    
}


// invitationsTest()
async function invitationsTest() {
    // Invitations work by updating two docs simultaneously
    // 1) As soon as someone is invited, he is given access to modify class data by updating classGroupDoc
    // 2) Invited person's invitations list is also chagned so to notify him
    // Removing works the same, host must take away control and at the same time (notify user/change status) in recepient doc

    let env = await getEnv({older: false})

    const alice = env.authenticatedContext("alice", {email: "alice@gmail.com"})
    const byAlice = alice.firestore()
    const jake = env.authenticatedContext("jake", {email: "jake@gmail.com"})
    const byJake = jake.firestore()
    const mike = env.authenticatedContext("mike", {email: "mike@gmail.com"})
    const byMike = mike.firestore()

    // CREATING CLASSGROUPS AND CLASSES
    const aliceGroup = "classGroups/aliceGroup"
    const mikeGroup = "classGroups/mikeGroup"
    const aliceClassWithClassGroup = "classGroups/aliceGroup/classes/aliceClassId"
    await env.withSecurityRulesDisabled(async context => {
        const f = context.firestore()
        await setDoc(doc(f, aliceGroup), {
            classGroupName: "aliceGroupName",
            editors: {},
            cgAdmin: "alice", classes: { 
                aliceClassId: {
                    students: {},
                    className: "alice's Class"
                }, 
                alice2ndClassId: {
                    students: {},
                    className: "alice's 2nd Class"
                },
                
            }
        })
        await setDoc(doc(f, mikeGroup), {
            classGroupName: "mikeGroupName",
            editors: {},
            cgAdmin: "mike", classes: {
                mikeClassId: {
                    students: {},
                    className: "mike's Class"
                }, 
                mike2ndClassId: {
                    students: {},
                    className: "mike's 2nd Class"
                },
                
            }
        })
    })

    // HELPING FUNCTION AND OTHER REQUIRED CODE
    const invitation = (cid, uid, cgid, cname) => ({
        meta: {metaId: cid},
        [`invitations.${cid}`]: {
            classGroupId: cgid,
            email: uid+"@gmail.com",
            className: cname,
            status: true
        }
    })
    const invite = (firestore, invitationPath, hostId, classId, className) => {
        const [col, recepientId] = invitationPath.split('/')
        const batch = writeBatch(firestore)
        batch.update(doc(firestore, invitationPath), invitation(classId, hostId, hostId+"Group", className))
        batch.update(doc(firestore, "classGroups", hostId+"Group"), {
            [`editors.${classId}`]: arrayUnion(recepientId),
            meta: {metaId: classId}
        })
        return batch.commit()
    }

    const removeInvite = (firestore, invitationPath, hostId, classId, className) => {
        const [col, recepientId] = invitationPath.split('/')
        const batch = writeBatch(firestore)
        batch.update(doc(firestore, invitationPath), {[`invitations.${classId}.status`]: false, meta: {metaId: classId}})
        batch.update(doc(firestore, "classGroups", hostId+"Group"), {
            [`editors.${classId}`]: arrayRemove(recepientId),
            meta: {metaId: classId}
        })
        return batch.commit()
    }
    const jakeInvitationsPath = 'teachers/jake'
    const mikeInvitationsPath = 'teachers/mike'

    // Invitation fail if invited person doesn't exists
    await assertFails(invite(byAlice, jakeInvitationsPath, "alice", "aliceClassId", "alice's Class"))
    await assertFails(invite(byAlice, mikeInvitationsPath, "alice", "aliceClassId", "alice's Class"))

    // TEACHER NOW EXISTS
    await setDoc(doc(byJake, "teachers/jake"), {"msg": "hi I am adding data for myself", invitations: {}})
    await setDoc(doc(byMike, "teachers/mike"), {"msg": "hi I am adding data for myself", invitations: {}})

    // Invitations now works
    await assertSucceeds(invite(byAlice, jakeInvitationsPath, "alice", "aliceClassId", "alice's Class"))

    // inviting with the same invitation doesn't raises an error 
    await assertSucceeds(invite(byAlice, jakeInvitationsPath, "alice", "aliceClassId", "alice's Class"))

    // Inviting (TOD: "ALLOW MULTIPLE PERSON FOR SINGLE CLASS")
    // 1)on behalf of others fail 2)without giving access fails 
    // 3) for a class that you don't own fail 4) inviting multiple person to single class fails for now
    await assertFails(invite(byMike, jakeInvitationsPath, "alice", "aliceClassId", "alice's Class"))
    await assertFails(updateDoc(doc(byAlice, jakeInvitationsPath), invitation('alice2ndClassId', "alice", "aliceGroup", "alice's 2nd Class")))
    await assertFails(invite(byMike, jakeInvitationsPath, "alice", "ALICE_DOESNT_OWNTHIS", "alice's Class"))
    // Inviting mike to a class already assigned to jake fails
    await assertFails(invite(byAlice, mikeInvitationsPath, "alice", "aliceClassId", "alice's Class")) 

    // SETTING MORE INVITATIONS
    await assertSucceeds(invite(byAlice, jakeInvitationsPath, "alice", "alice2ndClassId", "alice's 2nd Class"))
    await assertSucceeds(invite(byMike, jakeInvitationsPath, "mike", "mikeClassId", "mike's Class"))
    await assertSucceeds(invite(byMike, jakeInvitationsPath, "mike", "mike2ndClassId", "mike's 2nd Class"))

    // Removing Invitation only works for classes that you own
    await assertSucceeds(removeInvite(byAlice, jakeInvitationsPath, "alice", "aliceClassId", "alice's Class"))
    await assertSucceeds(removeInvite(byMike, jakeInvitationsPath, "mike", "mikeClassId", "mike's Class"))

    // Can't remove invitation 1)at place of some other person 2)for class that you don't own
    await assertFails(removeInvite(byAlice, jakeInvitationsPath, "mike", "mikeClassId", "mike's Class"))
    await assertFails(removeInvite(byAlice, jakeInvitationsPath, "mike", "NOTMIKECLASS", "mike's Class"))

    // removing invitation multiple times doesn't raises an error
    await assertSucceeds(removeInvite(byMike, jakeInvitationsPath, "mike", "mikeClassId", "mike's Class"))

    // Host can't take back control without informing recepient
    await assertFails(updateDoc(doc(byAlice, "classGroups", "aliceGroup"), {
        [`editors.jake`]: arrayRemove("alice2ndClassId"), //alice2ndClassId is assigned to jake
    }));
    // Host can't give control to someone without informing recepient
    await assertFails(updateDoc(doc(byAlice, "classGroups", "aliceGroup"), {
        [`editors.jake`]: arrayUnion("aliceClassId"), //aliceClassId is not assigned to jake
    }));
    // The above conditions 1) metaField 2) changing recepient doc are required only when changing editors
    await assertSucceeds(updateDoc(doc(byAlice, "classGroups", "aliceGroup"), {classGroupName: "I can change this without meta"}));
    await assertSucceeds(updateDoc(doc(byJake, jakeInvitationsPath), {classStatus: {"alice2ndClassId": false}}))

    await env.cleanup()
}



// teacherPublicTests() 
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



// checking()
// async function checking() {
//     try {
//         await store.dispatch(apiSlice.endpoints.register.initiate({email: "djs@gmail.com", password: "somepass"})).unwrap()
//         console.log("SUCCESS")
//     }
//     catch (err) {
//         console.log("ERROR: ", err)
//     }
//     console.log("AFTER")
//     store.dispatch(apiSlice.util.resetApiState()); 
// }

classGroupTests()
async function classGroupTests() {

    let env = await getEnv({older: false})
    
    
        const alice = env.authenticatedContext("alice", {email: "alice@gmail.com"})
        const byAlice = alice.firestore()
        const jake = env.authenticatedContext("jake", {email: "jake@gmail.com"})
        const byJake = jake.firestore()
        const mike = env.authenticatedContext("mike", {email: "mike@gmail.com"})
        const byMike = mike.firestore()
    
        const aliceGroup = "classGroups/alicegroup"
        await assertFails(getDoc(doc(byAlice, aliceGroup))) // Reading before creating Fails
    
        // Creating for someone else fails, missing name field fails
        const validClassGroup = {cgAdmin: "alice", classes: {}, classGroupName: "aliceGroup", editors: {}}
        await assertFails(setDoc(doc(byJake, aliceGroup), validClassGroup)) 
        await assertSucceeds(setDoc(doc(byAlice, aliceGroup), validClassGroup)) 
        
        // Updating on behalf of other fails
        await assertFails(updateDoc(doc(byJake, aliceGroup), {classGroupName: "jake can't edit alice data"}))
    
        // Can only get doucment that he owns
        await assertFails(getDoc(doc(byJake, aliceGroup)))
        await assertSucceeds(getDoc(doc(byAlice, aliceGroup)))

        // classes: { 
        //     aliceClassId: {
        //         students: {},
        //         className: "alice's Class"
        //     }, 
        //     alice2ndClassId: {
        //         students: {},
        //         className: "alice's 2nd Class"
        //     },
            
        // }

        
    
        await env.cleanup()
    }





async function arbitraryLogs() {
    let env = await getEnv({})
    // let jadeContext = env.authenticatedContext("jade")

    // const firestore = jadeContext.firestore()
    // await setDoc(doc(firestore, "test/first"), {"key": "value"})
    // const docSnapshot = await getDoc(doc(firestore, "test/first"))
    // console.log(docSnapshot.exists())

    await env.withSecurityRulesDisabled(async context => {
        const f = context.firestore()
        const docu = doc(f, "classGroups", "rgqm8JSNqxRhqKT5xyCY")
        await setDoc(docu, {
            "classes.C2QqbAN0qE2Vxs6pW2z9.className": "changed"
        }, {merge: true})
        console.log("after")
        
    })

    await env.cleanup()
}
// await arbitraryLogs()





async function getEnv({older = true} = {}) {
    let env = await initializeTestEnvironment({
        projectId: "uplifted-env-416417",
        firestore: {
            host: "127.0.0.1",
            port: 8080,
            rules: fs.readFileSync(path.join(import.meta.dirname, "../", "storage.rules"), "utf-8")
        }
    })
    if (!older) {
        await env.clearFirestore()
    }
    return env
}



