import { authStart, authCallback, igAuthStart, igAuthCallback, listLeads, fetchLeadsNow, fetchDmHistoryNow, subscribePages, webhook, connectionStatus, disconnect, healthCheck, stream, getWhatsAppConfig, saveWhatsAppConfig, whatsappEmbeddedComplete, fetchWhatsAppTemplates, fetchMetaStructureAndBudgets, fetchDailyMetaInsights, listBusinessPortfolios, connectBusinessPages, debugMetaStatus, listMetaPermissions, getMetaInsights, getMetaStructure, getCampaignLeadCounts, deauthorize, dataDeletion, dataDeletionStatus, getSyncJobStatus, getVideoSource, getAllLeadCounts } from "../../controllers/meta";

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')
  switch (name) {
    case 'authStart':
      return await authStart(event)
    case 'callback':
      return await authCallback(event)
    case 'igAuthStart':
      return await igAuthStart(event)
    case 'igCallback':
      return await igAuthCallback(event)
    case 'leads':
      return await listLeads(event)
    case 'fetchLeads':
      return await fetchLeadsNow(event)
    case 'fetchDmHistory':
      return await fetchDmHistoryNow(event)
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
    case 'getInsights':
      return await getMetaInsights(event)
    case 'getStructure':
      return await getMetaStructure(event)
    case 'businesses':
      return await listBusinessPortfolios(event)
    case 'connectPages':
      return await connectBusinessPages(event)
    case 'debug':
      return await debugMetaStatus(event)
    case 'permissions':
      return await listMetaPermissions(event)
    case 'deauthorize':
      return await deauthorize(event)
    case 'dataDeletion':
      return await dataDeletion(event)
    case 'dataDeletionStatus':
      return await dataDeletionStatus(event)
    case 'syncStatus':
      return await getSyncJobStatus(event)
    case 'campaignLeadCounts':
      return await getCampaignLeadCounts(event)
    case 'videoSource':
      return await getVideoSource(event)
    case 'allLeadCounts':
      return await getAllLeadCounts(event)
    default:
      return { code: 0, error: 'Not found' }
  }
})
