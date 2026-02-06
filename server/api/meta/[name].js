import { authStart, authCallback, listLeads, fetchLeadsNow, subscribePages, webhook, connectionStatus, disconnect, healthCheck, stream, getWhatsAppConfig, saveWhatsAppConfig, whatsappEmbeddedComplete, fetchWhatsAppTemplates, fetchMetaStructureAndBudgets, fetchDailyMetaInsights, listBusinessPortfolios, connectBusinessPages, debugMetaStatus, listMetaPermissions } from "../../controllers/meta";

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
    case 'connection':
      return await connectionStatus(event)
    case 'health':
      return await healthCheck(event)
    case 'disconnect':
      return await disconnect(event)
    case 'whatsappConfig':
      if (getMethod(event) === 'GET') return await getWhatsAppConfig(event)
      return await saveWhatsAppConfig(event)
    case 'whatsappEmbedded':
      return await whatsappEmbeddedComplete(event)
    case 'whatsappTemplates':
      return await fetchWhatsAppTemplates(event)
    case 'stream':
      return await stream(event)
    case 'webhook':
      return await webhook(event)
    case 'syncStructure':
      return await fetchMetaStructureAndBudgets(event)
    case 'syncInsights':
      return await fetchDailyMetaInsights(event)
    case 'businesses':
      return await listBusinessPortfolios(event)
    case 'connectPages':
      return await connectBusinessPages(event)
    case 'debug':
      return await debugMetaStatus(event)
    case 'permissions':
      return await listMetaPermissions(event)
    default:
      return { code: 0, error: 'Not found' }
  }
})
