import {
  authStart,
  authCallback,
  connectionStatus,
  disconnect,
  fetchAvailableSites,
  selectSite,
  fetchSitePages,
  // fetchPageAnalytics,
  getSitePages,
  searchSitePages
} from "../../controllers/google"

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')

  switch (name) {
    // OAuth endpoints
    case 'authStart':
      return await authStart(event)
    case 'callback':
      return await authCallback(event)
    case 'connection':
      return await connectionStatus(event)
    case 'disconnect':
      return await disconnect(event)

    // Google Search Console endpoints
    case 'sites':
      return await fetchAvailableSites(event)
    case 'selectSite':
      return await selectSite(event)
    case 'fetchPages':
      return await fetchSitePages(event)
    // case 'fetchAnalytics':
    //   return await fetchPageAnalytics(event)
    case 'getSitePages':
      return await getSitePages(event)
    case 'searchSitePages':
      return await searchSitePages(event)

    default:
      return { code: 0, error: 'Not found' }
  }
})

