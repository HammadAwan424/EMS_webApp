import { useEffect, useRef, useState } from 'react'
import Alert from "../CommonUI/Alert.jsx"
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useGetAuthQuery, useRegisterMutation } from 'src/api/apiSlice.js'
import Button from '../CommonUI/Button.jsx'


function Register() {
    console.log("Register is in effect")

    const emailRef = useRef()
    const passwordRef = useRef()
    const [confirmPassword, setConfirmPassword] = useState("")
    const [displayName, setDisplayName] = useState("")
    const [status, setStatus] = useState({visible: false, text: "", type: ""})
    const navigate = useNavigate()
    const location = useLocation()
    const [register, {isLoading, isSuccess}] = useRegisterMutation()
    
    const {data: userAuth} = useGetAuthQuery()


    function redirectBack() {
        navigate(location.state || "/", {replace: true});
    }

    console.log(status)
    

    useEffect(() => {
        if (userAuth) {
            return redirectBack()
        }
    }, [userAuth])

    async function handleClick(e) {
        e.preventDefault()
        const email = emailRef.current.value
        const password = passwordRef.current.value
        if (password !== confirmPassword) {
            setStatus({visible: true, type: "warning", text: "Password mismatch"})
            return
        }
        try {
            await register({ email, password, displayName }).unwrap()
            setStatus({type: "success", text: "Registered successfully, redirecting in a second...", visible: true})
        } catch (err) {
            const errorMsg = err.code == "auth/invalid-credentials" ? "Email and/or password incorrect" :
                "Couldn't register for now, try again later"
            setStatus({type: "warning", text: errorMsg, visible: true})
        }
    }

    return(
        <div className='py-8'>
            {!userAuth ? (
                <div id="Registration-Form" className="flex flex-col gap-10 bg-[rgb(59,59,59)] p-6 w-80 mx-auto rounded">  
                    <h1 className='text-white self-center'>Register</h1>

                    <form action="" className='flex flex-col gap-4' onSubmit={(e) => handleClick(e)}>
                        <p>Your Display Name</p>
                        <input 
                            className='text-white bg-neutral-600 rounded-sm p-1'  
                            type="text" placeholder="Enter Display Name" required value={displayName}
                            onInput={(e) => setDisplayName(e.target.value)}/>
                        
                        <p className='text-sm'>Enter you email address</p>
                        <input className='text-white bg-neutral-600 rounded-sm p-1' ref={emailRef} type="email" placeholder="Enter Email" required/>
                        
                        <p className='text-sm pt-2'>Password</p>
                        <input className='text-white bg-neutral-600 rounded-sm p-1' minLength={6} ref={passwordRef} type="password" placeholder="Enter Password" required />
                        
                        <p className='text-sm pt-2'>Confirm Password</p>
                        <input className='text-white bg-neutral-600 rounded-sm p-1' minLength={6}
                            type="password" placeholder="Re-enter Password" required
                            onChange={(e) => setConfirmPassword(e.currentTarget.value)} value={confirmPassword}
                        />
                        <div></div>
                        <Alert show={status.visible} text={status.text} type={status.type} />
                        <Button states={{isLoading}} text={{idleText: "Register", loadingText: "Registering..."}} />
                        <div className='text-sm self-center'>Already have an account? <Link to="/login" state={location.state ?? "/"}>Sign in</Link></div>
                    </form>
                </div>
                ) : null
            }
        </div>

    )
}







export default Register