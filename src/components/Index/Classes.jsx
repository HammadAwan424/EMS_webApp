import { skipToken } from "@reduxjs/toolkit/query"
import {  IconCalendarOff, IconMenu2  } from "src/IconsReexported.jsx"
import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { 
    useGetAuthQuery, useGetUserQuery, useGetClassByIdQuery, 
    useGetAttendanceQuery, useGetMonthlyAttendanceQuery, selectAll, 
    attendanceInitialState, selectTotal, selectIds } from "src/api/apiSlice"
import { dateUTCPlusFive, getDateStr } from "src/api/Utility"
import Pie from "../CommonUI/Pie"
import Track from "./Track"
import MediaQuery from "react-responsive"
import { useSelector } from "react-redux"
import { getAllClassIds } from "src/api/userSlice"
import { classInvitationSelector } from "src/api/invitation"
import { selectStudentsEntities, selectStudentsIds } from "../Class/ClassEdit"

function Classes() {
    const {data: Auth} = useGetAuthQuery()
    const {data: User} = useGetUserQuery(Auth.uid)
    const { acceptedAllowed} = classInvitationSelector(User)

    return (
        <>
           <div 
                className="classGrid CLASSES_SECTION_CONTAINER">
                    {acceptedAllowed.map(classId =>
                        <Class key={classId} classId={classId} classGroupId={User.invitations[classId].classGroupId} />
                    )}
           </div>
        </>
    )
}


function ClassSkeletonUI() {
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
export {ClassSkeletonUI}

function Class({classId, classGroupId, cssClasses=""}) {

    const baseDate = useMemo(() => {
        const dateWithOffset = dateUTCPlusFive()
        dateWithOffset.setUTCMonth(dateWithOffset.getUTCMonth() + 1) // to query for previous months, shift date to one month later
        const month = String(dateWithOffset.getUTCMonth() + 1).padStart(2, "0") // to change 0-11 months to 1-12 for database 
        const year = String(dateWithOffset.getUTCFullYear())
        return {ISOString: dateWithOffset.toISOString(), month, year}
    }, [])
    const [uniqueParams, setUniqueParams] = useState(null)
    const [swipeBack, setSwipeBack] = useState(0)

    const [dropdown, setDropdown] = useState(false)
    const dropdownRef = useRef(null)
    const {data: classData, isLoading: loadingDetails} = useGetClassByIdQuery({classId, classGroupId})
    const todayDateStr = getDateStr() // today because no dateUTCPlusFive is provided
    const {hash} = useLocation()

    const {data: attendance, isError, isFetching: fetchingAttendance, isLoading: loadingAttendance} = useGetAttendanceQuery({classId, classGroupId, dateStr: todayDateStr})
    
    const queryArgs = uniqueParams ? {classId, classGroupId, dateStr: uniqueParams} : skipToken
    const {data: monthly, isFetching: fetchingMonthly} = useGetMonthlyAttendanceQuery(queryArgs)
    const {noMoreData=false, newUniqueParams=null} = monthly ?? {}
    const allPreviousAttendance = selectAll(monthly ?? {monthly: attendanceInitialState})
    const allPreviousCount = selectTotal(monthly ?? {monthly: attendanceInitialState})

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
        return <ClassSkeletonUI />
    }

    const todayStudentIds = selectStudentsIds(attendance)
    const todayStudentEntities = selectStudentsEntities(attendance)
    const presentCount = todayStudentIds.filter(id => todayStudentEntities[id].status == 1).length
    const totalStuCount = todayStudentIds.length
 
    function previous() {
        setSwipeBack(swipeBack - 1)
    }
    function next() {
        setSwipeBack(swipeBack + 1)
    }
    

    let readAble;
    const atStart = swipeBack == 0
    const userViewingLoadingOrNoMoreData = allPreviousCount+swipeBack == -1
    if (atStart) {
        const copy = new Date(baseDate.ISOString)
        readAble = copy.toLocaleString("en-GB", {"day": "numeric", "month": "long", "timeZone": "UTC"})
    } else if (userViewingLoadingOrNoMoreData) {
        readAble = "Older"
    } else {
        const copy = new Date(baseDate.ISOString)
        const activeCardId = selectIds(monthly).at(swipeBack)
        copy.setUTCMonth(parseInt(activeCardId.slice(-4,-2))-1)
        copy.setUTCFullYear(parseInt(activeCardId.slice(-8, -4)))
        copy.setUTCDate(parseInt(activeCardId.slice(-2,)))
        readAble = copy.toLocaleString("en-GB", {"day": "numeric", "month": "long", "timeZone": "UTC"})
    }


    const pathBack = hash == "#classgroup" ? `/?id=${classGroupId}${hash}` 
        : hash == "#class" ? `/?id=${classId}${hash}` 
        : "/"

    return(
        <div data-id={classId} className={`CLASS p-2 flex group gap-1 overflow-hidden flex-col transition
                items-start rounded-md hover:bg-[--theme-quad] border-theme-100 border ${cssClasses}`} 
        >
            <div className="wrapper flex justify-between self-stretch items-center relative">
                <div className="title-200"> {classData.className} </div>
                {/* <div className="text-sm"> {} </div> */}     
                <IconMenu2 onClick={() => setDropdown(true)} className="cursor-pointer" />
                {/* TODO: Edit route for a class that is joined class/${classGroupId}/${classId} */}
                {dropdown && (
                    <div 
                        id="Dropdown" 
                        ref={dropdownRef} 
                        onClick={() => setDropdown(false)}
                        className="absolute bg-theme-500 cursor-pointer z-20 
                            min-w-20 rounded-sm select-none top-6 right-6" 
                        >
                        <div className="border-b border-theme-100 p-1"><Link className="noLink" to={`/`}>Edit</Link></div>
                        <div className="border-b border-theme-100 p-1"><Link 
                            className="noLink" state={pathBack}
                            to={`/attendance/set/${classGroupId}/${classId}/${getDateStr()}`}
                        >Attendance</Link></div>
                        <div className="p-1 "><Link className="noLink" 
                            to={`/class/details/${classGroupId}/${classId}`}
                        >Details</Link></div>
                    </div>
                )}
            </div>

            <div id="All Space" className="flex-auto self-stretch text-center flex items-center justify-center h-1">

                <div className="flex-[2_1_0] flex items-center justify-center self-stretch">
                    <Track totalItems={allPreviousCount+1+(fetchingMonthly||noMoreData ? 1 : 0)} swipeBack={swipeBack} navigation={{next, previous}}>

                        {noMoreData && (
                            <div className="bg-theme-500 rounded-full overflow-hidden w-full h-full inline-block relative select-none">
                                <div className="flex items-center justify-center w-full h-full flex-col">
                                    <MediaQuery minWidth={640}>
                                        {(matches) => <IconCalendarOff size={matches ? 30 : 20} />}
                                    </MediaQuery>
                                    <div className="md:text-lg">No previous data</div>
                                </div>
                            </div>
                        )}

                        {fetchingMonthly && (
                            <div className="bg-neutral-700 animate-pulse rounded-full overflow-hidden w-full h-full inline-block relative select-none">
                                <div className="flex items-center justify-center w-full h-full">
                                <h1>{"Loading..."}</h1>
                                </div>
                            </div>                        
                        )}

                        
                        {/* List from monthly attendance */}
                        {allPreviousAttendance.map(card => 
                            <div key={card.id} className="bg-red-600 rounded-full overflow-hidden w-full h-full inline-block relative select-none">
                                <Pie percentage={card.count / card.total * 100}>
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-3xl sm:text-4xl lg:text-5xl">{card.count}/{card.total}</span>
                                    </div>
                                </Pie>
                            </div>
                        )}


                        {/* Today attendance from getAttendance */}
                        {attendance.exists ? (
                            <Link className="noLink" draggable={false}
                                to={`/attendance/view/${classGroupId}/${classId}/${getDateStr()}`} state={pathBack}
                            >   
                                <div className="bg-red-600 rounded-full overflow-hidden w-full h-full inline-block relative select-none">
                                    <Pie percentage={presentCount / totalStuCount * 100}>
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-3xl sm:text-4xl lg:text-5xl">{presentCount}/{totalStuCount}</span>
                                        </div>
                                    </Pie>
                                </div>
                            </Link>
                        ) : (
                            <Link className="noLink" draggable={false} 
                                to={`/attendance/view/${classGroupId}/${classId}/${getDateStr()}`} state={pathBack}
                            >
                                <div 
                                    className="bg-theme-500 rounded-full overflow-hidden w-full h-full inline-block relative select-none"
        
                                >
                                    <div className="flex items-center justify-center w-full h-full flex-col">
                                        <MediaQuery minWidth={640}>
                                            {(matches) => <IconCalendarOff size={matches ? 30 : 20} />}
                                        </MediaQuery>
                                        <span className="md:text-lg pt-1">No data exists</span>
                                        <span className="text-xs md:text-sm">Click me</span>
                                    </div>
                                </div>
                            </Link>

                        )}
                    </Track>
                </div>
            </div>
                
            <div className="ml-auto text-xs md:text-sm lg:text-base">
                <span>{readAble}</span>
            </div>
        </div>
    )
}

export default Classes
export { Class }