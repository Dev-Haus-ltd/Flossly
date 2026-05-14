const USER_AGENT = 'Mozilla/5.0 (compatible; FlosslyTreatmentPlanBot/1.0)'

const asString = (value = '') => String(value || '').trim()

function toAbsoluteUrl(url = '', baseUrl = '') {
  try {
    return new URL(url, baseUrl).toString()
  } catch {
    return ''
  }
}

function decodeHtmlEntities(value = '') {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
}

function stripHtml(html = '') {
  return decodeHtmlEntities(
    String(html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
  ).trim()
}

function extractMetaTag(html = '', name = '') {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i')
  return decodeHtmlEntities(html.match(regex)?.[1] || '')
}

function extractTitle(html = '') {
  return decodeHtmlEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '')
}

function extractFirstImage(html = '', baseUrl = '') {
  const src = html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] || ''
  return toAbsoluteUrl(src, baseUrl)
}

function extractLinksFromDuckDuckGo(html = '') {
  const links = []
  const regex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
  let match
  while ((match = regex.exec(html)) && links.length < 5) {
    const rawHref = decodeHtmlEntities(match[1] || '')
    const label = stripHtml(match[2] || '')
    let href = rawHref
    const uddgMatch = rawHref.match(/[?&]uddg=([^&]+)/i)
    if (uddgMatch?.[1]) {
      try {
        href = decodeURIComponent(uddgMatch[1])
      } catch {}
    }
    if (!/^https?:\/\//i.test(href)) continue
    links.push({ url: href, label })
  }
  return links
}

async function fetchText(url = '') {
  if (!url) return ''
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    const response = await fetch(url, {
      headers: { 'user-agent': USER_AGENT },
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!response.ok) return ''
    return await response.text()
  } catch {
    return ''
  }
}

async function inspectPage(url = '', label = '') {
  const html = await fetchText(url)
  if (!html) return null
  const ogImage = extractMetaTag(html, 'og:image')
  const description = extractMetaTag(html, 'description') || extractMetaTag(html, 'og:description')
  const title = extractTitle(html)
  const text = stripHtml(html).slice(0, 5000)
  return {
    url,
    label: label || title || url,
    title,
    description,
    imageUrl: toAbsoluteUrl(ogImage || extractFirstImage(html, url), url),
    text,
  }
}

async function searchWeb(query = '') {
  const q = asString(query)
  if (!q) return []
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`
  const html = await fetchText(url)
  if (!html) return []
  return extractLinksFromDuckDuckGo(html)
}

export async function gatherTreatmentPlanResearch({
  organisationName = '',
  website = '',
  practitioners = [],
}) {
  const sources = []
  const warnings = []

  const normalizedWebsite = /^https?:\/\//i.test(asString(website)) ? asString(website) : ''
  if (normalizedWebsite) {
    const page = await inspectPage(normalizedWebsite, 'Organisation website')
    if (page) sources.push(page)
    else warnings.push('Unable to read organisation website for treatment plan enrichment.')
  }

  if (!sources.length && organisationName) {
    const orgResults = await searchWeb(`${organisationName} dental practice`)
    if (orgResults.length) {
      const page = await inspectPage(orgResults[0].url, orgResults[0].label || 'Search result')
      if (page) sources.push(page)
    } else {
      warnings.push('No public search result found for the organisation.')
    }
  }

  const practitionerResearch = []
  for (const practitioner of practitioners.slice(0, 3)) {
    const name = asString(practitioner?.name)
    if (!name) continue
    const results = await searchWeb(`${name} ${organisationName} dentist`)
    if (!results.length) continue
    const page = await inspectPage(results[0].url, results[0].label || name)
    if (!page) continue
    practitionerResearch.push({
      id: practitioner?.id ?? null,
      name,
      role: asString(practitioner?.role || 'Dentist'),
      url: page.url,
      label: page.label,
      imageUrl: page.imageUrl,
      text: page.text,
    })
  }

  const primarySource = sources[0] || null
  return {
    organisation: primarySource
      ? {
          url: primarySource.url,
          label: primarySource.label,
          title: primarySource.title,
          description: primarySource.description,
          imageUrl: primarySource.imageUrl,
          text: primarySource.text,
        }
      : null,
    practitioners: practitionerResearch,
    sources: [
      ...sources.map((item) => ({ label: item.label, url: item.url })),
      ...practitionerResearch.map((item) => ({ label: item.label, url: item.url })),
    ],
    warnings,
  }
}
