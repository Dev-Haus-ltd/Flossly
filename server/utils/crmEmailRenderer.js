import { template as EMAIL_TEMPLATE } from './emailTemplate.js'
import { renderTokens } from './tokenRenderer.js'

// Static sample context used for previews — no real lead data needed
const SAMPLE_CONTEXT = {
  name: 'Jane Smith',
  firstName: 'Jane',
  email: 'jane.smith@example.com',
  yourName: 'The Practice Team',
  info: 'jane.smith@example.com | 07700 900123 | Invisalign',
  practiceName: 'Your Practice',
  phone: '01234 567890',
  website: 'www.yourpractice.co.uk',
  orgEmail: 'info@yourpractice.co.uk',
  address: '1 Dental Lane, London W1A 1AA',
  street: '1 Dental Lane',
  cityStateZip: 'London W1A 1AA',
  officeHours: 'Mon–Fri 9am–5pm',
  coordinator: 'Sarah',
  principalDentist: 'Dr. Brown',
  location: 'London',
  bookingLink: 'https://yourpractice.co.uk/book',
  diaryBookingLink: 'https://yourpractice.co.uk/diary',
  promoX: '£99',
  promoY: '£299',
  promoZ: '',
  promoHigherAmount: '£599',
  promoDate: '1 May 2026',
  promoTime: '10am',
  promoDateTime: '1 May 2026 at 10am',
  promoMonth: 'May',
  promoDayTime: 'Monday at 10am',
  promoDaysTimes: 'Mon–Fri 9am–5pm',
  futureDate: '15 June 2026',
  dateRange: '1–31 May 2026',
  specificDate: '1 May 2026',
  mothersDayDate: '15 March 2026',
  parkingDetails: 'Free parking available on-site',
  publicTransportDetails: 'Near Tube Station (3 min walk)',
  localCharity: 'local charity',
  localBusiness1: 'local business',
  localBusiness2: '',
  localBusiness3: '',
}

/**
 * Apply the Flossly email layout wrapper or return raw HTML.
 * renderMode='wrapped' → inject into branded template
 * renderMode='raw_html' → return as-is (e.g. HTML pasted from Canva)
 * renderMode='builder'  → return as-is (self-contained GrapeJS output with embedded <style>)
 */
export function applyLayout(html, subject, renderMode = 'wrapped') {
  if (renderMode === 'raw_html' || renderMode === 'builder') return String(html || '')
  return EMAIL_TEMPLATE
    .replaceAll('{subject}', String(subject || ''))
    .replace('{content}', String(html || ''))
}

/**
 * Build a server-side preview using a static sample context.
 * Safe to call without any real lead data.
 */
export function buildPreviewHtml({ subject, template, renderMode = 'wrapped' }) {
  const renderedSubject = renderTokens(String(subject || ''), SAMPLE_CONTEXT, { format: 'text' })
  // Builder mode HTML already contains its own layout — skip token rendering pass on the layout
  const renderedBody = renderTokens(String(template || ''), SAMPLE_CONTEXT, { format: 'html' })
  const html = applyLayout(renderedBody, renderedSubject, renderMode)
  return { subject: renderedSubject, html }
}
