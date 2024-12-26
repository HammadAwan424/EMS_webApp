import { skipToken } from "@reduxjs/toolkit/query"
import {  IconCalendarOff  } from "src/IconsReexported.jsx"
import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { 
    selectAllById, selectTotalById, selectIdsById 
} from "src/api/redux/redux-utility"
import { useGetMonthlyAttendanceQuery, useGetAttendanceQuery } from "src/api/rtk-query/attendance"
import { useGetAuthQuery, useGetUserQuery } from "src/api/apiSlice"
import { useGetClassByIdQuery } from "src/api/rtk-query/class"
import { dateUTCPlusFive, getDateStr, getPath } from "src/api/Utility"
import Pie from "../CommonUI/Pie"
import MediaQuery from "react-responsive"
import { getAllClassesStatus } from "src/api/rtk-helpers/invitation"
import { selectStatsFromMonthly, selectStudentEntitiesDaily, selectStudentIdsDaily } from "src/api/rtk-helpers/attendance"
import ImprovedTrack, { trackReducer } from "../Index/ImprovedTrack"
import cn from "classnames"
import { Expand } from "../CommonUI/Icons"
import { useImmerReducer } from "use-immer"

const AttendanceCardContext = createContext({})


function AttendanceCardsList() {
    const {data: Auth} = useGetAuthQuery()
    const {data: User} = useGetUserQuery(Auth.uid)
    const { acceptedAllowed} = getAllClassesStatus(User)

    return (
        <>
           <div 
                className="attendanceCardGrid CLASSES_SECTION_CONTAINER">
                    {acceptedAllowed.map(classId =>
                        <AttendanceCard key={classId} classId={classId} classGroupId={User.invitations[classId].classGroupId} />
                    )}
           </div>
        </>
    )
}


function AttendanceCardSkeletonUI() {
    return (
        <div className={`CLASS p-2 flex group gap-1 flex-col h-[220px] lg:h-[250px]
                items-start rounded-md border-theme-100 border flex-1`}
        >
            <div className="h-6 w-12 md:w-16 bg-skeleton rounded-sm"></div>
            <div id="All Space" className="flex-auto self-stretch text-center items-center justify-center h-1">
                <div className="w-full max-h-full aspect-square flex items-center justify-center">
                    <div className="h-full max-w-full aspect-square">
                        <div className="bg-skeleton rounded-full w-full h-full"></div>
                    </div>
                </div>
            </div>
            <div className="h-4 w-16 md:w-24 md:h-5 bg-skeleton self-end rounded-sm"></div>
        </div>
    )
}


function AttendanceCard({classId, classGroupId, cssClasses=""}) {

    const attendanceClass = useContext(AttendanceCardContext)
    // Makes context.isJoined mandatory to prevent unexpectd behaviour
    if (attendanceClass.isJoined == undefined) {
        console.error("AttendanceCardContextValue: ", AttendanceCardContext)
        throw Error("AttendanceCardContextValue context didn't provide isJoined")
    }
    const isJoined = attendanceClass.isJoined
    
    const baseDate = useMemo(() => {
        const dateWithOffset = dateUTCPlusFive()
        // to query for previous months, shift date to one month later
        dateWithOffset.setUTCMonth(dateWithOffset.getUTCMonth() + 1) 
        // to change 0-11 months to 1-12 for database 
        const month = String(dateWithOffset.getUTCMonth() + 1).padStart(2, "0") 
        const year = String(dateWithOffset.getUTCFullYear())
        return {ISOString: dateWithOffset.toISOString(), month, year}
    }, [])
    const [uniqueParams, setUniqueParams] = useState(null)
    const [swipeBack, dispatch] = useReducer(trackReducer, 0)

    const [dropdown, setDropdown] = useState(false)
    const dropdownRef = useRef(null)
    const {data: classData, isLoading: loadingDetails} = useGetClassByIdQuery({classId, classGroupId})
    const todayDateStr = getDateStr() // today because no dateUTCPlusFive is provided
    const {hash} = useLocation()

    const {
        data: attendance, isError, isFetching: fetchingAttendance, isLoading: loadingAttendance
    } = useGetAttendanceQuery({classId, classGroupId, dateStr: todayDateStr})
    
    const queryArgs = uniqueParams ? {classId, classGroupId, dateStr: uniqueParams} : skipToken
    const {data: monthly, isFetching: fetchingMonthly} = useGetMonthlyAttendanceQuery(queryArgs)
    const {noMoreData=false, newUniqueParams=null} = monthly ?? {}
    const allPreviousAttendance = selectAllById(selectStatsFromMonthly(monthly))
    const allPreviousCount = selectTotalById(selectStatsFromMonthly(monthly))

    useEffect(() => {
        if (noMoreData) {
            return
        }
        else if (swipeBack == 0 && allPreviousCount == 0) {
            // Call query by updating params
            const baseParams = baseDate.year+baseDate.month
            setUniqueParams(baseParams)
        } else if (swipeBack + allPreviousCount == 0) { // const atEnd = allPreviousCount+swipeBack == 0
            // Call query by updating params
            setUniqueParams(newUniqueParams)
        }
    }, [allPreviousCount, swipeBack, baseDate, newUniqueParams, noMoreData])

    useEffect(() => {
        if (dropdown) {
            const close = (eve) => {
                if (!dropdownRef.current.contains(eve.target)) {
                    setDropdown(false)
                }
            }
            window.addEventListener("mousedown", close)
            return () => window.removeEventListener("mousedown", close)
        }
    }, [setDropdown, dropdown])
    

    if (loadingDetails || loadingAttendance) {
        return <AttendanceCardSkeletonUI />
    }

    const todayStudentIds = selectStudentIdsDaily(attendance)
    const todayStudentEntities = selectStudentEntitiesDaily(attendance)
    const presentCount = todayStudentIds.filter(id => todayStudentEntities[id].status == 1).length
    const totalStuCount = todayStudentIds.length
    

    const totalItems = allPreviousCount+1+(fetchingMonthly||noMoreData ? 1 : 0)
    function previous() {
        dispatch({type: "previous", totalItems})
    }
    function next() {
        dispatch({type: "next", totalItems})
    }
    

    let readAble;
    const atStart = swipeBack == 0
    const userViewingLoadingOrNoMoreData = allPreviousCount+swipeBack == -1
    if (atStart) {
        const copy = new Date(baseDate.ISOString)
        copy.setMonth(copy.getMonth() - 1)
        readAble = copy.toLocaleString("en-GB", {"day": "numeric", "month": "long", "timeZone": "UTC"})
    } else if (userViewingLoadingOrNoMoreData) {
        readAble = "Older"
    } else {
        const copy = new Date(baseDate.ISOString)
        const activeCardId = selectIdsById(selectStatsFromMonthly(monthly)).at(swipeBack)
        copy.setUTCMonth(parseInt(activeCardId.slice(-4,-2))-1)
        copy.setUTCFullYear(parseInt(activeCardId.slice(-8, -4)))
        copy.setUTCDate(parseInt(activeCardId.slice(-2,)))
        readAble = copy.toLocaleString("en-GB", {"day": "numeric", "month": "long", "timeZone": "UTC"})
    }


    const pathBack = hash == "#classgroup" ? `/?id=${classGroupId}${hash}` 
        : hash == "#class" ? `/?id=${classId}${hash}` 
        : "/"
    const trackElemClasses = cn(
        "noLink flex flex-col items-center justify-center rounded-full h-full select-none"
    )

    return(
        <div data-id={classId} className={`CLASS p-2 flex group gap-1 overflow-hidden flex-col transition
                items-start rounded-md hover:bg-[--theme-quad] border-theme-100 border ${cssClasses}`} 
        >
            <div className="wrapper flex justify-between self-stretch items-center relative">
                <Link 
                    className="title-200 noLink" 
                    to={getPath.attendance({classId, classGroupId, isJoined}).view({dateStr: todayDateStr})}
                >{classData.className}
                </Link>
            </div>

            <div id="All Space" className="flex-auto self-stretch text-center flex items-center h-1 gap-1">
                <Expand size={"100%"} onClick={previous} 
                    className="rotate-180 hover:bg-theme-300 w-6 h-6 md:w-8 md:h-8 lg:w-12 lg:h-12 rounded-md"/>

                <div className="max-h-full aspect-square flex flex-1 justify-center">
                    <div className="h-full max-w-full aspect-square overflow-hidden">
                       <ImprovedTrack classNames={"h-full"} 
                            totalItems={allPreviousCount+1+(fetchingMonthly||noMoreData ? 1 : 0)}
                            swipeBack={swipeBack} navigation={{next, previous}}
                        >

                            {noMoreData && (
                                <div className={cn(trackElemClasses, "bg-theme-500")}>
                                    <MediaQuery minWidth={640}>
                                        {(matches) => <IconCalendarOff size={matches ? 30 : 20} />}
                                    </MediaQuery>
                                    <div className="md:text-lg">No previous data</div>
                                </div>
                            )}

                            {fetchingMonthly && (
                                <div className={cn(trackElemClasses, "bg-neutral-700")}>
                                    <div className="md:text-lg">{"Loading..."}</div>
                                </div>                        
                            )}

                            
                            {/* List from monthly attendance */}
                            {allPreviousAttendance.map(card => 
                                <Link className={cn(trackElemClasses, "bg-red-500")} draggable={false} key={card.id}
                                    to={getPath.attendance({ classId, classGroupId, isJoined }).view({dateStr: card.id})} 
                                    state={pathBack}
                                >
                                        <Pie percentage={card.count / card.total * 100}>
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-3xl sm:text-4xl lg:text-5xl">{card.count}/{card.total}</span>
                                            </div>
                                        </Pie>
                                </Link>
                            )}


                            {/* Today attendance from getAttendance */}
                            {attendance.exists ? (
                                <Link className={cn(trackElemClasses, "bg-theme-500")} draggable={false}
                                    to={getPath.attendance({classId, classGroupId, isJoined}).today} state={pathBack}
                                >   
                                        <Pie percentage={presentCount / totalStuCount * 100}>
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-3xl sm:text-4xl lg:text-5xl">
                                                    {presentCount}/{totalStuCount}
                                                </span>
                                            </div>
                                        </Pie>
                                </Link>
                            ) : (
                                <Link className={cn(trackElemClasses, "bg-theme-500")} draggable={false} 
                                    to={getPath.attendance({classId, classGroupId, isJoined}).today} state={pathBack}
                                >
                                    <MediaQuery minWidth={640}>
                                        {(matches) => <IconCalendarOff size={matches ? 30 : 20} />}
                                    </MediaQuery>
                                    <span className="md:text-lg pt-1">No data exists</span>
                                    <span className="text-xs md:text-sm">Click me</span>
                              
                                </Link>
                            )}
                        </ImprovedTrack>
                    </div>
                </div>

                <Expand size={"100%"} onClick={next} 
                    className="hover:bg-theme-300 w-6 h-6 md:w-8 md:h-8 lg:w-12 lg:h-12 rounded-md"/>
            </div>
                
            <div className="ml-auto text-xs md:text-sm lg:text-base">
                <span>{readAble}</span>
            </div>
        </div>
    )
}

export default AttendanceCard
export { AttendanceCardSkeletonUI, AttendanceCardsList, AttendanceCardContext }