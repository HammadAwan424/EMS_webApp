import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from "react-router-dom";
import RootLayout from "./components/Layout/Layout.jsx"
import Root, {RootLoader, AuthRequired} from "./components/Root.jsx";
import Index from "./components/Index/Index.jsx"
import RootErrorPage from "./components/Layout/Error-page.jsx"
import Login from "./components/Auth/Login.jsx";
import Register from "./components/Auth/Register.jsx";
import { auth } from "./firebase/config.js";
// import { editAction, editLoader } from "./components/Edit/Edit.jsx"
// import EditErrorPage from "./components/Edit/ErrorPage.jsx";
import { signOutAction } from "./api/Utility.js";
// import { classAction, classLoader } from "./components/Index/Dashboard.jsx";
// import ClassInput, {loader as classEditLoader, action as classEditAction} from "./components/Class/ClassEdit.jsx";
import ClassGroupEdit from "./components/Classgroup/GroupEdit.jsx";
import ClassGroupCreate from "./components/Classgroup/GroupCreate.jsx";
import Notifications from "./components/Notifications/Notifications.jsx";
import { DetailedClassWrapper } from "./components/Index/DetailedClass.jsx";
import View from "./components/Attendance/View.jsx";
import ClassEditRoute from "./components/Class/ClassEditRoute.jsx";
import ClassLayout from "./components/Class/ClassLayout.jsx";
import TodayAttendanceWrapper from "./components/Attendance/TodayAttendanceWrapper.jsx";
import CS50 from "./components/CS50/CS50.jsx";


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
            <Route element={<Root />} loader={RootLoader} errorElement={<RootErrorPage />} id="root">
                <Route 
                    path="sssh!"
                    element={<CS50 />}
                />

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
                >   
    
                    <Route index element={<Index />} />
    
                    <Route path="classgroup/:Id" 
                        element={<AuthRequired><ClassGroupEdit /></AuthRequired>} 
                        // action={editAction} loader={editLoader} 
                        // errorElement={<EditErrorPage />}
                    />

                    <Route
                        path="classgroup/create"
                        element={<AuthRequired><ClassGroupCreate /></AuthRequired>}
                    />

                    <Route 
                        path="classgroup/:classGroupId/class/:classId" 
                        element={<AuthRequired><ClassLayout /></AuthRequired>}
                    >
                        <Route 
                            path="details"
                            element={<DetailedClassWrapper />}
                        />

                        <Route 
                            path="edit" 
                            element={<ClassEditRoute />}
                        />

                        <Route 
                            path="attendance/view/:dateStr" 
                            element={<View />}
                        />

                        <Route 
                            path="attendance/today" 
                            element={<TodayAttendanceWrapper />}
                        />
                    </Route>


                    <Route
                        path="notifications" element={<AuthRequired><Notifications /></AuthRequired>}
                    />  

                    <Route path="view" element={<View />}></Route>
                </Route>
            </Route>
        )
    )

    return(

        <RouterProvider router={router} />
    )
}


export default CustomRouterProvider