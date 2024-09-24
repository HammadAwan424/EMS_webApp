import { onAuthStateChanged, signInWithPhoneNumber, signOut } from "firebase/auth"
import { auth } from "src/firebase/config.js"
import { collection, getDocs, limit, snapshotEqual, where } from "firebase/firestore"
import { query } from "firebase/firestore"
import { Children, useEffect, useRef, useState } from "react"
import { firestore } from "src/firebase/config.js"
import { useLoaderData, useNavigation, useRouteLoaderData, useSearchParams } from "react-router-dom"
import DashBoard from "./Dashboard.jsx"
import NewUser from "./NewUser.jsx"
import { useGetAuthQuery, useGetClassGroupsQuery, useGetUserQuery } from "src/api/apiSlice.js"
import { Teacher } from "src/api/classGroups.js"
import { skipToken } from "@reduxjs/toolkit/query"
import { getAllClassIds, setActiveClasses, setClassesMarked, setInactiveClasses, setNewClasses } from "src/features/user/userSlice.js"
import { useDispatch, useSelector } from "react-redux"


function User() {

    const { data: Auth } = useGetAuthQuery()
    const { data: User } = useGetUserQuery(Auth.uid)
    const { data: classGroups } = useGetClassGroupsQuery(Auth.uid)
    const dispatch = useDispatch()

    const hasClassGroups = Teacher.hasClassGroups(classGroups)
    const hasClasses = Object.keys(User.classes).length > 0




    useEffect(() => {
        // invitationsKeyArray.remove(classesKeyArray) gives new invitations
        // Inform the user about the new invitations by checking their status if it is true or false
        // Take each id marked as true (user joined) from classesKeyArray and compare against invitationsKeyArray if some class is removed by host 
        // Add all the remaining classes to query if user wants them

        const invitationsKeyArray = Object.keys(User.invitations)
        const classesKeyArray = Object.keys(User.classes)
        const newInvitationsKeyArray = invitationsKeyArray.filter(idFromInvitation => !classesKeyArray.includes(idFromInvitation))
        if (newInvitationsKeyArray.length > 0) {
            // TODO: Inform the user
            console.log("You Have new invitations")
        }
        const [active, inactive] = [[], []]

        classesKeyArray.map(knownId => {
            const newStatus = User.invitations[knownId].status
            if (User.classes[knownId] == true) { // User joined classes
                if (newStatus == false) { // Access revoked by host/admin
                    // TODO: Prompt the user to update his doc to remove knownId from invitations as well as classes map, these shouldn't be fetched
                    console.log("Access has been revokes for: ", knownId)
                    inactive.push(knownId)
                } else {
                    active.push(knownId)
                }
            } else { // Classes rejected by user
                if (newStatus == false) { // Access revoked for classes that user is not interested in
                    // TODO: No need to tell user, silently remove the knownId from invitations as well as classes map
                    // This is just to cleanup user doc from unnecessary invitation after access has been revokes for security rules to work
                }
            }
        })
        if (active.length > 0 || inactive.length > 0 || newInvitationsKeyArray.length > 0) {
            dispatch(setActiveClasses(active));
            dispatch(setInactiveClasses(inactive));
            dispatch(setNewClasses(newInvitationsKeyArray))
        }
    }, [User, dispatch]);



    
    return (
        <>
            {
                hasClasses || hasClassGroups ? <DashBoard />
                    : <NewUser />
            }
        </>
    )

    
}



export default User

