import classNames from "classnames"
import {  IconAlertCircle  } from "src/IconsReexported.jsx"
function Apology({text="", header="", children, className}) {
    const classNameApology = classNames(
        "flex flex-col items-center justify-center",
        className
    )
    return (
        <div className={classNameApology}>
            <div className="text-xl font-medium">
                {header || "Oops! Nothing here :("}
            </div>
            <div className="flex items-start justify-center gap-2 text-yellow-400">
                <IconAlertCircle />
                <div>
                    {children}
                    {text}
                </div>
            </div>
        </div>
    )
}
export default Apology