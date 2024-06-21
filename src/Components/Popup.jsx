import { forwardRef } from "react"

const Popup = forwardRef(function Popup({children}, ref) {
    return(
        <dialog ref={ref} className="backdrop:bg-black backdrop:opacity-60 text-white bg-neutral-800">
            {children}
        </dialog>
    )
})

export default Popup