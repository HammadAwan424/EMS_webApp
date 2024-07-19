import { forwardRef, useEffect } from "react"

const Popup = forwardRef(function Popup({open, myClass="", children}, ref) {
    useEffect(() => {
        if (open == true) {
            ref.current.showModal()
        }
    })
    

    return(
        <dialog ref={ref} className={"backdrop:bg-black backdrop:opacity-60 text-white bg-neutral-800 " + myClass}>
            {children}
        </dialog>
    )
})

export default Popup