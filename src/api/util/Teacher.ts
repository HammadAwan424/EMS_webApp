//TODO: implement a common interface for checking basic status

const Teacher =  {
    hasClassGroups(classGroup: string[]) {
        return classGroup.length > 0
    }
}

export { Teacher }