import { useRef, useState, useEffect } from "react"

function Track({data, startAt, totalItems, children}) {

    const trackRef = useRef(null)
    const [currentItem, setCurrentItem] = useState(startAt)
    const [customDate, setCustomDate] = useState(new Date())
    const [trackTransform, setTrackTransform] = useState(120)


    useEffect(() => {
        if (itemExists(startAt)) {
            setTrackTransform(calculatTransform(startAt))
        }
        trackRef.current.classList.add("transition")
    }, [])

    function handleSwipeStart(e) {
        const startTime = new Date().getTime()
        const minSwipeDistance = 50 
        const minTimeForSwipe = 200
        const startPos = e.clientX

        window.onmousemove = (eve) => {
            const endPos = eve.clientX
            const diff = endPos-startPos
            if (Math.abs(endPos-startPos) > minSwipeDistance) {
    
                const movement = diff < 0 ? -1 : 1
                const endTime = new Date().getTime()

                if (endTime-startTime < minTimeForSwipe) {

                    const newItem = currentItem + movement


                    if (itemExists(newItem)) {
                        setCurrentItem(newItem)
                        setTrackTransform(calculatTransform(newItem))
                        
                        // Side work, date calculation
                        const copy = new Date(customDate.toISOString()) 
                        copy.setDate(copy.getDate() + movement)
                        setCustomDate(copy)
                    }
                }
                window.onmousemove = null
            }
            
        }

        window.onmouseup = () => {
            window.onmousemove = null
            window.onmouseup = null
        }
    }

    function itemExists(newItemToShow) {
        if (newItemToShow <= totalItems && newItemToShow >= 1) {
            return true
        } else {
            return false
        }
    }

    function calculatTransform(itemNo) {
        return (totalItems - itemNo) * -100
    }


    return(
        <div className="overflow-x-scroll overflow-y-hidden noscrollbar h-full aspect-square">
            <div ref={trackRef} id="track" className={"h-full whitespace-nowrap"} style={{ transform: `translate(${trackTransform}%, 0px)` }} onMouseDown={(e) => handleSwipeStart(e)}>
                {children}
            </div>
        </div>
    )
}

export default Track