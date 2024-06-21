import Card from "./Card.jsx"

function Homepage() {

    return (
        <> 
            <div className="grid overflow-hidden gap-3 grid-cols-1 md:grid-cols-2 auto-rows-[minmax(200px,auto)]">
                <Card  type="create" />
                <Card  type="join" />
                <Card  type="tests" />
            </div>
        </>
    )
}

export default Homepage