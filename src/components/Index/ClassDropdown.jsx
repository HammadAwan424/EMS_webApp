import { useEffect } from "react"
import { Link } from "react-router-dom"
import { getDateStr } from "src/api/Utility"

function ClassDropdown({expanded, setExpanded, classId, classGroupId}) {
    useEffect(() => {
        if (expanded) {
            const close = () => setExpanded(false)
            window.addEventListener("mousedown", close)
            return () => window.removeEventListener("mousedown", close)
        }
    }, [setExpanded, expanded])

    if (!expanded) return null
    return(
        <div id="Dropdown" className="absolute bg-theme-300 text-offwhite cursor-pointer z-20 min-w-20 rounded-md select-none top-6 right-6" onClick={() => setExpanded(false)}>
            <div className="border-b p-2"><Link className="text-inherit hover:text-inherit" to={`class/${classGroupId}/${classId}`}>Edit</Link></div>
            <div className="border-b p-2"><Link className="text-inherit hover:text-inherit" 
                to={`/attendance/set/${classGroupId}/${classId}/${getDateStr()}`}
            >Attendance</Link></div>
            <div className="border-b p-2"><Link className="text-inherit hover:text-inherit"
                to={`/class/details/${classGroupId}/${classId}`}
            >Details</Link></div>
            <div className="p-2">Close</div>
        </div>
    )
}

export default ClassDropdown