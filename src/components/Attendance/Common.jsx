import classNames from "classnames"
import { dateUTCPlusFive, parseDateStr } from "src/api/Utility"

function AttendanceLayout({children}) {
    return (
        <div>
            {children}
        </div>
    )
}

let states = {
    present: 1,
    unMarked: 0,
    absent: -1
}


function HeaderForEditViewAttendance({attendanceDoc, DateComponent, dateStr}) {
    const getReadable = () => {
        const dateObj = parseDateStr(dateStr)
        const urlReadable = dateObj.toLocaleString("en-GB", {
            "day": "numeric", "month": 
            "long", "timeZone": "UTC"
        })
        return urlReadable
    }

    const lastEditedDate = dateUTCPlusFive(attendanceDoc.lastEdited.seconds * 1000)
    const lastEdited = lastEditedDate.toLocaleString("en-GB", {"timeStyle": "short", "timeZone": "UTC"})
    const editedBy = attendanceDoc.editedBy

    return (
        <div className="flex justify-between pt-4 pb-2">
            <div className="flex gap-2">
                <div className="w-10 self-center aspect-square rounded-full bg-theme-300"></div>

                <div className="text-sm flex flex-col py-1 items-start justify-center">
                    <span>
                        <span className="font-semibold">{editedBy.name ?? "No name"}&nbsp;</span>
                        <span className="text-xs">{editedBy.email}</span>
                    </span>
                    <span>
                        <span className="text-xs">for&nbsp;</span>
                        <span className="font-semibold">Class {attendanceDoc.className}</span>
                    </span>
                </div>

            </div>
            <div>

                <div className="text-sm flex flex-col py-1 items-end justify-center">
                    {DateComponent ? <DateComponent.Main {...DateComponent.props} /> : (
                        <span>
                            {getReadable()}
                        </span>
                    )}
                    <span>
                        <span className="text-xs">last edited&nbsp;</span>
                        <span>{lastEdited}</span>
                    </span>
                </div>

            </div>
        </div>
    )
}


function PercentageBar({presentCount, totalCount}) {
    const absentCount = totalCount - presentCount
    const percentage = Math.round(presentCount / totalCount * 100)
    return (
        <div className="pb-8">
            <div className="flex justify-center items-center gap-2">
                <span className="title-200 text-offwhite z-20">{presentCount}</span>
                <span className="title-200">Present</span>
                <span>vs</span>
                <span className="title-200">Absent</span>
                <span className="title-200 z-20 text-offwhite">{absentCount}</span>
            </div>
            <div className="flex h-10 justify-between relative items-center">
                {/* <div className="h-2/3 rounded-full absolute left-0 bg-red-600 w-full">
            </div> */}
                <div className="border-green-500 border h-2/3 relative rounded-full w-full text-lg justify-center flex items-center">
                    <div style={{
                        width: `${percentage}%`
                    }} className="top-0 bottom-0 rounded-full transition-[width] absolute left-0 bg-green-500">
                    </div>
                    <span 
                        className={classNames(
                            'title-300 z-20 relative',
                            {'text-white': percentage <= 55},
                            {'text-black': percentage > 55}
                        )}
                    >{percentage}%</span>
                </div>
            </div>
        </div>
    )
}

export {states, HeaderForEditViewAttendance, PercentageBar}