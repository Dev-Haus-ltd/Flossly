import { crmAutomationDefaults, crmAutomationGroups } from '@shared/defaults/crmAutomationDefaults.js'
import { CrmAutomationDictionaryGroup, CrmAutomationDictionaryTemplate } from '../models'

const CATEGORY_BY_GROUP_KEY = {
  manual_responses: 'manual',
  lead_enquiry: 'enquiry',
  composite_bonding: 'enquiry',
  invisalign: 'enquiry',
  check_up: 'enquiry',
  birthday: 'birthday',
  practice_anniversary: 'birthday',
  black_friday: 'seasonal',
  christmas: 'seasonal',
  new_year: 'seasonal',
  valentines: 'seasonal',
  mothers_day: 'seasonal',
  fathers_day: 'seasonal',
  special_occasion: 'seasonal',
}

export const seedCrmAutomationDictionary = async () => {
  const templateMap = new Map(crmAutomationDefaults.map((t) => [t.key, t]))
  let groupsSeeded = 0
  let templatesSeeded = 0

  for (let i = 0; i < crmAutomationGroups.length; i++) {
    const group = crmAutomationGroups[i]
    const [, groupCreated] = await CrmAutomationDictionaryGroup.findOrCreate({
      where: { key: group.key },
      defaults: {
        title: group.title,
        description: group.description || null,
        category: CATEGORY_BY_GROUP_KEY[group.key] || 'enquiry',
        ordering: i,
        status: 'active',
      },
    })
    if (groupCreated) groupsSeeded++

    const keys = Array.isArray(group.templateKeys) ? group.templateKeys : []
    for (let j = 0; j < keys.length; j++) {
      const def = templateMap.get(keys[j])
      if (!def) continue
      const [, tplCreated] = await CrmAutomationDictionaryTemplate.findOrCreate({
        where: { key: def.key },
        defaults: {
          groupKey: group.key,
          type: def.type || 'Email',
          name: def.name,
          subject: def.subject || null,
          template: def.template || null,
          trigger: def.trigger || null,
          whatsappTemplateName: null,
          whatsappTemplateLanguage: null,
          ordering: j,
          status: 'active',
        },
      })
      if (tplCreated) templatesSeeded++
    }
  }

  return { groupsSeeded, templatesSeeded }
}
