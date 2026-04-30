import { success, error } from '../../../../utils/response';
import { Organisation, User, UserTask } from '../../../../models';
import { getRouterParam, getQuery, setResponseHeader } from 'h3';

export const exportOrgTasks = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const organisationId = getRouterParam(event, 'orgId');
  const { format = 'csv' } = query;

  if (!organisationId) {
    return error(400, "orgId is required");
  }

  try {
    // Get organisation details
    const organisation = await Organisation.findByPk(organisationId, {
      attributes: ['id', 'name']
    });

    if (!organisation) {
      return error(404, "Organisation not found");
    }

    // Get all tasks for this organisation with related data
    const tasks = await UserTask.findAll({
      where: { organisationId: parseInt(organisationId) },
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'assigner',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Format tasks for CSV export
    const csvData = tasks.map(task => ({
      'Task ID': task.id,
      'Title': task.title || '',
      'Description': task.description || '',
      'Assigned To': task.assignedUser?.fullName || '',
      'Assigned To Email': task.assignedUser?.email || '',
      'Assigned By': task.assigner?.fullName || '',
      'Due Date': task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      'Status ID': task.statusId || '',
      'Priority ID': task.priorityId || '',
      'Organisation ID': task.organisationId,
      'Created At': new Date(task.createdAt).toISOString(),
      'Updated At': new Date(task.updatedAt).toISOString()
    }));

    // If format is JSON, return JSON response
    if (format === 'json') {
      return success({
        organisationId: organisation.id,
        organisationName: organisation.name,
        totalTasks: tasks.length,
        tasks: csvData,
        exportedAt: new Date(),
        exportedBy: admin.userId
      });
    }

    // Convert to CSV
    const csvHeaders = Object.keys(csvData[0] || {});
    const csvRows = csvData.map(row => 
      csvHeaders.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma or quote
        const stringValue = String(value || '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );
    
    const csv = [csvHeaders.join(','), ...csvRows].join('\n');
    
    // Set headers for file download
    const filename = `tasks_org_${organisationId}_${organisation.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    
    setResponseHeader(event, 'Content-Type', 'text/csv');
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`);
    
    return csv;
  } catch (err) {
    console.error('Export org tasks error:', err);
    return error(500, err.message);
  }
};

/**
 * Export all tasks from all organisations (Super Admin only)
 * Returns CSV file for download
 */

export const exportAllTasks = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { format = 'csv' } = query;

  try {
    // Get all tasks with organisation and user data
    const tasks = await UserTask.findAll({
      include: [
        {
          model: Organisation,
          as: 'organisation',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'assigner',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Format tasks for CSV export
    const csvData = tasks.map(task => ({
      'Task ID': task.id,
      'Organisation ID': task.organisationId,
      'Organisation Name': task.organisation?.name || '',
      'Title': task.title || '',
      'Description': task.description || '',
      'Assigned To': task.assignedUser?.fullName || '',
      'Assigned To Email': task.assignedUser?.email || '',
      'Assigned By': task.assigner?.fullName || '',
      'Due Date': task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      'Status ID': task.statusId || '',
      'Priority ID': task.priorityId || '',
      'Created At': new Date(task.createdAt).toISOString(),
      'Updated At': new Date(task.updatedAt).toISOString()
    }));

    // Get organisation summary
    const orgSummary = {};
    tasks.forEach(task => {
      const orgName = task.organisation?.name || 'Unknown';
      orgSummary[orgName] = (orgSummary[orgName] || 0) + 1;
    });

    // If format is JSON, return JSON response
    if (format === 'json') {
      return success({
        totalTasks: tasks.length,
        totalOrganisations: Object.keys(orgSummary).length,
        organisationSummary: orgSummary,
        tasks: csvData,
        exportedAt: new Date(),
        exportedBy: admin.userId
      });
    }

    // Convert to CSV
    const csvHeaders = Object.keys(csvData[0] || {});
    const csvRows = csvData.map(row => 
      csvHeaders.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma or quote
        const stringValue = String(value || '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );
    
    const csv = [csvHeaders.join(','), ...csvRows].join('\n');
    
    // Set headers for file download
    const filename = `tasks_all_organisations_${new Date().toISOString().split('T')[0]}.csv`;
    
    setResponseHeader(event, 'Content-Type', 'text/csv');
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`);
    
    return csv;
  } catch (err) {
    console.error('Export all tasks error:', err);
    return error(500, err.message);
  }
};
