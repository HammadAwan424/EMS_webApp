import { addDoc, arrayUnion, collection, deleteField, doc, getDoc, getDocs, runTransaction, setDoc, updateDoc, where, writeBatch, WriteBatch } from "firebase/firestore"
import { Form, json, useActionData, useAsyncError, useFetcher, useLoaderData, useLocation, useOutletContext, useParams, useSubmit } from "react-router-dom"
import { auth, firestore } from "src/firebase/config"
import { IconCirclePlus, IconEdit, IconAlertCircle, IconCircleMinus, IconLayoutNavbarExpand, IconSquareArrowDown, IconX, IconCircleArrowDown, IconCircleArrowDownFilled, IconCircleArrowUpFilled, IconH1, IconBadgeSdFilled, IconMinus, IconPolygon } from "@tabler/icons-react" 
import { useEffect, useId, useReducer, useRef, useState } from "react"
import dot from "dot-object"
import { connectAuthEmulator } from "firebase/auth"
import { serverTimestamp } from "firebase/firestore"
import { query } from "firebase/firestore"
import { getClassById, getClassGroupById, getPublicTeacherByEmail } from "src/api/Teacher"
import { apiSlice, useEditClassGroupMutation, useEditClassMutation, useGetAuthQuery, useGetClassByIdQuery, useGetClassGroupsQuery } from "src/api/apiSlice"
import store from "src/app/store"
import { skipToken } from "@reduxjs/toolkit/query"
import { produce } from "immer"
import { useImmerReducer } from "use-immer"
import isEqual from "lodash.isequal"
import classNames from "classnames"
import { flatten } from "flat"
import Button from "../CommonUI/Button"
import ClassEdit from "./ClassEdit"


async function editLoader({request, params}) {
    // const promise = store.dispatch(apiSlice.endpoints.getAuth.initiate())
    // promise.unsubscribe()
    // const {data: Auth} = await promise
    // if (Auth) {
    //     const promise = store.dispatch(apiSlice.endpoints.getClassGroups.initiate(Auth.uid))
    //     promise.unsubscribe()
    // }
    return "Common Data"
}

async function editAction({request, params}) {
    return "Edit Loader"
}













export {editAction, editLoader}