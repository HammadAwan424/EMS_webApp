import { useRef, useState, useEffect, useCallback, useLayoutEffect } from "react"

function Track({swipeBack, totalItems, navigation, children}) {

    const trackRef = useRef(null)
    const [customDate, setCustomDate] = useState(new Date())
    const [trackTransform, setTrackTransform] = useState(0)

    const newTransform = useCallback(() => {
        const percentage = (totalItems - 1) * 100
        return -percentage
    }, [totalItems])

    const [parentTransform, setParentTransform] = useState(newTransform)

    
    useLayoutEffect(() => {
        setParentTransform(newTransform())
    }, [newTransform])



   

    function handleSwipeStart(e) {
        const startTime = new Date().getTime()
        const minSwipeDistance = 50 
        const minTimeForSwipe = 200
        const startPos = e.clientX

        const swipes = {
            right: 1,
            left: -1
        }

        window.onmousemove = (eve) => {
            const endPos = eve.clientX
            const diff = endPos-startPos
            if (Math.abs(endPos-startPos) > minSwipeDistance) {
    
                const movement = diff < 0 ? -1 : 1
                const endTime = new Date().getTime()

                if (endTime-startTime < minTimeForSwipe) {
                    
                    let copy = swipeBack
                    if (movement == swipes.right) {
                        copy -= 1
                    } else {
                        copy += 1
                    }

                    const newItem = -copy

                    


                    if (itemExists(newItem)) {
                        setTrackTransform(calculatTransform(newItem))
                        console.log("THIS SHOLDNT BE PRINTED")
                        const tmp = movement > 0 ? navigation.previous() : navigation.next()
                        
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

    function itemExists(newItemToShow) { // From 0 to +ve n, 0 means first item, so no previous
        
        const validItem = newItemToShow < totalItems && newItemToShow >= 0
        console.log(newItemToShow, totalItems, validItem)
        if (validItem) {
            return true
        } else {
            return false
        }
    }

    function calculatTransform(previousItemNo) { // From 0 to +ve n, 0 means first item, so no previous
        return previousItemNo * 100
    }


    return(
        <>
        <div className="w-full max-h-full aspect-square flex justify-center">
        <div className="max-w-full h-full aspect-square overflow-hidden">
            <div className="w-full h-full aspect-square" style={{ transform: `translate(${parentTransform}%, 0px)` }}>
                <div ref={trackRef} id="track" className={"h-full whitespace-nowrap transition"} style={{ transform: `translate(${trackTransform}%, 0px)` }} onMouseDown={(e) => handleSwipeStart(e)}>
                    {children}
                </div>
            </div>     
        </div>
        </div>
  
        </>
    )
}

export default Track