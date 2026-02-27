UPDATE "CrmAutomationGroups"
SET "source" = 'legacy'
WHERE key IN (
  'new_patient_enquiry',
  'black_friday_enquiry',
  'general_lead_nurture',
  'birthday_gift',
  'lead_enquiry_whatsapp',
  'composite_bonding_whatsapp',
  'invisalign_whatsapp',
  'check_up_whatsapp',
  'black_friday_whatsapp',
  'christmas_whatsapp',
  'new_year_whatsapp',
  'valentines_whatsapp',
  'mothers_day_whatsapp',
  'fathers_day_whatsapp',
  'special_occasion_whatsapp'
);
