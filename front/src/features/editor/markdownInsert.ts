import type { EditorView } from '@codemirror/view'

export function getSelection(view: EditorView) {
  return view.state.selection.main
}

export function insertAtCursor(view: EditorView, text: string) {
  const { from, to } = getSelection(view)
  view.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length },
  })
  view.focus()
}

export function wrapSelection(view: EditorView, before: string, after: string = before) {
  const { from, to } = getSelection(view)
  const selected = view.state.sliceDoc(from, to)
  const next = before + selected + after
  view.dispatch({
    changes: { from, to, insert: next },
    selection: {
      anchor: from + before.length,
      head: from + before.length + selected.length,
    },
  })
  view.focus()
}

export function insertLinesAround(
  view: EditorView,
  prefixEachLine: string,
  defaultLine = '',
) {
  const { from, to } = getSelection(view)
  const block = view.state.sliceDoc(from, to)
  const lines = block.length ? block.split('\n') : [defaultLine]
  const next = lines.map((l) => prefixEachLine + l).join('\n')
  view.dispatch({
    changes: { from, to, insert: next },
    selection: { anchor: from + next.length },
  })
  view.focus()
}

/** Replace the entire document content. */
export function replaceDoc(view: EditorView, text: string) {
  const docLen = view.state.doc.length
  view.dispatch({
    changes: { from: 0, to: docLen, insert: text },
    selection: { anchor: 0 },
    scrollIntoView: true,
  })
  view.focus()
}

/** Append text at the end of the document, ensuring at least one blank line of separation. */
export function appendToDoc(view: EditorView, text: string) {
  const docLen = view.state.doc.length
  const tail = view.state.sliceDoc(Math.max(0, docLen - 2), docLen)
  const sep = docLen === 0 ? '' : tail.endsWith('\n\n') ? '' : tail.endsWith('\n') ? '\n' : '\n\n'
  const insert = sep + text
  view.dispatch({
    changes: { from: docLen, to: docLen, insert },
    selection: { anchor: docLen + insert.length },
    scrollIntoView: true,
  })
  view.focus()
}
