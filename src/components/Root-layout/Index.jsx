import { Link, useLoaderData, useLocation } from "react-router-dom"
import { IconArrowRight } from "@tabler/icons-react"
import Homepage from "../Homepage/Homepage"
import { query, collection, where, limit, getDocs } from "firebase/firestore";
import { auth, firestore } from "src/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { getClassGroupByUser } from "src/api/classGroups";


async function loader() {
    return await getClassGroupByUser(auth.currentUser.uid)
}


function Index() {

    return (
        <>
        <Homepage />
        </>

    )
}

export default Index
export {loader}