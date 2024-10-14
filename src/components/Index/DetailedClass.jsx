import { useGetAuthQuery, useGetUserQuery, useGetAttendanceQuery, useGetMonthlyAttendanceQuery, selectAllStudents, selectStudentsCount, studentInitialState, selectStudentsForYearMonth } from "src/api/apiSlice"
import Classes, { Class } from "./Classes"
import {  IconUserFilled  } from "src/IconsReexported.jsx"
import { useLayoutEffect } from "react"
import Apology from "../Apology/Apology"
import { useParams } from "react-router-dom"
import { useState, useMemo } from "react"
import { skipToken } from "@reduxjs/toolkit/query"
import { dateUTCPlusFive, getDateStr } from "src/api/Utility"
import { useEffect } from "react"
import Track from "./Track"
// import ImprovedTrack from "./ImprovedTrack"


function DetailedClassWrapper() {
    const {classId, classGroupId} = useParams()

    return(
        <DetailedClass classId={classId} classGroupId={classGroupId} />
    )
}

export { DetailedClassWrapper }


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
        return <h1>Abracadabra</h1>
    }

    return (
        <div className="p-2 sm:p-4">
            <div className="flex">
                <Class classId={classId} classGroupId={classGroupId} cssClasses="flex-1 lg:h-[250px] h-[200px] bg-theme-500 hover:bg-theme-300" />
            </div>
            
            <div className="overflow-hidden">
                {/* <ImprovedTrack totalItems={queryArgsWithValue.length+1} swipeBack={swipeBack} navigation={{next, previous}} square={false}>
                    {noMoreData ? (
                        <div className="bg-[--theme-tertiary] rounded-full overflow-hidden w-full h-full inline-block relative select-none">
                            <div className="flex items-center justify-center w-full h-full flex-col">
                                <h1>No Previous Data</h1>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-neutral-700 animate-pulse rounded-full overflow-hidden w-full h-full inline-block relative select-none">
                            <div className="flex items-center justify-center w-full h-full">
                                <h1>{"Loading..."}</h1>
                            </div>
                        </div>   
                    )}
                    {queryArgsWithValue.map(yearMonth => 
                        <div className="inline-block overflow-hidden w-full" key={yearMonth}>
                            <Students studentList={selectStudentsForYearMonth(monthly, yearMonth)} />
                        </div>
                    )}
                </ImprovedTrack>  */}
            </div>

        </div>
    )
}

function Students({studentList}) {
    const ui = {}
    if (studentList.length <= 3) {
        ui.showAll = true
    } else {
        ui.showAll = false
    }
    return (
        <>
        <table className="w-full text-center align-middle table-fixed  [&_td]:h-16 border-separate border-spacing-y-2">
            <thead>
                <tr>
                    <th className="text-left w-4/12 sm:w-4/12 lg:w-2/12 pl-2">Name</th>
                    <th className="w-2/12 sm:w-2/12 lg:w-2/12">Roll No</th>
                    <th className="w-6/12 sm:w-6/12 lg:w-8/12">Attendance</th>
                </tr>
            </thead>
            <tbody>
                {ui.showAll ? (
                        studentList.map(studentData => {
                            const percentage = Math.round((studentData.present / (studentData.present + studentData.absent)) * 100)
                            return (
                                <tr key={studentData.id} className="bg-theme-500">
                                    <td className="rounded-l-md text-left pl-2">
                                        <IconUserFilled className="inline-block" />
                                        <span className="pl-1 relative inline-block top-[2px]">Someone</span>
                                    </td>
                                    <td>32</td>
                                    <td className="rounded-r-md">
                                        <div className="flex h-full justify-center relative items-center">
                                            <div style={{width:`${percentage}%`}} className="bg-orange-500 h-2/3 rounded-md absolute left-0"></div>
                                            <span className="font-bold text-4xl z-10">
                                                {percentage}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            )
                        }

                        )
                ) : (
                    <tr>
                        <td><span>show all is false</span></td>
                    </tr>
                )}
                {/* <tr>
                    <td colSpan={3}>
                        <div className="flex flex-col items-center gap-1">
                            <div className="threeDots"></div>
                            <button className="p-2">Show More</button>
                            <div className="threeDots"></div>
                        </div>
                    </td>
                </tr> */}
            </tbody>
        </table>
        </>
    )
}


export default DetailedClass