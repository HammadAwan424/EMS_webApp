import Card from "./Card.jsx"

function Homepage() {
    const createText = "Create a new class group to manage multiple classes on one screen"
    const joinText = "Join a class group as an admin to show others your class stats"
    const manageText = "Manage marking of various tests and share them with your administration easily"

    return (
        <> 
            <div className="grid overflow-hidden gap-3 grid-cols-1 md:grid-cols-2 auto-rows-[minmax(200px,auto)]">
                <Card  title="Create Class Group" text={createText} btnText={"Create Now"} />
                <Card  title="Join Class Group" text={joinText} btnText={"Join Now"} />
                <Card  title="Manage Tests" text={manageText} btnText={"Start Now"} />
            </div>
        </>
    )
}

export default Homepage