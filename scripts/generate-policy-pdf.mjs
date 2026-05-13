import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { jsPDF } from 'jspdf'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const sourcePath = path.join(repoRoot, 'docs', 'Updated_Onboarding_And_Commercial_Policy_2026-05-13.md')
const outputPath = path.join(repoRoot, 'docs', 'Updated_Onboarding_And_Commercial_Policy_2026-05-13.pdf')

const raw = fs.readFileSync(sourcePath, 'utf8').replace(/\r\n/g, '\n')
const lines = raw.split('\n')

const doc = new jsPDF({
  orientation: 'p',
  unit: 'pt',
  format: 'a4',
})

const pageWidth = doc.internal.pageSize.getWidth()
const pageHeight = doc.internal.pageSize.getHeight()
const marginX = 48
const topMargin = 54
const bottomMargin = 54
const usableWidth = pageWidth - marginX * 2
const maxY = pageHeight - bottomMargin

let y = topMargin

const addPageIfNeeded = (requiredHeight = 0) => {
  if (y + requiredHeight <= maxY) return
  doc.addPage()
  y = topMargin
}

const writeWrapped = (text, fontSize, opts = {}) => {
  const {
    indent = 0,
    bold = false,
    gapAfter = 8,
  } = opts

  doc.setFont('helvetica', bold ? 'bold' : 'normal')
  doc.setFontSize(fontSize)
  const wrapped = doc.splitTextToSize(text, usableWidth - indent)
  const lineHeight = fontSize * 1.35
  addPageIfNeeded(wrapped.length * lineHeight + gapAfter)
  doc.text(wrapped, marginX + indent, y)
  y += wrapped.length * lineHeight + gapAfter
}

for (const line of lines) {
  const trimmed = line.trim()

  if (!trimmed) {
    y += 6
    continue
  }

  if (trimmed.startsWith('# ')) {
    writeWrapped(trimmed.slice(2), 19, { bold: true, gapAfter: 14 })
    continue
  }

  if (trimmed.startsWith('## ')) {
    y += 6
    writeWrapped(trimmed.slice(3), 13, { bold: true, gapAfter: 8 })
    continue
  }

  if (trimmed.startsWith('- ')) {
    writeWrapped(`- ${trimmed.slice(2)}`, 10.5, { indent: 10, gapAfter: 5 })
    continue
  }

  writeWrapped(trimmed, 10.5, { gapAfter: 7 })
}

doc.save(outputPath)
console.log(outputPath)
