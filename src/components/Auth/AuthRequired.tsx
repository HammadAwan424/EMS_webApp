import { useGetAuthQuery } from "#src/api/rtk-query/apiSlice.ts"
import { createContext, FunctionComponent, ReactNode, useContext, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import type { AppAuth } from "#src/api/rtk-query/auth/util.ts"

const AppAuthContext = createContext<undefined | AppAuth>(undefined)

export function useAppAuthContext() {
    const Auth = useContext(AppAuthContext)
    if (!Auth) 
        throw new Error(
            "No AuthContext.Provider was provided, "
    )
    return Auth
}


// enforces login, wrapper for protected pages
export const AuthRequired: FunctionComponent<{children: ReactNode}> = ({ children }) => {
    const navigate = useNavigate()
    const location = useLocation()
    const {data: Auth} = useGetAuthQuery()

    useEffect(() => {
        // the undefined case is handled by the loader, so no worries
        // this handles the null case, when the user is not signed in 
        if (Auth == null || Auth == undefined) {
            navigate("/login", {state: location.pathname, replace: true})
        }
    }, [Auth, location.pathname, navigate])

    return (
        Auth && (
            <AppAuthContext.Provider value={Auth}>
                {children}
            </AppAuthContext.Provider>
        )
   
    )
}