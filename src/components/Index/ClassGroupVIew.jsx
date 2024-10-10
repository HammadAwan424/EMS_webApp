import { useGetAuthQuery, useGetUserQuery } from "src/api/apiSlice"
import Classes, { Class } from "./Classes"
import { IconUserFilled } from "@tabler/icons-react"
import { useLayoutEffect } from "react"
import { ClassGroup } from "./ClassGroups"
import Apology from "../Apology/Apology"
import { Link } from "react-router-dom"


function ClassGroupView({id}) {
    
    const {data: Auth} = useGetAuthQuery()
    const {data: User} = useGetUserQuery(Auth.uid)
    console.log("RECEIVED VALUE: ", id)

    return (
        <>
        <span className="title pt-0">ClassGroups</span>
        {
            id == "all" ? <h1>This page is for all, TODO</h1>
                : id == "nogroup" ? 
                <Apology>
                    <span>{"ClassGroups that you'll create will appear here. "}
                        <Link to={'/classgroup/create'}>Create a classGroup Now</Link>
                    </span>
                </Apology>
                : <ClassGroup id={id}></ClassGroup>
        }
        </>
    )
    
}


export default ClassGroupView
