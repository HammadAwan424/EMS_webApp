import { skipToken } from "@reduxjs/toolkit/query"
import {  IconCalendarOff, IconMenu2  } from "src/IconsReexported.jsx"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useGetAuthQuery, useGetUserQuery, useGetClassByIdQuery, useGetAttendanceQuery, useGetMonthlyAttendanceQuery, selectAll, attendanceInitialState, selectTotal, selectIds } from "src/api/apiSlice"
import { dateUTCPlusFive, getDateStr } from "src/api/Utility"
import Pie from "../CommonUI/Pie"
import Track from "./Track"
import MediaQuery from "react-responsive"
import { useSelector } from "react-redux"
import { getAllClassIds } from "src/api/userSlice"

function Classes() {
    const {data: Auth} = useGetAuthQuery()
    const {data: User} = useGetUserQuery(Auth.uid)
    const classIds = useSelector(getAllClassIds)

    return (
        <div className="CLASSES_CONTAINER flex flex-col gap-4 bg-[--theme-secondary] rounded-md p-4">
        {classIds.active.length > 0 ? (
           <div className="ONLY-CLASSES grid overflow-hidden gap-3 grid-cols-2 auto-rows-[minmax(200px,auto)] lg:auto-rows-[minmax(250px,auto)]">
                {classIds.active.map(classId =>
                    <Class key={classId} classId={classId} classGroupId={User.invitations[classId].classGroupId} />
                )}
           </div>
        ) : (
            <div>{"You don't have any classes"}</div>
        )}
        </div>

    )
}



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
    const {data: classData, isLoading: loadingDetails} = useGetClassByIdQuery({classId, classGroupId})
    const todayDateStr = getDateStr() // today because no dateUTCPlusFive is provided

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
    

    if (loadingDetails || loadingAttendance) {
        return <h1>Abracadabra</h1>
    }

    const presentCount = Object.values(attendance.students ?? {}).filter(v => v.status == 1).length
    const totalStuCount = Object.keys(attendance.students ?? {}).length
 
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
    
    return(
        <div data-id={classId} className={`CLASS p-2 flex group gap-1 overflow-hidden flex-col transition
                items-start rounded-md hover:bg-[--theme-quad] bg-[--theme-primary] ${cssClasses}`} 
        >
            <div className="wrapper flex justify-between self-stretch items-center relative">
                <div className="font-semibold text-2xl"> {classData.className} </div>
                {/* <div className="text-sm"> {} </div> */}     
                <IconMenu2 onClick={() => setDropdown(true)} className="cursor-pointer" />
                {dropdown && (
                    <div id="Dropdown" className="absolute bg-slate-600 cursor-pointer z-20 min-w-20 rounded-md select-none top-6 right-6" onClick={() => setDropdown(false)}>
                        <div className="border-b p-2"><Link className="text-inherit hover:text-inherit" to={`class/${classGroupId}/${classId}`}>Edit</Link></div>
                        <div className="border-b p-2"><Link className="text-inherit hover:text-inherit" 
                            to={`/attendance/set/${classGroupId}/${classId}/${getDateStr({dateUTCPlusFive: new Date(), hyphenated: true})}`}
                        >Attendance</Link></div>
                        <div className="border-b p-2"><Link className="text-inherit hover:text-inherit" 
                            to={`/class/details/${classGroupId}/${classId}`}
                        >Details</Link></div>
                        <div className="p-2">Close</div>
                    </div>
                )}
            </div>

            <div id="All Space" className="flex-auto self-stretch text-center flex items-center justify-center h-1">

                <div className="flex-[2_1_0] flex items-center justify-center self-stretch">
                    <Track totalItems={allPreviousCount+1+(fetchingMonthly||noMoreData ? 1 : 0)} swipeBack={swipeBack} navigation={{next, previous}}>

                        {noMoreData && (
                            <div className="bg-[--theme-tertiary] rounded-full overflow-hidden w-full h-full inline-block relative select-none">
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
                            <Link className="text-inherit hover:text-inherit font-normal" draggable={false}
                                to={`/attendance/view/${classGroupId}/${classId}/${getDateStr()}`}
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
                            <Link className="text-inherit hover:text-inherit font-normal" draggable={false} 
                                to={`/attendance/view/${classGroupId}/${classId}/${getDateStr()}`}
                            >
                                <div 
                                    className="bg-[--theme-tertiary] rounded-full overflow-hidden w-full h-full inline-block relative select-none"
        
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