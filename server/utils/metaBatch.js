/**
 * Meta Graph API Batch Client
 *
 * Reduces N sequential API calls to ceil(N/50) batch calls.
 * Each batch request is a single HTTP POST to the root Graph API endpoint
 * and can contain up to 50 sub-requests.
 *
 * Also provides withRetry() for exponential backoff on rate-limit errors.
 */

const META_VERSION = 'v24.0'
const BATCH_LIMIT = 50

const RATE_LIMIT_CODES = new Set([4, 17, 32, 613])

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Retry wrapper with exponential backoff.
 * Retries only on Meta rate-limit error codes (4, 17, 32, 613).
 *
 * @param {() => Promise<any>} fn
 * @param {number} maxRetries
 * @param {number} baseDelayMs  delay before first retry; doubles each attempt
 */
export const withRetry = async (fn, maxRetries = 4, baseDelayMs = 1500) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (e) {
      const apiCode = Number(e?.data?.error?.code)
      if (RATE_LIMIT_CODES.has(apiCode) && attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt) // 1.5s, 3s, 6s, 12s
        console.warn(
          `[MetaBatch] Rate limit (code ${apiCode}), retry ${attempt + 1}/${maxRetries} in ${delay}ms`
        )
        await sleep(delay)
        continue
      }
      throw e
    }
  }
}

/** Split array into arrays of at most size n */
export const chunkArray = (arr, n) => {
  const out = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

/**
 * Execute multiple Meta Graph API requests in batch.
 * Automatically chunks into groups of BATCH_LIMIT (50) and fires each chunk
 * as a single HTTP call.
 *
 * @param {{ method: string, relative_url: string }[]} requests
 * @param {string} accessToken
 * @returns {Promise<(object|null)[]>}  one result per input request; null means that sub-request failed
 */
export const metaBatch = async (requests, accessToken) => {
  if (!requests.length) return []

  const allResults = []

  for (const batchChunk of chunkArray(requests, BATCH_LIMIT)) {
    const raw = await withRetry(() =>
      $fetch(`https://graph.facebook.com/${META_VERSION}`, {
        method: 'POST',
        body: new URLSearchParams({
          access_token: accessToken,
          batch: JSON.stringify(batchChunk),
          include_headers: 'false',
        }).toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    )

    const items = Array.isArray(raw) ? raw : []

    for (const item of items) {
      if (!item || item.code !== 200) {
        // Log non-200 sub-request errors for observability but keep going
        if (item?.code && item.code !== 200) {
          try {
            const errBody = JSON.parse(item.body || '{}')
            console.warn('[MetaBatch] Sub-request failed', {
              code: item.code,
              error: errBody?.error?.message,
            })
          } catch {}
        }
        allResults.push(null)
        continue
      }
      try {
        allResults.push(JSON.parse(item.body))
      } catch {
        allResults.push(null)
      }
    }
  }

  return allResults
}
