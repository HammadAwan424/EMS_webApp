import { auth } from "src/firebase/config"
import User from "./User"
import Guest from "./Guest"

function Homepage() {
    return (
        <>
        {
            auth.currentUser ? <User /> : <Guest />
        }
        </>
    )
}

export default Homepage