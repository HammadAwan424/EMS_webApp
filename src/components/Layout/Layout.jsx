import { useState, useRef } from "react";
import { Outlet, useNavigation } from "react-router-dom";

import {  IconMenu2  } from "src/IconsReexported.jsx";

import { useGetAuthQuery, useGetClassGroupsQuery, useGetUserQuery } from "src/api/apiSlice.js";
import { skipToken } from "@reduxjs/toolkit/query";
import Sidebar from "./Sidebar.jsx";
import { useDispatch } from "react-redux";
import { DetailedClassSkeletonUI } from "../Index/DetailedClass.jsx";

export default function RootLayout() {

  const navigation  = useNavigation()
  const sidebarRef = useRef(null)
  const dispatch = useDispatch()
  const [popupVisible, setPopupVisible] = useState(false)

  function openSidebar() {
    sidebarRef.current.classList.remove("max-sm:-translate-x-full")
    window.onmousedown = (e) => {
      if (e.clientX >= sidebarRef.current.getBoundingClientRect().right) {
        closeSidebar()
        window.onmousedown = null
      }
    }
  }

  function closeSidebar() {
    sidebarRef.current.classList.add("max-sm:-translate-x-full")
  }


  const {data: Auth} = useGetAuthQuery()
  const shouldSkip = Auth ? Auth.uid : skipToken
  const {data: User, isLoading: loadingUser} = useGetUserQuery(shouldSkip)
  const {isLoading: loadingGroups} = useGetClassGroupsQuery(shouldSkip)

  if (loadingGroups || loadingUser) {
    return <RootLayoutSkeletonUI />
  }

  return (
    <>
    <div className="h-full" id='layout'>
      
      <div id="topbar" className="flex gap-1 p-2 sm:hidden items-center">
        <IconMenu2 className="p-1 box-content" onMouseUp={openSidebar} />
        <span className="">Menu</span>
      </div>

      <hr />

      <Sidebar myRef={sidebarRef} />

      {/* Contains padding for sidebar */}
      <div id="View" className="sm:pl-48 md:pl-60 h-full">
        <div className="p-3 sm:px-4 sm:py-5">
          <Outlet />
        </div>
      </div>

    </div>
    </> 
  );
}

function RootLayoutSkeletonUI() {
  return(
    <>
    <div className="h-full" id='layout'>
      
      <div id="topbar" className="flex gap-1 p-2 sm:hidden bg-skeleton">
        <div className="w-24 h-6 bg-skeleton"></div>
      </div>

      <div id="sidebar" className="fixed overflow-auto top-0 transition z-50
          left-0 bottom-0 flex flex-col gap-2 px-8 md:px-4 py-10 max-sm:-translate-x-full max-sm:w-[calc(100vw-80px)] sm:w-48 md:w-60">
            <div className="h-8 bg-skeleton rounded-md"></div>
            <div className="h-8 bg-skeleton rounded-md"></div>
            <div className="h-8 bg-skeleton rounded-md"></div>
      </div>

      {/* Contains padding for sidebar */}
      <div id="View" className="sm:pl-48 md:pl-60 h-full">
        <div className="p-3 sm:p-2">
            <div className="bg-theme-600">
            <div className="flex flex-col py-4">
                <div className="flex justify-between items-center">
                    <div className="w-32 h-10 bg-skeleton rounded-sm"></div>
                    <div className="w-28 h-7 bg-skeleton rounded-sm"></div>
                </div>
                <div className="flex items-center justify-center">
                    <div className="w-32 h-8 bg-skeleton rounded-full"></div>
                </div>
            </div>

              <DetailedClassSkeletonUI />
            </div>
        </div>
      </div>

    </div>
    </> 
  )
}

export {RootLayoutSkeletonUI}
