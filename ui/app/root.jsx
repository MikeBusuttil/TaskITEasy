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
import { useState } from "react"
import { ClientOnly } from 'remix-utils/client-only'
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
      <head>
        <link
          rel="icon"
          href="data:image/x-icon;base64,AA"
        />
        <Meta />
        <Links />
      </head>
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
          <ClientOnly fallback={<p>Loading...</p>}>{() => <NoSSR tasks={tasks} dark={dark} />}</ClientOnly>
        </div>
        
        <Outlet />

        <Scripts />
      </body>
    </html>
  )
}
