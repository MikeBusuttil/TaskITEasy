
import Editor from '@monaco-editor/react'
import { useRef } from "react"
const innerHTML = (await import("./inner.html?raw")).default

var contentWidget = (lineNumber) => ({
	domNode: (function () {
		var domNode = document.createElement("div")
		domNode.innerHTML = innerHTML
    domNode.id = `grab-and-check-${lineNumber}`
    domNode.classList.add("top-[20px]", "relative", "z-90")
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
			position: {
				lineNumber,
				column: 1,
			},
			preference: [
				monaco.editor.ContentWidgetPositionPreference.EXACT,
			],
		};
	},
})

const NoSSR = ({ tasks, dark }) => {
  const editorRef = useRef(null)
  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
    for (const lineNumber of [1, 2, 3]) {
      editor?.addContentWidget(contentWidget(lineNumber))
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
    defaultValue={tasks.map((t) => `        ${t.text}`).join("\n") + "\n"}
    onMount={handleEditorDidMount}
    options={{
      lineNumbers:() => null,
      glyphMargin: false,
    }}
  />
}

export default NoSSR
