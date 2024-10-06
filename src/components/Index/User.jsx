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
import { Teacher } from "src/api/Teacher.js"
import { skipToken } from "@reduxjs/toolkit/query"
import { getAllClassIds, setActiveClasses, setClassesMarked, setInactiveClasses, setNewClasses } from "src/api/userSlice.js"
import { useDispatch, useSelector } from "react-redux"


function User() {

    const { data: Auth } = useGetAuthQuery()
    const { data: User } = useGetUserQuery(Auth.uid)
    const { data: classGroups } = useGetClassGroupsQuery(Auth.uid)


    const hasClassGroups = Teacher.hasClassGroups(classGroups)
    const hasClasses = Object.keys(User.classes).length > 0


    
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

