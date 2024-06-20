function Card({ title, text, btnText }) {
    return (
        <div className="p-4 flex group overflow-hidden flex-col transition
            border-solid border-2 items-start rounded-md hover:bg-[--bg-hover-col]"
        >
            <div className="wrapper">
                <div className="font-semibold text-2xl"> {title} </div>
                <div className="text-sm"> {text} </div>
            </div>
            <div className="flex-auto"></div>
            <button>{btnText}</button>
        </div>
    );
}

export default Card;
