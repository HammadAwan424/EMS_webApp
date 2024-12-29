# Attend It
A **react-redux** app using **firebase** for teachers to maintain record of their students stats and allow collaborative work by creating groups. Deployed on **vercel**, [live preview here](https://attendit.vercel.app).

#### Video Demo: https://youtu.be/HzMAjw2V8t8

# Usage

It has following main sections from usage perspective:
- ClassGroups/Classes
- Invitations
- Attendance

Each authenticated person can create classgroups and add classes to each of them as desired. A class can have students and an assigned teacher by the group-admin through invitation. There will be a daily prompt to set attendance. Once set, can be updated up until that day.

# Cool things (I did)

- __The whole invitation system is built using firebase security rules,__ see [here](./storage.rules#L19) and [here](./storage.rules#L132). Summary - From someone sending an invitation to accepting it, revoking access to deleting the class itself blah blah, everything, just SECURITY RULES!
- For little document updates and read, __I set up a cronjob on vercel__ that runs at 00:00 (midnight) of utc +05:00 that takes a daily doc (which records frequent updates) and applies those changes to a monthly summary doc. 
- [Leveraged __firestore REST api__](./server/api/index.js#L68) to transfer client request received at backend directly to firestore by passing __Bearer Token__ to it. These requests mutate database so instead of two round trips (one for authentication), it only costs one (without doing any authentication). The security rules do the authentication and if valid, allows mutation. EVERYTHING ON FIREBASE. 
- A [cool security rule](./storage.rules#L208) which only allows updating attendance until midnight of the day of setting it irrespective of time. Currently only for utc +05:00 :( but not so difficult allowing admin to set it :)
- __Even learnt svg__ and created [some icons manually](./src/components/CommonUI/Icons.jsx). Arcs were a little bit difficult.
- Implemented pagination for infinite loading (for earlier attendances) using a [hard-coded carousal/track](./src/components/Index/ImprovedTrack.jsx). And in __rtk-query__, implemented [fallback mechanism to return most recent successful result](./src/api/rtk-query/attendance.js#L74) when query returns empty result.

# Tools Used
__React__ is the very first thing to mention alongside __tailwind__, then __Redux__ and __rtk-query__ (mostly) to manage firebase docs efficiently (caching). __Firebase__ for authentication and DB. __React-router__ for client-side routing. __Jest__ for writing tests.

# File structure
<pre>
server  
    |-- api
        |-- cronjob
        |-- **
src  
    |-- api
        |-- rtk-query -> **
        |-- rtk-helpers -> **
        |-- **

    |-- components
        |-- **
tests
    |--- **
</pre>
Note: *A lot of files are omitted as it would be tedious, and a useless task.*
- __server__ -> cloud-functions (only one) and cronjob.
- __components__ -> all the react code.
- __rtk-helpers__ -> pure functions to interact with firebase, pure because they take firebase instance as arg which made it easier to write tests.
- __rtk-query__ -> code that link rtk-helpers with prod firebase instance and rtk-query for managing client-side requests.
- __tests__ -> tests for firebase security rules and rtk-helpers using _jest_.

# Optimizations - TODO
- A fallback mechanism to return most recent available data (backward) or very next available data (forward) when the searched day is empty. It is implemented at database level but it is missing UI.
- Deleting classes is also missing user interface but security rules and rtk-helpers are available.
- Deleting classgroups which is done through cloud-function (deployed on vercel) is fully defined at server level but it is missing front-end api call. 
- Allow assigning multiple teachers to a class.