import { connectAuthEmulator } from "firebase/auth";
import { auth } from "src/firebase/config";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useContext, createContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { connectFirestoreEmulator } from "firebase/firestore";
import { firestore } from "src/firebase/config";
const AuthContext = createContext(null)

function Root() {

    const [isAuthenticated, setIsAuthenticated] = useState(null)

    useEffect(() => {
        return onAuthStateChanged(auth, user => {
            if (user) {
                setIsAuthenticated(true)
            } else {
                setIsAuthenticated(false)
            }
        })
    }, [])



    return (
        <>
        {isAuthenticated !== null ? (
            <AuthContext.Provider value={isAuthenticated}>
                <Outlet />
            </AuthContext.Provider>
        ) : null}
        </>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}

export function AuthRequired({children}) {
    const isAuthenticated = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login", {state: location.pathname})
        }
    }, [])
    
    return (
        <>
        { isAuthenticated && children }
        </>
    )
}


export default Root



