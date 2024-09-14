import { skipToken } from "@reduxjs/toolkit/query"
import { IconMenu2 } from "@tabler/icons-react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { useGetAuthQuery, useGetUserQuery, useGetClassByIdQuery, useGetAttendanceQuery, useGetMonthlyAttendanceQuery } from "src/api/apiSlice"
import { Teacher } from "src/api/classGroups"
import { getDateStr } from "src/api/Utility"
import Pie from "../CommonUI/Pie"
import Track from "./Track"

function Classes() {
    const {data: Auth} = useGetAuthQuery()
    const {data: User} = useGetUserQuery(Auth.uid)
    return (
        Teacher.hasClasses(User) ? (
            <div>
                <h1>Classes</h1>
                <hr className="py-2" />
                <div className="grid grid-cols-2">
                {Teacher.getClassIdArray(User).map(classId =>
                    <Class key={classId} classId={classId} classGroupId={User.classes[classId].classGroupId} />
                )}
                </div>

            </div> 
        ) : (
            <div>You don't have any classes</div>
        )

    )
}



function Class({classId, classGroupId}) {

    const [date, setDate] = useState(() => {
        const date = new Date()
        date.setUTCMonth(date.getUTCMonth() + 1) // to query for previous months, shift date to one month later
        const month = String(date.getUTCMonth() + 1).padStart(2, "0") // to change 0-11 months to 1-12 for database 
        const year = String(date.getUTCFullYear())
        return {ISOString: date.toISOString(), month, year}
    })
    const [swipeBack, setSwipeBack] = useState(0)
    const [state, setState] = useState([])
    const [meta, setMeta] = useState({loadingMonthly: true, today: new Date().toISOString()})
    const [noMoreData, setNoMoreData] = useState(false)

    const [dropdown, setDropdown] = useState(false)
    const {data: classData, isLoading: loadingDetails} = useGetClassByIdQuery({classId, classGroupId})
    const dateStr = getDateStr({dateObj: new Date(date.ISOString), hyphenated: true})
    const todayDateStr = getDateStr({dateObj: new Date(meta.today), hyphenated: true})
  
    const {data: attendance, isFetching: fetchingAttendance, isLoading: loadingAttendance} = useGetAttendanceQuery({classId, classGroupId, dateStr: todayDateStr})
    const param = date.year+date.month

    let totalItems = Object.keys(state).length + 1

    let isSkip;
    if ((noMoreData  || !(totalItems+swipeBack == 1) && !meta.loadingMonthly)) {
        isSkip = skipToken
    } else {
        isSkip = {classId, dateStr, classGroupId}
        if (!meta.loadingMonthly) {
            setMeta({...meta, loadingMonthly: true})
        }
    }
    console.log("Params: ", param, "state: ", state)  
    const {data: monthly, isFetching: fetchingMonthly} = useGetMonthlyAttendanceQuery(isSkip)


    if (loadingDetails || loadingAttendance) {
        return <h1>Abracadabra</h1>
    }

    console.log("Today is: ", attendance)
    // console.log("state s: ", state)  
    

    
    const presentCount = Object.values(attendance.students ?? {}).filter(v => v.status == 1).length
    const totalStuCount = Object.keys(attendance.students ?? {}).length

 
    function previous() {
        setSwipeBack(swipeBack - 1)
    }
    function next() {
        setSwipeBack(swipeBack + 1)
    }
    
    const arrAsc = Object.keys(state).sort((a, b) => a.localeCompare(b))
    totalItems = fetchingMonthly || noMoreData ? totalItems+1 : totalItems 
 
    
    
    

    


    function setter() {
        
        if (monthly && (!fetchingMonthly)) {
            console.log("setting meta", param, monthly)
            setMeta({...meta, loadingMonthly: false})
            if (monthly.exists) {
                const monthData = monthly.stats
                const [newMonth, newYear] = [monthly.id.slice(-2,), monthly.id.slice(-6, -2)]
                const combination = newYear+newMonth
                const newValues = {}
                for (let [key, value] of Object.entries(monthData)) {
                    newValues[combination+key] = {...value, id: combination+key}
                }
                // console.log("New values: ", newValues)
                // console.log("setting first one")
                setState({...state, ...newValues})
                
                const newDate = new Date(date.ISOString);
                newDate.setUTCMonth(parseInt(newMonth)-1) // to change 1-12 from database to 0-11 months
                newDate.setUTCFullYear(parseInt(newYear))
                setDate({ISOString: newDate.toISOString(), month: newMonth, year: newYear})

            } else {
                // console.log("setting second one")
                setNoMoreData(true)
            }
        } else {
            // console.log("monthly is false")
        }
        

    }
    setter()

    console.log("NOR MORE DATA: ", noMoreData)


    console.log("total is: ", totalItems, " swipe back is: ", swipeBack, "COndition is: ", fetchingMonthly || noMoreData, monthly, state)

    let readAble;
    
    const atEnd = totalItems+swipeBack == 1
    const atStart = swipeBack == 0
    if (atStart) {
        const copy = new Date(meta.today)
        readAble = copy.toLocaleString("en-GB", {"day": "numeric", "month": "long"})
    } else if (atEnd) {
        readAble = "Older"
    } else if (!atEnd) {
        if (-swipeBack < totalItems) {
            console.log("SWIPE BACK IS: ", swipeBack, "AND OTHER IS: ", arrAsc, "total items is: ", totalItems)
            const copy = new Date(date.ISOString)
            copy.setUTCMonth(parseInt(arrAsc.at(swipeBack).slice(-4,-2))-1)
            copy.setUTCFullYear(parseInt(arrAsc.at(swipeBack).slice(-8, -4)))
            copy.setUTCDate(parseInt(arrAsc.at(swipeBack).slice(-2,)))
            readAble = copy.toLocaleString("en-GB", {"day": "numeric", "month": "long"})
        } else {
            console.log("There is some unexpected goto, swipeBack: ", swipeBack, 'total items: ', totalItems)
        }
      
    }

    
    


    return(
        <div data-id={classId} className="CLASS p-1 flex group overflow-hidden flex-col transition
                border-solid border-2 items-start rounded-md hover:bg-[--bg-hover-col]"
        >
            <div className="wrapper flex justify-between self-stretch items-center relative">
                <div className="font-semibold text-2xl"> {classData.className} </div>
                {/* <div className="text-sm"> {} </div> */}     
                <IconMenu2 onClick={() => setDropdown(true)} className="cursor-pointer" />
                {dropdown && (
                    <div id="Dropdown" className="absolute bg-slate-600 cursor-pointer min-w-20 rounded-md select-none top-6 right-6" onClick={() => setDropdown(false)}>
                        <div className="border-b p-2"><Link className="text-inherit hover:text-inherit" to={`class/${classGroupId}/${classId}`}>Edit</Link></div>
                        <div className="border-b p-2"><Link className="text-inherit hover:text-inherit" 
                            to={`/attendance/set/${classGroupId}/${classId}/${getDateStr({dateObj: new Date(), hyphenated: true})}`}
                        >Attendance</Link></div>
                        <div className="p-2">Close</div>
                    </div>
                )}
            </div>

            <div id="All Space" className="flex-auto self-stretch text-center flex items-center justify-center h-1">
                <div className="SPACER md:flex-1"></div>

                <div className="flex-[2_1_0] flex items-center justify-center self-stretch">
                    <Track totalItems={totalItems} swipeBack={swipeBack} navigation={{next, previous}}>

                        {noMoreData && (
                            <div className="bg-[--theme-secondary] rounded-full overflow-hidden w-full h-full inline-block relative select-none">
                                <div className="flex items-center justify-center w-full h-full">
                                    <h1>{"Empty :)"}</h1>
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

                        
                        {arrAsc.map(key => 
                            <div key={state[key].id} className="bg-red-600 rounded-full overflow-hidden w-full h-full inline-block relative select-none">
                                <Pie percentage={state[key].count / state[key].total * 100}>
                                    <div className="w-full h-full flex items-center justify-center">
                                        <h1>{state[key].count}/{state[key].total}</h1>
                                    </div>
                                </Pie>
                            </div>
                        )}

                        
                       

                        {attendance.exists ? (
                            <div className="bg-red-600 rounded-full overflow-hidden w-full h-full inline-block relative select-none">
                                <Pie percentage={presentCount / totalStuCount * 100}>
                                    <div className="w-full h-full flex items-center justify-center">
                                        <h1>{presentCount}/{totalStuCount}</h1>
                                    </div>
                                </Pie>
                            </div>
                        ) : (
                            <div className="bg-red-600 rounded-full overflow-hidden w-full h-full inline-block relative select-none">
                                <div>No data exists</div>
                            </div>
                        )}
                    </Track>
                </div>

                <div className="hidden md:block flex-1 self-end justify-end text-end">
                    <span>{readAble}</span>
                </div>

            </div>

            <div className="md:hidden ml-auto text-xs">
                {loadingDetails ? <div>Loading</div> : <div>Includes {2} Students</div>}
            </div>
        </div>
    )
}

export default Classes
export { Class }