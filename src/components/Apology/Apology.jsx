import { IconAlertCircle } from "@tabler/icons-react"
function Apology({text="", children}) {
    return (
        <div className="flex flex-col items-center justify-center p-2">
            <div className="text-xl font-medium">
                {"Oops! Nothing here :("}
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