import { arrayRemove, deleteField, doc, setDoc, SetOptions, type DocumentData, type FirestoreDataConverter, type Primitive } from "firebase/firestore"
import type { ClassGroupId } from "../classgroups/util.ts";
import type { DeletableIndex, NestedPartial } from "src/api/util/types.ts";


type ClassId = string
type StudentId = string

type ClassDBModel = {
    className: string,
    students: Record<StudentId, {
        rollNo: string,
        studentName: string
    }>
}

type ClassIdentifier = {
    classId: ClassId,
    classGroupId: ClassGroupId
}

// TODO: how to dynamically get type of set elements
type ClassAppModel<Ids extends string[] | Set<string> = Set<string>>  = {
    students: {
        ids: Ids;
        entities: Record<string, {
            rollNo: string;
            studentName: string;
        }>;
    };
    className: string;
    exists: true;
    id: string;
}

// :: ClassAppDiff is an intermittent type ::
type ClassAppDiff = Omit<ClassAppModel, "students"> & {
    students: DeletableIndex<ClassAppModel['students'], "entities">
}
type ClassAppPatch = Partial<ClassAppDiff>


const getClassByIdConverter: FirestoreDataConverter<ClassAppModel, ClassDBModel> = {
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options) as ClassDBModel
        const studentsField = data.students // this field gets replaced
        const [ids, entities] = [Object.keys(studentsField), studentsField]
        const classAppModel: ClassAppModel = {id: snapshot.id, ...data, students: {ids, entities}} 
        return classAppModel
    },
    // 1) assumes passed data for setDoc would always be AppModelType (no fieldvalues)
    //  the type assertions in if/else blocks
    // 2) return type assertion was needed because return types can't be checked as they get 
    // intersected in overloads defined using interfaces
    toFirestore(classData, options?: SetOptions) {
        if (options) {
            const { students, ...data } = classData as NestedPartial<ClassAppModel> // could be partial
            const studentEntites = students?.entities ? {students: students.entities} : {}
            return {
                ...data,
                ...studentEntites
            } satisfies NestedPartial<ClassDBModel> as any
        } else {
            const { students, ...data } = classData as ClassAppModel // no partial in this case
            return {
                ...data,
                students: students.entities,
            }
        }
    }
}


export { getClassByIdConverter }
export type { ClassIdentifier, ClassDBModel, ClassAppModel, ClassAppPatch, ClassId, StudentId }