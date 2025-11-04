
function ensureArray(v) { return Array.isArray(v) ? v : (v ? [v] : []) }

export function htmlToBlocks(html) {
  try {
    if (typeof window === 'undefined') {
      const text = (html || '').replace(/<[^>]+>/g, '').trim()
      return { blocks: [{ type: 'paragraph', data: { text } }] }
    }
    const container = document.createElement('div')
    container.innerHTML = html || ''
    const blocks = []
    Array.from(container.childNodes).forEach((node) => {
      if (node.nodeType === 3) {
        const text = node.textContent.trim()
        if (text) blocks.push({ type: 'paragraph', data: { text } })
      } else if (node.nodeName === 'P') {
        blocks.push({ type: 'paragraph', data: { text: node.innerHTML } })
      } else if (/^H[1-6]$/.test(node.nodeName)) {
        const level = Number(node.nodeName.substring(1))
        blocks.push({ type: 'header', data: { level, text: node.innerHTML } })
      } else if (node.nodeName === 'UL' || node.nodeName === 'OL') {
        const style = node.nodeName === 'UL' ? 'unordered' : 'ordered'
        const items = Array.from(node.querySelectorAll('li')).map(li => li.innerHTML)
        blocks.push({ type: 'list', data: { style, items } })
      }
    })
    if (!blocks.length) blocks.push({ type: 'paragraph', data: { text: '' } })
    return { blocks }
  } catch {
    const text = (html || '').replace(/<[^>]+>/g, '').trim()
    return { blocks: [{ type: 'paragraph', data: { text } }] }
  }
}

export function blocksToHtml(data) {
  const blocks = (data && data.blocks) || []
  return blocks.map((b) => {
    if (b.type === 'paragraph') return `<p>${b.data?.text || ''}</p>`
    if (b.type === 'header') return `<h${b.data?.level || 2}>${b.data?.text || ''}</h${b.data?.level || 2}>`
    if (b.type === 'list') {
      const tag = b.data?.style === 'ordered' ? 'ol' : 'ul'
      const items = ensureArray(b.data?.items).map(i => `<li>${i}</li>`).join('')
      return `<${tag}>${items}</${tag}>`
    }
    return ''
  }).join('')
}

