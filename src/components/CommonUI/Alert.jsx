import { IconAlertTriangleFilled } from "@tabler/icons-react"

/**
 * Alert component
 * @param {Object} props - The properties object.
 * @param {boolean} props.show - Whether to show the alert.
 * @param {string} props.text - The alert text.
 * @param {"warning"|"success"} props.type - The type of alert.
 * @returns {JSX.Element} The Alert component.
 */
function Alert({show, text, type}) {
    return (
        <>
            {show && (
                <div className={"w-full flex gap-1 items-start rounded-lg p-1 " + (type == "warning" ? "bg-red-900 text-red-400" : "bg-green-900 text-green-400")}>
                    {type == "warning" && <div className="pt-1"><IconAlertTriangleFilled /></div>}
                    <p> 
                        {text}
                    </p>
                </div>
            )}
        </>
    )
}

export default Alert