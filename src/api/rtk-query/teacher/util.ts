import { ClassId } from "../class/util.ts"
import { ClassGroupAppModel, ClassGroupId } from "../classgroups/util.ts"

type InvitationId = string

type Teacher = {
    classes: {
        [index: ClassId]: boolean
    },
    classGroups: {
        [index: ClassGroupId]: ClassGroupAppModel['classGroupName']
    },
    invitations: {
        [index: InvitationId]: {
            className: string,
            classGroupId: string,
            email: string,
            status: boolean
        }
    },
    meta: {
        metaId: string
    }
}


export type { Teacher }