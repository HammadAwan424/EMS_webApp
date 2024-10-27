import classNames from "classnames";
import { useImmer } from "use-immer";
import { useMemo } from "react";

// Name works as Path which should be unique for each input else there would be problems
// uiGetter is only required when style=="custom"
// for style=="custom", uiToggle is still required, it will maintain state but won't apply styles
function Input({getValue, getDefaultValue, uiToggle, uiGetter, setValue, name, className="", style="simple", ...args}) {
    const value = getValue(name)
    const defaultValue = getDefaultValue(name)
    const inputUIStates = style == "trackChanges" || style == "simple" ? uiGetter(name) : {}

    const defaultStyles = "p-1 rounded-md border flex-1 px-2 outline-none min-w-0"
    const inputClasses = style == "trackChanges" ? classNames(
        defaultStyles,
        { "border-yellow-500 bg-transparent": inputUIStates.isModified},
        {"border-theme-100 bg-transparent" : !inputUIStates.isFocused && !inputUIStates.main},
        {"bg-theme-100 border-transparent": inputUIStates.isFocused && !inputUIStates.main},
        className
    ) : style == "simple" ? classNames(
        defaultStyles,
        {"border-theme-100 bg-transparent" : !inputUIStates.isFocused},
        {"bg-theme-100 border-transparent": inputUIStates.isFocused},
        className
    ) : classNames(defaultStyles, className)

    const onChange = (e) => {
        const newValue = e.target.value
        const isModified = newValue != defaultValue
        setValue({value: newValue, path: name, isModified})
        if (isModified) {
            uiToggle({uiValue: true, path: name, base:"isModified"})
        } else {
            uiToggle({uiValue: false, path: name, base:"isModified"})
        }
    }
    const onFocus = () => {
        uiToggle({uiValue: true, path: name, base: "isFocused"})
    }
    const onBlur = () => {
        uiToggle({uiValue: false, path: name, base: "isFocused"})
    }
    return (
        <input 
            className={inputClasses}
            required type="text"
            value={value} 
            name={name} 
            onChange={onChange} 
            onFocus={onFocus}
            onBlur={onBlur}
            autoComplete="off"
            {...args}
        />
    )
}

// Path should be unique for each input else there would be problems
const initialState = {
    isModified: {},
    isFocused: {}
}
function useInput() {
    const [uiState, setState] = useImmer(initialState)
    
    // const [state, dispatch] = useImmerReducer()
    const [uiToggle, uiReset] = useMemo(() => {
        const uiToggle = ({uiValue, path, base}) => setState(prev => {
            prev[base][path] = uiValue
        })
        const uiReset = () => setState(initialState)
        return [uiToggle, uiReset]
    }, [setState])

    const uiGetter = (path) => ({isModified: uiState.isModified[path], isFocused: uiState.isFocused[path]})
    const anyFocused = Object.values(uiState.isFocused).some(boolean => boolean == true)
    const anyModified = Object.values(uiState.isModified).some(boolean => boolean == true)
    return {uiToggle, uiGetter, uiReset, anyFocused, anyModified, uiState}
}

export {Input, useInput}