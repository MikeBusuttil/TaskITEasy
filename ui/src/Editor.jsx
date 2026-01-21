
import MonacoEditor from '@monaco-editor/react'
import ReactDOM from 'react-dom/client'
import { useCallback, useEffect, useRef, useState, useMemo } from "react"
import Grip from "./images/grip.svg?react"
import Clear from "./images/clear.svg?react"
import EventEmitter from "eventemitter2"

const TaskActionLeft = ({ lineNumber, stateManager }) => {
  const [indentation, setIndentation] = useState(stateManager.indentations[lineNumber - 1])
  const [mouseLine, setMouseLine] = useState(null)

  const _setIndentation = useCallback((indentations) => setIndentation(indentations[lineNumber - 1]), [lineNumber])

  useEffect(() => {
    stateManager.on("indentations", _setIndentation)
    stateManager.on("mouseLine", setMouseLine)
    return () => {
      stateManager.off("indentations", _setIndentation)
      stateManager.off("mouseLine", setMouseLine)
    }
  }, [])

  return (
    <div 
      className="-left-[50px] absolute" 
      id={`grab-and-check-${lineNumber}`}
      onMouseMove={() => stateManager.emit("mouseLine", lineNumber)}
    >
      <div 
        className="flex flex-row group -top-[1px] relative"
        style={{ left: `${indentation * 16}px` }}
      >
        <Grip className={[
          "fill-gray-500 hover:cursor-move h-6 group-hover:visible z-10",
          mouseLine === lineNumber ? "visible" : "invisible"
        ].join(" ")} />
        <input 
          type="checkbox" 
          className="cursor-pointer z-10"
        />
      </div>
    </div>
  )
}

const TaskActionRight = ({ lineNumber, stateManager }) => {
  const [mouseLine, setMouseLine] = useState(null)

  useEffect(() => {
    stateManager.on("mouseLine", setMouseLine)
    return () => {
      stateManager.off("mouseLine", setMouseLine)
    }
  }, [])

  return (
    <div 
      className="-left-[50px] absolute" 
      id={`clear-${lineNumber}`}
      onMouseMove={() => stateManager.emit("mouseLine", lineNumber)}
    >
      <div className="flex flex-row group -top-[1px] left-[602px] relative">
        <button 
          className={[
            "hover:bg-gray-200 focus:bg-gray-200 dark:hover:bg-gray-800 dark:focus:bg-gray-800 object-cover rounded-full focus:outline-none z-10",
            mouseLine === lineNumber ? "visible" : "invisible"
          ].join(" ")}
          onClick={() => stateManager.deleteLine(lineNumber)}
        >
          <Clear className="fill-gray-500 h-6 p-1 z-10" />
        </button>
      </div>
    </div>
  )
}

class StateManager extends EventEmitter {
  indentations = []
  instance = null
  editor = null
  lines = 0
  text = ""

  // this.emit("deleteLine", lineNumber)

  _taskActionsLeft = (lineNumber, instance) => ({
    domNode: (function () {
      var domNode = document.createElement("div")
      const root = ReactDOM.createRoot(domNode)
      root.render(<TaskActionLeft lineNumber={lineNumber} stateManager={instance} />)
      return domNode;
    })(),
    getId: () => `task-action-left${lineNumber}`,
    getDomNode: function () { return this.domNode },
    getPosition: function () { return {position: {lineNumber, column: 1}, preference: [monaco.editor.ContentWidgetPositionPreference.EXACT]}},
  })
  _taskActionsRight = (lineNumber, instance) => ({
    domNode: (function () {
      var domNode = document.createElement("div")
      const root = ReactDOM.createRoot(domNode)
      root.render(<TaskActionRight lineNumber={lineNumber} stateManager={instance} />)
      return domNode;
    })(),
    getId: () => `task-action-right${lineNumber}`,
    getDomNode: function () { return this.domNode },
    getPosition: function () { return {position: {lineNumber, column: 1}, preference: [monaco.editor.ContentWidgetPositionPreference.EXACT]}},
  })

  addButton(lineNumber) {
    this.editor.addContentWidget(this._taskActionsLeft(lineNumber, this.instance))
    this.editor.addContentWidget(this._taskActionsRight(lineNumber, this.instance))
  }

  addButtons() {
    for (const lineNumber of [...Array(this.lines).keys()].map(l => l+1)) {
      this.addButton(lineNumber)
    }
  }

  deleteLine(lineNumber) {
    //TODO: fix this thing leaving a bunch of floating checkboxes at the end in some circumstances
    let newText = this.text.split("\n")
    let deleteLines = 1
    for (const indentation of this.indentations.slice(lineNumber)) {
      if (indentation > this.indentations[lineNumber - 1]) {
        deleteLines ++
      } else {
        break
      }
    }
    newText.splice(lineNumber-1, deleteLines)
    newText = newText.join("\n") + "\n"
    this.emit("text", newText)
    this.editor.focus()
  }
}

const stateManager = new StateManager()

const Editor = ({ tasks, dark }) => {
  const editorRef = useRef(null)
  // const [text, setText] = useState(tasks.map((t) => t.text).join("\n") + "\n")
  const [text, setText] = useState(`sup dude
  hey fam
    what is cracking in the hood?
    what you sayin
  any news
    from who
      idk
        I just work here
          got Steak hoe
            Got Beef
              Grade A hoe, not lean
            `)
  const [_modelContent, _setModelContent] = useState(text)
  const [previousCursorLine, setPreviousCursorLine] = useState(0)
  const [cursorPosition, _setCursorPosition] = useState({ position: {lineNumber: 1, column: 1}, source: "NA"})
  const [mouseLine, setMouseLine] = useState(null)
  const [actionButtons, setActionButtons] = useState(0)
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
  const stringifiedIndentations = useMemo(() => JSON.stringify(indentations), [indentations])
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
    stateManager.indentations = indentations
    stateManager.text = text
    stateManager.lines = lines
    stateManager.setMaxListeners(2*lines)
  }, [indentations, text, lines])

  // add or remove the buttons every time a line is added or removed
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    for (let lineNumber = actionButtons + 1; lineNumber <= lines; lineNumber++) {
      stateManager.addButton(lineNumber)
    }
    for (let lineNumber = actionButtons - 1; lineNumber >= lines; lineNumber--) {
      document.getElementById(`grab-and-check-${lineNumber+1}`).remove()
      document.getElementById(`clear-${lineNumber+1}`).remove()
    }
    setActionButtons(lines)
  }, [lines, actionButtons])

  // janky cursor snapping to beginning of line after indentations
  const ignoredCursorSources = new Set(["api", "tab", "outdent", "mouse"])
  const lineLength = useCallback((lineNumber) => text.split("\n")[lineNumber - 1].length, [text])
  const indentationLength = useCallback((lineNumber) => indentations[lineNumber - 1]*2, [indentations])
  useEffect(() => {
    const currentCursorPosition = `${cursorPosition.position.lineNumber},${cursorPosition.position.column}`
    let nextLineNumber = cursorPosition.position.lineNumber
    if(disallowedCursorPositions.has(currentCursorPosition)) {
      if (!ignoredCursorSources.has(cursorPosition.source)) {
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
      nextLineNumber = cursorPosition.position.lineNumber - (cursorPosition.position.lineNumber === previousCursorLine)
    }
    setPreviousCursorLine(nextLineNumber)
  }, [disallowedCursorPositions, cursorPosition, previousCursorLine, lineLength, indentationLength])

  function handleEditorDidMount(editor) {
    editorRef.current = editor
    setActionButtons(lines)
    stateManager.editor = editor
    stateManager.instance = stateManager
    stateManager.addButtons()
    
    editor.onMouseMove((e) => setMouseLine(e.target.position?.lineNumber))
    editor.onMouseLeave((e) => setMouseLine(null))
    editor.onDidChangeCursorPosition(_setCursorPosition)
    console.log("here are all the editor methods for reference:", editor)
  }

  useEffect(() => {
    stateManager.emit("indentations", JSON.parse(stringifiedIndentations))
  }, [stringifiedIndentations])
  useEffect(() => {
    stateManager.emit("mouseLine", mouseLine)
  }, [mouseLine])

  const setTextState = (text) => {
    _setModelContent(text)
    setText(text)
  }

  useEffect(() => {
    stateManager.on("text", setTextState)
  }, [])

  return (
    <div className="relative flex flex-col p-3 rounded-lg shadow-lg border w-[800px] mx-auto border-gray-300 dark:border-gray-700 dark:shadow-gray-700 dark:bg-[#1e1e1e]">
      <MonacoEditor
        height="300px"
        width="700px"
        theme={dark ? "vs-dark" : "light"}
        defaultValue={text}
        onMount={handleEditorDidMount}
        onChange={setTextState}
        value={_modelContent}
        options={{
          // Full list: https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IEditorOptions.html
          lineNumbers: "off",
          lineHeight: 1.6787,
          glyphMargin: false,
          tabSize: 2,
          guides: {indentation: false},
          minimap: {enabled: false},
          folding: true,
          wordWrap: "on",
          suggest: {
            showWords: false,
          },
        }}
      />
    </div>
  )
}

export default Editor
