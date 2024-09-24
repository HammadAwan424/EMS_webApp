import { getAllClassIds } from "src/features/user/userSlice"
import CardWithReset from "./Card"
import CreateCardReset from "./Create-card"
import { useSelector } from "react-redux"

function NewUser() {
    const returnedVal = useSelector(getAllClassIds)
    console.log("NEW USER", returnedVal)
    return (
        <div className="grid overflow-hidden gap-3 grid-cols-1 md:grid-cols-2 auto-rows-[minmax(200px,auto)]">
            <CreateCardReset/>
            <CardWithReset type="tests" />
            <CardWithReset type="join" />
        </div>
    )
}

export default NewUser