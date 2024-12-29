import classNames from "classnames"
import {IconFilter, IconUserFilled} from "src/IconsReexported"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "src/components/shadcn/Dropdown"
import { useMemo, useState, useEffect } from "react"
import { HeaderForEditViewAttendance, PercentageBar, states } from "./Common"
import { selectStudentEntitiesDaily, selectStudentIdsDaily } from "src/api/rtk-helpers/attendance"
import { Link, useLocation, useOutletContext, useParams } from "react-router-dom"
import { useGetClassByIdQuery } from "src/api/rtk-query/class"
import { useGetAttendanceWithRecentDataQuery } from "src/api/rtk-query/attendance"
import { DayPicker, TZDate } from "react-day-picker"
import { dateUTCPlusFive, getDateStr, getPath, joinedClass, parseDateStr } from "src/api/Utility"
import { Root, Trigger } from "@radix-ui/react-popover"
import { PopoverContent } from "../shadcn/Popover"
import { CalendarIcon } from "@radix-ui/react-icons"
import Button from "../CommonUI/Button"

const validate = (currentResult, originalArgs) => {
    // if current data doesn't exist, then use previous record
    if (currentResult.exists) {
        return {isError: false, data: currentResult, isPrevious: false}
    }

    const previuosRecordExists = currentResult.__previousRecord__ != undefined 
        && currentResult.__previousRecord__.exists == true

    if (previuosRecordExists) {
        return {isError: false, data: currentResult.__previousRecord__, isPrevious: true}
    }
    // if no previous successful fetch found, then show Apology i.e., the very first fetch fails
    const todayDateStr = getDateStr()
    const queryDateStr = originalArgs.dateStr
    const dateIsToday = todayDateStr == queryDateStr

    if (dateIsToday) {
        return {isError: true, error: {code: 1, message: "Apologies! No record but you can set it."}}
    }

    return {isError: true, error: {code: 2, message: "Apologies! No record."}}
}

// editedBy.className should exist without "" or null (no error but bad interface)
// display name may not exist, no prob
function View() {
    const [filter, setFilter] = useState("all")

    const { classId, classGroupId, dateStr } = useParams()
    const { search } = useLocation()
    const [queryParams, setQueryParams] = useState({classId, classGroupId, dateStr})

    const {
        data: currentResult, isLoading: loadingAttendance, isFetching, originalArgs
    } = useGetAttendanceWithRecentDataQuery(queryParams)
    const {data: classData, isLoading: loadingClassData} = useGetClassByIdQuery({classId, classGroupId})

    if (loadingAttendance || loadingClassData) {
        return null
    }

    
    const validatedResult = validate(currentResult, originalArgs)
    console.log("VALIDATED RESULT: ", validatedResult, "ORIGINAL: ", currentResult, "isFetching: ", isFetching)
    validatedResult.originalArgs = originalArgs // also add original args to end result

    const {isError} = validatedResult

    if (isError) {
        const code = validatedResult.error.code
        const setAble = code == 1
        return (
            <div className="flex items-center justify-center flex-col gap-4">
                {setAble ? (
                    <span className="text-offwhite text-xl">
                        No record found, but you can set it,&thinsp;
                        <Link 
                            className="noLink text-white font-semibold"
                            to={getPath.attendance({classId, classGroupId, isJoined: joinedClass(search)}).today}
                        >visit Today.</Link>
                    </span>
                ) : (
                    <span className="text-offwhite text-xl">
                        No record found
                    </span>
                )}
                <div className="flex flex-col justify-center gap-1 items-center text-sm">
                    <span className="font-medium">
                        {setAble ? "Or" : "Please"} select a different date below.
                    </span>
                    <DateComponent 
                        queryParams={queryParams} setQueryParams={setQueryParams} 
                        validatedResult={validatedResult} isFetching={isFetching} 
                    />
                </div>
            </div>
        )
    }

    const resultToUse = validatedResult.data

    const headerProp = {
        className: classData.className,
        editedBy: resultToUse.editedBy,
        lastEdited: resultToUse.lastEdited 
    }

    const attendance = {
        students: selectStudentEntitiesDaily(resultToUse),
        ids: selectStudentIdsDaily(resultToUse)
    }

    const presentCount = Object.values(attendance.students).filter(v => v.status == states.present).length
    const totalCount = attendance.ids.length

    const filterStudents = (filter) => {
        const filterToStatus = {
            "present": states.present,
            "absent": states.absent
        }
        return filter == "all" ? attendance.ids
            : attendance.ids.filter(id => attendance.students[id].status == filterToStatus[filter])
    }


    return (
        <div>
            <span className="title-100">View Attendance</span>
            <HeaderForEditViewAttendance 
                attendanceDoc={headerProp} 
                DateComponent={{Main: DateComponent, props: {queryParams, setQueryParams, validatedResult, isFetching}}}
            />

            <PercentageBar presentCount={presentCount} totalCount={totalCount} />

            <table 
                className="w-full text-center align-middle [&_td]:border-t
                table-fixed [&_td]:h-16 border rounded-md border-theme-100
                [&_td]:border-theme-100 border-separate border-spacing-y-2"
            >
            <thead>
                <tr className="title-200">
                    <th className="text-left w-2/5 pl-2">Name</th>
                    <th className="w-1/5">Roll No</th>
                    <th className="w-2/5">
                        <div className="flex items-center justify-center gap-2">
                            <span>Status</span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <IconFilter className="border border-transparent transition rounded-md box-content p-2 hover:border-theme-100" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuLabel>Filter Students</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuRadioGroup value={filter} onValueChange={setFilter}>
                                        <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="present">Present</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="absent">Absent</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </th>
                </tr>
            </thead>
            <tbody>
                {filterStudents(filter).map(id => <StudentRow key={id} studentData={attendance.students[id]} />)}
            </tbody>
        </table>
        </div>
    )
}

// intial state from query params which are derived from url
// TODO: suppose it (date in url) is always valid
function DateComponent({queryParams, setQueryParams, validatedResult, isFetching}) {
    const today = useMemo(() => new TZDate(new Date(), "+05:00"), [])
    const {data = {}, isPrevious, isError, originalArgs} = validatedResult
    // const [fetchedEmptyDays, setFetchedEmptyDays] = useState([])
    // moving state up (classLayout) so it stays after View unmounts
    const [fetchedEmptyDays, setFetchedEmptyDays] = useOutletContext()

    // dateObj from data.createdAt is used for base state for
    // 1) selected day 2) rendered date in button 
    const dateObj = parseDateStr(isError ? queryParams.dateStr : data.createdAt)
    const [selected, setSelectedMain] = useState(isError ? undefined : dateObj)
    const setSelected = (date) => {
        setSelectedMain(dateUTCPlusFive(date))
    }

    const queryParamsDateObj = parseDateStr(originalArgs.dateStr) // args will exist even in case of error
    // previous or errored res will append current date 
    // which is not in list already to disabled list
    const toAppend = (isPrevious || isError) && !isFetching && 
        fetchedEmptyDays.findIndex(element => element.getTime?.() == queryParamsDateObj.getTime()) == -1
    console.log("To append: ", toAppend, isPrevious, validatedResult)
    useEffect(() => {
        if (toAppend) {
            setFetchedEmptyDays(prev => [...prev, queryParamsDateObj])
            // selected date only changes when query is successful
            isError == false && setSelected(parseDateStr(data.createdAt))
        }
    }, [toAppend, queryParamsDateObj, isError, data.createdAt, setFetchedEmptyDays])


    const [popupOpen, setPopupOpen] = useState(false)


    // while loading, calendar stays hidden (no day), show loading in button instead of date
    // update query params with the selected date
    const onSubmit = () => {
        setPopupOpen(false)
        const dateStr = getDateStr(0, selected, true)
        setQueryParams({...queryParams, dateStr})
    }

    const openChangeWithValidation = (v) => {
        if (isFetching) return
        setPopupOpen(v)
    }

    // only used while calendar is open, will show only when user select other day than being shown
    const showSubmit = isError || parseDateStr(data.createdAt).getTime() != selected.getTime()

    const urlReadable = dateObj.toLocaleString("en-GB", {
        "day": "numeric", "month": 
        "long", "timeZone": "UTC"
    })
    return (
        <Root open={popupOpen} onOpenChange={openChangeWithValidation}>
            <div className="flex flex-col gap-2 justify-between w-[calc(var(--radix-popover-trigger-width)*2.5)]">
                <Trigger asChild>
                        <Button className={`
                                font-semibold border-theme-100 bg-transparent hover:bg-theme-500 px-3 py-2
                                flex items-center gap-2
                            `}
                            states={{isLoading: isFetching}} text={{idleText: "Loading"}}
                            spinnerClassName="w-[15px] h-[15px]"
                            noDefaultStyle
                        > 
                            {urlReadable}
                            <CalendarIcon modifiers={{fetchedEmptyDays}} />
                        </Button>
                </Trigger>
                {isError && (
                    <Button className={classNames(
                        "bg-white text-black disabled:bg-offwhite",
                        "py-2"
                    )}
                        noDefaultStyle
                        text={{ idleText: "Submit" }}
                        disabled={!selected}
                        onClick={onSubmit}
                    >
                        Submit
                    </Button>
                )}
            </div>
            <PopoverContent align={isError ? "center" : "end"} className="relative" sideOffset={2} >
                {!isError && (
                    <Button className={classNames(
                        "bg-white text-black disabled:bg-offwhite",
                        "py-2 absolute top-0 -translate-y-[calc(100%+2px)]",
                        "w-[--radix-popover-trigger-width] text-sm"
                    )}
                    noDefaultStyle  
                    text={{idleText: "Submit"}}
                    disabled={!showSubmit}
                    onClick={onSubmit}
                >
                    Submit
                </Button>
                )}
                <Calendar 
                    setSelected={setSelected} 
                    selected={selected} 
                    modifiers={{
                        fetchedEmptyDays
                    }}
                    disabled={[{after: today}, ...fetchedEmptyDays]} 
                />
            </PopoverContent>
        </Root>
    )
}



function StudentRow({studentData}) {
    return (
        <tr className="title-200">
            <td className="text-left pl-2">
                <IconUserFilled className="inline-block" />
                <span className="pl-1 relative inline-block top-[2px]">{studentData.studentName}</span>
            </td>
            <td>{studentData.rollNo}</td>
            <td>
                <span className={classNames(
                    {"text-green-500": studentData.status == states.present},
                    {"text-red-500": studentData.status == states.absent}
                )}>
                    {studentData.status == states.present ? "Present" : "Absent"}
                </span>
            </td>
        </tr>
    )
}


function Calendar({selected, setSelected, ...props}) {
    const button = 'border-none'
    const monthButton = 'bg-transparent p-0 w-8 inline-flex items-center justify-center hover:bg-theme-100'
    return (
        <DayPicker
        captionLayout="label"
        mode='single'
        selected={selected}
        onDayClick={setSelected}
        showOutsideDays={true}
        fixedWeeks={false}
        required
        classNames={{
          chevron: "fill-offwhite w-4 h-4",
          // right offset of nav is the same as left offset on month_caption
          // it is 2 (8px) from nav>btn padding and 2 (8px) from nav padding
          nav: `absolute right-0 px-2 top-2 h-8 flex gap-2`,
          button_next: `${button} ${monthButton}`,
          button_previous: `${button} ${monthButton}`,
          month_caption: "px-2 h-12 flex items-center font-bold",
          month_grid: "border-spacing-1 table-fixed border-separate w-full",
          selected: 'text-black bg-white hover:bg-white',
          day: "hover:bg-theme-100 rounded-lg text-center p-0",
          day_button: `bg-transparent w-full px-2 py-1 text-sm ${button}`,
          root: `w-[calc(var(--radix-popover-trigger-width)*2.5)] relative bg-theme-600`,
          months: `border-theme-100 border rounded-md px-2`,
          disabled: `text-offwhite`,
          outside: "invisible",
        }}
        modifiersClassNames={{
            fetchedEmptyDays: "text-red-500"
        }}
        {...props}
    />
    )
}


export default View