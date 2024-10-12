import { useState, useRef } from "react";
import { Outlet, useNavigation } from "react-router-dom";

import {  IconMenu2  } from "src/IconsReexported.jsx";

import { useGetAuthQuery, useGetClassGroupsQuery, useGetUserQuery } from "src/api/apiSlice.js";
import { skipToken } from "@reduxjs/toolkit/query";
import Sidebar from "./Sidebar.jsx";
import { useDispatch, useSelector } from "react-redux";
import { getAllClassIds } from "src/api/userSlice.js";

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
    const {data: User, isFetching} = useGetUserQuery(shouldSkip)
    const {isFetching: loadingGroups} = useGetClassGroupsQuery(shouldSkip)
    const classIds = useSelector(getAllClassIds)


  // TODO: show skeleton UI
  if (isFetching || loadingGroups) {
    return <h1>We are fetching you document after auth</h1>
  }

    return (
      <>
      <div className="h-full" id='layout'>
        
        <div id="topbar" className="flex gap-1 p-2 sm:hidden bg-[--theme-secondary]">
          <IconMenu2 onMouseUp={openSidebar} />
          <span className="">Menu</span>
        </div>

        <Sidebar myRef={sidebarRef} />

        <div id="View" className="sm:pl-48 md:pl-60 h-full">
          <Outlet />
        </div>

      </div>
      </> 
    );
  }


