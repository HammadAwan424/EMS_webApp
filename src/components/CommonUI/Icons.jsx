import classNames from "classnames"

function Cross({className, onClick, size}) {
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={className} onClick={onClick}>
            <path d="M20 20 L80 80 M80 20 L20 80" strokeWidth={7} strokeLinecap="round" />
        </svg>
    )
}

function Spinner({svgClassNames="", width=25, height=25, strokeWidth=30}) {
    return (
        <svg className={svgClassNames} width={width} height={height} viewBox="0 0 200 200">
            <path className="opacity-25" fill="transparent" strokeWidth={strokeWidth} stroke="white" d="
            M 100 20
            A 80 80 0 1 1 20 100
            "></path>
            <path className="opacity-75" fill="transparent" strokeWidth={strokeWidth} stroke="white" d="
            M 20 100
            A 80 80 0 0 1 100 20
            "></path>
        </svg>
    )
}

function Expand({className="", size=24, expanded=false, ...arg}) {
    const classes = classNames(
        className,
        'fill-transparent transition',
        'stroke-white',
        {'rotate-90': expanded}
    )   
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={classes} {...arg}>
            <path d="M40 35 L60 50 L40 65" strokeWidth={6} strokeLinecap="round" />
        </svg>
    )
}

// Below ones are taken from Tabler Icons
function Notification({active, ...props}) {
    const className = classNames(
        "origin-center",
        'fill-white',
        {"animate-ping": active}
    )
    return (
        <svg {...props} height={24} width={24}>
            <path d="M10 6h-3a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-3">
            </path>
            <path d="M17 7m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" className={className} >
            </path>
        </svg>
    )
}

export { Spinner, Cross, Notification, Expand }
