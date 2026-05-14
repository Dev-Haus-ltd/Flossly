import { success, error } from '../../../../utils/response';
import { Organisation, CrmAutomationTemplate, CrmAutomationGroup, CrmAutomationGroupTemplate } from '../../../../models';
import { Op } from 'sequelize';
import { getRouterParam, getQuery, readBody, setResponseHeader, getHeader, readMultipartFormData } from 'h3';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { bulkUploadAutomations as crmBulkUploadAutomations } from '../../../crm';
import { parseAdminAutomationUploadFile } from '../../shared.js';

export const getGlobalAutomationLibrary = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  const query = getQuery(event);
  const { type, enabled, limit = 100, offset = 0 } = query;

  try {
    const whereClause = {};

    if (type) {
      whereClause.type = type;
    }

    if (enabled !== undefined) {
      whereClause.enabled = enabled === 'true';
    }

    const groups = await CrmAutomationGroup.findAll({
      where: { source: 'system' },
      include: [
        {
          model: CrmAutomationGroupTemplate,
          as: 'templates',
          required: false,
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['ordering', 'ASC'], ['title', 'ASC']],
    });

    const groupsWithTemplates = await Promise.all(groups.map(async (group) => {
      const templateKeys = group.templates?.map((t) => t.templateKey) || [];

      const templates = templateKeys.length > 0 ? await CrmAutomationTemplate.findAll({
        where: {
          key: { [Op.in]: templateKeys },
          ...whereClause,
        },
      }) : [];

      return {
        id: group.id,
        key: group.key,
        title: group.title,
        description: group.description,
        enabled: group.enabled,
        ordering: group.ordering,
        source: group.source,
        templateCount: templates.length,
        templates: templates.map((template) => ({
          id: template.id,
          key: template.key,
          type: template.type,
          name: template.name,
          subject: template.subject,
          sending: template.sending,
          enabled: template.enabled,
          whatsappTemplateName: template.whatsappTemplateName,
          trigger: template.trigger,
        })),
      };
    }));

    const totalTemplates = await CrmAutomationTemplate.count();
    const enabledTemplates = await CrmAutomationTemplate.count({ where: { enabled: true } });

    return success({
      totalGroups: groupsWithTemplates.length,
      totalTemplates,
      enabledTemplates,
      disabledTemplates: totalTemplates - enabledTemplates,
      limit: parseInt(limit),
      offset: parseInt(offset),
      groups: groupsWithTemplates,
    });
  } catch (err) {
    console.error('Get global automation library error:', err);
    return error(500, err.message);
  }
};

export const getPracticeAutomationLibrary = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  const query = getQuery(event);
  const organisationId = getRouterParam(event, 'orgId');
  const { type, enabled, limit = 100, offset = 0 } = query;

  if (!organisationId) {
    return error(400, 'orgId is required');
  }

  try {
    const organisation = await Organisation.findByPk(organisationId, {
      attributes: ['id', 'name'],
    });

    if (!organisation) {
      return error(404, 'Organisation not found');
    }

    const templateWhere = {};

    if (type) {
      templateWhere.type = type;
    }

    if (enabled !== undefined) {
      templateWhere.enabled = enabled === 'true';
    }

    const groups = await CrmAutomationGroup.findAll({
      where: { organisationId: parseInt(organisationId) },
      include: [
        {
          model: CrmAutomationGroupTemplate,
          as: 'templates',
          required: false,
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['ordering', 'ASC'], ['title', 'ASC']],
    });

    const groupsWithTemplates = await Promise.all(groups.map(async (group) => {
      const templateKeys = group.templates?.map((t) => t.templateKey) || [];

      const templates = templateKeys.length > 0 ? await CrmAutomationTemplate.findAll({
        where: {
          key: { [Op.in]: templateKeys },
          organisationId: parseInt(organisationId),
          ...templateWhere,
        },
      }) : [];

      return {
        id: group.id,
        key: group.key,
        title: group.title,
        description: group.description,
        enabled: group.enabled,
        ordering: group.ordering,
        source: group.source,
        templateCount: templates.length,
        templates: templates.map((template) => ({
          id: template.id,
          key: template.key,
          type: template.type,
          name: template.name,
          subject: template.subject,
          sending: template.sending,
          enabled: template.enabled,
          whatsappTemplateName: template.whatsappTemplateName,
          trigger: template.trigger,
        })),
      };
    }));

    const totalTemplates = await CrmAutomationTemplate.count({
      where: { organisationId: parseInt(organisationId) },
    });
    const enabledTemplates = await CrmAutomationTemplate.count({
      where: { organisationId: parseInt(organisationId), enabled: true },
    });

    return success({
      organisationId: organisation.id,
      organisationName: organisation.name,
      totalGroups: groupsWithTemplates.length,
      totalTemplates,
      enabledTemplates,
      disabledTemplates: totalTemplates - enabledTemplates,
      limit: parseInt(limit),
      offset: parseInt(offset),
      groups: groupsWithTemplates,
    });
  } catch (err) {
    console.error('Get practice automation library error:', err);
    return error(500, err.message);
  }
};

export const toggleAutomationTemplate = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  const body = await readBody(event);
  const { templateId, enabled } = body;

  if (!templateId) {
    return error(400, 'templateId is required');
  }

  if (enabled === undefined) {
    return error(400, 'enabled is required (true or false)');
  }

  try {
    const template = await CrmAutomationTemplate.findByPk(templateId);

    if (!template) {
      return error(404, 'Automation template not found');
    }

    template.enabled = enabled;
    await template.save();

    return success({
      message: `Automation template ${enabled ? 'activated' : 'deactivated'} successfully`,
      template: {
        id: template.id,
        key: template.key,
        name: template.name,
        type: template.type,
        enabled: template.enabled,
        updatedBy: admin.userId,
        updatedAt: template.updatedAt,
      },
    });
  } catch (err) {
    console.error('Toggle automation template error:', err);
    return error(500, err.message);
  }
};

export const adminBulkUploadAutomations = async (event) => {
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

      const items = parseAdminAutomationUploadFile(filePart);
      event.context.adminBulkAutomationPayload = {
        organisationId,
        items,
      };
    }

    return await crmBulkUploadAutomations(event);
  } catch (err) {
    console.error('Admin bulk upload automations error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to bulk upload automations');
  }
};

export const downloadAdminAutomationTemplate = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, 'Admin access required');
  }

  try {
    const templatePath = join(process.cwd(), 'public', 'samples', 'automation-sample.csv');
    const csvContent = await readFile(templatePath, 'utf8');

    setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8');
    setResponseHeader(event, 'Content-Disposition', 'attachment; filename="automation-sample.csv"');

    return csvContent;
  } catch (err) {
    console.error('Download admin automation template error:', err);
    return error(500, err.message || 'Failed to download automation template');
  }
};
