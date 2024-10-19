import { Link } from "react-router-dom"

function NewUser() {
    return (
        <div className="grid overflow-hidden gap-3 grid-cols-1 md:grid-cols-2 auto-rows-[minmax(200px,auto)]">
            <Card type="create"/>
            <Card type="join" />
            <Card type="tests" />
        </div>
    )
}


const types = {
    create: {
        title: "Create Class Group",
        text: "Create a new class group to manage multiple classes on one screen",
        btnText: "Create Now",
    },
    join: {
        title: "Join Class",
        text: "Join a class as a teacher to manage class assigned to you",
        btnText: "Visit Invitations",
    },
    tests: {
        title: "Manage Tests",
        text: "Manage marking of various tests and share them with your administration easily",
        btnText: "Coming soon"
    }
}

function Card({type}) {

    const { title, text, btnText } = types[type]
    
    const linkPath = type == "create" 
        ? "/classgroup/create" : type == "join" 
        ? "/notifications" : ""

    const testsButton = <button onClick={() => alert("Coming soon...")}>{btnText}</button>
    const buttonForOtherCases = 
        <Link to={linkPath} className="noLink"><button>
            {btnText}
        </button></Link>

    return (
        <div className="p-4 flex flex-col transition
            border-theme-100 border items-start rounded-md hover:bg-theme-500"
        >
            <div className="wrapper">
                <div className="font-semibold text-2xl"> {title} </div>
                <div className="text-sm">{text}</div>
            </div>
            <div className="flex-auto"></div>
            {type == "tests" ? testsButton : buttonForOtherCases}
        </div>
    );
}

export default NewUser