import { authStart, authCallback, listLeads, fetchLeadsNow, subscribePages, webhook } from "../../controllers/meta";

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')
  switch (name) {
    case 'authStart':
      return await authStart(event)
    case 'callback':
      return await authCallback(event)
    case 'leads':
      return await listLeads(event)
    case 'fetchLeads':
      return await fetchLeadsNow(event)
    case 'subscribe':
      return await subscribePages(event)
    case 'webhook':
      return await webhook(event)
    default:
      return { code: 0, error: 'Not found' }
  }
})

