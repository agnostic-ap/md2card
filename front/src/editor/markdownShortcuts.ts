import { keymap } from '@codemirror/view'
import { EditorSelection, Prec } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'

/**
 * Toggle inline marker around selection.
 * - No selection: insert before+after with cursor between them.
 * - Markers already wrap the selection (immediately outside): remove them.
 * - Otherwise: wrap and keep the selection highlighted.
 */
function toggleWrap(before: string, after = before) {
  return (view: EditorView): boolean => {
    view.dispatch(
      view.state.changeByRange((range) => {
        const doc = view.state.doc

        if (range.empty) {
          return {
            changes: { from: range.from, insert: before + after },
            range: EditorSelection.cursor(range.from + before.length),
          }
        }

        // Detect existing wrap just outside the selection → unwrap
        const ctxBefore =
          range.from >= before.length
            ? doc.sliceString(range.from - before.length, range.from)
            : ''
        const ctxAfter = doc.sliceString(range.to, range.to + after.length)

        if (ctxBefore === before && ctxAfter === after) {
          return {
            changes: [
              { from: range.from - before.length, to: range.from, insert: '' },
              { from: range.to, to: range.to + after.length, insert: '' },
            ],
            range: EditorSelection.range(
              range.from - before.length,
              range.to - before.length,
            ),
          }
        }

        // Wrap
        return {
          changes: [
            { from: range.from, insert: before },
            { from: range.to, insert: after },
          ],
          range: EditorSelection.range(range.from, range.to + before.length + after.length),
        }
      }),
    )
    view.focus()
    return true
  }
}

/**
 * Smart link: wraps selection as label text with cursor landing in the URL field,
 * or inserts a bare []() template with cursor at the label position.
 */
function insertLink(view: EditorView): boolean {
  view.dispatch(
    view.state.changeByRange((range) => {
      if (range.empty) {
        return {
          changes: { from: range.from, insert: '[](url)' },
          range: EditorSelection.range(range.from + 2, range.from + 5), // select "url"
        }
      }
      const label = view.state.doc.sliceString(range.from, range.to)
      const insert = `[${label}](url)`
      return {
        changes: { from: range.from, to: range.to, insert },
        range: EditorSelection.range(
          range.from + label.length + 3, // after `[label](`
          range.from + insert.length - 1, // before `)`
        ),
      }
    }),
  )
  view.focus()
  return true
}

// Mod- = ⌘ on macOS, Ctrl on Windows/Linux
export const markdownShortcutsExtension = Prec.high(
  keymap.of([
    { key: 'Mod-b',       run: toggleWrap('**') },
    { key: 'Mod-i',       run: toggleWrap('*') },
    { key: 'Mod-e',       run: toggleWrap('`') },
    { key: 'Mod-Shift-x', run: toggleWrap('~~') },
    { key: 'Mod-Shift-u', run: toggleWrap('<u>', '</u>') },
    { key: 'Mod-Shift-m', run: toggleWrap('<mark>', '</mark>') },
    { key: 'Mod-k',       run: insertLink },
  ]),
)
