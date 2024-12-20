import classNames from "classnames"
import { useState } from "react"
import { Outlet, useParams, NavLink, useLocation, useNavigate } from "react-router-dom"
import { getDateStr, getPath, joinedClass } from "src/api/Utility"
import { IconArrowLeft } from "src/IconsReexported"


function ClassLayout() {
    const todayDateStr = getDateStr()

    console.log("THIS IS CLASS LAYOUT")

    const navLinkClass = classNames(
        "font-medium text-xl noLink border-b p-2 first:pl-0 last:pr-0 transition",
        "[&.active]:border-white [&.active]:text-white",
        "[&:not(.active)]:border-transparent [&:not(.active)]:border-transparent:text-offwhite"
    )

    const {dateStr, classGroupId, classId} = useParams()
    const [dateFromUrl, _] = useState(dateStr)

    const {search} = useLocation()
    const isJoined = joinedClass(search)
    const history = useNavigate()

    const handleBackClick = () => history(-1)

    return (
        <>  
            <div className="flex gap-2 items-center justify-start pb-4">
                <div onClick={handleBackClick}><IconArrowLeft /></div>
            
                <NavLink className={navLinkClass} replace={true}
                    to={getPath.attendance({classId, classGroupId, isJoined}).today}
                >Today</NavLink>
                <div className="w-[1px] self-stretch py-2 bg-clip-content bg-theme-100"></div>
                <NavLink className={navLinkClass} replace={true}
                    to={getPath.attendance({classId, classGroupId, isJoined}).view({dateStr: dateFromUrl || todayDateStr})}
                >View</NavLink>
                <div className="w-[1px] self-stretch py-2 bg-clip-content bg-theme-100"></div>
                <NavLink className={navLinkClass} replace={true}
                    to={getPath.class({classId, classGroupId, isJoined}).edit}
                >Edit</NavLink>                
                <div className="w-[1px] self-stretch py-2 bg-clip-content bg-theme-100"></div>
                <NavLink className={navLinkClass} replace={true}
                    to={getPath.class({classId, classGroupId, isJoined}).details}
                >Details</NavLink>              
            </div>
            
            <Outlet />
        </>
    )
}

export default ClassLayout