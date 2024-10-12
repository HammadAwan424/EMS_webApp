import { useState , useRef } from "react";

import { IconArrowLeft } from "@tabler/icons-react"
import Popup from "src/components/CommonUI/Popup.jsx"
import Alert from "src/components/CommonUI/Alert.jsx"
import { auth, firestore } from "src/firebase/config";
import { addDoc, collection } from "firebase/firestore";



function CardWithReset({type}) {
    const [rerender, setRerender] = useState(0)
    function triggerRerender() {
        setRerender(rerender+1)
    }

    return(
        <Card type={type} reset={triggerRerender} key={rerender} />
    )
}


const types = {
    create: {
        title: "Create Class Group",
        text: "Create a new class group to manage multiple classes on one screen",
        btnText: "Create Now",
        placeholderText: "Enter Name" 
    },
    join: {
        title: "Join Class Group",
        text: "Join a class group as an admin to show others your class stats",
        btnText: "Join Now",
        placeholderText: "Enter CID"
    },
    tests: {
        title: "Manage Tests",
        text: "Manage marking of various tests and share them with your administration easily",
        btnText: "Start Now"
    }
}


function Card({type, reset}) {

    const [popupVisible, setPopupVisible] = useState(false)
    const [warning, setWarning] = useState({visible: false})
    const dialogRef = useRef(null)
    const inputRef = useRef()
    const { title, text, btnText, placeholderText } = types[type]


    function openDialog() {
        if (type == "tests") {
            alert("Coming soon")
        } else {
            setPopupVisible(true)
        }
    }
    
    function closeDialog() {
        reset()
    }

    function handleSubmitClick() {
        if (type == "create") {
            const value = inputRef.current.value
            if (!value.trim()) return
            
            handleCreateClick(value)
            return
        }
        setWarning({
            visible: true,
            text: "The data was not received"
        })
    }

    return (
        <div className="p-4 flex group overflow-hidden flex-col transition
            border-solid border-2 items-start rounded-md hover:bg-[--bg-hover-col]"
        >
            <div className="wrapper">
                <div className="font-semibold text-2xl"> {title} </div>
                <div className="text-sm"> {text} </div>
            </div>
            <div className="flex-auto"></div>
            <button onClick={openDialog}>{btnText}</button>
            {/* <button onClick={tmp}>NOTHING</button> */}
            
            {popupVisible && (
                <Popup ref={dialogRef} open={true} myClass="w-full sm:w-80">
                    <div className="px-4 py-2 w-full border-4 border-stone-900">
                        <IconArrowLeft onClick={closeDialog} className="self-start" />
                        <div className="py-6 flex flex-col gap-5"> 
                            <input ref={inputRef} required className={"bg-stone-600 rounded-sm p-1 border " + (warning.visible ? "border-red-800" : "border-transparent")} placeholder={placeholderText} type="text" autoFocus />
                            <Alert show={warning.visible} text={warning.text} type="warning" />
                            <button onClick={handleSubmitClick}>{btnText.split(" ")[0]}</button>
                        </div>
                    </div>
                </Popup>
            )}
        </div>
    );
}



/**
 * 
 * @param {string} name 
 */
async function handleCreateClick(name) {
    console.log(name)
    const uid = auth.currentUser.uid
    const colRef = collection(firestore, "classGroups")
    const docRef = await addDoc(colRef, {
        name: name,
        cgAdmin: uid
    })
}



export default CardWithReset;
