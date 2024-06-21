import Student from "./Student.jsx";
import Popup from "/src/Components/Popup.jsx"
import { useState, useRef } from "react";

function Students({ lst }) {
    const [btnDisabled, setBtnDisabled] = useState(true);
    const [absentStu, setAbsentStu] = useState(0); // Changes when submit button is clicked and all students are marked
    const [renderWarning, setRenderWarning] = useState(false)
    const dataRef = useRef({});
    const dialogRef = useRef(null);
    const submitBtnRef = useRef(null);

    const students = lst.map((obj) => (
        <Student
            name={obj.name}
            id={obj.id}
            data={dataRef}
            validateBtn={validateBtn}
            key={obj.id}
        />
    ));

    function countFromData(bool) {
        let count = 0;
        for (let key in dataRef.current) {
            if (dataRef.current[key] == bool) count += 1;
        }
        return count;
    }

    function validateBtn() {
        let selectedItems = Object.keys(dataRef.current).length;
        let totalItems = lst.length;
        if (selectedItems == totalItems) {
            setBtnDisabled(false); // Enable btn
            submitBtnRef.current.classList.remove("opacity-75");
        }
    }

    function initialSubmitHandler() {
        if (btnDisabled) {
            setRenderWarning(true);
        } else {
        
            let absentStu = countFromData(false);
            setAbsentStu(absentStu);
            dialogRef.current.showModal();
        }
    }

    function closeDialog() {
        dialogRef.current.close();
    }

    function Status({ count }) {
        switch (count) {
            case 0:
                return <div>No student is absent</div>;
            case 1:
                return <div>1 student is absent</div>;
            default:
                return <div>{count} students are absent</div>;
        }
    }

    function confirmSubmitHandler() {
        console.log(dataRef.current);
    }

    return (
        <>
            <Popup ref={dialogRef}>
                <div className="flex flex-col gap-6 px-6 py-8">
                    <div>
                        <Status count={absentStu} />
                    </div>
                    <div className="flex gap-4">
                        <button autoFocus onClick={closeDialog}>
                            Go back
                        </button>
                        <button onClick={confirmSubmitHandler}>Yes submit</button>
                    </div>
                </div>
            </Popup>


            {/* All Students (collection of student components) */}
            <div className="flex items-center gap-2 flex-col sm:w-[--student-width-for-desktop] p-2">
                {students}
                {renderWarning && 
                <div className="w-full bg-red-900 text-red-400 rounded-lg p-1">
                    <p>
                        Please mark all the students above
                    </p>
                </div>}

                <button ref={submitBtnRef} className="w-full opacity-75" onClick={initialSubmitHandler}>
                    Submit
                </button>
            </div>
        </>
    );
}

export default Students;
