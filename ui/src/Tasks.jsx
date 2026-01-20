
import Editor from '@monaco-editor/react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { useCallback, useEffect, useRef, useState, useMemo } from "react"
import { usePureCallback } from "./usePureCallback"
import Grip from "./grip.svg?react"
import Clear from "./clear.svg?react"
import EventEmitter from "eventemitter2"

const TaskActionLeft = ({ lineNumber, indentation, onmousemove }) => {
  return (
    <div 
      className="-left-[50px] absolute" 
      id={`grab-and-check-${lineNumber}`}
      onMouseMove={onmousemove}
    >
      <div 
        className="flex flex-row group -top-[1px] relative"
        style={{ left: `${indentation * 16}px` }}
      >
        <Grip className="fill-gray-500 hover:cursor-move h-6 invisible group-hover:visible z-10" />
        <input 
          type="checkbox" 
          className="cursor-pointer z-10"
        />
      </div>
    </div>
  )
}

const TaskActionRight = ({ lineNumber, onmousemove, onclick }) => {
  return (
    <div 
      className="-left-[50px] absolute" 
      id={`clear-${lineNumber}`}
      onMouseMove={onmousemove}
    >
      <div className="flex flex-row group -top-[1px] left-[602px] relative">
        <button 
          className="hover:bg-gray-200 focus:bg-gray-200 dark:hover:bg-gray-800 dark:focus:bg-gray-800 object-cover rounded-full focus:outline-none z-10 invisible group-hover:visible"
          onClick={onclick}
        >
          <Clear className="fill-gray-500 h-6 p-1 z-10" />
        </button>
      </div>
    </div>
  )
}

class StateManager extends EventEmitter {
  indentations = []
  editor = null
  lines = 0
  text = ""

  // this.emit("deleteLine", lineNumber)

  _onmousemove (lineNumber) {
    let otherLineNumbers = new Set([...Array(this.lines).keys()].map(l => l+1))
    otherLineNumbers.delete(lineNumber)
    document.getElementById(`grab-and-check-${lineNumber}`)?.getElementsByTagName('svg')[0].classList.remove('invisible')
    document.getElementById(`clear-${lineNumber}`)?.getElementsByTagName('button')[0].classList.remove('invisible')
    for (const otherLineNumber of otherLineNumbers) {
      document.getElementById(`grab-and-check-${otherLineNumber}`)?.getElementsByTagName('svg')[0].classList.add('invisible')
      document.getElementById(`clear-${otherLineNumber}`)?.getElementsByTagName('button')[0].classList.add('invisible')
    }
  }

  _taskActionsLeft = (lineNumber, indentation, onmousemove) => ({
    domNode: (function () {
      var domNode = document.createElement("div")
      const root = ReactDOM.createRoot(domNode)
      root.render(<TaskActionLeft lineNumber={lineNumber} indentation={indentation} onmousemove={onmousemove} />)
      return domNode;
    })(),
    getId: () => `task-action-left${lineNumber}`,
    getDomNode: function () { return this.domNode },
    getPosition: function () { return {position: {lineNumber, column: 1}, preference: [monaco.editor.ContentWidgetPositionPreference.EXACT]}},
  })
  _taskActionsRight = (lineNumber, onmousemove, onclick) => ({
    domNode: (function () {
      var domNode = document.createElement("div")
      const root = ReactDOM.createRoot(domNode)
      root.render(<TaskActionRight lineNumber={lineNumber} onmousemove={onmousemove} onclick={onclick} />)
      return domNode;
    })(),
    getId: () => `task-action-right${lineNumber}`,
    getDomNode: function () { return this.domNode },
    getPosition: function () { return {position: {lineNumber, column: 1}, preference: [monaco.editor.ContentWidgetPositionPreference.EXACT]}},
  })

  addButton(lineNumber) {
    const onmousemove = () => this._onmousemove(lineNumber)
    const onclick = () => this.deleteLine(lineNumber)
    this.editor.addContentWidget(this._taskActionsLeft(lineNumber, this.indentations[lineNumber-1], onmousemove))
    this.editor.addContentWidget(this._taskActionsRight(lineNumber, onmousemove, onclick))
  }

  addButtons() {
    for (const lineNumber of [...Array(this.lines).keys()].map(l => l+1)) {
      console.log("adding button", lineNumber)
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

const Tasks = ({ tasks, dark }) => {
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
  }, [indentations, text, lines])

  const onEditorMouseMove = usePureCallback((e) => {
    const lineNumbers = [...Array(lines).keys()].map(x => x+1)
    const lineNumber = e.target.position?.lineNumber
    if (!lineNumber) return
    //TODO: improve performance by only continuing if the lineNumber changes
    let otherLines = new Set(lineNumbers)
    otherLines.delete(lineNumber)
    document.getElementById(`grab-and-check-${lineNumber}`)?.getElementsByTagName('svg')[0].classList.remove('invisible')
    document.getElementById(`clear-${lineNumber}`)?.getElementsByTagName('button')[0].classList.remove('invisible')
    for (const line of otherLines) {
      document.getElementById(`grab-and-check-${line}`)?.getElementsByTagName('svg')[0].classList.add('invisible')
      document.getElementById(`clear-${line}`)?.getElementsByTagName('button')[0].classList.add('invisible')
    }
  })

  const onMouseLeave = usePureCallback(() => {
    const lineNumbers = [...Array(lines).keys()].map(x => x+1)
    for (const line of lineNumbers) {
      document.getElementById(`grab-and-check-${line}`)?.getElementsByTagName('svg')[0].classList.add('invisible')
      document.getElementById(`clear-${line}`)?.getElementsByTagName('button')[0].classList.add('invisible')
    }
  })

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

  useEffect(() => {
    const indentations = JSON.parse(stringifiedIndentations)
    indentations.map((indentation, index) => {
      const lineNumber = index + 1
      if (document.getElementById(`grab-and-check-${lineNumber}`)) {
        document.getElementById(`grab-and-check-${lineNumber}`).children[0].style = `left: ${indentation*16}px`
      }
    })
  }, [stringifiedIndentations])

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
    stateManager.addButtons()
    
    editor.onMouseMove(onEditorMouseMove)
    editor.onMouseLeave(onMouseLeave)
    editor.onDidChangeCursorPosition(_setCursorPosition)
    console.log("here are all the editor methods for reference:", editor)
  }

  const setTextState = (text) => {
    _setModelContent(text)
    setText(text)
  }

  useEffect(() => {
    stateManager.on("text", setTextState)
  }, [])

  return (
    <div className="relative flex flex-col p-3 rounded-lg shadow-lg border w-[800px] mx-auto border-gray-300 dark:border-gray-700 dark:shadow-gray-700 dark:bg-[#1e1e1e]">
      <Editor
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

export default Tasks
