export const logAllProps = (obj, depth = 0, maxDepth = 2) => {
  if (depth > maxDepth) return
  const props = new Set()
  let current = obj
  while (current) {
    Object.getOwnPropertyNames(current).forEach((prop) => props.add(prop))
    current = Object.getPrototypeOf(current)
  }
  const sorted = [...props].sort()
  console.group(`Editor methods/properties (depth ${depth})`)
  sorted.forEach((prop) => {
    if (typeof obj[prop] === "function") {
      console.log(`${"  ".repeat(depth)}${prop}()`)
    } else {
      console.log(`${"  ".repeat(depth)}${prop}:`, obj[prop])
    }
  })
  console.groupEnd()
}

export const reorder = ({items, startIndex, count = 1, destIndex}) => {
  const output = [...items.slice(0, startIndex), ...items.slice(startIndex + count)]
  return [...output.slice(0, destIndex), ...items.slice(startIndex, startIndex + count), ...output.slice(destIndex)]
}

export const constructIndentations = (text) => {
  let indentations = [0]
  text.split("\n").map((line, lineNumber) => {
    if (!lineNumber) return
    const indentation = Math.floor(line.match(/^(  )*/g)[0].length / 2)
    indentations.push(Math.min(indentations.slice(-1)[0] + 1, indentation))
  })
  return indentations
}
