import { Link } from "react-router-dom"
import {  IconArrowRight  } from "src/IconsReexported.jsx"

function Guest() {
    return (
        <>
            <div className="flex flex-col gap-4">
                <h1 className="font-mono">Grade-Book</h1>

                <hr />

                <div className="flex flex-col gap-2">
                    <h2 className="font-semibold text-[--primary-col]">Includes benefits:</h2>
                    <p className="text-[--secondary-col] bg-[--bg-hover-col] p-2">
                        Become an Admin and arrange your data in hierarchical structure and allow customized access to others
                    </p>
                    <p className="text-[--secondary-col] bg-[--bg-hover-col] p-2">
                        No more paper or whatsoever. Not even have to worry about entring students records again and again. Just enter once and we will Prompt you to enter their attendence at the right time.
                    </p>
                    <p className="text-[--secondary-col] bg-[--bg-hover-col] p-2">
                        Create or join Classgroups and add a number of various isolated classes.
                    </p>
                </div>

                <Link to="/login" className="self-start">
                    <button className="group">Get started
                        <IconArrowRight className="pl-1 transition inline-block group-hover:translate-x-1" />
                    </button>
                </Link>
            </div>
        </>
    )
}

export default Guest