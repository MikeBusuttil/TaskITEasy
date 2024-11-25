
import Editor from '@monaco-editor/react'
import { useCallback, useEffect, useRef, useState, useMemo } from "react"
const gripSvg = (await import("../grip.svg?raw")).default
const clearSvg = (await import("../clear.svg?raw")).default

const NoSSR = ({ tasks, dark }) => {
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

  const deleteLineAndChildren = useCallback((lineNumber) => {
    //TODO: fix this thing leaving a bunch of floating checkboxes at the end in some circumstances
    let newText = text.split("\n")
    let deleteLines = 1
    document.getElementById(`grab-and-check-${lineNumber}`).remove()
    document.getElementById(`clear-${lineNumber}`).remove()
    for (const indentation of indentations.slice(lineNumber)) {
      if (indentation > indentations[lineNumber - 1]) {
        document.getElementById(`grab-and-check-${lineNumber + deleteLines}`)?.remove()
        document.getElementById(`clear-${lineNumber + deleteLines}`)?.remove()
        deleteLines ++
      } else {
        break
      }
    }
    newText.splice(lineNumber-1, deleteLines)
    newText = newText.join("\n")
    _setModelContent(newText)
    setText(newText)
    editorRef.current.focus()
  }, [text, indentations])

  const onmousemove = useCallback((lineNumber) => {
    let otherLineNumbers = new Set([...Array(lines).keys()].map(l => l+1))
    otherLineNumbers.delete(lineNumber)
    document.getElementById(`grab-and-check-${lineNumber}`)?.getElementsByTagName('svg')[0].classList.remove('invisible')
    document.getElementById(`clear-${lineNumber}`)?.getElementsByTagName('button')[0].classList.remove('invisible')
    for (const otherLineNumber of otherLineNumbers) {
      document.getElementById(`grab-and-check-${otherLineNumber}`)?.getElementsByTagName('svg')[0].classList.add('invisible')
      document.getElementById(`clear-${otherLineNumber}`)?.getElementsByTagName('button')[0].classList.add('invisible')
    }
  }, [lines])

  var taskActionsLeft = (lineNumber, indentation) => ({
    domNode: (function () {
      var domNode = document.createElement("div")
      domNode.id = `grab-and-check-${lineNumber}`
      domNode.classList.add("task-action")
      domNode.onmousemove = () => onmousemove(lineNumber)
      
      var innerContainer = document.createElement("div")
      innerContainer.classList.add("flex", "flex-row", "group", "-top-[1px]", "relative")
      innerContainer.style = `left: ${indentation*16}px`
      domNode.appendChild(innerContainer)

      innerContainer.insertAdjacentHTML('beforeend', gripSvg)
      innerContainer.children[0].classList.add("fill-gray-500", "hover:cursor-move", "h-6", "invisible", "group-hover:visible", "z-10")
            
      var checkbox = document.createElement("input")
      checkbox.type="checkbox"
      checkbox.classList.add("cursor-pointer", "z-10")
      innerContainer.appendChild(checkbox)

      return domNode;
    })(),
    getId: () => `task-action-left${lineNumber}`,
    getDomNode: function () { return this.domNode },
    getPosition: function () { return {position: {lineNumber, column: 1}, preference: [monaco.editor.ContentWidgetPositionPreference.EXACT]}},
  })
  var taskActionsRight = (lineNumber) => ({
    domNode: (function () {
      var domNode = document.createElement("div")
      domNode.id = `clear-${lineNumber}`
      domNode.classList.add("task-action")
      domNode.onmousemove = () => onmousemove(lineNumber)
      
      var innerContainer = document.createElement("div")
      innerContainer.classList.add("flex", "flex-row", "group", "-top-[1px]", "left-[670px]", "relative")
      domNode.appendChild(innerContainer)

      var button = document.createElement("button")
      button.classList.add(
        "hover:bg-gray-800", "focus:bg-gray-800", //TODO: dark mode
        "object-cover", "rounded-full", "focus:outline-none", "z-10", "invisible", "group-hover:visible"
      )
      button.onclick = () => deleteLineAndChildren(lineNumber)
      innerContainer.appendChild(button)
   
      button.insertAdjacentHTML('beforeend', clearSvg)
      button.children[0].classList.add("fill-gray-500", "h-6", "p-1", "z-10")

      return domNode;
    })(),
    getId: () => `task-action-right${lineNumber}`,
    getDomNode: function () { return this.domNode },
    getPosition: function () { return {position: {lineNumber, column: 1}, preference: [monaco.editor.ContentWidgetPositionPreference.EXACT]}},
  })

  const initializeActionButtons = useCallback((editor) => {
    console.log("initializing!")
    //TODO: use Monaco API to replace widget ID so the console doesn't complain
    for (const lineNumber of [...Array(lines).keys()].map(l => l+1)) {
      document.getElementById(`grab-and-check-${lineNumber}`)?.remove()
      document.getElementById(`clear-${lineNumber}`)?.remove()
      editor.addContentWidget(taskActionsLeft(lineNumber, indentations[lineNumber-1]))
      editor.addContentWidget(taskActionsRight(lineNumber))
    }
    
    const lineNumbers = [...Array(lines).keys()].map(x => x+1)
    editor.onMouseMove(function (e) {
      const lineNumber = e.target.position?.lineNumber
      if (!lineNumber) return
      let otherLines = new Set(lineNumbers)
      otherLines.delete(lineNumber)
      document.getElementById(`grab-and-check-${lineNumber}`)?.getElementsByTagName('svg')[0].classList.remove('invisible')
      document.getElementById(`clear-${lineNumber}`)?.getElementsByTagName('button')[0].classList.remove('invisible')
      for (const line of otherLines) {
        document.getElementById(`grab-and-check-${line}`)?.getElementsByTagName('svg')[0].classList.add('invisible')
        document.getElementById(`clear-${line}`)?.getElementsByTagName('button')[0].classList.add('invisible')
      }
    })
    editor.onMouseLeave(function () {
      for (const line of lineNumbers) {
        document.getElementById(`grab-and-check-${line}`)?.getElementsByTagName('svg')[0].classList.add('invisible')
        document.getElementById(`clear-${line}`)?.getElementsByTagName('button')[0].classList.add('invisible')
      }
    })
  }, [lines])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    initializeActionButtons(editor)
  }, [lines])

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
    initializeActionButtons(editor)
    editor.onDidChangeCursorPosition(_setCursorPosition)
    console.log("here are all the editor methods for reference:", editor)
  }

  return (
    <div className={`relative flex flex-col p-3 rounded-lg shadow-lg border ${ dark ? "border-gray-700 shadow-gray-700 bg-[#1e1e1e]" : "border-gray-300"} w-1/2 mx-auto`}>
      <Editor
        height="300px"
        theme={dark ? "vs-dark" : "light"}
        defaultValue={text}
        onMount={handleEditorDidMount}
        onChange={(newText) => setText(newText)}
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
        }}
      />
    </div>
  )
}

export default NoSSR
