import classNames from "classnames"
import { IconUserFilled } from "src/IconsReexported"
import { Expand } from "../CommonUI/Icons"
import ClassDropdown, { DropdownItem } from "../Index/ClassDropdown"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "src/components/shadcn/Dropdown"
  

function View() {
    const percentage = 60

    const first = classNames(
        'title-300 z-20 relative',
        {'text-white': percentage <= 55},
        {'text-black': percentage > 55}
    )
    
    return (
        <div>
            <span className="title-100">View Attendance</span>

            <div>
                <div></div>
            </div>

            <div className="flex justify-center items-center gap-2">
                <span className="title-200 text-offwhite z-20">20</span>
         
                <span className="title-200">Present</span>
                <span>vs</span>
                <span className="title-200">Absent</span>
                <span className="title-200 z-20 text-offwhite">25</span>
            </div>
            <div className="flex h-10 justify-between relative items-center">
                {/* <div className="h-2/3 rounded-full absolute left-0 bg-red-600 w-full">
                </div> */}
                <div className="border-green-500 border h-2/3 relative rounded-full w-full text-lg justify-center flex items-center">
                    <div style={{
                            width:`${percentage}%`
                        }} className="top-0 bottom-0 rounded-full absolute left-0 bg-green-500">
                    </div>
                    <span className={first}>{percentage}%</span>
                </div>
            </div>

            <div className="flex justify-end items-center">
                <DropdownMenu>
                    <DropdownMenuTrigger>Filter</DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>Filter Students</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup value="one">
                            <DropdownMenuRadioItem value="one">All</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="all">Present</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="some">Absent</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>


                <ClassDropdown>
                    <DropdownItem></DropdownItem>
                    <DropdownItem></DropdownItem>
                </ClassDropdown>
                

            </div>

            <table 
            className="w-full text-center align-middle [&_td]:border-t 
                table-fixed [&_td]:h-16 border rounded-md border-theme-100 
                [&_td]:border-theme-100 border-separate border-spacing-y-2"
        >
            <thead>
                <tr>
                    <th className="text-left w-4/12 sm:w-4/12 lg:w-2/12 pl-2">Name</th>
                    <th className="w-2/12 sm:w-2/12 lg:w-2/12">Roll No</th>
                    <th className="w-6/12 sm:w-6/12 lg:w-8/12">Status</th>
                </tr>
            </thead>
            <tbody>
                <Present />
                <Absent />
                <Absent />
                <Present />
                <Present />
            </tbody>
        </table>
        </div>
    )
}


function Present({studentData}) {
    return (
        // <tr key={studentData.id} className="">
        <tr className="">
            <td className="text-left pl-2">
                <IconUserFilled className="inline-block" />
                <span className="pl-1 relative inline-block top-[2px] title-300">Hammad</span>
            </td>
            <td className="title-200">32</td>
            <td className="">
                <span className="title-200 text-green-500">Present</span>
            </td>
        </tr>
    )
}
function Absent({studentData}) {
    return (
        // <tr key={studentData.id} className="">
        <tr className="">
            <td className="text-left pl-2">
                <IconUserFilled className="inline-block" />
                <span className="pl-1 relative inline-block top-[2px] title-300">Hammad</span>
            </td>
            <td className="title-200">32</td>
            <td className="">
                <span className="title-200 text-red-500">Absent</span>
            </td>
        </tr>
    )
}

export default View