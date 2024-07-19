import { signInWithEmailAndPassword, AuthErrorCodes as code, connectAuthEmulator, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth'
import { useRef, useState, useEffect } from 'react'
import { auth } from "../../firebase/config.js"
import Alert from "../reusableComponents/Alert.jsx"
import { useAuth } from '../Root.jsx'
import { Link, useLocation, useNavigate, useNavigation } from 'react-router-dom'

function Login() {
    console.log("Login comp is in effect")

    const emailRef = useRef()
    const passwordRef = useRef()
    const [status, setStatus] = useState({visible: false, text: "", type: ""})
    const location = useLocation()
    const [formVisible, setFormVisible] = useState(false)
    const navigate = useNavigate()    

    function redirectBack() {
        navigate(location.state?.from || "/");
    }

    const isAuthenticated = useAuth()

    useEffect(() => {
        if (auth.currentUser) {
            redirectBack()
        }
    }, [isAuthenticated])


    function handleClick(e) {
        e.preventDefault()
        const email = emailRef.current.value
        const password = passwordRef.current.value
        console.log(email, password)
        signInWithEmailAndPassword(auth, email, password)
            .then(creds => {
                setStatus(() => {
                    return {
                        type: "success",
                        text: "Signed in successfully, redirecting..."
                    }
                })
            })
            .catch(err => {
                setStatus(() => {
                    return {
                        type: "warning",
                        text: err.code == "auth/wrong-password" ? "The password you entered is incorrect" :
                            err.code == "auth/user-not-found" ?  "Incorrect email" :
                            "Couldn't sign in, try again"
                    }
                })  
            })
            .finally(() => setStatus((prev) => {return {...prev, visible: true}}))
    }

    return(
        <div className='py-8'>
            {!auth.currentUser ? (
                <div className="flex flex-col gap-10 bg-[rgb(59,59,59)] p-6 w-80 mx-auto rounded">  
                    <h1 className='text-white self-center'>Login</h1>

                    <form action="" className='flex flex-col gap-4' onSubmit={(e) => handleClick(e)}>
                        <p className='text-sm'>Enter you email address</p>
                        <input className='text-black bg-neutral-600 rounded-sm p-1' ref={emailRef} type="email" placeholder="Enter Email" required/>
                        <p className='text-sm pt-2'>Password</p>
                        <input className='text-black bg-neutral-600 rounded-sm p-1' ref={passwordRef} type="password" placeholder="Enter Password" required />
                        <Alert show={status.visible} text={status.text} type={status.type} />
                        <div></div>
                        <button type="submit">Sign in</button>
                        <div className='text-sm self-center'>Don't have an account? <Link to="/register" state={{from: location.pathname}}>Register Now</Link></div>
                    </form>
                </div>
                ) : null
            } 
        </div>

    )
}

export default Login