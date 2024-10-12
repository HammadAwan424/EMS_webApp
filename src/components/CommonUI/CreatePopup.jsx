import { useState, useRef } from 'react';
import Alert from './Alert';
import { Form, useNavigation } from 'react-router-dom';
import {  IconArrowLeft  } from "src/IconsReexported.jsx";

const CreatePrompt = ({popupVisible, setPopupVisible, rerender}) => {
    
    const [alert, setAlert] = useState({ visible: false, text: '' });
    const inputRef = useRef(null);
    const dialogRef = useRef(null);
    const navigation = useNavigation()
    
    const data = {
        title: "Create Class Group",
        text: "Create a new class group to manage multiple classes on one screen",
        btnText: "Create Now",
        placeholderText: "Enter Name" 
    }

    const closeDialog = () => {
        setPopupVisible(false);
    };

    return (
        <>
        {popupVisible && (
            <div className='fixed inset-0 bg-opacity-60 bg-black flex items-center justify-center'>
                <div ref={dialogRef} className="text-white bg-neutral-800 w-full sm:w-80">
                    <div className="px-4 py-2 w-full border-4 border-stone-900">
                        <IconArrowLeft onClick={closeDialog} className="self-start" />
                        <Form className="py-6 flex flex-col gap-5" method="post" action='/?index'>
                            <input 
                                name="name" 
                                ref={inputRef} 
                                required 
                                className="w-full bg-stone-600 rounded-sm p-1 border" 
                                placeholder={data.placeholderText} 
                                type="text" 
                                autoFocus 
                            />
                            <Alert show={alert.visible} text={alert.text} type={"warning"} />
                            <button className={navigation.state === "submitting" ? "bg-red-600" : ""} type="submit">Create</button>
                        </Form>
                    </div>
                </div>
            </div>

        )}
        </>

    );
};


export default CreatePrompt;