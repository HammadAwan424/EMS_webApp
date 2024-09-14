function Pie({percentage=0, stroke=10, children}) {
    let property;
    let number;

    if (percentage % 25 == 0 && percentage != 0) {
        number = 100
    }  else {
        number = (percentage % 25) * 4
    }

    

    const first = `polygon(0% 0%, 50% 50%, ${number}% 0%)`
    const second = `polygon(0% 0%, 100% 0%, 100% ${number}%, 50% 50%)`
    const third = `polygon(0% 0%, 100% 0%, 100% 100%, ${100-number}% 100%, 50% 50%)`
    const fourth = `polygon(50% 50%, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% ${100-number}%)`

    if (percentage <= 25) {
        property = first
    } else if (percentage <= 50) {
        property = second
    } else if (percentage <= 75) {
        property = third
    } else {
        property = fourth
    }

    const rotation = "rotate(45deg)"
    const bg = 'bg-[--theme-primary]'
    
    return (
        <div className="PIE h-full w-full relative rounded-full bg-red-50000">
            <div className="bg-green-500 h-full w-full rounded-full overflow-hidden" style={{ clipPath: property, transform: rotation }}>
            </div>

            <div className={`rounded-full ${bg} absolute`}
                style={{
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: `${100 - stroke}%`,
                    height: `${100 - stroke}%`
                }}>
                {children}
            </div>
        </div>

    )
}

export default Pie