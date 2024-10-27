import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, memoryLocalCache, persistentLocalCache } from "firebase/firestore"
import { connectAuthEmulator } from "firebase/auth";
import { connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDtvloUqVjVfgMxKfYR0EGMGza1yBIl4dk",
    authDomain: "uplifted-env-416417.firebaseapp.com",
    projectId: "uplifted-env-416417",
    storageBucket: "uplifted-env-416417.appspot.com",
    messagingSenderId: "436927138832",
    appId: "1:436927138832:web:dc3f7b9e45193072b40e95",
    measurementId: "G-MR9LXWNB8V"
};

const firebaseApp = initializeApp(firebaseConfig)
const auth = getAuth(firebaseApp)
const firestore = initializeFirestore(firebaseApp, {})

console.log("// config.js -> process.env.production is: ", production)
if (production != "true") {
    console.log("Firebase WebSdk working in Development")
    connectAuthEmulator(auth, 'http://192.168.88.240:9099')
    // connectAuthEmulator(auth, 'http://127.0.0.1:9099')
    connectFirestoreEmulator(firestore, "192.168.88.240", 8080)
} else {
    console.log("Firebase WebSdk working in Production")
}


export { auth, firestore }