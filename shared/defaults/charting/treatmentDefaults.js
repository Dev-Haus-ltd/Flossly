export const DEFAULT_ORGANISATION_TREATMENTS = [
  // Diagnostic Related Services
  { code: 'EXAM', name: 'Comprehensive Exam', category: 'Diagnostic Related Services', price: 60, defaultDuration: 20 },
  { code: 'REVIEW', name: 'Review Consultation', category: 'Diagnostic Related Services', price: 45, defaultDuration: 15 },
  { code: 'EMERG', name: 'Emergency Assessment', category: 'Diagnostic Related Services', price: 75, defaultDuration: 20 },
  { code: 'XR-BW', name: 'Bitewing X-Ray', category: 'Diagnostic Related Services', price: 25, defaultDuration: 10 },
  { code: 'XR-PA', name: 'Periapical X-Ray', category: 'Diagnostic Related Services', price: 30, defaultDuration: 10 },
  { code: 'XR-OPG', name: 'OPG Radiograph', category: 'Diagnostic Related Services', price: 95, defaultDuration: 20 },
  { code: 'CBCT', name: 'CBCT Scan', category: 'Diagnostic Related Services', price: 180, defaultDuration: 30 },

  // Periodontic Related Services
  { code: 'PER-ASS', name: 'Periodontal Assessment', category: 'Periodontic Related Services', price: 70, defaultDuration: 20 },
  { code: 'SRP-Q', name: 'Scaling and Root Planing (Quadrant)', category: 'Periodontic Related Services', price: 140, defaultDuration: 45 },
  { code: 'PER-MAINT', name: 'Periodontal Maintenance', category: 'Periodontic Related Services', price: 95, defaultDuration: 30 },
  { code: 'GING', name: 'Gingivectomy', category: 'Periodontic Related Services', price: 220, defaultDuration: 45 },

  // Preventive Related Services
  { code: 'SCALE', name: 'Scale and Polish', category: 'Preventive Related Services', price: 80, defaultDuration: 30 },
  { code: 'FLR', name: 'Fluoride Application', category: 'Preventive Related Services', price: 35, defaultDuration: 10 },
  { code: 'SEAL', name: 'Fissure Sealant', category: 'Preventive Related Services', price: 55, defaultDuration: 20 },
  { code: 'WHIT', name: 'Teeth Whitening', category: 'Preventive Related Services', price: 200, defaultDuration: 45 },
  { code: 'OHI', name: 'Oral Hygiene Instruction', category: 'Preventive Related Services', price: 25, defaultDuration: 10 },

  // Surface Related Services
  { code: 'CMP-1', name: 'Composite Filling (1 Surface)', category: 'Surface Related Services', price: 120, defaultDuration: 30 },
  { code: 'CMP-2', name: 'Composite Filling (2 Surfaces)', category: 'Surface Related Services', price: 150, defaultDuration: 35 },
  { code: 'CMP-3', name: 'Composite Filling (3+ Surfaces)', category: 'Surface Related Services', price: 180, defaultDuration: 40 },
  { code: 'AMAL-1', name: 'Amalgam Filling (1 Surface)', category: 'Surface Related Services', price: 95, defaultDuration: 25 },
  { code: 'AMAL-2', name: 'Amalgam Filling (2+ Surfaces)', category: 'Surface Related Services', price: 125, defaultDuration: 30 },
  { code: 'GIC', name: 'Glass Ionomer Filling', category: 'Surface Related Services', price: 90, defaultDuration: 25 },

  // Crowns And Inlays Related Services
  { code: 'CRN-PFM', name: 'PFM Crown', category: 'Crowns And Inlays Related Services', price: 550, defaultDuration: 60 },
  { code: 'CRN-ZR', name: 'Zirconia Crown', category: 'Crowns And Inlays Related Services', price: 650, defaultDuration: 60 },
  { code: 'CRN-E', name: 'Emax Crown', category: 'Crowns And Inlays Related Services', price: 700, defaultDuration: 60 },
  { code: 'INLAY', name: 'Inlay', category: 'Crowns And Inlays Related Services', price: 420, defaultDuration: 45 },
  { code: 'ONLAY', name: 'Onlay', category: 'Crowns And Inlays Related Services', price: 450, defaultDuration: 45 },
  { code: 'VENEER', name: 'Porcelain Veneer', category: 'Crowns And Inlays Related Services', price: 500, defaultDuration: 50 },

  // Oral & Maxillofacial Surgery Related Services
  { code: 'EXT-S', name: 'Simple Extraction', category: 'Oral & Maxillofacial Surgery Related Services', price: 120, defaultDuration: 30 },
  { code: 'EXT-C', name: 'Complex Surgical Extraction', category: 'Oral & Maxillofacial Surgery Related Services', price: 280, defaultDuration: 60 },
  { code: 'WIS', name: 'Wisdom Tooth Extraction', category: 'Oral & Maxillofacial Surgery Related Services', price: 350, defaultDuration: 75 },
  { code: 'ALV', name: 'Alveoloplasty', category: 'Oral & Maxillofacial Surgery Related Services', price: 300, defaultDuration: 60 },

  // Dentures Related Services
  { code: 'DEN-FULL', name: 'Full Denture', category: 'Dentures Related Services', price: 900, defaultDuration: 90 },
  { code: 'DEN-PART', name: 'Partial Denture', category: 'Dentures Related Services', price: 650, defaultDuration: 75 },
  { code: 'DEN-REP', name: 'Denture Repair', category: 'Dentures Related Services', price: 120, defaultDuration: 30 },
  { code: 'DEN-REL', name: 'Denture Reline', category: 'Dentures Related Services', price: 180, defaultDuration: 40 },

  // Implant Services Related Services
  { code: 'IMP-PLAC', name: 'Implant Placement', category: 'Implant Services Related Services', price: 1200, defaultDuration: 90 },
  { code: 'IMP-ABUT', name: 'Implant Abutment', category: 'Implant Services Related Services', price: 350, defaultDuration: 45 },
  { code: 'IMP-CRN', name: 'Implant Crown', category: 'Implant Services Related Services', price: 800, defaultDuration: 60 },
  { code: 'SINUS', name: 'Sinus Lift', category: 'Implant Services Related Services', price: 900, defaultDuration: 90 },
  { code: 'BONE-G', name: 'Bone Graft', category: 'Implant Services Related Services', price: 600, defaultDuration: 60 },

  // Bridges Related Services
  { code: 'BR-3', name: 'Three Unit Bridge', category: 'Bridges Related Services', price: 1400, defaultDuration: 90 },
  { code: 'BR-MD', name: 'Maryland Bridge', category: 'Bridges Related Services', price: 700, defaultDuration: 60 },
  { code: 'BR-TMP', name: 'Temporary Bridge', category: 'Bridges Related Services', price: 250, defaultDuration: 40 },

  // Orthodontic Related Services
  { code: 'ORTH-C', name: 'Orthodontic Consultation', category: 'Orthodontic Related Services', price: 80, defaultDuration: 25 },
  { code: 'BRACES-M', name: 'Metal Braces', category: 'Orthodontic Related Services', price: 2500, defaultDuration: 90 },
  { code: 'BRACES-C', name: 'Ceramic Braces', category: 'Orthodontic Related Services', price: 3200, defaultDuration: 90 },
  { code: 'ALIGN', name: 'Clear Aligners', category: 'Orthodontic Related Services', price: 2800, defaultDuration: 75 },
  { code: 'RET', name: 'Retainer', category: 'Orthodontic Related Services', price: 150, defaultDuration: 20 },

  // Other General Services
  { code: 'RCT-A', name: 'Root Canal (Anterior)', category: 'Other General Services', price: 280, defaultDuration: 60 },
  { code: 'RCT-PM', name: 'Root Canal (Premolar)', category: 'Other General Services', price: 340, defaultDuration: 75 },
  { code: 'RCT-M', name: 'Root Canal (Molar)', category: 'Other General Services', price: 420, defaultDuration: 90 },
  { code: 'POST', name: 'Post and Core', category: 'Other General Services', price: 180, defaultDuration: 40 },
  { code: 'DESEN', name: 'Desensitization Treatment', category: 'Other General Services', price: 70, defaultDuration: 20 },

  // Miscellaneous
  { code: 'NIGHT', name: 'Night Guard', category: 'Miscellaneous', price: 180, defaultDuration: 30 },
  { code: 'SPORT', name: 'Sports Guard', category: 'Miscellaneous', price: 140, defaultDuration: 30 },
  { code: 'LETTER', name: 'Dental Report / Letter', category: 'Miscellaneous', price: 40, defaultDuration: 15 },
  { code: 'N2O', name: 'Nitrous Oxide Sedation', category: 'Miscellaneous', price: 130, defaultDuration: 30 },
]
