import { useRef, useState, useEffect } from 'react'
import Alert from "../CommonUI/Alert.jsx"
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useGetAuthQuery, useSignInMutation } from 'src/api/apiSlice.js'

function Login() {

    console.log("Login component is in effect")

    const emailRef = useRef()
    const passwordRef = useRef()
    const [status, setStatus] = useState({visible: false, text: "", type: ""})
    const location = useLocation()
    const [formVisible, setFormVisible] = useState(false)
    const navigate = useNavigate()    
    const [signIn, {isLoading, isSuccess}] = useSignInMutation()

    function redirectBack() {
        navigate(location.state?.from || "/", {replace: true});
    }

    const {data: userAuth} = useGetAuthQuery()


    useEffect(() => {
        if (userAuth) {
            redirectBack()
        }
    }, [userAuth])


    async function handleClick(e) {
        e.preventDefault()
        const email = emailRef.current.value
        const password = passwordRef.current.value
        console.log(email, password)

        try {
            await signIn({ email, password }).unwrap()
            setStatus({
                type: "success",
                text: "Signed in successfully, redirecting...",
                visible: true
            })
        } catch (err) {
            setStatus({
                type: "warning",
                text: err.code == "auth/invalid-credentials" ? "Email and/or password incorrect" :
                    err.code == "auth/invalid-credentials" ? "Email and/or password incorrect" :
                        "Couldn't sign in, try again",
                visible: true
            })
        }
    }

    return(
        <div className='py-8'>
            {!userAuth ? (
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