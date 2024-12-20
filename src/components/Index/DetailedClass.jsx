import { selectMonthlyStudents, selectStudentCountMonthly } from "src/api/rtk-helpers/attendance"
import { useGetAttendanceQuery, useGetMonthlyAttendanceQuery } from "src/api/rtk-query/attendance"
import AttendanceCard, { AttendanceCardSkeletonUI, AttendanceCardContext } from "src/components/Attendance/AttendanceCard"
import {  IconUserFilled  } from "src/IconsReexported.jsx"
import { useLocation, useParams } from "react-router-dom"
import { useState, useMemo , useEffect } from "react"
import { skipToken } from "@reduxjs/toolkit/query"
import { dateUTCPlusFive, getDateStr, joinedClass } from "src/api/Utility"

import ImprovedTrack from "./ImprovedTrack"
import { useGetClassByIdQuery } from "src/api/apiSlice"


function DetailedClassWrapper() {
    const {classId, classGroupId} = useParams()
    const {search} = useLocation()
    const isJoined = joinedClass(search)

    return(
        <AttendanceCardContext.Provider value={{isJoined}}>
            <DetailedClass classId={classId} classGroupId={classGroupId} />
        </AttendanceCardContext.Provider>
    )
}

export { DetailedClassWrapper }


function DetailedClassSkeletonUI() {
    return(
        <>
            <AttendanceCardSkeletonUI />

            <div className="flex gap-2 flex-col py-4">
                <div className="w-32 h-8 bg-skeleton rounded-sm"></div>
                <div className="border-theme-100 border h-20 rounded-md"></div>
            </div>
        </>
    )
}
export { DetailedClassSkeletonUI }


function DetailedClass({classId, classGroupId}) {

    const [swipeBack, setSwipeBack] = useState(0)
    const baseDate = useMemo(() => {
        const dateWithOffset = dateUTCPlusFive()
        dateWithOffset.setUTCMonth(dateWithOffset.getUTCMonth() + 1) // to query for previous months, shift date to one month later
        const month = String(dateWithOffset.getUTCMonth() + 1).padStart(2, "0") // to change 0-11 months to 1-12 for database 
        const year = String(dateWithOffset.getUTCFullYear())
        return {ISOString: dateWithOffset.toISOString(), month, year}
    }, [])
    const [uniqueParams, setUniqueParams] = useState(null)
    const todayDateStr = getDateStr()

    const queryArgs = uniqueParams ? {classId, classGroupId, dateStr: uniqueParams} : skipToken
    const {data: monthly, isLoading: loadingMonthly, isFetching: fetchingMonthly} = useGetMonthlyAttendanceQuery(queryArgs)
    const {data: classData, isLoading: loadingClass} = useGetClassByIdQuery({classId, classGroupId})
    const {noMoreData=false, newUniqueParams=null, queryArgsWithValue=[]} = monthly ?? {}
    const studentsCount = selectStudentCountMonthly(monthly)
    
    useEffect(() => {
        if (noMoreData) {
            return
        }
        else if (swipeBack == 0 && studentsCount == 0) {
            // Call query by updating params
            const baseParams = baseDate.year+baseDate.month
            setUniqueParams(baseParams)
        } else if (Math.abs(swipeBack) == queryArgsWithValue.length) { // const atEnd = allPreviousCount+swipeBack == 0
            // Call query by updating params
            setUniqueParams(newUniqueParams)
        }
    }, [queryArgsWithValue.length, studentsCount, swipeBack, baseDate, newUniqueParams, noMoreData])

    function previous() {
        setSwipeBack(swipeBack - 1)
    }
    function next() {
        setSwipeBack(swipeBack + 1)
    }
    
    if (loadingMonthly || loadingClass) {
        return <DetailedClassSkeletonUI />
    }
    
    const userViewingLoadingOrNoMoreData = queryArgsWithValue.length+swipeBack == 0
    let readable;
    if (userViewingLoadingOrNoMoreData) {
        readable = "Older"
    } else {
        const date = dateUTCPlusFive()
        date.setUTCMonth(parseInt(queryArgsWithValue.at(swipeBack-1).slice(-2,)) + 1)
        readable = date.toLocaleString("en-GB", {month: "long"})
    }
    
    return (
        <div className="flex flex-col gap-6">
            <div className="flex">
                <AttendanceCard classId={classId} classGroupId={classGroupId} cssClasses="flex-1 lg:h-[250px] h-[220px]" />
            </div>
            
            <div>
                <div className="flex justify-between items-center">
                    <span className="title-200 pb-2 inline-flex">Students Summary</span>
                    <span>{readable}</span>
                </div>
                <ImprovedTrack totalItems={queryArgsWithValue.length+1} swipeBack={swipeBack} navigation={{next, previous}}>
                    {noMoreData ? (
                    <div className="flex items-center justify-center border border-theme-100 rounded-md">
                            <span className="title-100 p-6">No Previous Data</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center">
                            <h1>{"Loading..."}</h1>
                        </div>
                    )}
                    {queryArgsWithValue.map(yearMonth => 
                        <div className="" key={yearMonth}>
                            <Students studentList={selectMonthlyStudents(monthly, yearMonth, classData)} />
                        </div>
                    )}
                </ImprovedTrack> 
            </div>

        </div>
    )
}
// [&_tr:not(:first-child)>td]:border-t-2
function Students({studentList}) {
    const [ui, setUI] = useState({showAll: studentList.length <= 3})
    return (
        <>
        <table 
            className="w-full text-center align-middle [&_td]:border-t 
                table-fixed [&_td]:h-16 border rounded-md border-theme-100 
                [&_td]:border-theme-100 border-separate border-spacing-y-2"
        >
            <thead>
                <tr>
                    <th className="text-left w-4/12 sm:w-4/12 lg:w-2/12 pl-2">Name</th>
                    <th className="w-2/12 sm:w-2/12 lg:w-2/12">Roll No</th>
                    <th className="w-6/12 sm:w-6/12 lg:w-8/12">Attendance</th>
                </tr>
            </thead>
            <tbody>
                {ui.showAll ? (
                        studentList.map(studentData => <StudentRow key={studentData.id} studentData={studentData} />)
                ) : (
                    <>
                        <StudentRow studentData={studentList[0]} />
                        <tr>
                            <td colSpan={3}>
                                <div className="flex flex-col items-center gap-1">
                                    <div className="threeDots"></div>
                                    <button onClick={() => setUI({showAll: true})} className="p-2">Show All</button>
                                    <div className="threeDots"></div>
                                </div>
                            </td>
                        </tr>
                        <StudentRow studentData={studentList.at(-1)} />
                    </>
                )}

            </tbody>
        </table>
        </>
    )
}

function StudentRow({studentData}) {
    const [present, absent] = [studentData?.present ?? 0, studentData?.absent ?? 0]
    const zeroToOne = ( present / (present + absent))
    const percentage = Math.round(zeroToOne * 100)

    const red =  [220, 38, 38]
    const green = [34, 197, 94]
    const shift = green.map((channelInGreen, index) => {
        const greenShift = (channelInGreen * zeroToOne)
        const redShift = red[index] * (1-zeroToOne)
        return greenShift + redShift
    })
    const colorStr = `rgb(${shift.join(", ")}`

    return (
        <tr key={studentData.id} className="">
            <td className="text-left pl-2">
                <IconUserFilled className="inline-block" />
                <span className="pl-1 relative inline-block top-[2px]">{studentData.studentName || "No name"}</span>
            </td>
            <td>{studentData.rollNo || "-"}</td>
            <td className="">
                <div className="flex h-full justify-center relative items-center">
                    <div style={{
                            width:`${percentage}%`, backgroundColor: colorStr
                        }} className="h-2/3 rounded-md absolute left-0"></div>
                    <span className="font-bold text-4xl z-10">
                        {percentage}%
                    </span>
                </div>
            </td>
        </tr>
    )
}


export default DetailedClass