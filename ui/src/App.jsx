import { Outlet } from "react-router-dom"
import "./tailwind.css"
import User from "./user.svg?react"
import Menu from "./hamburger.svg?react"
import Sun from "./sun.svg?react"
import Moon from "./moon.svg?react"
import { useState } from "react"
import NoSSR from './.client/editor.client'

let tasks = [
  {id: 0, text: "sup dude"},
  {id: 1, text: "hey fam"},
  {id: 2, text: "what is cracking in the hood?"},
]

const IconHover = ({children, onClick=() => null}) => {
  return (
    <button onClick={onClick} className="object-cover m-2 rounded-full focus:outline-none hover:bg-gray-200 focus:bg-gray-200 dark:hover:bg-gray-800 dark:focus:bg-gray-800">{children}</button>
  )
}

export default function App() {
  const [dark, setDark] = useState(true)

  return (
    <html className={dark ? "dark" : ""}>
      <body className="h-screen dark:bg-[#1e1e1e]">
        <div className="flex flex-row h-12 w-full border-b border-gray-200 dark:border-gray-700 dark:bg-[#1e1e1e]">
          <IconHover>
            <Menu className="h-full p-2 fill-gray-500" />
          </IconHover>
          <div className="flex-grow"></div>
            <IconHover onClick={() => setDark(!dark)} dark={dark}>
              { dark ? <Moon className="h-full p-2 fill-gray-500" /> : <Sun className="h-full p-2 fill-gray-500" />}
            </IconHover>
            <IconHover>
              <User className="h-full p-2 fill-gray-500" onClick={() => console.log(document)} />
            </IconHover>
        </div>

        <div className="w-full pt-8 dark:bg-[#1e1e1e]">
          <NoSSR tasks={tasks} dark={dark} />
        </div>
        
        <Outlet />
      </body>
    </html>
  )
}
