import { useGetAttendanceQuery, useGetMonthlyAttendanceQuery, selectStudentsCount, studentInitialState, selectStudentsForYearMonth } from "src/api/apiSlice"
import { Class, ClassSkeletonUI } from "./Classes"
import {  IconUserFilled  } from "src/IconsReexported.jsx"
import { useParams } from "react-router-dom"
import { useState, useMemo , useEffect } from "react"
import { skipToken } from "@reduxjs/toolkit/query"
import { dateUTCPlusFive, getDateStr } from "src/api/Utility"

import ImprovedTrack from "./ImprovedTrack"


function DetailedClassWrapper() {
    const {classId, classGroupId} = useParams()

    return(
        <DetailedClass classId={classId} classGroupId={classGroupId} />
    )
}

export { DetailedClassWrapper }


function DetailedClassSkeletonUI() {
    return(
        <>
            <ClassSkeletonUI />

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
    const {data: attendance, isError, isFetching: fetchingAttendance, isLoading: loadingAttendance} = useGetAttendanceQuery({classId, classGroupId, dateStr: todayDateStr})
    
    const queryArgs = uniqueParams ? {classId, classGroupId, dateStr: uniqueParams} : skipToken
    const {data: monthly, isFetching: fetchingMonthly, isLoading: loadingMonthly} = useGetMonthlyAttendanceQuery(queryArgs)
    const {noMoreData=false, newUniqueParams=null, queryArgsWithValue=[]} = monthly ?? {}
    const studentsCount = selectStudentsCount(monthly ?? {students: studentInitialState})
    
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
    
    if (loadingAttendance || loadingMonthly) {
        return <DetailedClassSkeletonUI />
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex">
                <Class classId={classId} classGroupId={classGroupId} cssClasses="flex-1 lg:h-[250px] h-[220px]" />
            </div>
            
            <div>
                <span className="title-200 pb-2">Students Summary</span>
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
                            <Students studentList={selectStudentsForYearMonth(monthly, yearMonth)} />
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
                <span className="pl-1 relative inline-block top-[2px]">Someone</span>
            </td>
            <td>32</td>
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