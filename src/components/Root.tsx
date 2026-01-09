import { Outlet } from "react-router-dom";
import store from "src/api/redux/store.ts";
import { extendedApi, useGetAuthQuery } from "src/api/rtk-query/extendedApi.ts";
import { Popup } from "./CommonUI/Popup.jsx";
import { AsyncNoOp } from "#src/api/util/Utility.ts";



export const RootLoader: AsyncNoOp = async () => {
    const promise = store.dispatch(extendedApi.endpoints.getAuth.initiate())
    promise.unsubscribe()
    const {data: Auth} = await promise

    if (Auth) {
        const userDoc = store.dispatch(extendedApi.endpoints.getUser.initiate(Auth.uid))
        const classGroups = store.dispatch(extendedApi.endpoints.getClassGroups.initiate(Auth.uid))
        classGroups.unsubscribe()
        userDoc.unsubscribe()
    }
    return ""
}

export default function Root() {
    const { isSuccess } = useGetAuthQuery()

    return (
        <>
        {isSuccess ? (
            <>
                <Outlet />
                <Popup />
            </>
        ) : null}
        </>
    )
}



