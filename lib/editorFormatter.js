
function ensureArray(v) { return Array.isArray(v) ? v : (v ? [v] : []) }
function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function looksLikeHtml(value = '') {
  return /<\/?[a-z][\s\S]*>/i.test(String(value || ''))
}

function isHeadingLine(line = '') {
  const text = String(line || '').trim()
  if (!text) return false
  if (text.endsWith(':')) return false
  if (text.length > 80) return false
  if (/^[A-Z][A-Za-z\s&/()-]+$/.test(text)) return true
  return /^[A-Z\s&/()-]+$/.test(text) && /[A-Z]/.test(text)
}

function listMeta(line = '') {
  const text = String(line || '').trim()
  if (/^[-*•]\s+/.test(text)) return { type: 'ul', value: text.replace(/^[-*•]\s+/, '') }
  if (/^\d+\.\s+/.test(text)) return { type: 'ol', value: text.replace(/^\d+\.\s+/, '') }
  return null
}

export function plainTextToHtml(value) {
  if (!value) return ''
  if (looksLikeHtml(value)) return String(value)

  const lines = String(value)
    .replace(/\r\n/g, '\n')
    .split('\n')

  const html = []
  let paragraph = []
  let listType = null
  let listItems = []

  const flushParagraph = () => {
    if (!paragraph.length) return
    html.push(`<p>${paragraph.map((line) => escapeHtml(line)).join('<br>')}</p>`)
    paragraph = []
  }

  const flushList = () => {
    if (!listType || !listItems.length) return
    html.push(`<${listType}>${listItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</${listType}>`)
    listType = null
    listItems = []
  }

  for (const rawLine of lines) {
    const line = String(rawLine || '').trim()

    if (!line) {
      flushParagraph()
      flushList()
      continue
    }

    const bullet = listMeta(line)
    if (bullet) {
      flushParagraph()
      if (listType && listType !== bullet.type) flushList()
      listType = bullet.type
      listItems.push(bullet.value)
      continue
    }

    if (isHeadingLine(line)) {
      flushParagraph()
      flushList()
      html.push(`<h3>${escapeHtml(line)}</h3>`)
      continue
    }

    flushList()
    paragraph.push(line)
  }

  flushParagraph()
  flushList()

  return html.join('')
}

export function htmlToBlocks(html) {
  try {
    if (typeof window === 'undefined') {
      const text = (html || '').replace(/<[^>]+>/g, '').trim()
      return { blocks: [{ type: 'paragraph', data: { text } }] }
    }
    const container = document.createElement('div')
    container.innerHTML = html || ''
    const blocks = []

    const pushNode = (node) => {
      if (node.nodeType === 3) {
        const text = (node.textContent || '').trim()
        if (text) blocks.push({ type: 'paragraph', data: { text } })
        return
      }

      if (node.nodeType !== 1) return

      if (node.nodeName === 'P') {
        blocks.push({ type: 'paragraph', data: { text: node.innerHTML } })
        return
      }

      if (/^H[1-6]$/.test(node.nodeName)) {
        const level = Number(node.nodeName.substring(1))
        blocks.push({ type: 'header', data: { level, text: node.innerHTML } })
        return
      }

      if (node.nodeName === 'UL' || node.nodeName === 'OL') {
        const style = node.nodeName === 'UL' ? 'unordered' : 'ordered'
        const items = Array.from(node.querySelectorAll('li')).map(li => li.innerHTML)
        blocks.push({ type: 'list', data: { style, items } })
        return
      }

      Array.from(node.childNodes || []).forEach(pushNode)
    }

    Array.from(container.childNodes).forEach(pushNode)

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

