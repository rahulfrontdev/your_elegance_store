import React from 'react'

function is(x, y) {
  return (x === y && (x !== 0 || 1 / x === 1 / y)) || (x !== x && y !== y)
}

const objectIs = typeof Object.is === 'function' ? Object.is : is

export function useSyncExternalStoreWithSelector(
  subscribe,
  getSnapshot,
  getServerSnapshot,
  selector,
  isEqual
) {
  const instRef = React.useRef(null)
  if (instRef.current === null) {
    instRef.current = { hasValue: false, value: null }
  }
  const inst = instRef.current

  const getSelectedSnapshot = React.useMemo(() => {
    let hasMemo = false
    let memoizedSnapshot
    let memoizedSelection
    const maybeGetServerSnapshot =
      getServerSnapshot === undefined ? null : getServerSnapshot

    function memoizedSelector(nextSnapshot) {
      if (!hasMemo) {
        hasMemo = true
        memoizedSnapshot = nextSnapshot
        const nextSelection = selector(nextSnapshot)
        if (isEqual !== undefined && inst.hasValue) {
          const currentSelection = inst.value
          if (isEqual(currentSelection, nextSelection)) {
            return (memoizedSelection = currentSelection)
          }
        }
        return (memoizedSelection = nextSelection)
      }

      const currentSelection = memoizedSelection
      if (objectIs(memoizedSnapshot, nextSnapshot)) {
        return currentSelection
      }

      const nextSelection = selector(nextSnapshot)
      if (isEqual !== undefined && isEqual(currentSelection, nextSelection)) {
        memoizedSnapshot = nextSnapshot
        return currentSelection
      }

      memoizedSnapshot = nextSnapshot
      return (memoizedSelection = nextSelection)
    }

    return [
      () => memoizedSelector(getSnapshot()),
      maybeGetServerSnapshot === null
        ? undefined
        : () => memoizedSelector(maybeGetServerSnapshot()),
    ]
  }, [getSnapshot, getServerSnapshot, selector, isEqual, inst])

  const value = React.useSyncExternalStore(
    subscribe,
    getSelectedSnapshot[0],
    getSelectedSnapshot[1]
  )

  React.useEffect(() => {
    inst.hasValue = true
    inst.value = value
  }, [value, inst])

  React.useDebugValue(value)
  return value
}
