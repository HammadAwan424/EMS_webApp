function SingleStudentEdit({type, studentId}) {
    const {partialInputProps, updatedClassState, dispatch} = useContext(ClassEditContext) 

    const fields = [`students.entities.${studentId}.rollNo`, `students.entities.${studentId}.studentName`]

    const [rollNoUi, nameUi] = [partialInputProps.uiGetter(fields[0]), partialInputProps.uiGetter(fields[1])]
    const modified = rollNoUi.isModified || nameUi.isModified

    const generalLocked = updatedClassState.ui.lockedInput.includes("general")
    const disabled = type == "removed" || generalLocked

    // TODO: Take away condition from reducer and try to not run effect code when type is added
    // also prevent useEffect from running when type changes
    useEffect(() => {
        dispatch({
            type: "update_student",
            id: studentId,
            modified: rollNoUi.isModified || nameUi.isModified
        })
    }, [rollNoUi.isModified, nameUi.isModified, studentId, dispatch])

    const newInputProps = {...partialInputProps, disabled, style: "custom"}

    // DONE: use cva (class variance authority) here
    const nonPriorityStyles = (isFocused: boolean) => classNames(
        { 'border-yellow-500 bg-transparent': modified },
        { 'border-transparent bg-theme-100': !modified && isFocused },
        { 'border-theme-100 bg-transparent': !modified && !isFocused },
    )
    const styles = (isFocused: boolean) => cva('', {
        variants: {
            priority: {
                removed: 'border-red-500 bg-transparent',
                added: 'border-green-500 bg-transparent',
                false: nonPriorityStyles(isFocused),
            },
        },
    })

    const restore = () => dispatch({
        type: "update_student",
        id: studentId,
        modified: rollNoUi.isModified || nameUi.isModified
    })

    return (
        <div className={`flex items-center gap-2`} key={studentId}>
            {type == "removed" ? (
                <IconTrashOff className="text-red-500" onClick={restore} />
            ) : type == "added" ? (
                <Cross size={24} className="stroke-red-500" onClick={() => dispatch({ type: "remove_student", id: studentId })} />
            ) : (
                <IconTrash className="text-white" stroke={1} onClick={
                    () => {dispatch({ type: "remove_student", id: studentId }); dispatch({type:"lockInput", value: "teacher"})}
                } />
            )}
            <Input {...newInputProps} className={getClassname(rollNoUi.isFocused)} name={fields[0]} type="number" placeholder="Roll No" />
            <Input {...newInputProps} className={getClassname(nameUi.isFocused)} name={fields[1]} placeholder="Name" />
        </div>
    )
}