type LexicalNode = { text?: string; children?: LexicalNode[]; type?: string }

/** Estrae il testo semplice da un campo richText (per sommari e meta description). */
export function lexicalToText(value: unknown, max = 200): string {
  const root = (value as { root?: LexicalNode } | null)?.root
  if (!root) return ''
  const parts: string[] = []
  const walk = (node: LexicalNode) => {
    if (node.text) parts.push(node.text)
    node.children?.forEach(walk)
    if (node.type === 'paragraph' || node.type === 'heading' || node.type === 'listitem')
      parts.push(' ')
  }
  walk(root)
  const text = parts.join('').replace(/\s+/g, ' ').trim()
  if (text.length <= max) return text
  return `${text.slice(0, max).replace(/\s+\S*$/, '')}…`
}
