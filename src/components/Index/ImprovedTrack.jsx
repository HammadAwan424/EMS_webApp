import cn from "classnames"
import { useRef, useState, useCallback, useLayoutEffect, useEffect } from "react"

function ImprovedTrack({swipeBack, totalItems, navigation, children, classNames}) {
    const trackRef = useRef(null)
    const [trackTransform, setTrackTransform] = useState(0)

    const newTransform = useCallback(() => {
        const percentage = (totalItems - 1) * 100
        return -percentage
    }, [totalItems])

    const [parentTransform, setParentTransform] = useState(newTransform)

    // TODO: swipeBack is -ve and calculateTransform expects +ve
    useEffect(() => {
        const newItem = -swipeBack
        setTrackTransform(calculatTransform(newItem))
        
    }, [swipeBack, totalItems])

    
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
                    // let copy = swipeBack
                    // if (movement == swipes.right) {
                    //     copy -= 1
                    // } else {
                    //     copy += 1
                    // }

                    // THE COMMENTED OUT CODE WAS REQUIRED PREVISOULY
                    // WHEN SETTING TRANSFORM HERE
                    
                    // Determine what to do on valid swipe
                    const funcCall = movement == swipes.right ? navigation.previous() : navigation.next()
                }
                window.onmousemove = null
            }
            
        }

        const end = () => {
            // console.log("END IS CALLED")
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
                // console.log("ONTOUCHMOVE")
                movement(eve.touches[0])
            }
            window.ontouchend = end
        } else {
            window.onmousemove = movement
            window.onmouseup = end
        }
    }



    function calculatTransform(previousItemNo) { // From 0 to +ve n, 0 means first item, so no previous
        return previousItemNo * 100
    }

    // Setting justify-center will make the 
    return(
        <>
            <div id="track" className={cn("overflow-hidden", classNames)}>
                <div className="PARENT w-full h-full" style={{ transform: `translate(${parentTransform}%, 0px)` }}>
                    <div ref={trackRef}
                        className={
                            `flex [&>*]:flex-shrink-0 [&>*]:w-full transition items-start h-full
                        `} style={{ transform: `translate(${trackTransform}%, 0px)` }} onPointerDown={(e) => handleSwipeStart(e)}>
                        {children}
                    </div>
                </div> 
            </div>  
        </>
    )
}


// TODO: newItemToShow is -ve
function itemExists(newItemToShow, totalItems) { // 0 means first item
    const newItem = -newItemToShow
    const validItem = newItem < totalItems && newItem >= 0
    if (validItem) {
        return true
    } else {
        return false
    }
}

// TODO: state is -ve
function trackReducer(prevItem, action) {
    switch (action.type) {
        case "next": {
            const [totalItems, newItem] = [action.totalItems, prevItem + 1]
            return itemExists(newItem, totalItems) ? newItem : prevItem
        }
        case "previous": {
            const [totalItems, newItem] = [action.totalItems, prevItem - 1]
            return itemExists(newItem, totalItems) ? newItem : prevItem
        }
    }
}

export { trackReducer }

export default ImprovedTrack