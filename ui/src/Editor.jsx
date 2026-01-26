
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
  _indentationsNextCursor = null
  _dragListener = null
  _dragPrevious = { line: null, spaces: null } // last executed drag mutation
  _dragStart = { x: null, y: null } // cursor position when dragging started
  _dragLines = [] // lines when dragging started
  _dragIndentations = [] // indentations when dragging started
  instance = null
  editor = null
  locked = true
  lines = 0
  text = ""

  constructor() {
    super()
    this.on("indentations", this._onIndentations)
  }

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

  _onIndentations(indentations) {
    if (!this.editor || this._indentationsNextCursor) {
      this.indentations = indentations
      this.editor?.setPosition(this._indentationsNextCursor)
      this._indentationsNextCursor = null
      return
    }
    if (!this.locked || this._dragListener || this.editor?.getSelection()?.startLineNumber !== this.editor?.getSelection()?.endLineNumber) return this.indentations = indentations
    for (let lineIndex = 0; lineIndex < indentations.length; lineIndex++) {
      if (indentations[lineIndex] === this.indentations[lineIndex]) continue
      this._indentationsNextCursor = this.editor.getPosition()
      let lines = this.text.split("\n")
      lines = this._indent({
        lines,
        lineNumber: lineIndex + 2,
        count: this._countChildLines(lineIndex + 1),
        spaces: 2*indentations[lineIndex],
        originalParentSpaces: 2 * this.indentations[lineIndex],
      })
      this.indentations = indentations
      this.emit("text", lines.join("\n"))
      break
    }
  }

  _countChildLines(lineNumber) {
    let childLines = 0
    for (const indentation of this.indentations.slice(lineNumber)) {
      if (indentation > this.indentations[lineNumber - 1]) {
        childLines ++
      } else {
        break
      }
    }
    return childLines
  }

  deleteLine(lineNumber) {
    //TODO: fix this thing leaving a bunch of floating checkboxes at the end in some circumstances
    let newText = this.text.split("\n")
    newText.splice(lineNumber-1, this._countChildLines(lineNumber) + 1)
    newText = newText.join("\n") + "\n"
    this.emit("text", newText)
    this.editor.focus()
  }

  onDragStart = (lineNumber, e) => {
    const target = this.editor.getTargetAtClientPoint(e.clientX, e.clientY)
    const spaces = 2 * this.indentations[lineNumber - 1]
    this._dragStart = { x: e.clientX, y: e.clientY }
    this._dragPrevious = { line: lineNumber, spaces }
    this._dragLines = this.text.split("\n")
    this._dragIndentations = [...this.indentations]
    const childLines = this.locked ? this._countChildLines(lineNumber) : 0
    // console.log(`dragstart on line ${lineNumber}`, this._dragStart)
    this._dragListener = this._onDrag.bind(this, lineNumber, childLines)
    document.addEventListener('dragover', this._dragListener)
    document.addEventListener('dragend', this._offDrag.bind(this, lineNumber), { once: true })
  }

  _getMaxLeadingSpaces({srcLine, dstLine, count}) {
    if (dstLine === 1) return 0
    if (dstLine <= srcLine) {
      return 2*(this._dragIndentations[dstLine - 2] + 1)
    }
    if (dstLine + count - 2 > this._dragIndentations.length) {
      return 2*(this._dragIndentations.slice(-2)[0] + 1)
    }
    return 2*(this._dragIndentations[dstLine + count - 2] + 1)
  }

  _buildMutation(de, lineNumber, childLines) {
    const target = this.editor.getTargetAtClientPoint(de.clientX, de.clientY)
    // console.log(`Dragging line ${lineNumber} grip over editor position: line ${target?.position?.lineNumber}, clamped column ${target?.position?.column}, mouse column ${target?.mouseColumn}`)
    // console.log(`Dragging line ${lineNumber} grip over browser window pixel: ${de.clientX}, ${de.clientY}`)

    let targetLine = lineNumber + Math.trunc((de.clientY - this._dragStart.y) / 25)
    targetLine = Math.min(Math.max(1, targetLine), this.lines - childLines)
    this.emit("mouseLine", targetLine)

    let spaces = null
    const dX = Math.trunc((de.clientX - this._dragStart.x) / 8)
    spaces = this._dragIndentations[lineNumber - 1]*2 + dX - dX%2
    const maxAllowed = this._getMaxLeadingSpaces({srcLine: lineNumber, dstLine: targetLine, count: childLines + 1 })
    spaces = Math.max(Math.min(spaces, maxAllowed), 0)

    const desired = { line: targetLine, spaces }
    if (this._dragPrevious.line === desired.line && this._dragPrevious.spaces === desired.spaces) return
    this._dragPrevious = desired
    return {
      line: lineNumber === desired.line ? null : desired.line,
      spaces: 2 * this._dragIndentations[lineNumber - 1] === desired.spaces ? null : desired.spaces,
    }
  }

  _indent({ lines, lineNumber, count, spaces, originalParentSpaces }) {
    const spacingChange = spaces - originalParentSpaces
    if (!spacingChange) return lines
    const baseSpaces = " ".repeat(spaces)
    for (let lineIndex = lineNumber - 1; lineIndex < lineNumber - 1 + count; lineIndex++) {
      lines[lineIndex] = baseSpaces + lines[lineIndex].slice(originalParentSpaces)
    }
    return lines
  }

  _onDrag = (lineNumber, childLines, de) => {
    const mutation = this._buildMutation(de, lineNumber, childLines)
    if (!mutation) return
    let lines = [...this._dragLines]
    if (mutation.line) lines = reorder({
      items: lines,
      count: childLines + 1,
      startIndex: lineNumber - 1,
      destIndex: mutation.line - 1,
    })
    if (mutation.spaces !== null) lines = this._indent({
      lines,
      fromLineNumber: lineNumber,
      lineNumber: mutation.line || lineNumber,
      count: childLines + 1,
      spaces: mutation.spaces,
      originalParentSpaces: 2 * this._dragIndentations[lineNumber - 1],
    })
    this.emit("text", lines.join("\n"))
  }

  _offDrag = (lineNumber) => {
    // console.log(`dragend on line ${lineNumber} — stopping logging`)
    document.removeEventListener('dragover', this._dragListener)
    this._dragListener = null
  }
}

const stateManager = new StateManager()

const Editor = ({ tasks, dark, locked }) => {
  const editorRef = useRef(null)
  // const [text, setText] = useState(tasks.map((t) => t.text).join("\n") + "\n")
  const [text, setText] = useState(`0 sup dude
  1 hey fam
    2 what is cracking in the hood?
    3 what you sayin
  4 any news
    5 from who
      6 idk
        7 I just work here
          8 got Steak hoe
            9 Got Beef
              10 Grade A hoe, not lean
                11 Go ahead and touch it
        12 I don't think so
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
    stateManager.text = text
    stateManager.lines = lines
    stateManager.locked = locked
    stateManager.setMaxListeners(2*lines + 1)
  }, [text, lines, locked])

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
