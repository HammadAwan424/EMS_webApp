import { useGetAuthQuery, useGetUserQuery } from "src/api/apiSlice"
import Classes, { Class } from "./Classes"
import { IconUserFilled } from "@tabler/icons-react"
import { useLayoutEffect } from "react"
import { ClassGroup } from "./ClassGroups"


function ClassGroupView({id}) {
    
    const {data: Auth} = useGetAuthQuery()
    const {data: User} = useGetUserQuery(Auth.uid)
    console.log("RECEIVED VALUE: ", id)

    if (id == "all") {
        return <h1>This page is for all, TODO</h1>
    } else if (id == "noclass") {
        return null
    } else {
        return <ClassGroup id={id}></ClassGroup>
    }
}


export default ClassGroupView
