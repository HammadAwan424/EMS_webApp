import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useGetAuthQuery, useGetUserQuery } from "src/api/apiSlice.js"
import classNames from "classnames"
import ClassView from "./ClassView.jsx"
import ClassGroupView from "./ClassGroupVIew.jsx"
import { useImmer } from "use-immer"
import { classInvitationSelector } from "src/api/invitation.js"

function DashBoard() {

    // async function mine() {
    //     console.log("MINE")
    //     const token = await auth.currentUser.getIdToken()    
    //     console.log("TOKEN IS: ", token)
    // }

    // (function k() {
    //     mine()
    // })()

    const {data: Auth} = useGetAuthQuery()
    const {data: User} = useGetUserQuery(Auth.uid)
    const { acceptedAllowed: activeClasses } = classInvitationSelector(User)

    let classesList = []
    activeClasses.length > 0 ? classesList = [...activeClasses, "all"] : classesList.push("noclass")
    let classGroupList = Object.keys(User.classGroups)
    classGroupList.length > 0 ? classGroupList = [...classGroupList, "all"] : classGroupList.push("nogroup")

    const [lastVisited, setLastVisited] = useImmer({lastGroupId: classGroupList[0], lastClassId: classesList[0]})

    const {hash, pathname, search} = useLocation()
    const groupActive = hash == "#classgroup" ? true : false

    const navigateTo = useNavigate()

    // Set ids on lastVisitedSelect with which it is called
    const navigate = useCallback((pathname, options) => {
        const [before, searchWithHash] = pathname.split("?")
        const [search, later] = searchWithHash.split("#")
        const searchParams = new URLSearchParams(search)
        const id = searchParams.get("id")
        console.log("NAVIGATE WILL SET ID: ", id)
        setLastVisited(prev => {
            groupActive ? prev.lastGroupId = id : prev.lastClassId = id
        })
        navigateTo(pathname, options)
    }, [navigateTo, groupActive, setLastVisited])


    const setSelectInUrl = (e) => {
        const id = e.target.value
        navigate(`/?id=${id}${hash}`)
    }
    const id = groupActive ? lastVisited.lastGroupId : lastVisited.lastClassId


    const classnames = (active) => {
        return classNames(
            {"bg-gray-700": active},
            {"bg-[--theme-tertiary]": !active},
            "cursor-pointer"
        )
    }

    useEffect(() => {
        const searchParams = new URLSearchParams(search)
        // default to 'id' if searchParam is not equal to id
        // searchParams.get("id") == id ? id : searchParams.set("id", id);
        // default 'classes' if # section is not valid
        const newHash = (hash == "#class" || hash == "#classgroup") ? hash : "#class"
        if (newHash != hash || searchParams.get("id") != id) {
            searchParams.set("id", id);
            console.log("CALLING NAVIGATE: ", searchParams.toString(), newHash, id)
            navigate(pathname+'?'+searchParams+newHash, {replace: true})
        }
    }, [navigate, id, hash, pathname, search])

    if ((new URLSearchParams(search).get("id") != id) || !(hash == "#class" || hash == "#classgroup")) {
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
                        name="classSelect" value={id} id="topBarSelect" onInput={(e) => setSelectInUrl(e)}
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
                    
            <div className="py-1"></div> 

            <div className="flex w-48 mx-auto">
                <Link 
                    className={"noLink rounded-l-2xl flex-1 px-2 py-1 border-r-[--theme-primary] border-r-2 text-center " + classnames(!groupActive)}
                    id="classes" to="#class"
                >Classes</Link>
                <Link 
                    className={"noLink rounded-r-2xl flex-1 px-2 py-1 text-center " + classnames(groupActive)}
                    id="classgroups" to="#classgroup"
                >ClassGroups</Link>
            </div>

            {!groupActive && <div className="py-2"></div>}

            {groupActive ? <ClassGroupView id={id} /> : <ClassView id={id} />}
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