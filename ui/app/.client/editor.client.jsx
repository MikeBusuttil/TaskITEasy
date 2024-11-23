
import Editor from '@monaco-editor/react'
import { useCallback, useEffect, useRef, useState, useMemo } from "react"
import Grip from "../grip.svg"
import Clear from "../clear.svg"

const NoSSR = ({ tasks, dark }) => {
  const editorRef = useRef(null)
  const [scrollPadding, setScrollPadding] = useState("3px")
  const [text, setText] = useState(tasks.map((t) => t.text).join("\n") + "\n")
  const [_modelContent, _setModelContent] = useState(text)
  const [previousCursorLine, setPreviousCursorLine] = useState(0)
  const [cursorPosition, _setCursorPosition] = useState({ position: {lineNumber: 1, column: 1}, source: "NA"})
  const lines = useMemo(() => (text.match(/\n/g)||[]).length, [text])
  const indentations = useMemo(() => {
    let indentations = [0]
    text.split("\n").map((line, lineNumber) => {
      if (!lineNumber) return
      const indentation = Math.floor(line.match(/^(  )*/g)[0].length / 2)
      indentations.push(Math.min(indentations.slice(-1)[0] + 1, indentation))
    })
    return indentations
  },[text])
  const disallowedCursorPositions = useMemo(() => {
    let disallowed = new Set()
    indentations.map((indentation, index) => {
      if (!indentation) return
      for (let col = 1; col <= 2*indentation; col++) {
        disallowed.add(`${index + 1},${col}`)
      }
    })
    return disallowed
  },[indentations])

  useEffect(() => {
    const lineNumbers = [...Array(lines).keys()].map(x => x+1)
    editorRef.current?.onMouseMove(function (e) {
      const lineNumber = e.target.position?.lineNumber
      if (!lineNumber) return
      let otherLines = new Set(lineNumbers)
      otherLines.delete(lineNumber)
      document.getElementById(`grab-and-check-${lineNumber}`)?.getElementsByTagName('svg')[0].classList.remove('invisible')
      document.getElementById(`grab-and-check-${lineNumber}`)?.getElementsByTagName('button')[0].classList.remove('invisible')
      for (const line of otherLines) {
        document.getElementById(`grab-and-check-${line}`)?.getElementsByTagName('svg')[0].classList.add('invisible')
        document.getElementById(`grab-and-check-${line}`)?.getElementsByTagName('button')[0].classList.add('invisible')
      }
    })
    editorRef.current?.onMouseLeave(function () {
      for (const line of lineNumbers) {
        document.getElementById(`grab-and-check-${line}`)?.getElementsByTagName('svg')[0].classList.add('invisible')
        document.getElementById(`grab-and-check-${line}`)?.getElementsByTagName('button')[0].classList.add('invisible')
      }
    })
  }, [lines])

  const deleteLineAndChildren = useCallback((lineNumber) => {
    let newText = text.split("\n")
    let deleteLines = 1
    for (const indentation of indentations.slice(lineNumber)) {
      if (indentation > indentations[lineNumber - 1]) {
        deleteLines ++
      } else {
        break
      }
    }
    newText.splice(lineNumber-1, deleteLines)
    newText = newText.join("\n")
    _setModelContent(newText)
    setText(newText)
  }, [text, indentations])

  const onmousemove = useCallback((lineNumber) => {
    const id = `grab-and-check-${lineNumber}`
    let otherIds = new Set([...Array(lines).keys()].map(x => `grab-and-check-${x+1}`))
    otherIds.delete(id)
    document.getElementById(id)?.getElementsByTagName('svg')[0].classList.remove('invisible')
    document.getElementById(id)?.getElementsByTagName('button')[0].classList.remove('invisible')
    for (const otherId of otherIds) {
      document.getElementById(otherId)?.getElementsByTagName('svg')[0].classList.add('invisible')
      document.getElementById(otherId)?.getElementsByTagName('button')[0].classList.add('invisible')
    }
  }, [lines])

  const onChange = useCallback((newValue, event) => {
    // console.log("event", event, "caused the new value of the code:")
    setText(newValue)
  }, [])

  const lineLength = useCallback((lineNumber) => text.split("\n")[lineNumber - 1].length, [text])
  const indentationLength = useCallback((lineNumber) => indentations[lineNumber - 1]*2, [indentations])
  useEffect(() => {
    const currentCursorPosition = `${cursorPosition.position.lineNumber},${cursorPosition.position.column}`
    if(disallowedCursorPositions.has(currentCursorPosition)) {
      editorRef.current?.setPosition(
        cursorPosition.position.lineNumber === previousCursorLine
          ? {
            column: lineLength(cursorPosition.position.lineNumber - 1) + 1,
            lineNumber: cursorPosition.position.lineNumber - 1,
          } : {
            column: indentationLength(cursorPosition.position.lineNumber) + 1,
            lineNumber: cursorPosition.position.lineNumber
          }
      )
    }
    setPreviousCursorLine(cursorPosition.position.lineNumber)
  }, [disallowedCursorPositions, cursorPosition, previousCursorLine, lineLength, indentationLength])

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor

    const lineNumbers = [...Array(lines).keys()].map(x => x+1)
    editor.onMouseMove(function (e) {
      const lineNumber = e.target.position?.lineNumber
      if (!lineNumber) return
      let otherLines = new Set(lineNumbers)
      otherLines.delete(lineNumber)
      document.getElementById(`grab-and-check-${lineNumber}`)?.getElementsByTagName('svg')[0].classList.remove('invisible')
      document.getElementById(`grab-and-check-${lineNumber}`)?.getElementsByTagName('button')[0].classList.remove('invisible')
      for (const line of otherLines) {
        document.getElementById(`grab-and-check-${line}`)?.getElementsByTagName('svg')[0].classList.add('invisible')
        document.getElementById(`grab-and-check-${line}`)?.getElementsByTagName('button')[0].classList.add('invisible')
      }
    })
    editor.onMouseLeave(function () {
      for (const line of lineNumbers) {
        document.getElementById(`grab-and-check-${line}`)?.getElementsByTagName('svg')[0].classList.add('invisible')
        document.getElementById(`grab-and-check-${line}`)?.getElementsByTagName('button')[0].classList.add('invisible')
      }
    })
    editor.onDidScrollChange((e)=>setScrollPadding(`${-e.scrollTop - 3}px`))
    editor.onDidChangeCursorPosition(_setCursorPosition)
  }

  return (
    <div className={`relative flex flex-col p-3 rounded-lg shadow-lg border ${ dark ? "border-gray-700 shadow-gray-700 bg-[#1e1e1e]" : "border-gray-300"} w-1/2 mx-auto`}>
      <div className='absolute flex flex-col mt-[2px] w-full overflow-hidden'>
        {[...Array(lines).keys()].map((n) => (
          <div
            className="flex flex-row group relative"
            key={n+1}
            id={`grab-and-check-${n+1}`}
            onMouseMove={() => onmousemove(n+1)}
            style={{top: scrollPadding, marginLeft: `${36 + indentations[n]*15}px`}}
          >
            <Grip className="fill-gray-500 hover:cursor-move h-6 invisible group-hover:visible z-10"/>
            <input type="checkbox" className="cursor-pointer z-10 " />
            <div className="flex flex-grow"></div>
            <button className={[
                "object-cover rounded-full focus:outline-none z-10 mr-28",
                dark ? "hover:bg-gray-800 focus:bg-gray-800" : "hover:bg-gray-200 focus:bg-gray-200",
                "invisible group-hover:visible",
              ].join(" ")}
              onClick={() => deleteLineAndChildren(n+1)}
            >
              <Clear className="fill-gray-500 h-6 p-1"/>
            </button>
          </div>
          ))}
      </div>
      <Editor
        height="300px"
        theme={dark ? "vs-dark" : "light"}
        defaultValue={text}
        onMount={handleEditorDidMount}
        onChange={onChange}
        value={_modelContent}
        options={{
          lineNumbers:() => null,
          lineHeight: 1.6787,
          glyphMargin: true,
          tabSize: 2,
          guides: {indentation: false},
        }}
      />
    </div>
  )
}

export default NoSSR
