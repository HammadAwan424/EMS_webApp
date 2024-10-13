import { useRef, useState, useCallback, useLayoutEffect } from "react"

function Track({swipeBack, totalItems, navigation, children}) {

    const trackRef = useRef(null)
    const [trackTransform, setTrackTransform] = useState(0)

    const newTransform = useCallback(() => {
        const percentage = (totalItems - 1) * 100
        return -percentage
    }, [totalItems])

    const [parentTransform, setParentTransform] = useState(newTransform)

    
    useLayoutEffect(() => {
        setParentTransform(newTransform())
    }, [newTransform])

    const mobile = 'ontouchstart' in window

    function handleSwipeStart(e) {
        const startTime = new Date().getTime()
        const minSwipeDistance = 50 
        const minTimeForSwipe = 200
        const startPos = e.clientX

        const swipes = {
            right: 1,
            left: -1
        }

        const movement = (eve) => {
            const endPos = eve.clientX
            const diff = endPos-startPos
            const isValid = Math.abs(endPos-startPos) > minSwipeDistance
            
            if (isValid) {
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
                        const funcCall = movement > 0 ? navigation.previous() : navigation.next()
                    }
                }
                window.onmousemove = null
            }
            
        }

        const end = () => {
            console.log("END IS CALLED")
            if (mobile) {
                window.ontouchmove = null
                window.ontouchend = null
            } else {
                window.onmousemove = null
                window.onmouseup = null
            }
        }

        if (mobile) {
            window.ontouchmove = (eve) => {
                console.log("ONTOUCHMOVE")
                movement(eve.touches[0])
            }
            window.ontouchend = end
        } else {
            window.onmousemove = movement
            window.onmouseup = end
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
                <div ref={trackRef} id="track" className={"h-full whitespace-nowrap transition"} style={{ transform: `translate(${trackTransform}%, 0px)` }} onPointerDown={(e) => handleSwipeStart(e)}>
                    {children}
                </div>
            </div>     
        </div>
        </div>
  
        </>
    )
}

export default Track