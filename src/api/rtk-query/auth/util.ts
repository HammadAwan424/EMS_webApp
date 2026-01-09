import { ClassId } from "../class/util.ts"
import { ClassGroupId } from "../classgroups/util.ts"

type InvitationId = string

type User = {
    classes: Record<ClassId, boolean>,
    classGroups: Record<ClassGroupId, string>,
    invitations: Record<InvitationId, {
        classId: ClassId,
        classGroupId: ClassGroupId,
        email: string,
        status: boolean
    }>,
    meta: {
        metaId: string
    }
}

type AppAuth = {
    displayName: string,
    email: string, 
    uid: string
}


export type { User, AppAuth, InvitationId }