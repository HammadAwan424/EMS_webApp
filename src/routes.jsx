import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from "react-router-dom";
import RootLayout from "./components/Layout/Layout.jsx"
import Root, {RootLoader, AuthRequired} from "./components/Root.jsx";
import Index from "./components/Index/Index.jsx"
import RootErrorPage from "./components/Layout/Error-page.jsx"
import Login from "./components/Auth/Login.jsx";
import Register from "./components/Auth/Register.jsx";
import { action as createCGAction } from "./components/Index/Create-card.jsx";
import { auth } from "./firebase/config.js";
// import { editAction, editLoader } from "./components/Edit/Edit.jsx"
// import EditErrorPage from "./components/Edit/ErrorPage.jsx";
import { signOutAction } from "./api/Utility.js";
// import { classAction, classLoader } from "./components/Index/Dashboard.jsx";
// import ClassInput, {loader as classEditLoader, action as classEditAction} from "./components/Class/ClassEdit.jsx";
import Attendance from "./components/Attendance/Attendance.jsx";
import ClassGroupEdit from "./components/Classgroup/Edit.jsx";
import ClassGroupCreate from "./components/Classgroup/Create.jsx";
import Notifications from "./components/Notifications/Notifications.jsx";


// function loaderWrapper(loader) {
//     return async function loaderWrapperFunction(obj) {
//         let unsubscribe;
//         return new Promise((resolve, reject) => {
//             unsubscribe = onAuthStateChanged(auth, (user) => {
//                 // if (user) {
//                 //     console.log(user)
//                 //     resolve(loader(obj))
//                 // } else {
//                 //     console.log("Not signed in, Rejected with null", user)
//                 //     reject(new Error("User is not signed in", {cause: "null-auth"}))
//                 // }
                
//                 // Doing just to mimic latency
//                 setTimeout(() => resolve(loader(obj)), 500)
//             })
//         })
//         .catch(err => {
//             if (err.cause != "null-auth") {
//                 throw err;
//             } 
//             // This is only to prevent err "Loader didn't return anything"
//             // root component won't render anything until this err persists aka undefined auth status
//             return err  
//         })
//         .finally(() => unsubscribe())
//     }
// }



function CustomRouterProvider() {

    const router = createBrowserRouter(
        createRoutesFromElements(
            <Route element={<Root />} loader={RootLoader} id="root">
                <Route
                    path="/login"
                    element={<Login />}
                />
    
                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route 
                    path="/signout"
                    action={() => signOutAction(auth)}
                />
    
                <Route
                path="/"
                element={<RootLayout />}
                errorElement={<RootErrorPage />}
                >   
    
                    <Route index element={<Index />} action={createCGAction} />
    
                    <Route path="/classgroup/:Id" 
                    element={<AuthRequired><ClassGroupEdit /></AuthRequired>} 
                    // action={editAction} loader={editLoader} 
                    // errorElement={<EditErrorPage />}
                    />

                    <Route
                    path="/classgroup/create"
                    element={<AuthRequired><ClassGroupCreate /></AuthRequired>}
                    />

      

                    {/* <Route 
                    path="class/:classGroupId/:classId" 
                    // loader={classEditLoader}
                    // action={classEditAction}
                    element={<AuthRequired><ClassInput /></AuthRequired>}
                    /> */}

                    <Route 
                    path="attendance/:type/:classGroupId/:classId/:date" 
                    element={<AuthRequired><Attendance /></AuthRequired>}
                    />

                    <Route
                    path="/notifications" element={<AuthRequired><Notifications /></AuthRequired>}
                    />

        
                        
                </Route>
            </Route>
        )
    )

    return(

        <RouterProvider router={router} />
    )
}


export default CustomRouterProvider