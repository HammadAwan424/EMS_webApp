import { firestore, auth } from "src/api/firebase/config.js";
import getStore from "./getStore.js";

export default getStore({firestore, auth})