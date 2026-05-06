import { Op } from 'sequelize'
import { ClinicalNoteTemplate, ClinicalNoteTemplateVersion } from '../models'
import sequelize from './db'
import { error } from './response'

export const CLINICAL_NOTE_TEMPLATE_TYPES = ['diagnosis', 'treatment_plan']
export const CLINICAL_NOTE_TEMPLATE_SCOPES = ['system', 'organisation']
export const CLINICAL_NOTE_TEMPLATE_STATUSES = ['active', 'archived']
export const CLINICAL_NOTE_TEMPLATE_CATEGORIES = ['ai', 'user']

export const slugifyClinicalNoteTemplateKey = (value, fallback = 'clinical_note_template') =>
  String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]+/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 120) || fallback

export const sanitizeClinicalNoteTemplatePayload = (payload = {}, { existing = null, defaultScope = 'organisation' } = {}) => {
  const scope = CLINICAL_NOTE_TEMPLATE_SCOPES.includes(payload.scope) ? payload.scope : (existing?.scope || defaultScope)
  const type = CLINICAL_NOTE_TEMPLATE_TYPES.includes(payload.type) ? payload.type : existing?.type
  const category = CLINICAL_NOTE_TEMPLATE_CATEGORIES.includes(payload.category) ? payload.category : (existing?.category || (scope === 'system' ? 'ai' : 'user'))
  const status = CLINICAL_NOTE_TEMPLATE_STATUSES.includes(payload.status) ? payload.status : (existing?.status || 'active')
  const title = String(payload.title ?? existing?.title ?? '').trim().slice(0, 200)
  const key = slugifyClinicalNoteTemplateKey(payload.key || existing?.key || title || undefined)
  const content = payload.content !== undefined ? String(payload.content || '') : undefined
  const changeNote = payload.changeNote != null ? String(payload.changeNote).trim().slice(0, 255) : null
  const sourceTemplateId = payload.sourceTemplateId !== undefined
    ? (payload.sourceTemplateId ? Number(payload.sourceTemplateId) : null)
    : existing?.sourceTemplateId || null
  const sortOrder = payload.sortOrder == null || payload.sortOrder === ''
    ? Number(existing?.sortOrder || 0)
    : Number(payload.sortOrder)
  const isDefault = payload.isDefault !== undefined ? payload.isDefault === true || payload.isDefault === 'true' : undefined

  if (!type) error(400, 'type is required')
  if (!title) error(400, 'title is required')
  if (!key) error(400, 'key is required')
  if (content !== undefined && !content.trim()) error(400, 'content is required')
  if (!Number.isFinite(sortOrder)) error(400, 'sortOrder must be a valid number')

  return {
    scope,
    type,
    category,
    status,
    title,
    key,
    content,
    changeNote,
    sourceTemplateId,
    sortOrder,
    isDefault,
  }
}

export const buildClinicalTemplateQuery = ({ organisationId, type, status = 'active' }) => {
  const where = {
    status,
    ...(type ? { type } : {}),
    [Op.or]: [
      { scope: 'system' },
      { scope: 'organisation', organisationId: Number(organisationId) || 0 },
    ],
  }
  return where
}

export const serializeClinicalTemplate = (template) => {
  const raw = template?.toJSON ? template.toJSON() : template
  const currentVersion = raw?.currentVersion || null
  return {
    id: raw.id,
    scope: raw.scope,
    organisationId: raw.organisationId || null,
    type: raw.type,
    category: raw.category || (raw.scope === 'system' ? 'ai' : 'user'),
    key: raw.key,
    title: raw.title,
    status: raw.status,
    sourceTemplateId: raw.sourceTemplateId || null,
    currentVersionId: raw.currentVersionId || null,
    currentVersionNumber: currentVersion?.versionNumber || null,
    content: currentVersion?.content || '',
    changeNote: currentVersion?.changeNote || null,
    isDefault: raw.isDefault === true,
    sortOrder: Number(raw.sortOrder || 0),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
}

export const serializeClinicalTemplateVersion = (row) => {
  const raw = row?.toJSON ? row.toJSON() : row
  return {
    id: raw.id,
    templateId: raw.templateId,
    versionNumber: raw.versionNumber,
    content: raw.content || '',
    changeNote: raw.changeNote || null,
    createdBy: raw.createdBy || null,
    createdAt: raw.createdAt,
  }
}

export const ensureClinicalTemplateKeyAvailable = async ({ scope, organisationId = null, key, excludeId = null, transaction = null }) => {
  const where = {
    key: String(key || '').trim(),
    ...(scope === 'organisation' ? { scope: 'organisation', organisationId: Number(organisationId) || 0 } : { scope: 'system' }),
  }
  if (excludeId) where.id = { [Op.ne]: Number(excludeId) }
  const existing = await ClinicalNoteTemplate.findOne({ where, transaction })
  if (existing) error(409, 'Template key already exists')
}

export const clearClinicalTemplateDefault = async ({ scope, organisationId = null, type, excludeId = null, transaction = null }) => {
  const where = {
    scope,
    type,
    isDefault: true,
    ...(scope === 'organisation' ? { organisationId: Number(organisationId) || 0 } : {}),
  }
  if (excludeId) where.id = { [Op.ne]: Number(excludeId) }
  await ClinicalNoteTemplate.update({ isDefault: false }, { where, transaction })
}

export const getClinicalTemplateByIdForOrg = async ({ id, organisationId, includeArchived = false }) => {
  const row = await ClinicalNoteTemplate.findOne({
    where: {
      id: Number(id),
      ...(includeArchived ? {} : { status: 'active' }),
      [Op.or]: [
        { scope: 'system' },
        { scope: 'organisation', organisationId: Number(organisationId) || 0 },
      ],
    },
    include: [{ model: ClinicalNoteTemplateVersion, as: 'currentVersion' }],
  })
  if (!row) error(404, 'Clinical note template not found')
  return row
}

export const listAvailableClinicalTemplates = async ({ organisationId, type, status = 'active' }) => {
  const rows = await ClinicalNoteTemplate.findAll({
    where: buildClinicalTemplateQuery({ organisationId, type, status }),
    include: [{ model: ClinicalNoteTemplateVersion, as: 'currentVersion' }],
    order: [
      ['scope', 'ASC'],
      ['sortOrder', 'ASC'],
      ['title', 'ASC'],
      ['id', 'ASC'],
    ],
  })
  const serialized = rows.map(serializeClinicalTemplate)
  const organisationOverrides = new Set(
    serialized
      .filter((item) => item.scope === 'organisation')
      .flatMap((item) => {
        const pairs = [`${item.type}::${item.key}`]
        if (item.sourceTemplateId) pairs.push(`source::${item.sourceTemplateId}`)
        return pairs
      }),
  )

  return serialized.filter((item) => {
    if (item.scope !== 'system') return true
    return !organisationOverrides.has(`source::${item.id}`) && !organisationOverrides.has(`${item.type}::${item.key}`)
  })
}

export const createClinicalTemplateWithVersion = async ({
  scope = 'organisation',
  organisationId = null,
  type,
  category = scope === 'system' ? 'ai' : 'user',
  key,
  title,
  content,
  status = 'active',
  sourceTemplateId = null,
  sortOrder = 0,
  isDefault = false,
  actorUserId = null,
  changeNote = null,
}) => {
  return await sequelize.transaction(async (transaction) => {
    await ensureClinicalTemplateKeyAvailable({ scope, organisationId, key, transaction })
    if (isDefault) {
      await clearClinicalTemplateDefault({ scope, organisationId, type, transaction })
    }
    const template = await ClinicalNoteTemplate.create({
      scope,
      organisationId: scope === 'organisation' ? Number(organisationId) || 0 : null,
      type,
      category,
      key,
      title,
      status,
      sourceTemplateId,
      sortOrder,
      isDefault,
      createdBy: actorUserId || null,
      updatedBy: actorUserId || null,
    }, { transaction })
    const version = await ClinicalNoteTemplateVersion.create({
      templateId: template.id,
      versionNumber: 1,
      content,
      changeNote: changeNote || 'Initial version',
      createdBy: actorUserId || null,
    }, { transaction })
    template.currentVersionId = version.id
    await template.save({ transaction })
    return await ClinicalNoteTemplate.findByPk(template.id, {
      include: [{ model: ClinicalNoteTemplateVersion, as: 'currentVersion' }],
      transaction,
    })
  })
}

export const updateClinicalTemplateWithVersion = async ({
  template,
  title,
  key,
  category,
  content,
  status,
  sortOrder,
  isDefault,
  actorUserId = null,
  changeNote = null,
}) => {
  return await sequelize.transaction(async (transaction) => {
    await ensureClinicalTemplateKeyAvailable({
      scope: template.scope,
      organisationId: template.organisationId,
      key,
      excludeId: template.id,
      transaction,
    })
    const latestVersionNumber = await ClinicalNoteTemplateVersion.max('versionNumber', {
      where: { templateId: template.id },
      transaction,
    })
    if (isDefault === true) {
      await clearClinicalTemplateDefault({
        scope: template.scope,
        organisationId: template.organisationId,
        type: template.type,
        excludeId: template.id,
        transaction,
      })
    }
    template.title = title
    template.key = key
    template.category = category
    template.status = status
    template.sortOrder = sortOrder
    if (isDefault !== undefined) template.isDefault = isDefault
    template.updatedBy = actorUserId || null
    if (content !== undefined) {
      const version = await ClinicalNoteTemplateVersion.create({
        templateId: template.id,
        versionNumber: Number(latestVersionNumber || 0) + 1,
        content,
        changeNote: changeNote || 'Updated template',
        createdBy: actorUserId || null,
      }, { transaction })
      template.currentVersionId = version.id
    }
    await template.save({ transaction })
    return await ClinicalNoteTemplate.findByPk(template.id, {
      include: [{ model: ClinicalNoteTemplateVersion, as: 'currentVersion' }],
      transaction,
    })
  })
}

export const cloneClinicalTemplateToOrg = async ({ sourceTemplate, organisationId, actorUserId = null, title = null, changeNote = null }) => {
  const source = serializeClinicalTemplate(sourceTemplate)
  const key = `${source.key}_${Number(organisationId)}`
  return await createClinicalTemplateWithVersion({
    scope: 'organisation',
    organisationId,
    type: source.type,
    category: source.category || (source.scope === 'system' ? 'ai' : 'user'),
    key: slugifyClinicalNoteTemplateKey(key, source.key),
    title: title || source.title,
    content: source.content || '',
    status: 'active',
    sourceTemplateId: source.id,
    sortOrder: source.sortOrder || 0,
    isDefault: false,
    actorUserId,
    changeNote: changeNote || `Cloned from ${source.title}`,
  })
}
