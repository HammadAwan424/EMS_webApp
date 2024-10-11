import { useState } from "react"
import {
    IconSquareRoundedCheck, IconSquareRoundedX, 
    IconSquareRoundedXFilled, IconSquareRoundedCheckFilled
} from "@tabler/icons-react";
import classNames from "classnames";

function Student({details, id, markStudent}) {            
    let iconSize = 30
    const {studentName: name, rollNo} = details
    const studentName = name.toUpperCase()[0] + name.slice(1)

    let states = {
        present: 1,
        absent: 0,
        unMarked: -1
    }

    const marked = details.status != states.unMarked
 
    const handleCheckClick = () => {
        markStudent(states.present, id)
    }

    const handleCrossClick = () => {
        markStudent(states.absent, id)
    }

    const checkProps = {
        size: iconSize,
        onClick: handleCheckClick
    }

    const crossProps = {
        size: iconSize,
        onClick: handleCrossClick
    }

    console.log(marked)

    const className = classNames(
        {"hover:border-[--border-hover-col] bg-theme-300 hover:bg-theme-100 border-transparent": !marked},
        {"bg-theme-300": marked && !details.edited},
        {"border-yellow-500 bg-theme-500": details.edited},
        {"border-green-500": !details.edited && details.status == states.present},
        {"border-red-500": !details.edited && details.status != states.present}
    )

    
    return (
        <div className={"relative flex h-16 w-full items-center gap-1 overflow-hidden rounded-xl border p-1 transition duration-300 " + className}>
            
            <div className="flex flex-initial h-full items-center">
                <div className="relative h-[80%] aspect-square select-none rounded-full bg-emerald-600">
                    <span className="absolute text-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-semibold">{rollNo}</span>
                </div>                
            </div>

            <span>{studentName}</span>
            <span className="flex-1"></span>

            <div className="flex ">

                {details.status == states.present ? <IconSquareRoundedCheckFilled {...checkProps} className="text-green-500 z-20" />
                : <IconSquareRoundedCheck {...checkProps} className="text-green-500" />}

                {details.status == states.absent ? <IconSquareRoundedXFilled {...crossProps} className="text-red-500 z-20"/>
                : <IconSquareRoundedX {...crossProps} className="text-red-500" />}
                
            </div>

        </div>
    )
}

export default Student