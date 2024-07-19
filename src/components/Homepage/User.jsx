import { onAuthStateChanged, signInWithPhoneNumber, signOut } from "firebase/auth"
import { auth } from "src/firebase/config.js"
import { collection, getDocs, limit, snapshotEqual, where } from "firebase/firestore"
import { query } from "firebase/firestore"
import { Children, useEffect, useRef, useState } from "react"
import { firestore } from "src/firebase/config.js"
import { useLoaderData, useNavigation, useSearchParams } from "react-router-dom"
import DashBoard from "./Dashboard.jsx"
import NewUser from "./NewUser.jsx"



function User() {

    const [data, setData] = useState({isReady: false, content: undefined})

    const loaderData = useLoaderData()
    console.log("Logging loader Data", loaderData)
    const navigation = useNavigation()

    
    return (
        <>
            {
                navigation.state == "loading" ? <h1>Loading from Loader</h1>
                    : loaderData == null ? <NewUser />
                        : <DashBoard querySnapshot={loaderData} />
            }
        </>
    )

    
}




export default User

