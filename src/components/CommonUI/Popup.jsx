import {  IconX  } from "src/IconsReexported.jsx"
import Button from "./Button"

function Popup({
    visible, text, setVisible, confirmHandler, isLoading
    // btnStates: {text: {idleText = "Proceed", loadingText = "Processing..."} = {}, ...other} = {}
}) {
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
        <div className="inset-0 flex items-center justify-center fixed z-50">
            <div className="bg-black inset-0 opacity-50 absolute"></div>
            <div id="Popup" className="bg-[--theme-primary] max-w-[90%] text-center py-4 rounded-md w-full md:w-96 z-50">
                <div id="Top" className="flex flex-col p-4">
                    <div className="flex">
                        <div className="flex-auto"></div>
                        <span className="font-bold text-xl">Confirm Action?</span>
                        <div className="flex-auto relative">
                            <IconX size={28} onClick={() => setVisible(false)} className="cursor-pointer right-0 absolute rounded-full p-1 transition hover:bg-[--theme-secondary]" />
                        </div>
                    </div>
                    <span className="text-[--text-secondary-col]">{text}</span>
                </div>


                <div id="Bottom" className="p-4 flex flex-col gap-2">

                    <Button className="bg-red-600" onClick={confirmHandler} {...btnStates} />
                    <button type="button" className="bg-[--theme-secondary]" onClick={() => setVisible(false)}>Cancel</button>
                </div>

                
            </div>
        
        </div>
    )
}

export default Popup
