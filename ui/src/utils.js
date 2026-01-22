function logAllProps(obj, depth = 0, maxDepth = 2) {
  if (depth > maxDepth) return;
  const props = new Set();
  let current = obj;
  while (current) {
    Object.getOwnPropertyNames(current).forEach(prop => props.add(prop));
    current = Object.getPrototypeOf(current);
  }
  const sorted = [...props].sort();
  console.group(`Editor methods/properties (depth ${depth})`);
  sorted.forEach(prop => {
    if (typeof obj[prop] === 'function') {
      console.log(`${'  '.repeat(depth)}${prop}()`);
    } else {
      console.log(`${'  '.repeat(depth)}${prop}:`, obj[prop]);
    }
  });
  console.groupEnd();
}

export { logAllProps }
