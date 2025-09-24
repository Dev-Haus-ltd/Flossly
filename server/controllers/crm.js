import {
  CrmContact,
  CrmLead,
  CrmPipeline,
  CrmPipelineStage,
  CrmActivity,
  CrmConversation,
  CrmMessage,
} from "../models";
import { success, error } from "../utils/response";

export const listContacts = async (event) => {
  const { orgId } = event.context.user;
  const query = getQuery(event);
  const q = query.q?.trim();
  const where = { organisationId: orgId };
  if (q) {
    where[Op.or] = [
      { fullName: { [Op.iLike]: `%${q}%` } },
      { email: { [Op.iLike]: `%${q}%` } },
      { phone: { [Op.iLike]: `%${q}%` } },
    ];
  }
  try {
    const rows = await CrmContact.findAll({ where, order: [["createdAt", "DESC"]] });
    return success(rows);
  } catch (err) {
    return error(500, err.message);
  }
};

export const createContact = async (event) => {
  const { orgId, userId } = event.context.user;
  const body = await readBody(event);
  const payload = typeof body === "string" ? JSON.parse(body) : body;
  try {
    const row = await CrmContact.create({
      organisationId: orgId,
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      tags: payload.tags || [],
      source: payload.source || "Manual",
      meta: payload.meta || {},
      createdBy: userId,
      updatedBy: userId,
    });
    return success({ id: row.id });
  } catch (err) {
    return error(500, err.message);
  }
};

export const listLeads = async (event) => {
  const { orgId } = event.context.user;
  const query = getQuery(event);
  const where = { organisationId: orgId };
  if (query.pipelineId) where.pipelineId = Number(query.pipelineId);
  if (query.stageId) where.stageId = Number(query.stageId);
  if (query.ownerUserId) where.ownerUserId = Number(query.ownerUserId);
  try {
    const rows = await CrmLead.findAll({ where, order: [["createdAt", "DESC"]] });
    return success(rows);
  } catch (err) {
    return error(500, err.message);
  }
};

export const createLead = async (event) => {
  const { orgId, userId } = event.context.user;
  const body = await readBody(event);
  const payload = typeof body === "string" ? JSON.parse(body) : body;
  try {
    const row = await CrmLead.create({
      organisationId: orgId,
      contactId: payload.contactId,
      ownerUserId: payload.ownerUserId || userId,
      pipelineId: payload.pipelineId,
      stageId: payload.stageId,
      status: payload.status || "Open",
      value: payload.value,
      currency: payload.currency || "GBP",
      meta: payload.meta || {},
    });
    return success({ id: row.id });
  } catch (err) {
    return error(500, err.message);
  }
};

export const moveLeadStage = async (event) => {
  const { orgId } = event.context.user;
  const body = await readBody(event);
  const payload = typeof body === "string" ? JSON.parse(body) : body;
  try {
    const lead = await CrmLead.findOne({ where: { id: payload.leadId, organisationId: orgId } });
    if (!lead) return error(404, "Lead not found");
    await lead.update({ stageId: payload.stageId });
    return success(true);
  } catch (err) {
    return error(500, err.message);
  }
};

export const listPipelines = async (event) => {
  const { orgId } = event.context.user;
  try {
    const rows = await CrmPipeline.findAll({ where: { organisationId: orgId }, order: [["createdAt", "ASC"]] });
    return success(rows);
  } catch (err) {
    return error(500, err.message);
  }
};

export const createPipeline = async (event) => {
  const { orgId } = event.context.user;
  const body = await readBody(event);
  const payload = typeof body === "string" ? JSON.parse(body) : body;
  try {
    const row = await CrmPipeline.create({ organisationId: orgId, name: payload.name, isDefault: !!payload.isDefault });
    return success({ id: row.id });
  } catch (err) {
    return error(500, err.message);
  }
};

export const listPipelineStages = async (event) => {
  const { orgId } = event.context.user;
  const query = getQuery(event);
  const pipelineId = Number(query.pipelineId);
  try {
    const rows = await CrmPipelineStage.findAll({ where: { organisationId: orgId, pipelineId }, order: [["order", "ASC"]] });
    return success(rows);
  } catch (err) {
    return error(500, err.message);
  }
};

export const createPipelineStage = async (event) => {
  const { orgId } = event.context.user;
  const body = await readBody(event);
  const payload = typeof body === "string" ? JSON.parse(body) : body;
  try {
    const row = await CrmPipelineStage.create({
      organisationId: orgId,
      pipelineId: payload.pipelineId,
      name: payload.name,
      order: payload.order ?? 0,
      probability: payload.probability,
    });
    return success({ id: row.id });
  } catch (err) {
    return error(500, err.message);
  }
};


