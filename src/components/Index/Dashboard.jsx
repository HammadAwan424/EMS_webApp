import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import Track from "./Track.jsx"
import { IconMenu2 } from "@tabler/icons-react"
import { deleteDoc, doc } from "firebase/firestore"
import { auth, firestore } from "src/firebase/config.js"
import Alert from "../CommonUI/Alert.jsx"
import { Link, useFetcher, useLocation, useNavigate, useNavigation, useParams, useRouteLoaderData } from "react-router-dom"
import { getClassById, Teacher } from "src/api/classGroups.js"
import { apiSlice, useGetAttendanceQuery, useGetAuthQuery, useGetClassByIdQuery, useGetClassGroupsQuery, useGetMonthlyAttendanceQuery, useGetUserQuery } from "src/api/apiSlice.js"
import { skipToken } from "@reduxjs/toolkit/query"
import store from "src/app/store.js"
import { createSelector } from "@reduxjs/toolkit"
import Pie from "../CommonUI/Pie.jsx"
import { produce } from "immer"
import { getDateStr } from "src/api/Utility.js"
import ClassGroups from "./ClassGroups.jsx"
import Classes from "./Classes.jsx"
import classNames from "classnames"
import { useSelector } from "react-redux"
import { getAllClassIds } from "src/features/user/userSlice.js"
import ClassView from "./ClassView.jsx"


function DashBoard() {

    // async function mine() {
    //     console.log("MINE")
    //     const token = await auth.currentUser.getIdToken()    
    //     console.log("TOKEN IS: ", token)
    // }

    // (function k() {
    //     mine()
    // })()

    const navigation = useNavigation()
    const {data: Auth} = useGetAuthQuery()
    const {data: User} = useGetUserQuery(Auth.uid)
    const classIds = useSelector(getAllClassIds)
    const selectRef = useRef(null)

    const {hash} = useLocation()
    const navigate = useNavigate()
    const classGroupActive = hash == "#classgroups" ? true : false

    const setSelectInUrl = (e) => {
        const id = e.target.value
        navigate(`/?id=${id}${hash}`)
    }
    

    const selectOptions = useMemo(() => {
        let tmp = []
        classIds.active.length > 0 ? tmp = [...classIds.active, "all"] : tmp.push("noclass")
        return tmp
    }, [classIds])
    

    useEffect(() => {
        const url = new URL(window.location)
        const id = url.searchParams.get("id")
        url.searchParams.set("id", selectOptions.includes(id) ? id : selectOptions[0]);
        url.hash = url.hash == "classes" || url.hash == "classgroups" ? url.hash : "classes"
        navigate(url.pathname+url.search+url.hash)
    }, [selectOptions])

    const classnames = (active) => {
        return classNames(
            {"bg-gray-700": active},
            {"bg-[--theme-tertiary]": !active},
            "cursor-pointer"
        )
    }
    
    const url = new URL(window.location);
    // Hash and id both are available
    const id = url.searchParams.get("id")

    console.log(selectOptions.includes(id))

    if (!selectOptions.includes(id) || !(hash == "#classes" || hash == "#classgroups")) {
        return null
    }

    return (
        <div className="sm:p-2">
            {/* <div className="p-20">
                <div className=" w-80 h-40 bg-red-400 flex flex-col">
                    <div>
                        Hello world
                    </div>
                    <div>
                        Hello world
                    </div>
                    <div>
                        Hello world
                    </div>
                    <div className="flex-auto h-3 bg-white self-stretch items-center">
                        <div className=" bg-pink-300 w-full aspect-square max-h-full">
                        </div>
                    </div>
                </div>
            </div> */}
            <div id="Topbar" className="flex items-center px-4 py-2">
                <div className="SPACER flex-1"></div>
                <div className="flex w-48 mx-auto ">
                    <a 
                        className={"noLink rounded-l-2xl flex-1 px-2 py-1 border-r-[--theme-primary] border-r-2 text-center " + classnames(!classGroupActive)}
                        href="#classes" id="classes"
                    >Classes</a>
                    <a 
                        className={"noLink rounded-r-2xl flex-1 px-2 py-1 text-center " + classnames(classGroupActive)}
                        href="#classgroups" id="classgroups"
                    >ClassGroups</a>
                </div>

                <div className="flex-1 self-stretch text-end">
                    {/* <label htmlFor="topBarSelect">Select: </label> */}
                    <select 
                        className="bg-transparent focus:bg-[--theme-secondary] py-1 px-2 rounded-md text-left h-full" ref={selectRef}
                        name="classSelect" id="topBarSelect" onInput={(e) => setSelectInUrl(e)}
                        >
                        {selectOptions.map(value => (
                            <option key={value} value={value} selected={value == id}>
                                {value == "noclass" ? "--No class" : value == "all" ? "All" : `Class ${User.invitations[value].className}`}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {classGroupActive ? <ClassGroups /> : <ClassView id={id} />}
            {/* <Try /> */}
        </div>
    )
}

function Try() {

    const ref = useRef(null)
    const [added, setAdd] = useState(false)
    const [trackTransform, setTrackTransform] = useState(-200)
    const [anotherTransform, setAnotherTransform] = useState(0)
    const inputRef = useRef(null)
    

    function start() {
        setTrackTransform(0)
    }


    function add() {
        if (inputRef.current.checked) {
            setAnotherTransform(-200)
            setAdd(true)
        } else {
            setAdd(true)
        }
       

    }

    function reset() {
        setAdd(false)
        setTrackTransform(-200)
        setAnotherTransform(0)
    }

    return (
        <>
            <div className="ml-40">
                <div className="inline-block" style={{ transform: `translate(${anotherTransform}%, 0px)` }}>
                    <div ref={ref} className="h-40 bg-white w-40 whitespace-nowrap duration-[5000ms]" style={{ transform: `translate(${trackTransform}%, 0px)` }}>
                        {added && (
                            <>
                                <div className="w-40 h-full inline-flex  whitespace-nowrap bg-blue-500"></div>
                                <div className="w-40 h-full inline-flex  whitespace-nowrap bg-orange-500"></div>
                            </>
                        )}
                        <div className="w-40 h-full inline-flex whitespace-nowrap bg-red-500 overflow-hidden"><h1>Goal</h1></div>
                        <div className="w-40 h-full inline-flex  whitespace-nowrap bg-green-500"></div>
                        <div className="w-40 h-full inline-flex whitespace-nowrap bg-pink-500"></div>

                    </div>
                    <div className="w-40 py-2 border-l"></div>
                </div>

            </div>

            <div className="flex gap-1 items-center">
                <button onClick={start}>Start</button>
                <button onClick={add}>Add</button>
                <button onClick={reset}>Reset</button>
                <label htmlFor="checkbox">Optimize</label>
                <input id="checkbox" type="checkbox" ref={inputRef} />
            </div>

        </>
        
    )
}










// async function classLoader({request, params}) {
//     const { classGroupId, classId } = params
//     const promise = store.dispatch(apiSlice.endpoints.getClassById.initiate({classGroupId, classId}))
//     promise.unsubscribe()
//     return "Common Data"
// }

// async function classAction({request, params}) {
//     const { classGroupId, classId } = params
//     return "hello wrold"
// }
// export {classLoader, classAction}



export default DashBoard