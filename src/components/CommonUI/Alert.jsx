import classNames from "classnames"
import {  IconAlertTriangleFilled  } from "src/IconsReexported.jsx"

/**
 * Alert component
 * @param {Object} props - The properties object.
 * @param {boolean} props.show - Whether to show the alert.
 * @param {string} props.text - The alert text.
 * @param {"warning"|"success"} props.type - The type of alert.
 * @returns {JSX.Element} The Alert component.
 */
function Alert({show, text, type}) {
    
    const className = classNames(
        'w-full flex gap-2 rounded-lg p-1 items-center',
        {'bg-red-900 text-red-400': type=='warning'},
        {'bg-green-900 text-green-400': type=="success"}
    )

    return (
        <>
            {show && (
                <div className={className}>
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