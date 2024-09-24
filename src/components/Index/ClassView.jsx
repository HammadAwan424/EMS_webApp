import { useGetAuthQuery, useGetUserQuery } from "src/api/apiSlice"
import Classes, { Class } from "./Classes"
import { IconUserFilled } from "@tabler/icons-react"
import { useLayoutEffect } from "react"

function ClassView({id}) {
    
    const {data: Auth} = useGetAuthQuery()
    const {data: User} = useGetUserQuery(Auth.uid)
    console.log("RECEIVED VALUE: ", id)

    if (id == "all") {
        return <Classes />
    } else if (id == "noclass") {
        return null
    } else {
        return (
            <DetailedClass classId={id} classGroupId={User.invitations[id].classGroupId} />
        )
    }
}


function DetailedClass({classId, classGroupId}) {
    useLayoutEffect(() => {
        const className = 'max-sm:bg-[--theme-secondary]'
        document.body.classList.add(className)
        return () => document.body.classList.remove(className)
    }, [])

    return (
        <div className="bg-[--theme-secondary] p-2 sm:p-4">
            <div className="flex">
                <Class classId={classId} classGroupId={classGroupId} cssClasses="flex-1 lg:h-[250px] h-[200px]" />
            </div>
            <Students />
        </div>
    )
}

function Students() {
    return (
        <>
        <table className="w-full text-center align-middle table-fixed my-20 [&_td]:h-16 border-separate border-spacing-y-2">
            <thead>
                <th className="text-left w-4/12 sm:w-4/12 lg:w-2/12 pl-2">Name</th>
                <th className="w-2/12 sm:w-2/12 lg:w-2/12">Roll No</th>
                <th className="w-6/12 sm:w-6/12 lg:w-8/12">Attendance</th>
            </thead>
            <tr className="bg-[--theme-primary]">
                <td className="rounded-l-md text-left pl-2">
                    <IconUserFilled className="inline-block" />
                    <span className="pl-1 relative inline-block top-[2px]">Someone</span>
                </td>
                <td>32</td>
                <td className="rounded-r-md">
                    <div className="flex h-full justify-center relative items-center">
                        <div className="bg-orange-500 h-2/3 w-8/12 rounded-md absolute left-0"></div>
                        <span className="font-bold text-4xl z-10">70%</span>
                    </div>
                </td>
            </tr>
            <tr>
                <td colSpan={3}>
                    <div className="flex flex-col items-center gap-1">
                        <div className="threeDots"></div>
                        <button className="p-2">Show More</button>
                        <div className="threeDots"></div>
                    </div>
                </td>
            </tr>
            <tr className="bg-[--theme-primary]">
                <td className="rounded-l-md text-left pl-2">
                    <IconUserFilled className="inline-block" />
                    <span className="pl-1 relative inline-block top-[2px]">Someone</span>
                </td>
                <td>32</td>
                <td className="rounded-r-md">
                    <div className="flex h-full justify-center relative items-center">
                        <div className="bg-orange-500 h-2/3 w-8/12 rounded-md absolute left-0"></div>
                        <span className="font-bold text-4xl z-10">70%</span>
                    </div>
                </td>
            </tr>
            <tr className="bg-[--theme-primary]">
                <td className="rounded-l-md text-left pl-2">
                    <IconUserFilled className="inline-block" />
                    <span className="pl-1 relative inline-block top-[2px]">Someone</span>
                </td>
                <td>32</td>
                <td className="rounded-r-md">
                    <div className="flex h-full justify-center relative items-center">
                        <div className="bg-orange-500 h-2/3 w-8/12 rounded-md absolute left-0"></div>
                        <span className="font-bold text-4xl z-10">70%</span>
                    </div>
                </td>
            </tr>
        </table>
        </>
    )
}

export default ClassView