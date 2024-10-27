import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useContext, createContext, useEffect } from "react";

import store from "src/app/store";
import { apiSlice, useGetAuthQuery } from "src/api/apiSlice";
import { Popup } from "./CommonUI/Popup";
const AuthContext = createContext(null)

export const RootLoader = async () => {
    const promise = store.dispatch(apiSlice.endpoints.getAuth.initiate())
    promise.unsubscribe()
    const {data: Auth} = await promise

    if (Auth) {
        const userDoc = store.dispatch(apiSlice.endpoints.getUser.initiate(Auth.uid))
        const classGroups = store.dispatch(apiSlice.endpoints.getClassGroups.initiate(Auth.uid))
        classGroups.unsubscribe()
        userDoc.unsubscribe()
    }
    return "Common Data"
}

function Root() {

    const {isSuccess} = useGetAuthQuery()

    return (
        <>
        {isSuccess ? (
            <>
                <Outlet />
                <Popup />
            </>
        ) : null}
        </>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}

export function AuthRequired({children}) {
    
    const navigate = useNavigate()
    const location = useLocation()
    const {data: Auth} = useGetAuthQuery()

    useEffect(() => {
        if (!Auth) {
            navigate("/login", {state: location.pathname, replace: true})
        }
    }, [Auth, location.pathname, navigate])

    return (
        Auth && (
            <>
                {children}
            </>
        )
   
    )
}


export default Root



