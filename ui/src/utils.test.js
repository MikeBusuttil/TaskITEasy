import { describe, test, expect } from 'vitest'
import { reorder } from "./utils"

describe("reorder 1 at a time", () => {
  test("moves single item forward 1", () => {
    const items = ["a", "b", "c", "d"]
    const result = reorder({ items, startIndex: 1, destIndex: 2 })
    expect(result).toEqual(["a", "c", "b", "d"])
  })

  test("moves single item backward 2", () => {
    const items = ["a", "b", "c", "d"]
    const result = reorder({ items, startIndex: 2, destIndex: 0 })
    expect(result).toEqual(["c", "a", "b", "d"])
  })

  test("moves single item backward 1", () => {
    const items = ["a", "b", "c", "d"]
    const result = reorder({ items, startIndex: 2, destIndex: 1 })
    expect(result).toEqual(["a", "c", "b", "d"])
  })
})

describe("reorder multi-item", () => {
  test("moves 2 items forward 3", () => {
    const items = ["a", "b", "c", "d", 'e', 'f']
    const result = reorder({ items, startIndex: 1, count: 2, destIndex: 4 })
    expect(result).toEqual(["a", "d", "e", 'f', "b", 'c'])
  })

  test("moves 3 items backward 1", () => {
    const items = ["a", "b", "c", "d", 'e', 'f']
    const result = reorder({ items, startIndex: 2, count: 3, destIndex: 1 })
    expect(result).toEqual(["a", "c", "d", "e", 'b', 'f'])
  })

  test("moves 3 items forward 5", () => {
    const items = ["a", "b", "c", "d", 'e', 'f', 'g', 'h']
    const result = reorder({ items, startIndex: 1, count: 3, destIndex: 6 })
    expect(result).toEqual(["a", "e", "f", "g", 'h', "b", 'c', 'd'])
  })

  test("moves 3 items forward 1", () => {
    const items = ["a", "b", "c", "d", 'e', 'f', 'g', 'h']
    const result = reorder({ items, startIndex: 1, count: 3, destIndex: 2 })
    expect(result).toEqual(["a", "e", "b", "c", "d", 'f', 'g', 'h'])
  })

  test("moves 3 items forward 2", () => {
    const items = ["a", "b", "c", "d", 'e', 'f', 'g', 'h']
    const result = reorder({ items, startIndex: 1, count: 3, destIndex: 3 })
    expect(result).toEqual(["a", "e", 'f', "b", "c", "d", 'g', 'h'])
  })

  test("moves 3 items forward 3", () => {
    const items = ["a", "b", "c", "d", 'e', 'f', 'g', 'h']
    const result = reorder({ items, startIndex: 1, count: 3, destIndex: 4 })
    expect(result).toEqual(["a", "e", 'f', 'g', "b", "c", "d", 'h'])
  })

  test("moves 3 items forward 4", () => {
    const items = ["a", "b", "c", "d", 'e', 'f', 'g', 'h']
    const result = reorder({ items, startIndex: 1, count: 3, destIndex: 5 })
    expect(result).toEqual(["a", "e", 'f', 'g', 'h', "b", "c", "d"])
  })
})
