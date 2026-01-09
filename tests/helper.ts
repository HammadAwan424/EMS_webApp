import { initializeTestEnvironment } from "@firebase/rules-unit-testing"
import { readFileSync } from "fs"
import { resolve } from "path"

async function getEnv() {
    let env = await initializeTestEnvironment({
        projectId: "uplifted-env-416417",
        firestore: {
            host: "127.0.0.1",
            port: 8080,
            rules: readFileSync(resolve(__dirname, "../storage.rules"), "utf-8")
        }
    })
    await env.clearFirestore()
    return env
}

export { getEnv }