
import Editor from '@monaco-editor/react'
import { useCallback, useEffect, useRef, useState } from "react"
const innerHTML = (await import("./inner.html?raw")).default

var contentWidget = (lineNumber, monaco) => ({
	domNode: (function () {
		var domNode = document.createElement("div")
		domNode.innerHTML = innerHTML
    domNode.id = `grab-and-check-${lineNumber}`
    domNode.onmousemove = () => {
      const id = `grab-and-check-${lineNumber}`
      let otherIds = new Set(["grab-and-check-1", "grab-and-check-2", "grab-and-check-3"])
      otherIds.delete(id)
      console.log("onmousemove - " + id)
      document.getElementById(id)?.getElementsByTagName('svg')[0].classList.remove('invisible')
      for (const otherId of otherIds) {
        document.getElementById(otherId)?.getElementsByTagName('svg')[0].classList.add('invisible')
      }
    }
		return domNode;
	})(),
	getId: function () {
		return `grab-and-check${lineNumber}`
	},
	getDomNode: function () {
		return this.domNode
	},
	getPosition: function () {
		return {
      lane: monaco.editor.GlyphMarginLane.Right,
      range: monaco.Range.fromPositions(new monaco.Position(lineNumber, 1)),
      zIndex: 1,
		}
	},
})

const NoSSR = ({ tasks, dark }) => {
  const editorRef = useRef(null)

  const [code, setCode] = useState("")

  useEffect(() => {
    console.log("ummmm code?", code)
  }, [code])

  const onChange = useCallback((newValue, event) => {
    console.log("event", event, "casued the new value of the code:")
    console.log(newValue)
  }, [])

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
    for (const lineNumber of [1, 2, 3]) {
      editor?.addGlyphMarginWidget(contentWidget(lineNumber, monaco))
    }

    editor.onMouseMove(function (e) {
      const lineNumber = e.target.position?.lineNumber
      if (!lineNumber) return
      let otherLines = new Set([1,2,3])
      otherLines.delete(lineNumber)
      document.getElementById(`grab-and-check-${lineNumber}`)?.getElementsByTagName('svg')[0].classList.remove('invisible')
      for (const line of otherLines) {
        document.getElementById(`grab-and-check-${line}`)?.getElementsByTagName('svg')[0].classList.add('invisible')
      }
    })
    editor.onMouseLeave(function () {
      for (const line of [1,2,3]) {
        document.getElementById(`grab-and-check-${line}`)?.getElementsByTagName('svg')[0].classList.add('invisible')
      }
    })
  }

  return <Editor
    height="90vh"
    theme={dark ? "vs-dark" : "light"}
    defaultValue={tasks.map((t) => t.text).join("\n") + "\n"}
    onMount={handleEditorDidMount}
    value={code}
    onChange={onChange}
    options={{
      lineNumbers:() => null,
      glyphMargin: true,
    }}
  />
}

export default NoSSR
