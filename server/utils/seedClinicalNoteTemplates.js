import sequelize from './db'
import {
  ClinicalNoteTemplate,
  ClinicalNoteTemplateVersion,
} from '../models'
import {
  createClinicalTemplateWithVersion,
  updateClinicalTemplateWithVersion,
} from './clinicalNoteTemplates'

const DIAGNOSIS_TYPE = 'diagnosis'

const SYSTEM_TEMPLATE_SEED = [
  {
    key: 'ai_adult_exam',
    title: 'AI Adult Exam',
    type: DIAGNOSIS_TYPE,
    category: 'ai',
    sortOrder: 10,
    isDefault: true,
    content: `EXAM

Nurse: [Name of nurse assisting]

Chief complaint: [Describe patients reason for visit such as pain, lost filling etc.]

HISTORY

Medical history: [e.g. checked, updated see medical history tab or details provided]

Social History

Smoking: [e.g. never, ex-smoker, daily, occasional, vape user]
Alcohol intake: [e.g. none, rare, <14 units/week, >14 units/week]
Other: [e.g. none, dietary habits, occupation ]

Dental History

Last dental visit: [e.g. 6 months ago, 1 year ago, unknown]
Brushing: [e.g. twice daily with ETB]
Interdental cleaning: [e.g. none, floss, tepe, woodsticks, water flosser]

EXAMINATION

Extraoral[For each extraoral exam item: NAD or describe findings]

Facial symmetry:
Skin:
TMJ:
Jaw movement & MOM:
Salivary glands:
Neck/Lymph nodes:

Intraoral soft tissues[For each intraoral exam item: NAD or describe findings]

Labial:
Buccal:
Sulcus mucosa:
Palatal mucosa:
Floor of mouth:
Tongue:

Dental exam[For each dental exam item: NAD or describe findings]

Caries:
Restorations:
Wear/fractures:
Occlusion:
Other observations:

Periodontal Assessment

BPE: See BPE tab
Gingivae: [NAD or describe findings such as bleeding, recession, plaque]

Radiographs

[Describe radiographic types taken or not taken]
[Describe findings or justification if taken]

Risk Assessment

Caries: [Low / Med / High]
Perio: [Low / Med / High]
Oral cancer: [Low / Med / High]

DIAGNOSIS & TREATMENT PLAN

Diagnosis

[e.g., Healthy dentition, early caries UR6, generalised incisal wear, defective composite]

Advice Given

[e.g. oral hygiene instruction, dietary, monitoring, post-op advice]

Treatment Plan

[List treatment planned items such as restorative work, preventive care or referral plan]

Discussion & Consent

[e.g. Diagnosis and options discussed, risks explained, patient consented, patient questions answered]

Next Appointment

[Describe next steps such as 6-month recall or treatment to be scheduled]`,
  },
  {
    key: 'ai_child_exam',
    title: 'AI Child Exam',
    type: DIAGNOSIS_TYPE,
    category: 'ai',
    sortOrder: 20,
    isDefault: false,
    content: `CHILD DENTAL EXAM

Nurse: [Name of nurse assisting]
Accompanied by: [e.g. Parent, Guardian, Carer or describe relation]
Chief complaint: [Describe patients reason for visit such as pain, lost filling etc.]

HISTORY

Medical history: [e.g. checked, updated see medical history tab or details provided]

Social History

Diet: [e.g. Sugary snacks/drinks, bottle use, bedtime milk or describe other dietary risks]
Oral habits: [e.g. none, dummy, thumb sucking, nail biting, mouth breathing or describe other]
Other: (Remove subheading if none mentioned)

Dental History

Dental history: [e.g. describe when last seen, any known conditions or previous treatment if mentioned]
Brushing: [e.g. twice daily with ETB]
Interdental cleaning: [e.g. none, floss, tepe, woodsticks, water flosser]

EXAMINATION

Extraoral[For each extraoral exam item: NAD or describe findings]

Face:
Skin:
TMJ:
Jaw movement & MOM:
Salivary glands:
Neck:
Lymph nodes:

Intraoral soft tissues[For each intraoral exam item: NAD or describe findings]

Labial:
Buccal:
Sulcus mucosa:
Palatal mucosa:
Floor of mouth:
Tongue:

Dental exam

Dentition stage: [Primary / Mixed / Permanent]
Caries: [NAD or describe findings]
Restorations: [NAD or describe findings]
Occlusion: [NAD or describe findings]
Wear/fractures: [NAD or describe findings]
Other observations: [NAD or describe findings]

Periodontal Assessment

Gingivae: [NAD or describe findings]

Radiographs

[Describe radiographic types taken or not taken]
[Describe findings or justification if taken]

Risk Assessment

Caries: [Low / Med / High]
Perio: [Low / Med / High]
Oral cancer: [Low / Med / High]

DIAGNOSIS & TREATMENT PLAN

Diagnosis

[e.g. Caries in primary molars, normal exfoliation, ectopic eruption, early crowding etc.]

Advice Given

[e.g. OHI tailored to age, dietary advice, fluoride, habit cessation, eruption monitoring etc.]

Treatment Plan

[List treatment planned items such as restorative work, preventive care or referral plan]

Discussion & Consent

[e.g. Findings and options discussed with parent/carer, risks explained, consent obtained, child engaged where appropriate etc.]

Next Appointment

[Describe next steps such as 6-month recall or treatment to be scheduled]`,
  },
  {
    key: 'adult_emergency',
    title: 'Adult Emergency',
    type: DIAGNOSIS_TYPE,
    category: 'user',
    sortOrder: 30,
    isDefault: false,
    content: `Verbal consent obtained for examination

Pt attended with .PR Approved

RFA: Emergency apt.

CO:

HPC:

Site of pain -

Onset -

Character of pain -

Radiation -

Associations (other symptoms) -

Time (spontaneous?) -

Exacerbates/Relieves -

Severity (?/10) -

MH: Checked & signed

SH:

Smoker - Non-smoker,

Alcohol - within guidelines

Anxiety level - Low/Medium/High

-----------------------------------------------------------------

E/O Examination:

Oral Cancer Screen- Clear

TMJ: NAD

Lymphadenopathy: NAD

MOM: NAD

Asymmetry: NAD

Lips: Competent/Incompetent

I/O Examination:

Lips: NAD

Commissures: NAD

Soft and Hard Palate/Fauces: NAD

Retro-molar pad - NAD

Buccal & Labial mucosa: NAD

Buccal Sulcus: NAD

Dorsal & Ventral surfaces of tongue - NAD

Lateral border of tongue - NAD

FOM: NAD

Salivary Glands: NAD

Justification of SI:

Vitality Testing

Trauma Chart

LBW/RBW/PA/OPT -Routine caries assessment- assess for caries

-Assess for apical pathology and bone levels

-Assess for mixed dentition

Grade: Diagnostically Acceptable/Not Diagnostically Acceptable

Teeth Present: 18,17,16,15,14,13,12,11/21,22,23,24,25,26,27,28

48,47,46,45,44,43,42,41/31,32,33,34,35,36,37,38

Restorations present in: 18,17,16,15,14,13,12,11/21,22,23,24,25,26,27,28

48,47,46,45,44,43,42,41/31,32,33,34,35,36,37,38

Pathology: Radiolucencies associated with tooth ( N ) indicative of caries

Radiolucencies associated with tooth ( N ) indicative of secondary caries

Radiolucencies associated with tooth ( N ) indicative of apical periodontitis

Radiopacities associated with tooth ( N ) indicative of calculus

Bone Levels: % Generalised/Localised Horizontal Bone loss

% Vertical Bone Loss

Diagnoses

Periodontal Diagnosis: Localised/Generalised plaque-induced gingivitis

Localised/Generalised Periodontitis Stage: 1/2/3/4 Grade: A/B/C

Risk Factors; Gingivitis/Smoker/Pregnancy/Condition/Restorations

In Remission/Active

Coronal Diagnosis:

Pulpal Diagnosis:

Periapical Diagnosis:

Prosthodontic Diagnosis: Kennedy Class 1 Mod

Kennedy Class 2 Mod

Kennedy Class 3 Mod

Kennedy Class 4 Mod

D/W pt:

Trx Plan

Next Appt:

Pt understands the above care plan, the involved risks and benefits of all offered treatment options (including doing nothing) and is happy with the joint decision above

Patient Record Form (01/04/2018 R7) Validated and Seen by patient

Examination completed: Dr J Malik GDC No: 289641

Nurse: GDC No:`,
  },
  {
    key: 'adult_full_examination',
    title: 'Adult Full Examination',
    type: DIAGNOSIS_TYPE,
    category: 'user',
    sortOrder: 40,
    isDefault: false,
    content: `Verbal Consent Obtained for Examination

RFA/PCO: Examination. No complaints

HPC: None

RMH: Completed and Checked See Medical Proforma (case notes). Fit and well to continue

PDH:

History of Trauma: Yes/No

Last Trx completed: Dental Anxiety: Mild/ Moderate/ Severe Needle phobic: +/-

Restorations: Lightly/Moderately/Heavily Restored

Toothpaste: Fluoridated;ETB/MTB; Once/Twice Daily; Spit/Rinse

Adjuncts: M/W/TePe/Floss/Water Floss/Nil

Diet: Meals: Snacks: Low frequency of sugar <3 Fav Food: Fav Drink:

Caries Risk: High/Low

FH/SH/ Pt Availability:

Smoker: Yes/No years: amount: p/day

Alcohol: < within/above recommended levels (10 units recommended)

Occupation:

Stress: Mild/Moderate/Severe

E/O Examination:

Oral Cancer Screen- Clear

TMJ: NAD

Lymphadenopathy: NAD

MOM: NAD

Asymmetry: NAD

Lips: Competent/Incompetent

I/O Examination:

Lips: NAD

Commissures: NAD

Soft and Hard Palate/Fauces: NAD

Retro-molar pad - NAD

Buccal & Labial mucosa: NAD

Buccal Sulcus: NAD

Dorsal & Ventral surfaces of tongue - NAD

Lateral border of tongue - NAD

FOM: NAD

Salivary Glands: NAD

Periodontal Tissues:

Plaque Present: mild/moderate/severe

Calculus Present: Yes/No; as charted/nil

Oral Hygiene: poor/moderate/good/excellent

BPE: 000/000 Mobility: G1/2/3/ Nil Recession: Millers I/II/III/IV Generalised/Localised Furcation: G1/2/3/ Nil

Clinical Notes:

Occlusion: Class 1/ 2 Div 1 Div2 / Pseudo/ 3/ AOB

Guidance: LHS; Canine/Group RHS; Canine/Group

Angles Class: Molars(LHS): I/II/III I/II/III (RHS): I/II/III

Skeletal Classification: 1/2/3

RCP-ICP:

Toothwear: Attrition/Abrasion/Erosion/Abfraction present (see photos)

TSL Risk:

BEWE: 000/000 Limited to enamel/dentin

Crowding: none/mild/moderate/severe/spaced

Justification of SI: LBW/RBW/LVBW/RVBW/PA/OPT -Routine caries assessment- assess for caries

-Assess for apical pathology and bone levels

-Assess for mixed dentition

Grade: Diagnostically Acceptable/Not Diagnostically Acceptable

Teeth Present:

18,17,16,15,14,13,12,11/21,22,23,24,25,26,27,28

48,47,46,45,44,43,42,41/31,32,33,34,35,36,37,38

Restorations present in:

18,17,16,15,14,13,12,11/21,22,23,24,25,26,27,28

48,47,46,45,44,43,42,41/31,32,33,34,35,36,37,38

Pathology: Radiolucencies associated with tooth ( N ) indicative of caries

Radiolucencies associated with tooth ( N ) indicative of secondary caries

Radiolucencies associated with tooth ( N ) indicative of apical periodontitis

Radiopacities associated with tooth ( N ) indicative of calculus

Bone Levels: % Generalised/Localised Horizontal Bone loss

% Vertical Bone Loss

Diagnosis:

-no issues currently present

Periodontal Diagnosis:

Localised/Generalised plaque-induced gingivitis

Localised/Generalised Periodontitis Stage: 1/2/3/4 Grade: A/B/C  Risk Factors; Gingivitis/Smoker/Pregnancy/ In Remission/Active/Currently Stable BOP< 10%+

Coronal Diagnosis:

Pulpal Diagnosis:

Periapical Diagnosis:

Prosthodontic Diagnosis:

Kennedy Class 1 Mod

Kennedy Class 2 Mod

Kennedy Class 3 Mod

Kennedy Class 4 Mod

Nil

D/w pt:

Guarded Prognosis: Pallative Trx/XLA;

TP:

Pain: XLA/EXTIRPATE

Stabilisation Phase

1a) OHI, TBI, Baseline indices, FV application, Prescribe NaFl 2800/5000 ppm

1b) Supra-PMPR + RV 6/52 weeks

2) Periodontal Therapy

1st Visit; OHI, Indices, 6PPC, IP Debridement

2nd Visit; R/V 6PPC+/- Sub-PMPR 4mm+BOP (8 weeks post)

Restorative Phase

3) Restore

4) Referral RCT

Advanced Phase

5) Orthodontic Therapy

5) Crown

5) Implants

5) Implant Retained Prosthesis referral

5)CoCr/Acrylic Partial/Complete Maxillary/Mandibular Denture

Trx completed today:

1) OHI

- reinforced MTB/ETB modified-bass technique, to brush x2/day with fluoridated toothpaste (1450/2800/5000ppm) normal/as advised/as normal; spit not rinse

- diet advice to reduce frequency of sugars

- use straw when consuming carbonated beverages to reduce exposure and substitute with

water wherever possible<frequency less than 3 per/week

Pt understands the above care plan, the involved risks and benefits of all offered treatment options (including doing nothing) and is happy with the joint decision above

Patient Record Form Validated and Seen by patient

Examination completed: Dr J Malik GDC No: 289641

Nurse: GDC No:`,
  },
  {
    key: 'periodntial_discussion',
    title: 'Periodntial discussion',
    type: DIAGNOSIS_TYPE,
    category: 'user',
    sortOrder: 50,
    isDefault: false,
    content: `Gingivitis: Reversible gum inflammation.
Periodontitis: Irreversible inflammation affecting gums, tooth attachments and bone.

Treatment

Gingivitis: Improve oral hygiene in 14-21 days with modified Bass brushing, twice-daily fluoridated toothpaste (≥1450 ppm), spitting (not rinsing) and reduced sugar intake. May require Supra PMPR (removal of superficial plaque biofilm)
Periodontitis: As above but combined with sub PMPR (removal of superficial plaque biofilm)can halt progression with Non-Surgical Periodontal Treatment (NSPT), enhanced oral hygiene and regular maintenance.

Risks

Supra/Sub PMPR Treatment Risks: Discomfort, bleeding, swelling, temporary sensitivity, rare infection and potential unsuccessful treatment
Poor Compliance Risks: Gingivitis progression to periodontitis, further tissue/bone loss, tooth mobility/loss, systemic health implications and increased treatment complexity/cost.`,
  },
  {
    key: 'pmpr_proforma',
    title: 'PMPR Proforma',
    type: DIAGNOSIS_TYPE,
    category: 'user',
    sortOrder: 60,
    isDefault: false,
    content: `Verbal Consent Obtained for PMPR

RFA/PCO: R/V OH + Baseline Indices+  PMPR . No complaints

HPC: None

RMH: Completed, Checked and Signed. See Medical Tab. Fit and well to continue

-----------------------------------------------------------------

E/O Examination:

Oral Cancer Screen- Clear

TMJ: NAD

Lymphadenopathy: NAD

MOM: NAD

Asymmetry: NAD

Lips: Competent/Incompetent

I/O Examination:

Lips: NAD

Commissures: NAD

Soft and Hard Palate/Fauces: NAD

Retro-molar pad - NAD

Buccal & Labial mucosa: NAD

Buccal Sulcus: NAD

Dorsal & Ventral surfaces of tongue - NAD

Lateral border of tongue - NAD

FOM: NAD

Salivary Glands: NAD

This Appt:

Trx completed:

1. OHI, TBI, Baseline Indices, Supra PMPR

2) Review in 3/12 months with GDP to assess gingival

3) Recall 6/12 month re low perio risk

Next Appt: Review with GDP in 3/12 months

Pt understands the above care plan, the involved risks and benefits of all offered treatment options (including doing nothing) and is happy with the joint decision above

Patient Record Form (01/04/2018 R7) Validated and Seen by patient

Examination completed: Dr J Malik GDC No: 289641

Nurse: GDC No:`,
  },
  {
    key: 'whitening_proforma',
    title: 'Whitening Proforma',
    type: DIAGNOSIS_TYPE,
    category: 'user',
    sortOrder: 70,
    isDefault: false,
    content: `Verbal Consent Obtained for cosmetic consultation.

RFA/PCO: Consultation.

Verbal Consent Obtained for Examination

RFA/PCO: Examination. No complaints

HPC: None

RMH: Completed and Checked See Medical Proforma (case notes). Fit and well to continue

PDH:

History of Trauma: Yes/No

Last Trx completed: Dental Anxiety: Mild/ Moderate/ Severe Needle phobic: +/-

Restorations: Lightly/Moderately/Heavily Restored

Toothpaste: Fluoridated;ETB/MTB; Once/Twice Daily; Spit/Rinse

Adjuncts: M/W/TePe/Floss/Water Floss/Nil

Diet: Meals: Snacks: Low frequency of sugar <3 Fav Food: Fav Drink:

Caries Risk: High/Low

FH/SH/ Pt Availability:

Smoker: Yes/No years: amount: p/day

Alcohol: < within/above recommended levels (10 units recommended)

Occupation:

Stress: Mild/Moderate/Severe

E/O Examination:

Oral Cancer Screen- Clear

TMJ: NAD

Lymphadenopathy: NAD

MOM: NAD

Asymmetry: NAD

Lips: Competent/Incompetent

I/O Examination:

Lips: NAD

Commissures: NAD

Soft and Hard Palate/Fauces: NAD

Retro-molar pad - NAD

Buccal & Labial mucosa: NAD

Buccal Sulcus: NAD

Dorsal & Ventral surfaces of tongue - NAD

Lateral border of tongue - NAD

FOM: NAD

Salivary Glands: NAD

Periodontal Tissues:

Plaque Present: mild/moderate/severe

Calculus Present: Yes/No; as charted/nil

Oral Hygiene: poor/moderate/good/excellent

BPE: 000/000 Mobility: G1/2/3/ Nil Recession: Millers I/II/III/IV Generalised/Localised Furcation: G1/2/3/ Nil

Clinical Notes:

Occlusion: Class 1/ 2 Div 1 Div2 / Pseudo/ 3/ AOB

Guidance: LHS; Canine/Group RHS; Canine/Group

Angles Class: Molars(LHS): I/II/III I/II/III (RHS): I/II/III

Skeletal Classification: 1/2/3

RCP-ICP:

Toothwear: Attrition/Abrasion/Erosion/Abfraction present (see photos)

TSL Risk:

BEWE: 000/000 Limited to enamel/dentin

Crowding: none/mild/moderate/severe/spaced

Justification of SI: LBW/RBW/LVBW/RVBW/PA/OPT -Routine caries assessment- assess for caries

-Assess for apical pathology and bone levels

-Assess for mixed dentition

Grade: Diagnostically Acceptable/Not Diagnostically Acceptable

Teeth Present:

18,17,16,15,14,13,12,11/21,22,23,24,25,26,27,28

48,47,46,45,44,43,42,41/31,32,33,34,35,36,37,38

Restorations present in:

18,17,16,15,14,13,12,11/21,22,23,24,25,26,27,28

48,47,46,45,44,43,42,41/31,32,33,34,35,36,37,38

Pathology: Radiolucencies associated with tooth ( N ) indicative of caries

Radiolucencies associated with tooth ( N ) indicative of secondary caries

Radiolucencies associated with tooth ( N ) indicative of apical periodontitis

Radiopacities associated with tooth ( N ) indicative of calculus

Bone Levels: % Generalised/Localised Horizontal Bone loss

% Vertical Bone Loss

Diagnosis:

-no issues currently present

Periodontal Diagnosis:

Localised/Generalised plaque-induced gingivitis

Localised/Generalised Periodontitis Stage: 1/2/3/4 Grade: A/B/C Risk Factors; Gingivitis/Smoker/Pregnancy/ In Remission/Active/Currently Stable BOP< 10%+

Coronal Diagnosis:

Pulpal Diagnosis:

Periapical Diagnosis:

Prosthodontic Diagnosis:

Kennedy Class 1 Mod

Kennedy Class 2 Mod

Kennedy Class 3 Mod

Kennedy Class 4 Mod

Nil

D/w pt:

• pt enquired about tooth whitening - explained risks and benefits, costs,
• how to use and appts required,
• if having composite bonding will have to wait 2 weeks to not compromise bonding success
• pt will think about it and book appt if they wish to go ahead.
• Risks, Side Effects and Contraindications
o Sensitivity: Temporary sensitivity during or after treatment
o Gingival Irritation: Potential gum irritation or inflammation
o Tooth or Restoration Discoloration: Uneven whitening or discoloration
o Unsuccessful Treatment: Inadequate whitening or relapse
o Over-Whitening: Translucent enamel risk
o Contraindications: Pregnancy, breastfeeding, sensitive teeth/gums, untreated cavities
• Pt understands the treatment benefits, risks and limitations
• Acknowledgement of pre-treatment oral health status
• Verbal Consent for below treatment given, pt aware of risks and potential side effects and to continue with any proposed trx only when written consent confirmed.
• Pt to be be provided with trx plan, fees via email which will include conclusion of todays exam and any necessary consent requiring signing.
• Pt has been advised their right to seek a second opinion, as well, if any information provided is unclear may contact practice/practitioner to discuss

Guarded Prognosis: Pallative Trx/XLA;

TP:

Pain: XLA/EXTIRPATE

Stabilisation Phase

1a) OHI, TBI, Baseline indices, FV application, Prescribe NaFl 2800/5000 ppm

1b) Supra-PMPR + RV 6/52 weeks

2) Periodontal Therapy

1st Visit; OHI, Indices, 6PPC, IP Debridement

2nd Visit; R/V 6PPC+/- Sub-PMPR 4mm+BOP (8 weeks post)

Restorative Phase

3) Restore

4) Referral RCT

Advanced Phase

5) Orthodontic Therapy

5) Crown

5) Implants

5) Implant Retained Prosthesis referral

5)CoCr/Acrylic Partial/Complete Maxillary/Mandibular Denture

Trx completed today:

1) OHI

- reinforced MTB/ETB modified-bass technique, to brush x2/day with fluoridated toothpaste (1450/2800/5000ppm) normal/as advised/as normal; spit not rinse

- diet advice to reduce frequency of sugars

- use straw when consuming carbonated beverages to reduce exposure and substitute with

water wherever possible<frequency less than 3 per/week

Pt understands the above care plan, the involved risks and benefits of all offered treatment options (including doing nothing) and is happy with the joint decision above

Patient Record Form Validated and Seen by patient

Examination completed: Dr J Malik GDC No: 289641

Nurse: GDC No:

Current tooth shade:

Whitening Treatment Plan

1. Type of Whitening: In-office, at-home or combination
2. Whitening Agent: Specify product and concentration (e.g., hydrogen peroxide, carbamide peroxide)
3. Application Method: Tray, strip or in-office application
4. Treatment Duration: Number of sessions or treatment days
5. Cost and Payment Terms: Outline treatment cost, payment schedule and refund policy`,
  },
]

let _seedAttempted = false

async function hasClinicalNoteTemplateTables() {
  const schema = sequelize?.options?.define?.schema || null
  try {
    const queryInterface = sequelize.getQueryInterface()
    const templatesTable = schema
      ? { tableName: 'ClinicalNoteTemplates', schema }
      : 'ClinicalNoteTemplates'
    const versionsTable = schema
      ? { tableName: 'ClinicalNoteTemplateVersions', schema }
      : 'ClinicalNoteTemplateVersions'
    await queryInterface.describeTable(templatesTable)
    await queryInterface.describeTable(versionsTable)
    return true
  } catch {
    return false
  }
}

export async function seedClinicalNoteTemplates() {
  if (_seedAttempted) return { status: 'skipped', reason: 'already_attempted' }
  _seedAttempted = true

  const hasTables = await hasClinicalNoteTemplateTables()
  if (!hasTables) {
    console.log('Clinical note template tables not found. Skipping startup seed.')
    return { status: 'skipped', reason: 'missing_tables' }
  }

  for (const seed of SYSTEM_TEMPLATE_SEED) {
    const existing = await ClinicalNoteTemplate.findOne({
      where: {
        scope: 'system',
        type: seed.type,
        key: seed.key,
      },
      include: [{ model: ClinicalNoteTemplateVersion, as: 'currentVersion' }],
    })

    if (!existing) {
      await createClinicalTemplateWithVersion({
        scope: 'system',
        organisationId: null,
        type: seed.type,
        category: seed.category,
        key: seed.key,
        title: seed.title,
        content: seed.content,
        status: 'active',
        sortOrder: seed.sortOrder,
        isDefault: seed.isDefault,
        actorUserId: null,
        changeNote: 'Initial system seed',
      })
      continue
    }

    const currentContent = existing.currentVersion?.content || ''
    const needsUpdate =
      existing.title !== seed.title ||
      existing.category !== seed.category ||
      existing.status !== 'active' ||
      Number(existing.sortOrder || 0) !== Number(seed.sortOrder || 0) ||
      existing.isDefault !== seed.isDefault ||
      currentContent !== seed.content

    if (!needsUpdate) continue

    await updateClinicalTemplateWithVersion({
      template: existing,
      title: seed.title,
      key: seed.key,
      category: seed.category,
      content: currentContent === seed.content ? undefined : seed.content,
      status: 'active',
      sortOrder: seed.sortOrder,
      isDefault: seed.isDefault,
      actorUserId: null,
      changeNote: 'System seed refresh (Dentally templates)',
    })
  }

  return { status: 'seeded' }
}
