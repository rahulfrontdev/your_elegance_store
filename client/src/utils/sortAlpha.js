const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true })

export function compareAlpha(a, b) {
  return collator.compare(String(a ?? ''), String(b ?? ''))
}

/** Sort strings A–Z; optional label pinned first (e.g. "All"). */
export function sortLabels(labels, pinFirst = null) {
  const list = [...labels].sort(compareAlpha)
  if (!pinFirst || !list.includes(pinFirst)) return list
  return [pinFirst, ...list.filter((item) => item !== pinFirst)]
}
