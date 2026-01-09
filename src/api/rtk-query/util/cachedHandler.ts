import { doc, DocumentData, DocumentReference, DocumentSnapshot, getDoc, onSnapshot, Query as FirestoreQuery, Query } from "firebase/firestore";
import { moveThere } from "../../rtk-helpers/customSlice.js";
import apiSlice from "../apiSlice.js";
import { ThunkExtra } from "../../redux/getStore.js";
import { EndpointBuilder, fetchBaseQuery } from "@reduxjs/toolkit/query";


import { createEntityAdapter, EntityAdapter, EntityId, EntityState, EntityStateAdapter } from "@reduxjs/toolkit";
import type { BaseQuery, TagTypes, ReducerPath } from "../baseApi.js";



type UnknownEntityAdapter = EntityAdapter<unknown, EntityId>
type AdapterState = EntityState<unknown, EntityId>
type NoListener = {
    listenerType?: undefined
}
type SingleDocListener<ResultType, QueryArg> = {
    listenerType: "single",
    getDocRef: (queryArg: QueryArg, extra: ThunkExtra) => DocumentReference<ResultType, DocumentData>
}
type MultiDocListener<ResultType extends AdapterState, QueryArg> = {
    listenerType: "multi",
    getQuery: (queryArg: QueryArg, extra: ThunkExtra) => FirestoreQuery<ResultType['entities'][EntityId], DocumentData>,
    entityAdapter: UnknownEntityAdapter
}
type MultiAllowed<ResultType, QueryArg> = ResultType extends AdapterState 
    ? MultiDocListener<ResultType, QueryArg> 
    : never
type DocListener<ResultType, QueryArg> = 
    | SingleDocListener<ResultType, QueryArg>
    | MultiAllowed<ResultType, QueryArg>
    | NoListener
type WrapperQueryExtraArgs<ResultType, QueryArg> = {
    // if expansion is required in future
} & DocListener<ResultType, QueryArg>


type Builder = EndpointBuilder<BaseQuery, TagTypes, ReducerPath>
declare const __builder__: Builder
type __Typed_Query__<ResultType, QueryArg> = typeof __builder__.query<ResultType, QueryArg>
type onCacheEntryAdded<ResultType, QueryArg> = Parameters<__Typed_Query__<ResultType, QueryArg>>[0]['onCacheEntryAdded']
type QueryCacheLifecycleApi<ResultType, QueryArg> = Parameters<NonNullable<onCacheEntryAdded<ResultType, QueryArg>>>[1]
type QueryDefinitionArg<ResultType, QueryArg> = 
    Parameters<__Typed_Query__<ResultType, QueryArg>>[0] & WrapperQueryExtraArgs<ResultType, QueryArg>


const singleDocListener = async <ResultType, QueryArg>(
    docRef: DocumentReference<ResultType>,
    QueryCacheLifecycleApi: QueryCacheLifecycleApi<ResultType, QueryArg>
) => {
    const { cacheDataLoaded, updateCachedData, cacheEntryRemoved } = QueryCacheLifecycleApi
    // const docRef = getDocRef ? getDocRef(queryArg) : doc((extra as ThunkExtra).firestore, queryArg)
    let unsubscribe = null;
    try {
        await cacheDataLoaded;
        unsubscribe = onSnapshot(docRef, { source: "cache", includeMetadataChanges: true }, (snapshot) => {
            updateCachedData((draft) => {
                return snapshot.data({ serverTimestamps: "estimate" })!
            });
            // snapshot.metadata.hasPendingWrites && dispatch(moveThere({documentData: doc, identifier: snapshot.id}))
        });
    } catch {
        // no op
    } finally {
        await cacheEntryRemoved;
        unsubscribe && unsubscribe();
    }
}


const multiDocListener = async <ResultType extends AdapterState, QueryArg>(
    firestoreQuery: FirestoreQuery<ResultType['entities'][EntityId]>,
    QueryCacheLifecycleApi: QueryCacheLifecycleApi<ResultType, QueryArg>,
    entityAdapter: UnknownEntityAdapter
) => {
    const { cacheDataLoaded, updateCachedData, cacheEntryRemoved } = QueryCacheLifecycleApi
    let unsubscribe = null;
    try {
        await cacheDataLoaded;
        const options = { source: "cache", includeMetadataChanges: true } as const
        unsubscribe = onSnapshot(firestoreQuery, options, (snapshot) => {
            updateCachedData(draft => {
                snapshot.docChanges().forEach((docChange) => {
                    if (docChange.type == "added" || docChange.type == "modified") {
                        entityAdapter.setOne(draft, docChange.doc.data());
                    } else if (docChange.type == "removed") { // just for clarity
                        entityAdapter.removeOne(draft, entityAdapter.selectId(docChange.doc.data()))
                    }
                })
            })
        });
    } catch {
        // no op
    } finally {
        await cacheEntryRemoved;
        unsubscribe && unsubscribe();
    }
}


function query<ResultType, QueryArg>(
    builder: Builder,
    definition: QueryDefinitionArg<ResultType, QueryArg>
) {
    const { listenerType } = definition
    let onCacheEntryAdded: undefined | onCacheEntryAdded<ResultType, QueryArg> = undefined
    if (listenerType == "single") {
        const { getDocRef } = definition
        onCacheEntryAdded = (arg, api) => 
            singleDocListener(getDocRef(arg, api.extra as ThunkExtra), api)
    } else if (listenerType == "multi") {
        const { getQuery, entityAdapter } = definition
        onCacheEntryAdded = (arg, api) =>
        // @ts-expect-error
            multiDocListener(getQuery(arg, api.extra as ThunkExtra), api, entityAdapter)
    }
    return builder.query<ResultType, QueryArg>({
        ...definition,
        onCacheEntryAdded
    })
}
const mutation = <ResultType, QueryArg>(
    builder: EndpointBuilder<BaseQuery, TagTypes, ReducerPath>,
    definition: Parameters<typeof builder.mutation<ResultType, QueryArg>>[0]
) => {
    return builder.mutation<ResultType, QueryArg>(definition)
}
const cacheWrapper = {
    query,
    mutation
}

export {cacheWrapper}