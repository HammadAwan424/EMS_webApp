import classNames from "classnames"
import { Spinner } from "./Icons"

function Button({
    states: { isLoading = false, isError = false } = {},
    text: { errorText = "Retry :(", successText = "Success", loadingText = "Loading...", idleText = "Submit" } = {},
    className = "",
    ...args
}) {

    const classes = classNames(
        "bg-blue-500 flex justify-center gap-2",
        className,
        {"bg-red-500": isError},
        {"cursor-wait": isLoading}
    )

    const svgClassNames = classNames(
        "text-white",
        {"animate-spin": isLoading}
    ) 

    // errorText : !isError ? successText : idleText 
    const btnText = isLoading ? loadingText : isError ? errorText : idleText 
    const strokeWidth = 25

    return (
        <button className={classes} {...args} disabled={isLoading} >
            {btnText}
            {isLoading && <Spinner svgClassNames={svgClassNames} />}
        </button>
    )
}

export default Button