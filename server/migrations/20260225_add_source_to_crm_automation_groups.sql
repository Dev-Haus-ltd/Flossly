ALTER TABLE IF EXISTS "CrmAutomationGroups"
  ADD COLUMN IF NOT EXISTS "source" VARCHAR(32) DEFAULT 'custom';

UPDATE "CrmAutomationGroups"
SET "source" = 'system'
WHERE key IN (
  'manual_responses',
  'lead_enquiry',
  'composite_bonding',
  'invisalign',
  'check_up',
  'black_friday',
  'christmas',
  'new_year',
  'valentines',
  'mothers_day',
  'birthday',
  'practice_anniversary',
  'fathers_day',
  'special_occasion',
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
