function Cross({className, onClick, size}) {
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={className} onClick={onClick}>
            <path d="M20 20 L80 80 M80 20 L20 80" strokeWidth={7} strokeLinecap="round" />
        </svg>
    )
}

function Spinner({svgClassNames="", width=25, height=25, strokeWidth=25}) {
    return (
        <svg className={svgClassNames} width={25} height={25} viewBox="0 0 200 200">
            <path className="opacity-25" fill="transparent" strokeWidth={strokeWidth} stroke="white" d="
            M 100 35
            A 65 65 0 1 1 35 100
            "></path>
            <path className="opacity-75" fill="transparent" strokeWidth={strokeWidth} stroke="white" d="
            M 35 100
            A 65 65 0 0 1 100 35
            "></path>
        </svg>
    )
}

export { Spinner, Cross }
