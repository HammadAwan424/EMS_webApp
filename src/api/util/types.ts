import type { Primitive } from "firebase/firestore";
import { noOp } from "./Utility.ts";

export type NestedPartial<T> = string extends keyof T ? T : Partial<T> | (T extends Primitive ? T : T extends {} ? {
    [K in keyof T]?: NestedPartial<T[K]>
} : never);
export type DeletableIndex<T, U> = {
    [K in keyof T]: K extends U ? { [N in keyof T[K]]: T[K][N] | "deleted" } : T[K]
}