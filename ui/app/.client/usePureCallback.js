import { useState, useEffect, useCallback } from "react"

export const usePureCallback = (callback) => {
  const [fireCallback, setFireCallback] = useState(false)
  const [parameters, setParameters] = useState(false)

  useEffect(() => {
    if (fireCallback) {
      setFireCallback(false)
      callback(...parameters)
    }
  }, [parameters, fireCallback, callback])

  const output = useCallback((...params) => {
    setParameters(params)
    setFireCallback(true)
  }, [])

  return output
}
