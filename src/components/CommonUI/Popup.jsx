import {  IconX  } from "src/IconsReexported.jsx"
import Button from "./Button"
import { useMemo, useState , useEffect } from "react"


let count = 0
function genId() {
  count = (count + 1)
  return count.toString()
}

const initialPopupState = {
    id: -1,
    text: "",
    handler: () => {},
    visible: false,
    isLoading: false
}
let globalState = initialPopupState
let setStateRef = []

const popup = ({id, ...args}) => {
    if (id == globalState.id) { // allow if same popup is asking for update
        setGlobalState({id, ...args})
    } else { // some other popup is asking for change in global state
        if (!globalState.visible) { // allow if no other popup is open
            setGlobalState({id, ...args})
        } else {
            console.log("Another popup is asking for update, requesting: ", id, "already present: ", globalState.id, globalState)
        }
    }
}

function setGlobalState(newState) {
    globalState = {...globalState, ...newState} // change globalState, created because we need to read it inside popup
    setStateRef[0](globalState) // change state for render
} 


const usePopupMaster = () => {
    const [state, setState] = useState(globalState)
    const setStateWrapper = (args) => {
        console.log("setPopupState with args: ", args)
        setState(args)
    }
    setStateRef.push(setStateWrapper)
    const close = () => setGlobalState(initialPopupState) // acts as a root
    return {state, close}
}

// 1) no Popup master, only usePopup that was called in Popup component and every other place popup is called with args
// 2) to automatically render out on unmount, introduced usePopup with useEffect that returns popup(initialState)
// 3) problem: two components called usePopup, one of them set visible = true, the other one render out
// this will cause the first visible = true to become hidden, need decoupling
// for decoupling -> every usePopup call is identified uniquely  
// a global state would exist, calling popup from usePopup wil set visible = true for that unique usePopup
// popup with visible = true won't have an effect if global state is already visible = true
// some other popup has already called popup with visible = true 
// on unmount, if current usePopup had set visible = true ealier, then it make globalState = initialState

const usePopup = ({isLoading=false} = {}) => {
    const id = useMemo(genId, [])

    // when props changes (loading here)
    useEffect(() => {
        popup({id, isLoading})
    }, [isLoading, id])

    // for unmount
    useEffect(()=> {
        return () => popup({...initialPopupState, id, visible: false})
    }, [id])

    return {
        close: () => popup({...initialPopupState, id, visible: false}), 
        popup: (args) => popup({...args, id, visible: true,})
    }
}


function Popup() {
    const {state, close} = usePopupMaster()
    const {visible, isLoading, handler: confirmHandler, text} = state
    
    if (!visible) return null
    
    const btnStates = {
        text: {
            idleText: "Proceed",
            loadingText: "Processing..."
        },
        states: {
            isLoading
        }
    }


    return (
        <div className="inset-0 flex items-center justify-center fixed z-50 bg-black/50">
            <div id="Popup" className="bg-[--theme-primary] max-w-[90%] text-center py-4 rounded-md w-full md:w-96 z-50">
                <div id="Top" className="flex flex-col p-4">
                    <div className="flex">
                        <div className="flex-auto"></div>
                        <span className="font-bold text-xl">Confirm Action?</span>
                        <div className="flex-auto relative">
                            <IconX size={28} onClick={close} className="cursor-pointer right-0 absolute rounded-full p-1 transition hover:bg-[--theme-secondary]" />
                        </div>
                    </div>
                    <span className="text-[--text-secondary-col]">{text}</span>
                </div>


                <div id="Bottom" className="p-4 flex flex-col gap-2">

                    <Button className="bg-red-600 hover:bg-red-500" onClick={confirmHandler} {...btnStates} />
                    <button type="button" className="bg-[--theme-secondary]" onClick={close}>Cancel</button>
                </div>
            </div>
        
        </div>
    )
}

export {popup, Popup, usePopup}
