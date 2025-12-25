import { listJourneyAutomationGroups, listJourneyAutomationTemplates, saveJourneyAutomationTemplate, toggleJourneyAutomationGroup } from '~/server/controllers/patientJourney'

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'name')
  switch (path) {
    case 'automationGroups':
      return await listJourneyAutomationGroups(event)
    case 'automationTemplates':
      return await listJourneyAutomationTemplates(event)
    case 'automationSave':
      return await saveJourneyAutomationTemplate(event)
    case 'automationToggle':
      return await toggleJourneyAutomationGroup(event)
    default:
      return { code: 1, message: 'Not found' }
  }
})
