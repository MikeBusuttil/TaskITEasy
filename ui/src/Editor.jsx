
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
  const [checked, setChecked] = useState(stateManager.checks[lineNumber - 1])

  const _setIndentation = useCallback((indentations) => setIndentation(indentations[lineNumber - 1]), [lineNumber])
  const _setChecked = useCallback((checks) => setChecked(checks[lineNumber - 1]), [lineNumber])

  const onCheck = (e) => {
    setChecked(e?.target?.checked)
    stateManager.check({lineNumber, checked: e?.target?.checked})
  }

  useEffect(() => {
    stateManager.on("indentations", _setIndentation)
    stateManager.on("mouseLine", setMouseLine)
    stateManager.on("checks", _setChecked)
    return () => {
      stateManager.off("indentations", _setIndentation)
      stateManager.off("mouseLine", setMouseLine)
      stateManager.off("checks", _setChecked)
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
          "hover:cursor-move h-6 group-hover:visible z-10",
          mouseLine === lineNumber ? "visible" : "invisible",
          checked ? "dark:fill-gray-700 fill-gray-300" : "fill-gray-500",
        ].join(" ")} />
        <input 
          type="checkbox" 
          className="cursor-pointer z-10"
          checked={checked}
          onChange={onCheck}
        />
      </div>
    </div>
  )
}

const TaskActionRight = ({ lineNumber, stateManager }) => {
  const [mouseLine, setMouseLine] = useState(null)
  const [checked, setChecked] = useState(stateManager.checks[lineNumber - 1])

  const _setChecked = useCallback((checks) => setChecked(checks[lineNumber - 1]), [lineNumber])

  useEffect(() => {
    stateManager.on("mouseLine", setMouseLine)
    stateManager.on("checks", _setChecked)
    return () => {
      stateManager.off("mouseLine", setMouseLine)
      stateManager.off("checks", _setChecked)
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
          <Clear className={[
            "h-6 p-1 z-10",
            checked ? "dark:fill-gray-700 fill-gray-300" : "fill-gray-500",
          ].join(' ')} />
        </button>
      </div>
    </div>
  )
}

class StateManager extends EventEmitter {
  indentations = []
  checks = []
  _widgets = []
  _indentationsNextCursor = null
  _dragListener = null
  _dragPrevious = { line: null, spaces: null } // last executed drag mutation
  _dragStart = { x: null, y: null } // cursor position when dragging started
  _dragLines = [] // lines when dragging started
  _dragChecks = [] // checks when dragging started
  _dragIndentations = [] // indentations when dragging started
  instance = null
  editor = null
  editorDecorations = null
  locked = true
  text = ""

  constructor() {
    super()
    this.on("indentations", this._onIndentations)
    this.on("checks", this._onChecks)
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
    const widgets = []
    for (const side of ['left', 'right']) {
      widgets.push(this._spawnWidget(lineNumber, this.instance, side))
      this.editor.addContentWidget(widgets.slice(-1)[0])
    }
    return widgets
  }

  updateButtons(lines) {
    if (!this.editor) return
    for (let lineNumber = this._widgets.length + 1; lineNumber <= lines; lineNumber++) {
      this._widgets.push(this.addButton(lineNumber))
    }
    for (const widgets of this._widgets.slice(lines)) {
      for (const widget of widgets) this.editor.removeContentWidget(widget)
    }
    this._widgets = this._widgets.slice(0, lines)
  }

  check({ lineNumber, checked }) {
    const checks = [...this.checks]
    const childLines = this.locked ? this._countChildLines(lineNumber) : 0
    for (let lineIndex = lineNumber - 1; lineIndex < lineNumber + childLines; lineIndex++) checks[lineIndex] = checked
    this.emit("checks", checks)
  }

  _onChecks(checks) {
    this.checks = checks
    if (!this.editor) return

    const decorations = []
    checks.forEach((checked, lineIndex) => {
      if (!checked) return
      const lineNumber = lineIndex + 1
      const startColumn = 2*this.indentations[lineIndex] + 1
      const endColumn = this.editor.getModel().getLineMaxColumn(lineNumber)
      console.log({endColumn, startColumn})
      decorations.push({
        range: new monaco.Range(lineNumber, startColumn, lineNumber, endColumn),
        options: {
          inlineClassName: 'task-checked',
        },
      })
    })
    this.editorDecorations.clear()
    this.editorDecorations.set(decorations)
  }

  _onIndentations(indentations) {
    if (!this.editor || this._indentationsNextCursor) {
      this.indentations = indentations
      this.editor?.setPosition(this._indentationsNextCursor)
      this._indentationsNextCursor = null
      return
    }
    if (!this.locked || this._dragListener || indentations.length !== this.indentations.length || this.editor?.getSelection()?.startLineNumber !== this.editor?.getSelection()?.endLineNumber) return this.indentations = indentations
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
    let newText = this.text.split("\n")
    newText.splice(lineNumber-1, this.locked ? this._countChildLines(lineNumber) + 1 : 1)
    this.emit("text", newText.join("\n"))
    this.editor.focus()
  }

  onDragStart = (lineNumber, e) => {
    const target = this.editor.getTargetAtClientPoint(e.clientX, e.clientY)
    const spaces = 2 * this.indentations[lineNumber - 1]
    this._dragStart = { x: e.clientX, y: e.clientY }
    this._dragPrevious = { line: lineNumber, spaces }
    this._dragLines = this.text.split("\n")
    this._dragIndentations = [...this.indentations]
    this._dragChecks = [...this.checks]
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
    targetLine = Math.min(Math.max(1, targetLine), this.indentations.length - childLines)
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
    const checks = reorder({
      items: this._dragChecks,
      count: childLines + 1,
      startIndex: lineNumber - 1,
      destIndex: (mutation.line || lineNumber) - 1,
    })
    this.emit("checks", checks)
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
  const [mounted, setMounted] = useState(false)
  const [text, setText] = useState("")
  const [_modelContent, _setModelContent] = useState(text)
  const [previousCursorLine, setPreviousCursorLine] = useState(0)
  const [cursorPosition, _setCursorPosition] = useState({ position: {lineNumber: 1, column: 1}, source: "NA"})
  const [mouseLine, setMouseLine] = useState(null)
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
    stateManager.locked = locked
  }, [text, locked])

  // parse the tasks to extract checked statuses & text
  useEffect(() => {
    const lines = []
    const checks = []
    for (const task of tasks.split("\n")) {
      let line = task.replace(/- \[x\] /gm, '')
      checks.push(line.length !== task.length)
      lines.push(line.replace(/- \[ ] /gm, ''))
    }
    setText(lines.join("\n").trimEnd() + "\n")
    stateManager.emit("checks", checks)
  }, [tasks])

  // add or remove the buttons every time a line is added or removed
  useEffect(() => {
    stateManager.updateButtons(lines)
    stateManager.setMaxListeners(5*lines + 10)
  }, [lines, mounted])

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

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor
    stateManager.editor = editor
    stateManager.instance = stateManager
    stateManager.editorDecorations = editor.createDecorationsCollection()
    stateManager.emit("checks", stateManager.checks)
    setMounted(true)
    
    editor.onMouseMove((e) => setMouseLine(e.target.position?.lineNumber))
    editor.onMouseLeave((e) => setMouseLine(null))
    editor.onDidChangeCursorPosition(_setCursorPosition)
    // logAllProps(editor)
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
