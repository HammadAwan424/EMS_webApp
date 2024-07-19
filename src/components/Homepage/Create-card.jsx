import { useState } from "react";
import { useRef } from "react";
import { IconArrowLeft, IconArrowNarrowLeft, IconFidgetSpinner } from "@tabler/icons-react"
import Popup from "src/components/reusableComponents/Popup.jsx"
import Alert from "src/components/reusableComponents/Alert.jsx"
import { auth, firestore } from "src/firebase/config";
import { addDoc, collection } from "firebase/firestore";
import { Form, useNavigation } from "react-router-dom";


async function action({request}) {
    console.log("Loader in Create card is called")
    const data = await request.formData()
    const value = data.get("name")
    const uid = auth.currentUser.uid
    const colRef = collection(firestore, "classGroups")
    const p = new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(addDoc(colRef, {
                name: value,
                cgAdmin: uid
            }))
        },1000)
    })
    .then(docRef => {console.log(docRef); return docRef})
    .catch(reason => {
        console.log("Rejected")
        return reason
    })
    
    console.log(p)
    return p
     
}


const data = {
    title: "Create Class Group",
    text: "Create a new class group to manage multiple classes on one screen",
    btnText: "Create Now",
    placeholderText: "Enter Name" 
}

function CreateCard({reset}) {

    const [popupVisible, setPopupVisible] = useState(false)
    const [alert, setAlert] = useState({visible: false, text: "", type: ""})
    const dialogRef = useRef(null)
    const inputRef = useRef()
    const navigation = useNavigation()


    function openDialog() {
        setPopupVisible(true)
    }
    

    
    function closeDialog() {
        reset()
    }


    return (
        <div className="p-4 flex group overflow-hidden flex-col transition
            border-solid border-2 items-start rounded-md hover:bg-[--bg-hover-col]"
        >
            <div className="wrapper">
                <div className="font-semibold text-2xl"> {data.title} </div>
                <div className="text-sm"> {data.text} </div>
            </div>
            <div className="flex-auto"></div>
            <button onClick={openDialog}>{data.btnText}</button>
            {/* <button onClick={tmp}>NOTHING</button> */}
            
            {popupVisible && (
                <Popup ref={dialogRef} open={true} myClass="w-full sm:w-80">
                    <div className="px-4 py-2 w-full border-4 border-stone-900">
                        <IconArrowLeft onClick={closeDialog} className="self-start" />
                        <Form className="py-6 flex flex-col gap-5" method="post">
                            <input name="name" ref={inputRef} required className={"w-full bg-stone-600 rounded-sm p-1 border " + (alert.visible ? "border-red-800" : "border-transparent")} placeholder={data.placeholderText} type="text" autoFocus />
                            <IconFidgetSpinner />
                            <Alert show={alert.visible} text={alert.text} type={"warning"} />
                            <button className={navigation.state == "submitting" ? "bg-red-600" : ""} type="submit">{data.btnText.split(" ")[0]}</button>
                        </Form>
                    </div>
                </Popup>
            )}
        </div>
    );
}

function CreateCardReset() {
    const [rerender, setRerender] = useState(0)
    function triggerRerender() {
        setRerender(rerender+1)
    }

    return(
        <CreateCard reset={triggerRerender} key={rerender} />
    )
}


export default CreateCardReset;
export {action}