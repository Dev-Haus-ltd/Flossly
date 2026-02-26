export const renderBracketTokens = (text, tokens = {}, options = {}) => {
  if (!text) return ''
  const { caseInsensitive = true } = options
  let out = String(text)
  Object.entries(tokens).forEach(([rawKey, rawValue]) => {
    const key = String(rawKey)
    const safeValue = rawValue === undefined || rawValue === null ? '' : String(rawValue)
    const escapedKey = key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
    const pattern = `\\[${escapedKey}\\]`
    const re = new RegExp(pattern, caseInsensitive ? 'gi' : 'g')
    out = out.replace(re, safeValue)
  })
  return out
}

export const renderPatientTokens = (text, ctx = {}) => {
  const tokens = {
    'First Name': ctx.firstName || 'there',
    'Practice Name': ctx.practiceName || 'your practice',
    'Practice Phone': ctx.practicePhone || '',
    'Practice Address': ctx.practiceAddress || '',
    'Date/Time': ctx.dateTime || '',
    'Appointment Date': ctx.appointmentDate || '',
    'Appointment Time': ctx.appointmentTime || '',
  }
  return renderBracketTokens(text, tokens)
}

export const renderOnboardingTokens = (text, ctx = {}) => {
  const tokens = {
    'Name': ctx.name || 'there',
    'Practice Name': ctx.practiceName || 'your practice',
    'Founder Name': ctx.founderName || 'Saba',
    'Success Manager Name': ctx.successManagerName || 'FlosslyOS Team',
    'email': ctx.email || '',
    'Trial End Date': ctx.trialEndDate || '',
    'Trial Days Remaining': ctx.trialDaysRemaining ?? '',
    'Trial Days Remaining Unit': ctx.trialDaysRemainingUnit || '',
    'Trial Days Used': ctx.trialDaysUsed ?? '',
    'Trial Days Used Unit': ctx.trialDaysUsedUnit || '',
    'Trial Total Days': ctx.trialTotalDays ?? '',
    'Trial Total Days Unit': ctx.trialTotalDaysUnit || '',
    'Plan Name': ctx.planName || '',
    'Plan Drift Price': ctx.planDriftPrice || '',
    'Plan Glide Price': ctx.planGlidePrice || '',
    'Plan Soar Price': ctx.planSoarPrice || '',
    'Pricing From Label': ctx.pricingFromLabel || '',
    'Pricing Currency': ctx.pricingCurrency || '',
    'Practice Snapshot': ctx.practiceSnapshot || '',
    'Impact Admin Hours': ctx.impactAdminHours ?? '',
    'Impact Hours Saved': ctx.impactHoursSaved ?? '',
    'Impact Enquiry Loss': ctx.impactEnquiryLoss ?? '',
    'Impact Revenue Recovered': ctx.impactRevenueRecovered ?? '',
    'Impact NoShow Rate': ctx.impactNoShowRate ?? '',
    'Impact NoShow Rate After': ctx.impactNoShowRateAfter ?? '',
    'Impact NoShow Savings': ctx.impactNoShowSavings ?? '',
    'Impact Search Hours': ctx.impactSearchHours ?? '',
    'Impact Total Annual': ctx.impactTotalAnnual ?? '',
    'Impact Hours Returned': ctx.impactHoursReturned ?? '',
    'Tasks Count': ctx.tasksCount || '0',
    'Leads Count': ctx.leadsCount || '0',
    'Automations Count': ctx.automationsCount || '0',
    'Documents Count': ctx.documentsCount || '0',
    'Hours Saved': ctx.hoursSaved || '0',
    'Value Created': ctx.valueCreated || '0',
    'Base URL': ctx.baseUrl || '',
    'Watch Video URL': ctx.watchVideoUrl || '',
    'Start Setup URL': ctx.startSetupUrl || '',
    'Schedule Call URL': ctx.scheduleCallUrl || '',
    'Connect Meta Ads URL': ctx.connectMetaAdsUrl || '',
    'Complete Setup URL': ctx.completeSetupUrl || '',
    'Automation Builder URL': ctx.automationBuilderUrl || '',
    'Set Up Diary URL': ctx.setUpDiaryUrl || '',
    'Recall Setup URL': ctx.recallSetupUrl || '',
    'Activate Automation URL': ctx.activateAutomationUrl || '',
    'Subscribe URL': ctx.subscribeUrl || '',
    'Export Data URL': ctx.exportDataUrl || '',
  }
  return renderBracketTokens(text, tokens)
}

export const renderLeadTokens = (text, ctx = {}) => {
  const tokens = {
    'Name': ctx.name || 'there',
    'Email': ctx.email || '',
    'Telephone': ctx.telephone || '',
    'Your Name': ctx.yourName || 'Team',
  }
  return renderBracketTokens(text, tokens)
}
