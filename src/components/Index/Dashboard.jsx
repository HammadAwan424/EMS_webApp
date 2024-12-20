import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useGetAuthQuery, useGetUserQuery } from "src/api/apiSlice.js"
import classNames from "classnames"
import ClassView from "./ClassView.jsx"
import ClassGroupView from "./ClassGroupVIew.jsx"
import { getAllClassesStatus } from "src/api/rtk-helpers/invitation.js"
import { useDispatch, useSelector } from "react-redux"
import { getLastVisited, setLastVisited } from "src/api/redux/userActivity.js"
import { AttendanceCardContext } from "../Attendance/AttendanceCard.jsx"

function DashBoard() {

    // async function mine() {
    //     console.log("MINE")
    //     const token = await auth.currentUser.getIdToken()    
    //     console.log("TOKEN IS: ", token)
    // }

    const {data: Auth} = useGetAuthQuery()
    const {data: User} = useGetUserQuery(Auth.uid)
    const dispatch = useDispatch()
    
    const lastVisited = useSelector(getLastVisited)

    const {hash, pathname, search} = useLocation()

    const parsedUrl = useMemo(() => {
        const { acceptedAllowed: activeClasses } = getAllClassesStatus(User)
        let classesList = []
        activeClasses.length > 0 ? classesList = [...activeClasses, "all"] : classesList.push("noclass")
        let classGroupList = Object.keys(User.classGroups)
        // classGroupList.length > 0 ? classGroupList = [...classGroupList, "all"] : classGroupList.push("nogroup")
        classGroupList.length > 0 ? classGroupList = [...classGroupList] : classGroupList.push("nogroup")

        const hashValid = hash == "#class" || hash == "#classgroup"
        const defaultHash = "#class"

        const defaultId = hash == "#class" ? classesList[0] : hash == "#classgroup" ? classGroupList[0] : ""
        const searchParams = new URLSearchParams(search)
        const currentId = searchParams.get("id")
        const idValid = hashValid && 
            (hash == "#class" ? classesList.includes(currentId) : classGroupList.includes(currentId))
        const isValid = hashValid && idValid

        searchParams.set("id", idValid ? currentId : defaultId);

        const url = pathname + '?' + searchParams + (hashValid ? hash : defaultHash)
        
        return {
            isValid,
            url,
            newHash: hashValid ? hash : defaultHash,
            newId: idValid ? currentId : defaultId,
            classesList, classGroupList,
        }
    }, [hash, pathname, search, User])

    const {classGroupList, classesList, isValid, newHash, newId} = parsedUrl

    const navigateTo = useNavigate()

    const groupActive = newHash == "#classgroup" ? true : false

    const navigate = useCallback((id, hash, options) => {
        const groupActive = hash == "#classgroup" ? true : false
        dispatch(setLastVisited(groupActive ? {groupId: id} : {classId: id}))
        navigateTo(`/?id=${id}${hash}`, options)
    }, [navigateTo, dispatch])


    const setSelectInUrl = (e) => {
        const id = e.target.value
        navigate(id, newHash)
    }

    const classnames = (active) => {
        return classNames(
            {"bg-gray-700": active},
            {"bg-[--theme-tertiary]": !active},
            "cursor-pointer"
        )
    }

    useEffect(() => {
        // console.log("Running useEffect")
        if (!isValid) {
            // console.log("Calling navigate inside useEffect")
            navigate(newId, newHash, {replace: true})
        }
    }, [navigate, newId, newHash, isValid])

    if (!isValid) {
        // console.log("returning null")
        // console.log(parsedUrl)
        return null
    }

    return (
        <div>
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

            <div id="Topbar" className="flex items-center justify-between">
                <span className="title-100">Dashboard</span>
                <div className="self-stretch text-end">
                    {/* <label htmlFor="topBarSelect">Select: </label> */}
                    <select 
                        className="bg-transparent focus:bg-[--theme-secondary] py-1 px-2 rounded-md text-left h-full"
                        name="classSelect" value={newId} id="topBarSelect" onInput={(e) => setSelectInUrl(e)}
                        >
                        {(groupActive ? classGroupList : classesList).map(value => (
                            <option key={value} value={value}>
                                {value == "noclass" ? "--No class" 
                                : value == "nogroup" ? "--No group"
                                : value == "all" ? "All" 
                                : groupActive ? `Group ${User.classGroups[value]}`
                                : `Class ${User.invitations[value].className}`}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
                    
            <div className="py-3 md:py-1"></div> 

            <div className="flex w-48 mx-auto">
                <Link 
                    className={"noLink rounded-l-2xl flex-1 px-2 py-1 border-r-[--theme-primary] border-r-2 text-center " + classnames(!groupActive)}
                    id="classes" to={`/?id=${lastVisited.classId}#class`}
                >Classes</Link>
                <Link 
                    className={"noLink rounded-r-2xl flex-1 px-2 py-1 text-center " + classnames(groupActive)}
                    id="classgroups" to={`/?id=${lastVisited.groupId}#classgroup`}
                >ClassGroups</Link>
            </div>

            {!groupActive && <div className="py-3"></div>}
            
            <AttendanceCardContext.Provider value={{isJoined: groupActive ? false : true}}>
                {groupActive ? <ClassGroupView id={newId} /> : <ClassView id={newId} />}
            </AttendanceCardContext.Provider>
            
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
                    <div ref={ref} className="h-40 bg-white w-40 whitespace-nowrap" style={{ transform: `translate(${trackTransform}%, 0px)` }}>
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