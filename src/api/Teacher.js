const Teacher =  {
    getInvitationId(classId, invitations) {
        return invitations[classId].classGroupId + classId
    },
    hasInvitations(user) {
        return Object.keys(user.invitations).length > 0
    },
    hasClasses(user) {
        return Object.keys(user.classes).length > 0
    },
    getClassIdArray(user) {
        return Object.keys(user.classes)
    },
    hasClassGroups(classGroup) {
        return classGroup.length > 0
    }
}

export { Teacher }