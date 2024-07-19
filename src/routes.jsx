import { createBrowserRouter, createRoutesFromElements, Route, Link, redirect, useNavigate, renderMatches, redirectDocument, Router, RouterProvider } from "react-router-dom";
import RootLayout from "./components/Root-layout/Root-layout.jsx"
import Root, { AuthRequired } from "./components/Root.jsx";
import Index, { loader as indexLoader, loader } from "./components/Root-layout/Index.jsx"
import RootErrorPage from "./components/Root-layout/Error-page.jsx"
import Homepage from "./components/Homepage/Homepage.jsx";
import Login from "./components/Auth/Login.jsx";
import Register from "./components/Auth/Register.jsx";
import { action as createCGAction } from "./components/Homepage/Create-card.jsx";
import { auth, firestore } from "./firebase/config.js";
import Students from "./components/Students/Students.jsx";
import { onAuthStateChanged, connectAuthEmulator } from "firebase/auth";
import { connectFirestoreEmulator } from "firebase/firestore"
import Edit, {editAction, editLoader} from "./components/Edit/Edit.jsx"
import EditErrorPage from "./components/Edit/ErrorPage.jsx";


function loaderWrapper(loader) {
    return async function loaderWrapperFunction(obj) {
        let unsubscribe;
        return new Promise((resolve, reject) => {
            unsubscribe = onAuthStateChanged(auth, (user) => {
                if (user) {
                    resolve(loader(obj))
                } else {
                    console.log("Not signed in, Rejected with null")
                    reject(new Error("User is not signed in", {cause: "null-auth"}))
                }
            })
        })
        .catch(err => {
            if (err.cause != "null-auth") {
                throw err;
            } 
            // This is only to prevent err "Loader didn't return anything"
            // root component won't render anything until this err persists aka undefined auth status
            return err  
        })
        .finally(() => unsubscribe())
    }
}



function CustomRouterProvider() {

    const router = createBrowserRouter(
        createRoutesFromElements(
            <Route element={<Root />}>
                <Route
                    path="/login"
                    element={<Login />}
                />
    
                <Route
                    path="/register"
                    element={<Register />}
                />
    
                <Route
                path="/"
                element={<RootLayout />}
                errorElement={<RootErrorPage />}
                >   
    
                    <Route index element={<Index />} loader={loaderWrapper(indexLoader) } action={createCGAction} />
    
                    <Route path="/edit/classgroup/:Id" 
                    element={<AuthRequired><Edit /></AuthRequired>} 
                    action={editAction} loader={loaderWrapper(editLoader)} 
                    errorElement={<EditErrorPage />}
                    />
        
                    <Route
                    path="/home"
                    element={<h1>You are at home</h1>}             
                    />
    
                    <Route path="/students" element={<Students lst={[{id: 3, name: "hello"}]} />}/>
                        
                </Route>
            </Route>
        )
    )

    return(
        <RouterProvider router={router} />
    )
}


export default CustomRouterProvider