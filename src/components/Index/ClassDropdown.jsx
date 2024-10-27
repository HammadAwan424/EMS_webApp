import { useEffect, useRef, useState } from "react"

function ClassDropdown({children}) {
    const [expanded, setExpanded] = useState(false)
    const dropDownRef = useRef(null)
    useEffect(() => {
        if (expanded) {
            const close = (eve) => {
                if (!dropdownRef.current.contains(eve.target)) {
                    setExpanded(false)
                }
            }
            window.addEventListener("mousedown", close)
            return () => window.removeEventListener("mousedown", close)
        }
    }, [setExpanded, expanded, dropDownRef])

    if (!expanded) return null
    return(
        <div id="Dropdown" ref={dropDownRef} className="absolute bg-theme-300 text-offwhite cursor-pointer z-20 min-w-20 rounded-md select-none top-6 right-6" onClick={() => setExpanded(false)}>
            {children}
        </div>
    )
}

function DropdownItem({children}) {
    return (
        <div className="px-2 py-1 [&:not(:last-child)]:border-b">
            {children}
        </div>
    )
}

export default ClassDropdown
export {DropdownItem}