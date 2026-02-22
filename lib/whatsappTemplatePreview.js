export const getTemplateComponent = (template, type) => {
  if (!template?.components) return null
  return template.components.find((c) => String(c?.type || '').toLowerCase() === type)
}

export const getTemplateParamCount = (template) => {
  const body = getTemplateComponent(template, 'body')
  const text = String(body?.text || '')
  const matches = [...text.matchAll(/\{\{\s*(\d+)\s*\}\}/g)]
  let max = 0
  matches.forEach((m) => {
    const n = Number(m[1] || 0)
    if (n > max) max = n
  })
  return max
}

export const getTemplateParamExamples = (template) => {
  const body = getTemplateComponent(template, 'body')
  const example = body?.example?.body_text?.[0] || []
  return Array.isArray(example) ? example : []
}

export const applyTemplateParams = (text = '', params = []) => {
  let out = String(text || '')
  params.forEach((val, idx) => {
    const re = new RegExp(`\\{\\{\\s*${idx + 1}\\s*\\}\\}`, 'g')
    out = out.replace(re, String(val ?? ''))
  })
  return out
}

export const buildTemplatePreviewLines = (template, params = []) => {
  if (!template) return null
  const header = getTemplateComponent(template, 'header')
  const body = getTemplateComponent(template, 'body')
  const footer = getTemplateComponent(template, 'footer')
  const lines = []
  if (header?.text) lines.push(applyTemplateParams(header.text, params))
  if (body?.text) lines.push(applyTemplateParams(body.text, params))
  if (footer?.text) lines.push(applyTemplateParams(footer.text, params))
  return lines.length ? lines : null
}
