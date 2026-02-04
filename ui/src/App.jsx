import { Outlet } from "react-router-dom"
import { useState } from "react"
import "./App.css"
import User from "./images/user.svg?react"
import Menu from "./images/hamburger.svg?react"
import Sun from "./images/sun.svg?react"
import Moon from "./images/moon.svg?react"
import Lock from "./images/lock.svg?react"
import Unlock from "./images/unlock.svg?react"
import Checkbox from "./images/checkbox.svg?react"
import Editor from './Editor'

let tasks = `- [ ] sup dude
  - [ ] hey fam
    - [ ] what is cracking in the hood?
    - [x] what you sayin
  - [ ] any news
    - [ ] from who
      - [ ] idk
        - [ ] I just work here
          - [ ] got Steak hoe
            - [ ] Got Beef
              - [x] Grade A hoe, not lean
                - [x] Go ahead and touch it
        - [ ] I don't think so
`

const IconHover = ({children, onClick=() => null, title}) => {
  return (
    <button onClick={onClick} className="object-cover m-2 rounded-full focus:outline-none hover:bg-gray-200 focus:bg-gray-200 dark:hover:bg-gray-800 dark:focus:bg-gray-800" title={title}>{children}</button>
  )
}

export default function App() {
  const [dark, setDark] = useState(true)
  const [locked, setLocked] = useState(true)
  const [showAll, setShowAll] = useState(true)

  return (
    <div className={["h-screen dark:bg-[#1e1e1e]", dark ? "dark" : ""].join(" ")}>
      <div className="flex flex-row h-12 w-full border-b border-gray-200 dark:border-gray-700 dark:bg-[#1e1e1e]">
        <IconHover>
          <Menu className="h-full p-2 fill-gray-500" />
        </IconHover>
        <div className="flex-grow" />
          <IconHover onClick={() => setShowAll(!showAll)} title={showAll ? "Hide completed tasks" : "Show completed tasks"}>
            <Checkbox className={["h-full p-2", showAll ? "fill-gray-500" : "dark:fill-gray-700 fill-gray-300"].join(" ")} />
          </IconHover>
          <IconHover onClick={() => setLocked(!locked)} title={locked ? "Uncouple tasks from their dependencies" : "Lock child tasks to their parents"}>
            { locked ? <Lock className="h-full p-2 fill-gray-500" /> : <Unlock className="h-full p-2 fill-gray-500" />}
          </IconHover>
          <IconHover onClick={() => setDark(!dark)} title={dark ? "Toggle light theme" : "Give yourself to the Dark Side"}>
            { dark ? <Moon className="h-full p-2 fill-gray-500" /> : <Sun className="h-full p-2 fill-gray-500" />}
          </IconHover>
          <IconHover>
            <User className="h-full p-2 fill-gray-500" onClick={() => console.log(document)} />
          </IconHover>
      </div>

      <div className="w-full pt-8 dark:bg-[#1e1e1e]">
        <Editor tasks={tasks} dark={dark} locked={locked} />
      </div>
      
      <Outlet />
    </div>
  )
}
