
import classNames from "classnames"
import {  IconAlertTriangle, IconSquareRoundedX  } from "src/IconsReexported.jsx"

/**
 * Alert component
 * @param {Object} props - The properties object.
 * @param {boolean} props.show - Whether to show the alert.
 * @param {string} props.text - The alert text.
 * @param {"warning"|"success"} props.type - The type of alert.
 * @returns {JSX.Element} The Alert component.
 */
function Alert({show, setter, text, type}) {
    
    const className = classNames(
        'flex gap-2 rounded-lg p-1 items-center',
        {'text-red-700 border-red-700 border': type=='warning'},
        {'bg-green-900 text-green-400': type=="success"}
    )


    return (
        <>
            {show && (
                <div className={className}>
                    {type == "warning" && <div className="pt-1"><IconAlertTriangle /></div>}
                    <p> 
                        {text}
                    </p>
                    <IconSquareRoundedX className="ml-auto" 
                        onClick={() => {setter && setter(false)}} 
                    />
                </div>
            )}
        </>
    )
}

export default Alert