import classNames from "classnames"
import { Spinner } from "./Icons"
import { forwardRef } from "react"
import { PopoverTrigger } from "@radix-ui/react-popover"

const Button = forwardRef(
    ({
        states: { isLoading = false, isError = false, isModified = false } = {},
        text: { errorText = "Retry :(", successText = "Success", loadingText = "Loading...", idleText = "Submit" } = {},
        className = "",
        noDefaultStyle = false,
        children,
        spinnerClassName,
        ...args
    }, ref) => {
    
        const disabled = isLoading || args.disabled
    
        const classes = classNames(
            // "bg-blue-500 flex justify-center gap-2 items-center",
            'flex justify-center gap-2 items-center transition',
            'disabled:cursor-not-allowed font-semibold',
            !isError && noDefaultStyle==false && "bg-black hover:bg-black/65 disabled:text-offwhite",
            className,
            {"bg-red-500 text-red-900": isError},
            {"cursor-wait": isLoading}
        )
    
        const svgClassNames = classNames(
            "text-white",
            spinnerClassName,
            {"animate-spin": isLoading}
        ) 
    
        // errorText : !isError ? successText : idleText 
        const btnText = isLoading ? loadingText : isError ? errorText : idleText 
        const strokeWidth = 25
    
        return (
            <button ref={ref} className={classes} {...args} disabled={disabled} >
                {isLoading ? (
                    <>
                        {btnText} <Spinner svgClassNames={svgClassNames} />
                    </>
                ) : children ? (
                    children
                ) : btnText}
            </button>
        )
    }
)
Button.displayName = PopoverTrigger.displayName


export default Button