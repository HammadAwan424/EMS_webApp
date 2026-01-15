# RTK Query Firestore Cache Wrapper

This utility adds the functionality of cache-synchronization to RTK Query endpoints for Firestore documents. It's strongly typed so works well with `ts`.

### Overview
It sets up firestore snapshot listeners and subscribes to rtk-query cache so when an `updateDoc` is requested, the cache entries are updated together which allows us to only fetch the document once, costing only a single DB read, even while reading the newer version.


## Supported Modes
- Single-document listeners
- Collection listeners, requires RTK Entity Adapters for standardization

## Example Usage

### 1. Single Document Listener
```ts
// listenerType: "single" mandates getDocRef attribute
const api = createApi({
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    getUser: cacheWrapper.query<User, string>(builder, {
      queryFn: async () => ({ data: {} as User }),
      listenerType: "single",
      getDocRef: (userId, extra) => 
        // getDocRef is typed, i.e., typeof userId == "string"
        // return type of converter should match User type
        doc(firestore, "users", userId).withConverter(convertsToUser) 
    }),
  }),
});
```


### 2. Multi Document Listener
```ts
const postsAdapter = createEntityAdapter<Post>();
// listenerType: "multi" mandates getQuery & entityAdapter fields
const api = createApi({
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    getPosts: cacheWrapper.query<EntityState<Post>, string>(builder, {
      queryFn: async () => ({
        data: postsAdapter.getInitialState(),
      }),
      listenerType: "multi", // "multi" allowed only when query return type is EntityState<YourType>
      entityAdapter: postsAdapter, // the entity adapter to set and remove documents
      getQuery: (userId, extra) =>
        query(collection(extra.firestore, "posts")) // assumes thunk extra is set up
        // the converter is called once for each document fetched
        // the converter must return objects of type Post
        .withConverter(convertToPost), 
    }),
  }),
});
```

