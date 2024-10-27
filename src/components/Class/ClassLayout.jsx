import classNames from "classnames"
import { Outlet, useParams, NavLink } from "react-router-dom"
import { getDateStr, getPath } from "src/api/Utility"


function ClassLayout() {
    const {classId, classGroupId} = useParams()
    const todayDateStr = getDateStr()

    const navLinkClass = classNames(
        "font-medium text-xl noLink border-b p-2 first:pl-0 last:pr-0 transition",
        "[&.active]:border-white [&.active]:text-white",
        "[&:not(.active)]:border-transparent [&:not(.active)]:border-transparent:text-offwhite"
    )

    return (
        <>
            <div className="flex gap-2 items-center justify-start pb-4">
                <NavLink className={navLinkClass}
                    to={getPath.attendance({classId, classGroupId}).today}
                >Today</NavLink>
                <div className="w-[1px] self-stretch py-2 bg-clip-content bg-theme-100"></div>
                <NavLink className={navLinkClass}
                    to={getPath.attendance({classId, classGroupId}).view({dateStr: todayDateStr})}
                >View</NavLink>
                <div className="w-[1px] self-stretch py-2 bg-clip-content bg-theme-100"></div>
                <NavLink className={navLinkClass}
                    to={getPath.class({classId, classGroupId}).edit}
                >Edit</NavLink>                
                <div className="w-[1px] self-stretch py-2 bg-clip-content bg-theme-100"></div>
                <NavLink className={navLinkClass}
                    to={getPath.class({classId, classGroupId}).details}
                >Details</NavLink>              
            </div>
            
            <Outlet />
        </>
    )
}

export default ClassLayout