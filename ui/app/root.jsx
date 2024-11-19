import {
  Links,
  Meta,
  Outlet,
  Scripts,
} from "@remix-run/react";
import styles from "./tailwind.css?url";
export const links = () => [
  { rel: "stylesheet", href: styles },
];
import User from "./user.svg?react"
import Menu from "./hamburger.svg?react"

export default function App() {
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
      <body>
        <div className="flex flex-row h-12 w-full border-b border-gray-100 border-opacity-10">
          <div className="object-cover m-2 rounded-full hover:bg-gray-200 focus:bg-gray-200 focus:outline-none">
            <Menu className="h-full p-2 fill-gray-500" />
          </div>
          <div className="flex-grow"></div>
          <div className="object-cover m-2 rounded-full hover:bg-gray-200 focus:bg-gray-200 focus:outline-none">
            <User className="h-full p-2 fill-gray-500" />
          </div>
        </div>
        <h1 className="text-3xl font-bold underline">Hello our world!!👋</h1>
        <Outlet />

        <Scripts />
      </body>
    </html>
  );
}
