import classNames from "classnames";
import { useImmer } from "use-immer";
import { useMemo } from "react";
import { cva } from "class-variance-authority"
import { GetValue } from "../util/getValueFactory.ts";
import valueDiff from "#src/api/util/diff/valueDiff.ts";

type InitialState = {
    isEdited: Record<string, boolean>
    isFocused: Record<string, boolean>
}
type InputUIToggleArgs = {boolValue: boolean, UIState: keyof InitialState, inputName: string}
const initialState: InitialState = {
    isEdited: {},
    isFocused:  {},
}
function useInput() {
    const [UIState, setState] = useImmer(initialState)
    
    const [InputUIToggle, InputUIReset] = useMemo(() => {
        const InputUIToggle = ({boolValue, UIState, inputName}: InputUIToggleArgs) => setState(prev => {
            prev[UIState][inputName] = boolValue
        })
        const InputUIReset = () => setState(initialState)
        return [InputUIToggle, InputUIReset]
    }, [setState])

    const InputUIGetter = (inputName: string) => ({
        isEdited: UIState.isEdited[inputName], isFocused: UIState.isFocused[inputName]
    })
    const anyFocused = Object.values(UIState.isFocused).some(boolean => boolean)
    const anyEdited = Object.values(UIState.isEdited).some(boolean => boolean)
    return {InputUIToggle, InputUIGetter, InputUIReset, data: {anyFocused, anyEdited, UIState}}
}


export type InputProps = Omit<ReturnType<typeof useInput>, "data" | "InputUIReset"> & {
    name: NonNullable<string>,
    stylesType?: "plain" | "track" | "minimal",
    getValue: GetValue, 
    setValue: (value: string, path: string) => void
} & React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>
// Name works as Path which should be unique for each input else there would be problems
// uiGetter is only required when style=="custom"
// for style=="custom", uiToggle is still required, it will maintain state but won't apply styles
function Input({
    name, stylesType = "minimal", 
    getValue, setValue, 
    InputUIGetter, InputUIToggle, ...args
}: InputProps) {
    const value = getValue(name)
    const UIState = InputUIGetter(name)

    const focusStyles = classNames(
        "bg-theme-100", "border-transparent", UIState.isFocused,
        "border-theme-100", "bg-transparent", !UIState.isFocused    
    )
    const defaultStyles = cva(["p-1 rounded-md border flex-1 px-2 outline-none min-w-0"], {
        variants: {
            isEdited: {
                true: ["border-yellow-500",  "bg-transparent"],
                false: focusStyles
            }
        },
        defaultVariants: {
            isEdited: false
        }
    })

    let styles = "" // when stylesType == "plain"
    if (stylesType == "minimal") 
        // only tracks focus state for styles
        styles = defaultStyles({isEdited: false})
    else if (stylesType == "track")
        // generates styles based on the whole state, track modifications
        styles = defaultStyles({isEdited: value.s == "edited"})
        

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setValue(value, name)
    const onFocus = () =>
        InputUIToggle({boolValue: true, UIState: "isFocused", inputName: name})
    const onBlur = () =>
        InputUIToggle({boolValue: false, UIState: "isFocused", inputName: name})

    return (
        <input 
            className={styles + " " + args.className}
            required type="text"
            value={value.c} 
            name={name} 
            onChange={onChange} 
            onFocus={onFocus}
            onBlur={onBlur}
            autoComplete="off"
            {...args}
        />
    )
}


export {Input, useInput}