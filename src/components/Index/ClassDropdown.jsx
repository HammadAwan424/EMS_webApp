function ClassDropdown({expanded}) {
    if (!expanded) return null

    return(
        <div id="Dropdown" className="absolute bg-slate-600 cursor-pointer z-20 min-w-20 rounded-md select-none top-6 right-6" onClick={() => setDropdown(false)}>
            <div className="border-b p-2"><Link className="text-inherit hover:text-inherit" to={`class/${classGroupId}/${classId}`}>Edit</Link></div>
            <div className="border-b p-2"><Link className="text-inherit hover:text-inherit" 
                to={`/attendance/set/${classGroupId}/${classId}/${getDateStr({dateUTCPlusFive: new Date(), hyphenated: true})}`}
            >Attendance</Link></div>
            <div className="p-2">Close</div>
        </div>
    )
}

export default ClassDropdown