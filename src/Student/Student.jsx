import { useState } from "react"
import {
    IconSquareRoundedCheck, IconSquareRoundedX, 
    IconSquareRoundedXFilled, IconSquareRoundedCheckFilled
} from "@tabler/icons-react";

function Student({name, id, data, validateBtn}) {            
    let iconSize = 30
    name = name.toUpperCase()[0] + name.slice(1)

    let states = {
        present: 1,
        absent: 0,
        unMarked: -1
    }

    const [state, setState] = useState(-1)
    
 
    const handleCheckClick = () => {
        setState(1)
        data.current[id] = true
        validateBtn()
    }
    const checkProps = {
        size: iconSize,
        onClick: handleCheckClick
    }

    const handleCrossClick = () => {
        setState(0)
        data.current[id] = false
        validateBtn()
    }
    const crossProps = {
        size: iconSize,
        onClick: handleCrossClick
    }

   
    


    return (
        <div className="relative flex h-16 w-full items-center gap-1 overflow-hidden rounded-xl border border-[--border-col] p-1 transition duration-300 hover:border-[--border-hover-col]">

            { (state != states.unMarked) && <div className="pointer-events-none absolute z-10 bg-black opacity-20 inset-0"></div> }        
            
            <div className="flex flex-initial h-full items-center">
                <div className="relative h-[80%] aspect-square select-none rounded-full bg-emerald-500">
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-semibold">{name[0]}</span>
                </div>                
            </div>

            <span>{name}</span>
            <span className="flex-1"></span>

            <div className="flex ">

                {state == states.present ? <IconSquareRoundedCheckFilled {...checkProps} className="text-green-500 z-20" />
                : <IconSquareRoundedCheck {...checkProps} className="text-green-500" />}

                {state == states.absent ? <IconSquareRoundedXFilled {...crossProps} className="text-red-500 z-20"/>
                : <IconSquareRoundedX {...crossProps} className="text-red-500" />}
                
            </div>

        </div>
    )
}

export default Student