import { useState, useRef } from "react";
import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { Link, useLoaderData, Form, NavLink, useNavigation, useSubmit } from "react-router-dom";
import { IconMenu2 } from '@tabler/icons-react';
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "src/firebase/config.js";
import CreatePrompt from "../reusableComponents/CreatePopup.jsx";
import { createClassGroupLink } from "src/api/Utility.js";


export default function RootLayout() {

  const navigation  = useNavigation()
  const sidebarRef = useRef()
  const [popupVisible, setPopupVisible] = useState(false)
  const [reRender, setRerender] = useState(1)

  function rerender() {
    setRerender(reRender+1)
  }

    function openSidebar() {
      sidebarRef.current.classList.remove("max-sm:-translate-x-full")
      
      window.onmousedown = (e) => {
        if (e.clientX >= sidebarRef.current.getBoundingClientRect().right) {
          sidebarRef.current.classList.add("max-sm:-translate-x-full")
          console.log("window event is also called")
          window.onmousedown = null
        }
      }
    }

    return (
      <>
      <div className="h-full" id='layout'>
        
        <div id="topbar" className="flex gap-1 p-2 sm:hidden bg-[--theme-secondary]">
          <IconMenu2 onMouseUp={openSidebar} />
          <span className="">Menu</span>
        </div>

        <div ref={sidebarRef} id="sidebar" className="fixed overflow-auto top-0 transition items-start
          left-0 bottom-0 flex flex-col gap-2 px-8 py-10 max-sm:-translate-x-full max-sm:w-[calc(100vw-80px)] sm:w-48 md:w-60">
          <Link to={createClassGroupLink()}>Create</Link>
          {auth.currentUser ? <button onClick={() => signOut(auth)}>Sign out</button> : <Link to="/login"><button>Sign in</button></Link>}
          <Link to='/home'>GOtoheome</Link>
        </div>

        { navigation.state == "loading" ?
          <h1>Loading...</h1> :
          <div className="sm:pl-48 md:pl-60 h-full">
            <Outlet />
            <CreatePrompt popupVisible={popupVisible} setPopupVisible={setPopupVisible} rerender={rerender} />
          </div>
        }

      </div>
      </> 
    );
  }


function SidebarItems({n}) {
  let total = []
  for (let i = 0; i < n; i++) {
    total.push(<div key={i}>{i} for Sidebar</div>)
  }
  return total
}
function OuterItems({n}) {
  let total = []
  for (let i = 0; i < n; i++) {
    total.push(<div key={i}>{i} for Sidebar</div>)
  }
  return total
}