import styles from "./student.module.css"   
import { useState, userState } from "react"
import { 
    IconBackground,
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
        className: styles.check,
        onClick: handleCheckClick
    }

    const handleCrossClick = () => {
        setState(0)
        data.current[id] = false
        validateBtn()
    }
    const crossProps = {
        size: iconSize,
        className: styles.cross,
        onClick: handleCrossClick
    }

   
    


    return (
        <div className="h-16 p-1 w-full relative flex gap-1 items-center border rounded-xl border-[--border-col] overflow-hidden transition hover:border-[--border-hover-col] duration-300">

            { (state != states.unMarked) && <div className={styles.overlay}></div> }        
            
            <div className={styles.left}>
                <div className={styles.icon}>
                    <span className={styles.center}>{name[0]}</span>
                </div>                
            </div>

            <span>{name}</span>
            <span className="flex-1"></span>

            <div className="flex ">

                {state == states.present ? <IconSquareRoundedCheckFilled {...checkProps} style={{zIndex: 3}} />
                : <IconSquareRoundedCheck {...checkProps} />}

                {state == states.absent ? <IconSquareRoundedXFilled {...crossProps} style={{zIndex: 3}} />
                : <IconSquareRoundedX {...crossProps} />}
                
            </div>

        </div>
    )
}

export default Student