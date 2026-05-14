/**
 * Split markdown by horizontal rules: a line containing only `---` (YAML front matter
 * is not supported). Each segment becomes one card when split mode is on.
 */
export function splitMarkdown(source: string): string[] {
  const lines = source.split(/\r?\n/)
  const chunks: string[][] = []
  let current: string[] = []

  for (const line of lines) {
    if (/^===\s*$/.test(line)) {
      const joined = current.join('\n').trim()
      if (joined) chunks.push(joined.split('\n'))
      current = []
    } else {
      current.push(line)
    }
  }
  const last = current.join('\n').trim()
  if (last) chunks.push(last.split('\n'))

  return chunks.map((c) => c.join('\n').trim()).filter(Boolean)
}
