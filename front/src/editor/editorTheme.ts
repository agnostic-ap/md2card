import { EditorView } from '@codemirror/view'

export const lightEditorTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#fffdf8',
      color: '#2a241d',
    },
    '.cm-content': {
      caretColor: '#ff5c28',
      fontFamily:
        '"JetBrains Mono", "IBM Plex Mono", "SF Mono", ui-monospace, Menlo, Consolas, monospace',
      fontSize: '13px',
      lineHeight: '1.7',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#ff5c28',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      backgroundColor: '#ffd7c7 !important',
    },
    '.cm-gutters': {
      backgroundColor: '#f4efe5',
      color: '#9a938c',
      border: 'none',
      borderRight: '1px solid #e8e3da',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#fff1e8',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(255, 92, 40, 0.06)',
    },
  },
  { dark: false },
)
