import { useState } from "react";
import { useRef } from "react";
import { IconCross } from "@tabler/icons-react"
import styles from "/src/Student/students.module.css"

const types = {
    create: {
        title: "Create Class Group",
        text: "Create a new class group to manage multiple classes on one screen",
        btnText: "Create Now"
    },
    join: {
        title: "Join Class Group",
        text: "Join a class group as an admin to show others your class stats",
        btnText: "Join Now"
    },
    tests: {
        title: "Manage Tests",
        text: "Manage marking of various tests and share them with your administration easily",
        btnText: "Start Now"
    }
}

function Card({type}) {

    const [fieldVisible, setFieldVisible] = useState(false)
    const dialogRef = useRef(null)
    const { title, text, btnText } = types[type]

    function closeDialog() {
        dialogRef.current.close()
    }

    function openDialog() {
        dialogRef.current.showModal()
    }

    // function tmp() {
    //     setFieldVisible(true)
    // }

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

            <dialog id='submitDialog' ref={dialogRef}>
                <div className={styles.submitDialog + " flex flex-col gap-2"}>
                    <IconCross onClick={closeDialog} className="self-end" />
                    <input required className="bg-stone-600 rounded-sm p-1" placeholder={btnText[0]} type="text" autoFocus />
                    <div>
                        <button autoFocus>Go back</button>
                        <button>Yes submit</button>
                    </div>
                </div>

            </dialog>

            {/* {fieldVisible && <TmpComp />} */}

        </div>
    );
}


// function TmpComp() {
//     return(
//         <div className="opacity-50 bg-black absolute w-full h-screen">  
//             <input type="text" />
//         </div>
//     )
// }


export default Card;
