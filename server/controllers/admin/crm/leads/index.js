import { error } from '../../../../utils/response';
import { getRouterParam, setResponseHeader, getHeader, readMultipartFormData } from 'h3';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { bulkUploadLeads as crmBulkUploadLeads } from '../../../crm';
import { parseAdminLeadUploadFile } from '../../shared.js';

export const adminBulkUploadLeads = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  try {
    const contentType = String(getHeader(event, 'content-type') || '').toLowerCase();

    if (contentType.includes('multipart/form-data')) {
      const formData = await readMultipartFormData(event);
      if (!formData?.length) {
        return error(400, 'No file uploaded');
      }

      const filePart = formData.find((part) => part.name === 'file');
      if (!filePart?.data?.length) {
        return error(400, 'Missing file');
      }

      const organisationId = String(getRouterParam(event, 'orgId') || '').trim();
      if (!organisationId) {
        return error(400, 'orgId is required');
      }

      const leads = await parseAdminLeadUploadFile({ filePart, organisationId });
      event.context.adminBulkLeadPayload = {
        organisationId,
        leads,
      };
    }

    return await crmBulkUploadLeads(event);
  } catch (err) {
    console.error('Admin bulk upload leads error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to bulk upload leads');
  }
};

export const downloadAdminLeadTemplate = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  try {
    const templatePath = join(process.cwd(), 'public', 'samples', 'lead-sample.csv');
    const csvContent = await readFile(templatePath, 'utf8');

    setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8');
    setResponseHeader(event, 'Content-Disposition', 'attachment; filename="lead-sample.csv"');

    return csvContent;
  } catch (err) {
    console.error('Download admin lead template error:', err);
    return error(500, err.message || 'Failed to download lead template');
  }
};
