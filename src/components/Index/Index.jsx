import User from "./User"
import Guest from "./Guest"
import { useGetAuthQuery  } from "src/api/apiSlice";


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