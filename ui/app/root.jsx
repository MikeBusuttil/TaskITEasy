import {
  Links,
  Meta,
  Outlet,
  Scripts,
} from "@remix-run/react"
import styles from "./tailwind.css?url"
export const links = () => [
  { rel: "stylesheet", href: styles },
]
import User from "./user.svg"
import Menu from "./hamburger.svg"
import Sun from "./sun.svg"
import Moon from "./moon.svg"
import Grip from "./grip.svg"
import Clear from "./clear.svg"
import { useState } from "react"

const IconHover = ({children, dark, onClick=() => null}) => {
  return (
    <button onClick={onClick} className={`object-cover m-2 rounded-full focus:outline-none ${ dark ? "hover:bg-gray-800 focus:bg-gray-800" : "hover:bg-gray-200 focus:bg-gray-200"}`}>{children}</button>
  )
}

const Task = ({text, dark}) => {
  return (
    <div className="flex flex-row pb-1 group">
      <Grip className="fill-gray-500 hover:cursor-move h-6 invisible group-hover:visible" />
      <input type="checkbox" />
      <p className={dark ? "text-gray-400" : ""}>{text}</p>
      <div className="flex-grow"></div>

      <button className={[
        "object-cover rounded-full focus:outline-none",
        dark ? "hover:bg-gray-800 focus:bg-gray-800" : "hover:bg-gray-200 focus:bg-gray-200",
        "invisible group-hover:visible",
      ].join(" ")}>
        <Clear className="fill-gray-500 h-6 p-1"/>
      </button>
      
    </div>
  )
}

export default function App() {
  const [dark, setDark] = useState(true)

  return (
    <html>
      <head>
        <link
          rel="icon"
          href="data:image/x-icon;base64,AA"
        />
        <Meta />
        <Links />
      </head>
      <body className={dark ? "bg-black" : "bg-white"}>
        <div className={`flex flex-row h-12 w-full border-b ${ dark ? "border-gray-700" : "border-gray-200"}`}>
          <IconHover dark={dark}>
            <Menu className="h-full p-2 fill-gray-500" />
          </IconHover>
          <div className="flex-grow"></div>
            { dark ?
              <IconHover onClick={() => setDark(!dark)} dark={dark}><Moon className="h-full p-2 fill-gray-500" /></IconHover> :
              <IconHover onClick={() => setDark(!dark)} dark={dark}><Sun className="h-full p-2 fill-gray-500" /></IconHover>
            }
            <IconHover dark={dark}>
              <User className="h-full p-2 fill-gray-500" />
            </IconHover>
        </div>
        
        <div className={`flex flex-col mt-4 p-3 rounded-lg shadow-lg border ${ dark ? "border-gray-700 shadow-gray-700" : "border-gray-300"} w-1/2 mx-auto`}>
          <Task dark={dark} text="sup dude" />
          <Task dark={dark} text="hey fam" />
          <Task dark={dark} text="what is cracking in the hood?" />
        </div>
        <Outlet />

        <Scripts />
      </body>
    </html>
  )
}
