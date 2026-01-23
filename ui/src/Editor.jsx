
import { useCallback, useEffect, useRef, useState, useMemo } from "react"
import MonacoEditor from '@monaco-editor/react'
import EventEmitter from "eventemitter2"
import ReactDOM from 'react-dom/client'

import { logAllProps, reorder } from "./utils"
import Grip from "./images/grip.svg?react"
import Clear from "./images/clear.svg?react"

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
      draggable
      onDragStart={(event) => stateManager.onDragStart(lineNumber, event)}
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
  _dragListener = null
  _dragStart = { row: null, col: null, x: null, y: null }
  _dragLines = []
  instance = null
  editor = null
  lines = 0
  text = ""

  _spawnWidget = (lineNumber, instance, title) => ({
    domNode: (function () {
      var domNode = document.createElement("div")
      const root = ReactDOM.createRoot(domNode)
      const Component = title === 'left' ? TaskActionLeft : TaskActionRight
      root.render(<Component lineNumber={lineNumber} stateManager={instance} />)
      return domNode;
    })(),
    getId: () => `task-action-${title}${lineNumber}`,
    getDomNode: function () { return this.domNode },
    getPosition: function () { return {position: {lineNumber, column: 1}, preference: [monaco.editor.ContentWidgetPositionPreference.EXACT]}},
    allowEditorOverflow: title === 'left',
  })

  addButton(lineNumber) {
    this.editor.addContentWidget(this._spawnWidget(lineNumber, this.instance, 'left'))
    this.editor.addContentWidget(this._spawnWidget(lineNumber, this.instance, 'right'))
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

  _attemptReOrder(targetLineNumber, originalLineNumber) {
    if (!targetLineNumber || targetLineNumber === this._dragStart.row) return
    this.emit("mouseLine", targetLineNumber)
    //TODO: multi-line
    const lines = reorder({
      items: this._dragLines,
      startIndex: this._dragStart.row - 1,
      destIndex: targetLineNumber - 1,
    })
    //TODO: if indentation is > what's allowed here, trim those spaces... do that for all lines
    this._dragStart.row = targetLineNumber
    this.emit("text", lines.join("\n"))
  }

  _attemptIndent(newPos, lineIndex) {
    const dX = this._dragStart.col > 2 ? newPos.col - this._dragStart.col : Math.round((newPos.x - this._dragStart.x) / 9)
    if (isNaN(dX) || Math.abs(dX) < 2 || !newPos.col) return
    const atMaxIndentation = !lineIndex || this.indentations[lineIndex] > this.indentations[lineIndex - 1]
    if (dX > 2 && atMaxIndentation) return
    const lines = this.text.split("\n")
    const originalSpaces = 2 * this.indentations[lineIndex]
    lines[lineIndex] = lines[lineIndex].slice(originalSpaces)
    let spaces = Math.max(originalSpaces + dX, 0)
    spaces = Math.min(spaces - spaces%2, 2*(this.indentations[lineIndex - 1] + 1))
    lines[lineIndex] = " ".repeat(spaces) + lines[lineIndex]
    this._dragStart.col = Math.max(spaces - 4, 0)
    this._dragStart.x = newPos.x
    this.emit("text", lines.join("\n"))
  }

  _onDrag = (lineNumber, de) => {
    const target = this.editor.getTargetAtClientPoint(de.clientX, de.clientY)
    // console.log(`Dragging line ${lineNumber} — editor position: line ${target?.position?.lineNumber}, clamped column ${target?.position?.column}, mouse column ${target?.mouseColumn}`)
    // console.log(`Browser window mouse position: ${de.clientX}, ${de.clientY}`)
    this._attemptReOrder(target?.position?.lineNumber, lineNumber)
    this._attemptIndent({ x: de.clientX, col: target?.mouseColumn }, this._dragStart.row - 1)
  }

  _offDrag = (lineNumber) => {
    // console.log(`dragend on line ${lineNumber} — stopping logging`)
    document.removeEventListener('dragover', this._dragListener)
    this._dragListener = null
    this._dragStart = { row: null, col: null, x: null, y: null }
  }

  onDragStart = (lineNumber, e) => {
    const target = this.editor.getTargetAtClientPoint(e.clientX, e.clientY)
    this._dragStart = { row: lineNumber, col: target?.mouseColumn || target?.position?.column, x: e.clientX, y: e.clientY }
    this._dragLines = this.text.split("\n")
    // console.log(`dragstart on line ${lineNumber}`, this._dragStart)
    this._dragListener = this._onDrag.bind(this, lineNumber)
    document.addEventListener('dragover', this._dragListener)
    document.addEventListener('dragend', this._offDrag.bind(this, lineNumber), { once: true })
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
  const lines = useMemo(() => (text.match(/\n/g)||[]).length + 1, [text])
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
    return
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
    logAllProps(editor)
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
    return () => stateManager.off("text", setTextState)
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
          lineHeight: 25,
          glyphMargin: false,
          tabSize: 2,
          guides: {indentation: false},
          minimap: {enabled: false},
          folding: true,
          wordWrap: "on",
          lineDecorationsWidth: 50,
          suggest: {
            showWords: false,
          },
          stickyScroll: {
            enabled: false,
          },
        }}
      />
    </div>
  )
}

export default Editor
