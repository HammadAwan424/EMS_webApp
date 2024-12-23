import express from "express"
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth, getFirestore } from "firebase-admin/auth"
import { docFromApiRes } from "./helper.js";
import cronjob from "./cronjob.js";

// ($env:production="true"; vercel dev) for production // ps
// ($env:debug="true"; vercel dev) for debug // ps


const app = express();

async function initialize() {
    // Selects private key from local file (private.js) instead of process.env.FIREBASE_PRIVATE_KEY if deubg == "true"
    if (process.env.debug == "true") {
        console.log("Debug Mode On");
        const privateJs = await import("./private.js");
        process.env.FIREBASE_PRIVATE_KEY = privateJs.FIREBASE_PRIVATE_KEY;
        process.env.CRON_SECRET = privateJs.CRON_SECRET
    } else {
        console.log("Debug Mode Off");
    }

    if (process.env.production == "true") {
        console.log("Firebase admin working in Production");

        const FIREBASE_PRIVATE_KEY = atob(process.env.FIREBASE_PRIVATE_KEY);
        const key = {
            type: "service_account",
            project_id: "uplifted-env-416417",
            private_key_id: "6099862d967bb32362701b06f67ff8cb70645bd0",
            private_key: FIREBASE_PRIVATE_KEY,
            client_email:
                "firebase-adminsdk-5k64x@uplifted-env-416417.iam.gserviceaccount.com",
            client_id: "105850253477777376987",
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url:
                "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url:
                "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-5k64x%40uplifted-env-416417.iam.gserviceaccount.com",
            universe_domain: "googleapis.com",
        };

        return initializeApp({
            credential: cert(key),
        });
    } else {
        console.log("Firebase admin working in Development");
        process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
        process.env.FIREBASE_AUTH_EMULATOR_HOST = " 127.0.0.1:9099";
        return initializeApp({ projectId: "uplifted-env-416417" });
    }
}

const firebaseApp = await initialize()
const firestore = getFirestore(firebaseApp)
const auth = getAuth(firebaseApp)
const firestoreUrl = process.env.production == "true" ?
    "https://firestore.googleapis.com/v1beta2/projects/uplifted-env-416417/databases/(default)/documents" :
    'http://localhost:8080/v1/projects/uplifted-env-416417/databases/(default)/documents'


// Daily cronjob
app.get("/api/cronjob/daily", (req, res) => cronjob(req, res, firestore))


// Handles deletion of classgroups through firebase REST api
app.delete("/api/classGroups/:id", async (req, res) => {
    const [bearerStr, token] = req.headers.authorization.split(" ")
    const id = req.params.id
    const docPath = `${firestoreUrl}/classGroups/${id}`

    let response;
    try {
        response = await fetch(docPath, {headers: 
            {Authorization : `Bearer ${token}`}
        })
    } catch {
        return res.send("Invalid Request")
    }
    let document;
    try {
        // custom function to convert api response to document
        // similar to what a client lib does
        document = await docFromApiRes(response)
    } catch (err) {
        res.send(err.message)
    }
    const {exists, data} = document
    if (!exists) {
        return res.send("No resource")
    }
    const batch = firestore.batch()
    for (let [key,value] of Object.entries(data.classes)) {
        batch.delete(firestore.doc(`classGroups/${id}/classes/${key}`))
    }
    for (let [classId, assignedTeachers] of Object.entries(data.editors)) {
        const toUpdate = {[`invitations.${classId}.status`]: false} 
        assignedTeachers.forEach(teacherId => batch.update(firestore.doc(`teachers/${teacherId}`), toUpdate))
    }
    batch.delete(firestore.doc(`classGroups/${id}`))
    await batch.commit()
    res.send("Success")
});


// Only works when debug=="true", production=="true" will make request to production db else local
// Can be used to fetch some doc and test DB connection (local or prod)
app.get("/api/testDB/:collection/:id", debugOnly, async (req, res) => {
    try {
        const document = await firestore.doc(`${req.params.collection}/${req.params.id}`).get()
        const data = await document.data()
        res.send(data)
    } catch (err) {
        res.send(err.message)
    }
}) 


// Test route for checking server response
app.get("/api/", (req, res) => {
    res.send('Server is responding')
})


// I was practicing regex in routes/endpoints
app.get("/api/check/:id(\\d+)", (req, res) => {
    res.send("helloo")
})


// Prevents endpoint from running in production
function debugOnly (req, res, next) {
    if (process.env.debug == "true") {
        next()
    } else {
        next('route')
    }
}


app.listen(3001, () => console.log("Server ready on port http://127.0.0.1:3001."));


export default app  