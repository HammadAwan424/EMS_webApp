import { response } from "express";

const getFireStoreProp = (value) => {
    const props = {
        arrayValue: 1,
        bytesValue: 1,
        booleanValue: 1,
        doubleValue: 1,
        geoPointValue: 1,
        integerValue: 1,
        mapValue: 1,
        nullValue: 1,
        referenceValue: 1,
        stringValue: 1,
        timestampValue: 1,
    };
    return Object.keys(value).find((k) => props[k] === 1);
};

const fireStoreParser = (value) => {
    let newVal = value;
    // You can use this part to avoid mutating original values
    //   let newVal;
    //   if (typeof value === 'object') {
    //     newVal = { ...value };
    //   } else if (value instanceof Array) {
    //     newVal = value.slice(0);
    //   } else {
    //     newVal = value;
    //   }
    const prop = getFireStoreProp(newVal);
    if (prop === "doubleValue" || prop === "integerValue") {
        newVal = Number(newVal[prop]);
    } else if (prop === "arrayValue") {
        newVal = ((newVal[prop] && newVal[prop].values) || []).map((v) =>
            fireStoreParser(v)
        );
    } else if (prop === "mapValue") {
        newVal = fireStoreParser((newVal[prop] && newVal[prop].fields) || {});
    } else if (prop === "geoPointValue") {
        newVal = { latitude: 0, longitude: 0, ...newVal[prop] };
    } else if (prop) {
        newVal = newVal[prop];
    } else if (typeof newVal === "object") {
        Object.keys(newVal).forEach((k) => {
            newVal[k] = fireStoreParser(newVal[k]);
        });
    }
    return newVal;
};

const docFromApiRes = async (firebaseRestApiRes) => {
    const status = firebaseRestApiRes.status
    const json = await firebaseRestApiRes.json()
    if (status == 404) {
        return {
            exists: false,
            data: undefined
        }
    } else if (status == 200) {
        return {
            exists: true,
            data: fireStoreParser(json.fields ?? {})
        }
    } else if (status == 403) {
        throw {message: "Permission-denied", response: json}
    } else {
        throw {message: "Something unexpected happended", response: json}
    }
} 

export { fireStoreParser, docFromApiRes }