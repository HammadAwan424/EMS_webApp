import { query, collection, where, limit, getDocs } from "firebase/firestore";
import { auth, firestore } from "src/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { getCurrentClassGroups } from "src/api/classGroups";
import User from "./User"
import Guest from "./Guest"
import { useGetAuthQuery, useGetClassGroupsQuery } from "src/api/apiSlice";
import store from "src/app/store";
import { apiSlice } from "src/api/apiSlice";

// async function loader() {
//     const promise = store.dispatch(apiSlice.endpoints.getAuth.initiate())
//     promise.unsubscribe()
//     const {data: Auth} = await promise

//     if (Auth) {
//         const userDoc = store.dispatch(apiSlice.endpoints.getUser.initiate(Auth.uid))
//         userDoc.unsubscribe()
//     }
//     return "Common Data"
// }

function Index() {

    const {data: Auth} = useGetAuthQuery()

    return (
        <>
        {
            Auth ? <User /> : <Guest />
        }
        </>
    )
}

export default Index