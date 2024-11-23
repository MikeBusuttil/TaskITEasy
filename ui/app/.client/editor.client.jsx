
import Editor from '@monaco-editor/react'
import { useCallback, useEffect, useRef, useState, useMemo } from "react"
const innerHTML = (await import("./inner.html?raw")).default
import Grip from "../grip.svg"

var contentWidget = (lineNumber, monaco) => ({
	domNode: (function () {
		var domNode = document.createElement("div")
		domNode.innerHTML = innerHTML
    domNode.id = `grab-and-check-${lineNumber}`
    domNode.onmousemove = () => {
      const id = `grab-and-check-${lineNumber}`
      let otherIds = new Set(["grab-and-check-1", "grab-and-check-2", "grab-and-check-3"])
      otherIds.delete(id)
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
  const [scrollPadding, setScrollPadding] = useState("3px")
  const [text, setText] = useState(tasks.map((t) => t.text).join("\n") + "\n")
  const lines = useMemo(() => (text.match(/\n/g)||[]).length,[text])
  const indentations = useMemo(() => {
    let indentations = [0]
    text.split("\n").map((line, lineNumber) => {
      if (!lineNumber) return
      const indentation = Math.floor(line.match(/^(  )*/g)[0].length / 2)
      indentations.push(Math.min(indentations.slice(-1)[0] + 1, indentation))
    })
    console.log(indentations)
    return indentations
  },[text])

  useEffect(() => {
    const lineNumbers = [...Array(lines).keys()].map(x => x+1)
    editorRef.current?.onMouseMove(function (e) {
      const lineNumber = e.target.position?.lineNumber
      if (!lineNumber) return
      let otherLines = new Set(lineNumbers)
      otherLines.delete(lineNumber)
      document.getElementById(`grab-and-check-${lineNumber}`)?.getElementsByTagName('svg')[0].classList.remove('invisible')
      for (const line of otherLines) {
        document.getElementById(`grab-and-check-${line}`)?.getElementsByTagName('svg')[0].classList.add('invisible')
      }
    })
    editorRef.current?.onMouseLeave(function () {
      for (const line of lineNumbers) {
        document.getElementById(`grab-and-check-${line}`)?.getElementsByTagName('svg')[0].classList.add('invisible')
      }
    })
  }, [lines])

  const onmousemove = useCallback((lineNumber) => {
    const id = `grab-and-check-${lineNumber}`
    let otherIds = new Set([...Array(lines).keys()].map(x => `grab-and-check-${x+1}`))
    otherIds.delete(id)
    document.getElementById(id)?.getElementsByTagName('svg')[0].classList.remove('invisible')
    for (const otherId of otherIds) {
      document.getElementById(otherId)?.getElementsByTagName('svg')[0].classList.add('invisible')
    }
  }, [lines])

  const onChange = useCallback((newValue, event) => {
    // console.log("event", event, "casued the new value of the code:")
    setText(newValue)
  }, [])

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor

    const lineNumbers = [...Array(lines).keys()].map(x => x+1)
    editor.onMouseMove(function (e) {
      const lineNumber = e.target.position?.lineNumber
      if (!lineNumber) return
      let otherLines = new Set(lineNumbers)
      otherLines.delete(lineNumber)
      document.getElementById(`grab-and-check-${lineNumber}`)?.getElementsByTagName('svg')[0].classList.remove('invisible')
      for (const line of otherLines) {
        document.getElementById(`grab-and-check-${line}`)?.getElementsByTagName('svg')[0].classList.add('invisible')
      }
    })
    editor.onMouseLeave(function () {
      for (const line of lineNumbers) {
        document.getElementById(`grab-and-check-${line}`)?.getElementsByTagName('svg')[0].classList.add('invisible')
      }
    })
    editor.onDidScrollChange((e)=> {
      setScrollPadding(`${-e.scrollTop - 3}px`)
    })
  }

  return (
    <div className={`relative flex flex-col p-3 rounded-lg shadow-lg border ${ dark ? "border-gray-700 shadow-gray-700 bg-black" : "border-gray-300"} w-1/2 mx-auto`}>
      <div className='absolute flex flex-col mt-[2px] w-full overflow-hidden'>
        {[...Array(lines).keys()].map((n) => (
          <div
            className="flex flex-row group relative left-9"
            key={n+1}
            id={`grab-and-check-${n+1}`}
            onMouseMove={() => onmousemove(n+1)}
            style={{top: scrollPadding, left: `${36 + indentations[n]*15}px`}}
          >
            <Grip className="fill-gray-500 hover:cursor-move h-6 invisible group-hover:visible z-10"/>
            <input type="checkbox" className="cursor-pointer z-10 " />
          </div>
          ))}
      </div>
      <Editor
        height="300px"
        theme={dark ? "vs-dark" : "light"}
        defaultValue={text}
        onMount={handleEditorDidMount}
        onChange={onChange}
        options={{
          lineNumbers:() => null,
          lineHeight: 1.6787,
          glyphMargin: true,
          tabSize: 2,
        }}
      />
    </div>
  )
}

export default NoSSR
