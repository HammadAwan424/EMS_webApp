import { useEffect, useMemo, useRef, useState } from "react"
import Track from "./Track.jsx"
import { IconMenu2 } from "@tabler/icons-react"
import { deleteDoc, doc } from "firebase/firestore"
import { firestore } from "src/firebase/config.js"
import Alert from "../CommonUI/Alert.jsx"
import { Link, useFetcher, useNavigation, useParams, useRouteLoaderData } from "react-router-dom"
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


function DashBoard() {

    const navigation = useNavigation()
    const {data: Auth} = useGetAuthQuery()


    return (
        <div className="p-2">
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
            <ClassGroups />
            <Classes />

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
                    <div ref={ref} className="h-40 bg-white w-40 whitespace-nowrap duration-[5000ms] inline-block" style={{ transform: `translate(${trackTransform}%, 0px)` }}>
                        {added && (
                            <>
                                <div className="w-40 h-full inline-block bg-blue-500"></div>
                                <div className="w-40 h-full inline-block bg-orange-500"></div>
                            </>
                        )}
                        <div className="w-40 h-full inline-block bg-red-500 overflow-hidden"><h1>Goal</h1></div>
                        <div className="w-40 h-full inline-block bg-green-500"></div>
                        <div className="w-40 h-full inline-block bg-pink-500"></div>

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