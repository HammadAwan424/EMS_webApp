import { onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth'
import { useEffect, useRef, useState } from 'react'
import { auth, firestore } from "../../firebase/config.js"
import { useAuth } from '../Root.jsx'
import Alert from "../reusableComponents/Alert.jsx"
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { writeBatch, doc } from 'firebase/firestore'


function Register() {
    console.log("Register is in effect")

    const emailRef = useRef()
    const passwordRef = useRef()
    const [confirmPassword, setConfirmPassword] = useState("")
    const [status, setStatus] = useState({visible: false, text: "", type: ""})
    const [formVisible, setFormVisible] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()

    const isAuthenticated = useAuth()


    function redirectBack() {
        navigate(location.state?.from || "/");
    }

    useEffect(() => {
        if (isAuthenticated) {
            redirectBack()
        }
    }, [isAuthenticated])


    function handleSubmit(e) {
        e.preventDefault()
        const email = emailRef.current.value
        const password = passwordRef.current.value

        if (password !== confirmPassword) {
            setStatus({visible: true, type: "warning", text: "Password mismatch"})
            return
        }


        createUserWithEmailAndPassword(auth, email, password)
            .then(creds => {
                setStatus(
                    {type: "success", text: "Registered successfully, redirecting...", visible: false}
                )
                const batch = writeBatch(firestore)
                batch.set(doc(firestore, "teachers", creds.user.uid), {invitations: {}})
                batch.set(doc(firestore, "teachersPublic", creds.user.uid), {email: creds.user.email})
                return batch.commit()
            })
            .catch(err => {
                const errorMsg = err.code == "auth/email-already-in-use" ? "Email already exists, change it to different address" :
                    "Couldn't register for now, try again later"

                setStatus({type: "warning", text: errorMsg, visible: false})  
            })
            .finally(() => setStatus(currentState => {
                return {...currentState, visible: true}
            }))
    }

    return(
        <div className='py-8'>
            {!isAuthenticated ? (
                <div id="Registration-Form" className="flex flex-col gap-10 bg-[rgb(59,59,59)] p-6 w-80 mx-auto rounded">  
                    <h1 className='text-white self-center'>Register</h1>

                    <form action="" className='flex flex-col gap-4' onSubmit={(e) => handleSubmit(e)}>
                        <p className='text-sm'>Enter you email address</p>
                        <input className='text-black bg-neutral-600 rounded-sm p-1' ref={emailRef} type="email" placeholder="Enter Email" required/>
                        <p className='text-sm pt-2'>Password</p>
                        <input className='text-black bg-neutral-600 rounded-sm p-1' minLength={6} ref={passwordRef} type="password" placeholder="Enter Password" required />
                        <p className='text-sm pt-2'>Confirm Password</p>
                        <input className='text-black bg-neutral-600 rounded-sm p-1' minLength={6}
                            type="password" placeholder="Re-enter Password" required
                            onChange={(e) => setConfirmPassword(e.currentTarget.value)} value={confirmPassword}
                        />
                        <div></div>
                        <Alert show={status.visible} text={status.text} type={status.type} />
                        <button type="submit">Register</button>
                        <div className='text-sm self-center'>Already have an account? <Link to="/login">Sign in</Link></div>
                    </form>
                </div>
                ) : null
            }
        </div>

    )
}







export default Register