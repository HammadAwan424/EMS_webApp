// TODO:
// ?- syntax in rtk typescript helpers

import { Primitive } from "firebase-admin/firestore"

function edge<T extends Array<string>>(arg: T, b: "first"): void;
function edge<T>(arg: T, b: "second"): void;
function edge<T>(arg: T, b: "first" | "second"): void {
    if (b == "second") {
        const s = arg // still generic T?
    }
}
const s = Math.random() > 0.5 ? "first" : "second" // even tho it ts doesn't allow passing unions
test("string", s) // X



function constrained<T extends Array<number>>(arg: T) {}
function moreGeneral<T>(arg: T, type: string) {
    if (type == "first") {
        const s = arg
    }
    const f = (arg: T extends Array<number> ? T : never) => constrained(arg)
}




// Can't pass type arguements to generic arguements
type Box<K> = {content: K}
const obj = {
    f: <K>(arg: Box<K>) => {}
}
type Obj = typeof obj
// If you only have type of Obj (you are in type space):
type UnknownBox = Parameters<Obj['f']>[0] // always unknown for the generic part :(

type StringBox = Parameters<typeof obj.f<string>>[0] // this works, as you are in value space

declare const objDeclared: Obj // hackish way to get into value space
type AnotherStringBox = Parameters<typeof objDeclared.f<string>>[0]

type TestInfer = Obj extends {f: (a: infer K) => void} ? K<string> : never // inferring doesn't work either



// workaround for interface overloads but implementation can't typecheck
interface FooFunc {
    (n:number): number;
    (s:string): string;
    (sn: string | number): string | number;
}
const o: FooFunc = (sn: any) => {
    return sn;
}


// values constrained to {[index: string]: any} doesn't follow extends Primitive false
type Index = {[index: string]: number}
type Test1 = Index extends Primitive ? "Primitive" : "Not"
type Error<T> = T extends Primitive ? "Primitive" : "Not"
function error<T extends Primitive>(arg: T) {
    type V = T extends Primitive ? "Primitive" : "Not"
    type S = Error<T>
}


type IsArray<T> = T extends any[] ? true : false;
function f1<U extends object[]>(x: IsArray<U>) {
    const t: true = x;   // Error
    const f: false = x;  // Error, but previously wasn't

    const test1: IsArray<U> = true
    
}



function importedF(a: number): number;
function importedF(a: never): void;
function importedF(a: number):number {
    return 3
}