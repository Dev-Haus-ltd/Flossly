import {
  listContacts,
  createContact,
  listLeads,
  createLead,
  moveLeadStage,
  listPipelines,
  createPipeline,
  listPipelineStages,
  createPipelineStage,
} from "../../controllers/crm.js";

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, "name");

  switch (name) {
    case "listContacts":
      return await listContacts(event);
    case "createContact":
      return await createContact(event);
    case "listLeads":
      return await listLeads(event);
    case "createLead":
      return await createLead(event);
    case "moveLeadStage":
      return await moveLeadStage(event);
    case "listPipelines":
      return await listPipelines(event);
    case "createPipeline":
      return await createPipeline(event);
    case "listPipelineStages":
      return await listPipelineStages(event);
    case "createPipelineStage":
      return await createPipelineStage(event);
    case "ping":
      return { ok: true, ts: Date.now() };
    default:
      setResponseStatus(event, 404);
      return { code: 0, error: `Not found: ${name}` };
  }
});


