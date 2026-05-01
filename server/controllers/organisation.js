import {
  Organisation,
  OrganisationContact,
  OrganisationEquipment,
  OrganisationGroup,
  OrganisationGroupUser,
  OrganisationPeople,
  OrganisationPriority,
  OrganisationStatus,
  OrganisationSurgery,
  OrganisationScript,
  DictionaryScript,
  ClinicalNoteTemplate,
  ClinicalNoteTemplateVersion,
  User,
  Role,
  OrganisationReferral,
  UserOrganisation,
  UserPreference,
  Task,
  UserTask,
  UserHrDocument,
  TaskChecklist,
  UserTaskChecklist,
} from "../models";
import { HrDocument } from "../models/hrDocuments";
import formidable from "formidable";
import path from "path";
import DB from "../utils/db";
import { success, error } from "../utils/response";
import { readBody, createError, getQuery } from "h3";
import {
  sendTrialActivatedEmail,
  sendOrganisationReferralEmail,
  sendOrganisationCreatedInternalNotification,
} from "../utils/emailNotifications";
import bcrypt from "bcrypt";
import { Op } from "sequelize";
import { uploadTempFile } from "../utils/storage";
import { parseJsonBody } from "../utils/body";
import {
  cloneClinicalTemplateToOrg,
  createClinicalTemplateWithVersion,
  getClinicalTemplateByIdForOrg,
  sanitizeClinicalNoteTemplatePayload,
  serializeClinicalTemplate,
  serializeClinicalTemplateVersion,
  updateClinicalTemplateWithVersion,
} from "../utils/clinicalNoteTemplates";

// Role constants for access control
// Role ID 1 = Practice Manager, Role ID 8 = Principal Dentist / Practice Owner
const PRIVILEGED_ROLE_IDS = [1, 8];

const getDentistRoleId = async (transaction) => {
  const roles = await Role.findAll({
    attributes: ["id", "title"],
    transaction,
  });
  const dentistRole = roles.find((role) =>
    (role.title || "").toLowerCase().includes("dentist")
  );
  return dentistRole ? dentistRole.id : 5;
};

const createDummyDentistForOrganisation = async ({
  organisationId,
  organisationName,
  createdBy,
  transaction,
}) => {
  const roleId = await getDentistRoleId(transaction);
  const email = `dummy-dentist+org-${organisationId}@flossly.local`;
  const existing = await User.findOne({ where: { email }, transaction });
  if (existing) return existing;

  const password = await bcrypt.hash(
    `dummy-${organisationId}-${Date.now()}`,
    10
  );

  const dentistUser = await User.create(
    {
      fullName: organisationName,
      email,
      password,
      profileCompletion: 0,
      roleId,
      status: "Active",
      isEmailVerified: true,
      createdBy,
    },
    { transaction }
  );

  await UserOrganisation.create(
    {
      userId: dentistUser.id,
      organisationId,
      status: "Active",
    },
    { transaction }
  );

  return dentistUser;
};

export const updateOrganisationDetails = async (event) => {
  const loggedUser = event.context.user;
  const orgId = loggedUser.orgId;
  const form = formidable({ multiples: false, keepExtensions: true });

  // Helper: pick first value, treat empty strings as undefined
  const firstNonEmpty = (fields, key) => {
    if (!fields || !(key in fields)) return undefined;
    const raw = Array.isArray(fields[key]) ? fields[key][0] : fields[key];
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      return trimmed === '' ? undefined : trimmed;
    }
    return raw === '' ? undefined : raw;
  };

  try {
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(event.node.req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const organisation = await Organisation.findByPk(orgId);
    if (!organisation) {
      return error(404, "Organisation not found");
    }

    // STRING fields (only update when non-empty was provided)
    const name = firstNonEmpty(fields, 'name');
    const address = firstNonEmpty(fields, 'address');
    const contact = firstNonEmpty(fields, 'contact');
    const typeVal = firstNonEmpty(fields, 'type');

    if (name !== undefined) organisation.name = name;
    if (address !== undefined) organisation.address = address;
    if (contact !== undefined) organisation.contact = contact;

    // Validate enum against model allowed values (Sequelize stores them on rawAttributes)
    if (typeVal !== undefined) {
      const enumValues =
        Organisation.rawAttributes &&
        Organisation.rawAttributes.type &&
        Organisation.rawAttributes.type.values;
      if (Array.isArray(enumValues) && !enumValues.includes(typeVal)) {
        return error(
          400,
          `Invalid organisation type. Allowed values: ${enumValues.join(', ')}`
        );
      }
      organisation.type = typeVal;
    }

    // Numeric fields
    const managerId = firstNonEmpty(fields, 'managerId');
    const teamCount = firstNonEmpty(fields, 'teamCount');
    const surgeryCount = firstNonEmpty(fields, 'surgeryCount');
    const cqcInspectionDate = firstNonEmpty(fields, 'cqcInspectionDate');
    const practiceAnniversaryDate = firstNonEmpty(fields, 'practiceAnniversaryDate');
    const automationPlaceholdersRaw = firstNonEmpty(fields, 'automationPlaceholders');

    if (managerId !== undefined) organisation.managerId = parseInt(managerId, 10) || organisation.managerId;
    if (teamCount !== undefined) organisation.teamCount = Number.isNaN(Number(teamCount)) ? organisation.teamCount : parseInt(teamCount, 10);
    if (surgeryCount !== undefined) organisation.surgeryCount = Number.isNaN(Number(surgeryCount)) ? organisation.surgeryCount : parseInt(surgeryCount, 10);
    if (cqcInspectionDate !== undefined) {
      const d = new Date(cqcInspectionDate);
      organisation.cqcInspectionDate = isNaN(d.getTime()) ? organisation.cqcInspectionDate : d;
    }
    if (practiceAnniversaryDate !== undefined) {
      const d = new Date(practiceAnniversaryDate);
      organisation.practiceAnniversaryDate = isNaN(d.getTime()) ? organisation.practiceAnniversaryDate : d;
    }
    if (automationPlaceholdersRaw !== undefined) {
      if (typeof automationPlaceholdersRaw === 'string') {
        try {
          organisation.automationPlaceholders = JSON.parse(automationPlaceholdersRaw);
        } catch (err) {
          return error(400, 'automationPlaceholders must be valid JSON');
        }
      } else if (typeof automationPlaceholdersRaw === 'object') {
        organisation.automationPlaceholders = automationPlaceholdersRaw;
      } else {
        return error(400, 'automationPlaceholders must be an object');
      }
    }

    // Handle non-working days
    const nonWorkingDaysRaw = firstNonEmpty(fields, 'nonWorkingDays');
    if (nonWorkingDaysRaw !== undefined) {
      try {
        let parsedNonWorkingDays = nonWorkingDaysRaw;
        if (typeof nonWorkingDaysRaw === 'string') {
          parsedNonWorkingDays = JSON.parse(nonWorkingDaysRaw);
        }
        
        // Validate structure: should be an array
        if (!Array.isArray(parsedNonWorkingDays)) {
          return error(400, 'nonWorkingDays must be an array');
        }
        
        const validNonWorkingDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        for (const day of parsedNonWorkingDays) {
          if (!validNonWorkingDays.includes(day)) {
            return error(400, `Invalid non-working day: ${day}. Allowed values: ${validNonWorkingDays.join(', ')}`);
          }
        }
        
        organisation.nonWorkingDays = parsedNonWorkingDays;
      } catch (err) {
        return error(400, 'nonWorkingDays must be valid JSON array with day abbreviations (Mon, Tue, Wed, Thu, Fri, Sat, Sun)');
      }
    }

    // Handle working day timings
    const workingTimingsRaw = firstNonEmpty(fields, 'workingTimings');
    if (workingTimingsRaw !== undefined) {
      try {
        let parsedTimings = workingTimingsRaw;
        if (typeof workingTimingsRaw === 'string') {
          parsedTimings = JSON.parse(workingTimingsRaw);
        }
        
        // Validate structure: should have days as keys with startTime and endTime
        if (!parsedTimings || typeof parsedTimings !== 'object') {
          return error(400, 'workingTimings must be a valid object');
        }
        
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/; // HH:MM format
        
        for (const day of validDays) {
          if (!parsedTimings[day]) {
            return error(400, `Missing timings for ${day}`);
          }
          if (!parsedTimings[day].startTime || !parsedTimings[day].endTime) {
            return error(400, `startTime and endTime required for ${day}`);
          }
          if (!timeRegex.test(parsedTimings[day].startTime) || !timeRegex.test(parsedTimings[day].endTime)) {
            return error(400, `Invalid time format for ${day}. Use HH:MM format.`);
          }
        }
        
        organisation.workingTimings = parsedTimings;
      } catch (err) {
        return error(400, 'workingTimings must be valid JSON with proper time format (HH:MM)');
      }
    }

    // Handle logo upload (if provided)
    if (files && files.logo) {
      const logoFile = Array.isArray(files.logo) ? files.logo[0] : files.logo;
      const fileExt = path.extname(logoFile.originalFilename || logoFile.newFilename || "");
      const filename = `org-${orgId}-${Date.now()}${fileExt}`;
      const sourcePath = logoFile.filepath || logoFile.path;
      const link = await uploadTempFile({
        filepath: sourcePath,
        filename,
        contentType: logoFile.mimetype || logoFile.type,
        baseDir: "uploads/logos",
      });
      organisation.logo = link;
    }

    if (firstNonEmpty(fields, 'origin') === "onboarding") {
      const user = await User.findByPk(loggedUser.userId);
      if (user) {
        user.profileCompletion = 50;
        await user.save();
      }
    }

    await organisation.save();
    return success(organisation.toJSON());

  } catch (err) {
    // Log full error server-side
    console.error('updateOrganisationDetails error:', err);

    // Friendly errors for common DB enum error
    if (err.name === 'SequelizeDatabaseError' && /invalid input value for enum/i.test(err.message)) {
      // Try to get allowed enum values to show a helpful message
      const enumValues =
        Organisation.rawAttributes &&
        Organisation.rawAttributes.type &&
        Organisation.rawAttributes.type.values;
      const allowed = Array.isArray(enumValues) ? enumValues.join(', ') : 'valid enum values';
      return error(400, `Invalid organisation type provided. Allowed values: ${allowed}`);
    }

    // Sequelize validation errors
    if (err.name === 'SequelizeValidationError' && err.errors && err.errors.length) {
      return error(400, err.errors.map(e => e.message).join('; '));
    }

    // Generic safe fallback
    return error(500, 'Unable to update organisation at this time');
  }
};


export const getPriorities = async (event) => {
  const loggedUser = event.context.user;
  const organisationId = loggedUser.orgId;
  try {
    const priorities = await OrganisationPriority.findAll({
      where: { organisationId },
      attributes: ["id", "key", "name", "color", "sortOrder"],
    });
    return success(priorities);
  } catch (err) {
    return error(500, err.message);
  }
};

export const getStatuses = async (event) => {
  const loggedUser = event.context.user;
  const organisationId = loggedUser.orgId;
  try {
    const statuses = await OrganisationStatus.findAll({
      where: { organisationId },
      attributes: ["id", "key", "name", "color"],
    });
    return success(statuses);
  } catch (err) {
    return error(500, err.message);
  }
};

export const updatePriorities = async (event) => {
  const body = await readBody(event);
  const { updates } = body;
  try {
    if (!Array.isArray(updates) || updates.length === 0) {
      throw createError({ message: "Request body must be a non-empty array." });
    }
    const updatedPriorities = [];
    for (const update of updates) {
      const { id, name, color, sortOrder, key, status } = update;
      const priority = await OrganisationPriority.findByPk(id);
      if (!priority) continue;
      if (name) priority.name = name;
      if (color) priority.color = color;
      if (sortOrder) priority.sortOrder = sortOrder;
      if (key) priority.key = key;
      if (status) priority.status = status;
      await priority.save();
      updatedPriorities.push(priority);
    }
    return success("Updated");
  } catch (err) {
    return error(500, err.message);
  }
};

export const updateStatuses = async (event) => {
  const body = await readBody(event);
  const { updates } = body;
  try {
    if (!Array.isArray(updates) || updates.length === 0) {
      throw createError({ message: "Request body must be a non-empty array." });
    }
    for (const update of updates) {
      const { id, name, color, key, status } = update;
      const orgStatus = await OrganisationStatus.findByPk(id);
      if (!orgStatus) continue;
      if (name) orgStatus.name = name;
      if (color) orgStatus.color = color;
      if (key) orgStatus.key = key;
      if (status) orgStatus.status = status;
      await orgStatus.save();
    }
    return success("Updated");
  } catch (err) {
    return error(500, err.message);
  }
};

export const addPriority = async (event) => {
  const loggedUser = event.context.user;
  const organisationId = loggedUser.orgId;
  const body = await readBody(event);
  try {
    const { key, name, color, sortOrder, status } = body;
    if (!key || !name || sortOrder === undefined || !organisationId) {
      throw createError({ message: "Missing required fields." });
    }
    await OrganisationPriority.create({
      key,
      name,
      color,
      sortOrder,
      organisationId,
      status: status || "Active",
    });

    return success("created");
  } catch (err) {
    return error(500, err.message);
  }
};

export const addStatus = async (event) => {
  const loggedUser = event.context.user;
  const organisationId = loggedUser.orgId;
  const body = await readBody(event);
  try {
    const { key, name, color, status } = body;
    if (!key || !name || sortOrder === undefined || !organisationId) {
      throw createError({ message: "Missing required fields." });
    }
    await OrganisationStatus.create({
      key,
      name,
      color,
      organisationId,
      status: status || "Active",
    });

    return success("created");
  } catch (err) {
    return error(500, err.message);
  }
};

export const getdetails = async (event) => {
  const loggedUser = event.context.user;
  try {
    const organisation = await Organisation.findOne({
      where: {
        id: loggedUser.orgId,
      },
      include: [
        {
          model: OrganisationContact,
          as: "contacts",
        },
        {
          model: OrganisationEquipment,
          as: "equipments",
        },
        {
          model: OrganisationSurgery,
          as: "surgeries",
        },
        {
          model: OrganisationPeople,
          as: "importantPeople"
        },
        {
          model: OrganisationGroup,
          as: "groups",
          include: [
            {
              model: OrganisationGroupUser,
              as: "groupUsers",
              include: [
                {
                  model: User,
                  as: "user",
                  attributes: ["id", "fullName", "email", "photo"]
                },
              ],
            },
          ],
        },
      ],
    });
    const orgJson = organisation?.toJSON ? organisation.toJSON() : organisation;
    orgJson.crmFeatureAccess = {
      meta: orgJson?.automationPlaceholders?.crmFeatureAccess?.meta !== false,
      whatsapp: orgJson?.automationPlaceholders?.crmFeatureAccess?.whatsapp !== false,
      chatbot: orgJson?.automationPlaceholders?.crmFeatureAccess?.chatbot !== false,
    };
    return success(orgJson);
  } catch (err) {
    return error(500, err.message);
  }
};

export const updateImportantPeople = async (event) => {
  try {
    const body = await readBody(event)
    const {
      id,
      organisationId,
      safeguardingLead,
      firstAider,
      fireMarshal,
      crossInfectionLead,
      complaintsHandler,
      dpo,
      rpa
    } = parseJsonBody(body);

    let people = await OrganisationPeople.findOne({ where: { organisationId, id } });

    if (people) {
      await people.update({
        safeguardingLead,
        firstAider,
        fireMarshal,
        crossInfectionLead,
        complaintsHandler,
        dpo,
        rpa
      });
    } else {
      people = await OrganisationPeople.create({
        organisationId,
        safeguardingLead,
        firstAider,
        fireMarshal,
        crossInfectionLead,
        complaintsHandler,
        dpo,
        rpa
      });
    }


    return success(people);
  } catch (err) {
    return error(500, err.message)
  }
};

export const addEquipment = async (event) => {
  const loggedUser = event.context.user;
  const body = await readBody(event);
  const { equipments } = parseJsonBody(body);
  if (!equipments || !Array.isArray(equipments)) {
    throw createError({ message: "Equipments array is required" });
  }
  const transaction = await DB.transaction();
  try {
    const created = await OrganisationEquipment.bulkCreate(
      equipments.map((eq) => ({ ...eq, organisationId: loggedUser.orgId })),
      { transaction }
    );
    await transaction.commit();
    return success(created);
  } catch (err) {
    await transaction.rollback();
    return error(500, err.message);
  }
};

export const addContacts = async (event) => {
  const loggedUser = event.context.user;
  const body = await readBody(event);
  const { contacts } = parseJsonBody(body);
  if (!contacts || !Array.isArray(contacts)) {
    throw createError({ message: "Contacts array is required" });
  }
  const transaction = await DB.transaction();
  try {
    const created = await OrganisationContact.bulkCreate(
      contacts.map((c) => ({ ...c, organisationId: loggedUser.orgId })),
      { transaction }
    );
    await transaction.commit();
    return success(created);
  } catch (err) {
    await transaction.rollback();
    return error(500, err.message);
  }
};

export const addSurgery = async (event) => {
  const loggedUser = event.context.user;
  const body = await readBody(event);
  const { name, color, description, details } = parseJsonBody(body);
  if (!name) {
    throw createError({ message: "Name is required" });
  }
  const transaction = await DB.transaction();
  try {
    const surgery = await OrganisationSurgery.create({
      name,
      color,
      organisationId: loggedUser.orgId,
      description,
      details,
    });
    return success(surgery);
  } catch (err) {
    await transaction.rollback();
    return error(500, err.message);
  }
};

export const addGroup = async (event) => {
  const loggedUser = event.context.user;
  const body = await readBody(event);
  const { name, description, userIds } = parseJsonBody(body);
  if (!name) {
    throw createError({ message: "Name is required" });
  }
  const transaction = await DB.transaction();
  try {
    const group = await OrganisationGroup.create(
      { name, description, organisationId: loggedUser.orgId },
      { transaction }
    );
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      const groupUsers = userIds.map((userId) => ({
        userId,
        organisationId: loggedUser.orgId,
        groupId: group.id,
      }));
      await OrganisationGroupUser.bulkCreate(groupUsers, { transaction });
    }
    await transaction.commit();
    return success(group);
  } catch (err) {
    await transaction.rollback();
    return error(500, err.message);
  }
};

export const updateAttributes = async (event) => {
  const body = await readBody(event);
  const { type, data, userIds } = parseJsonBody(body);

  if (!type) throw createError({ message: "Type is required" });
  const transaction = await DB.transaction();

  try {
    let updatedRecord;

    switch (type) {
      case "equipment": {
        const equipment = await OrganisationEquipment.findByPk(data.id);
        if (!equipment) throw createError({ message: "Equipment not found" });
        updatedRecord = await equipment.update(data, { transaction });
        break;
      }

      case "contact": {
        const contact = await OrganisationContact.findByPk(data.id);
        if (!contact) throw createError({ message: "Contact not found" });
        updatedRecord = await contact.update(data, { transaction });
        break;
      }

      case "surgery": {
        const surgery = await OrganisationSurgery.findByPk(data.id);
        if (!surgery) throw createError({ message: "Surgery not found" });
        updatedRecord = await surgery.update(data, { transaction });
        break;
      }

      case "group": {
        const group = await OrganisationGroup.findByPk(data.id, {
          transaction,
        });
        if (!group) throw createError({ message: "Group not found" });
        await group.update(data, { transaction });
        if (Array.isArray(userIds)) {
          await OrganisationGroupUser.destroy({
            where: { groupId: id },
            transaction,
          });

          const groupUsers = userIds.map((userId) => ({
            userId,
            organisationId: group.organisationId,
            groupId: group.id,
          }));
          await OrganisationGroupUser.bulkCreate(groupUsers, { transaction });
        }
        updatedRecord = group;
        break;
      }

      default:
        throw createError({ message: "Invalid type provided" });
    }

    await transaction.commit();
    return success(updatedRecord);
  } catch (err) {
    await transaction.rollback();
    return error(500, err.message);
  }
};

export const deleteAttribute = async (event) => {
  const body = await readBody(event);
  const { type, id } = parseJsonBody(body);

  if (!type || !id) throw createError({ message: "Type and Id is required" });
  const transaction = await DB.transaction();
  try {
    let model;
    let ModelRef;

    switch (type) {
      case "equipment":
        ModelRef = OrganisationEquipment;
        break;

      case "contact":
        ModelRef = OrganisationContact;
        break;

      case "surgery":
        ModelRef = OrganisationSurgery;
        break;

      case "group":
        ModelRef = OrganisationGroup;
        break;

      default:
        throw createError({ message: "Invalid type provided" });
    }

    // 1️⃣ Get full context FIRST
    model = await ModelRef.findByPk(id, { transaction });

    if (!model) {
      throw createError({ message: `${type} not found` });
    }

    // 🔥 You can use `model` here for logging / hooks replacement if needed
    // console.log(model.toJSON());

    // 2️⃣ Delete directly from DB (no instance hooks)
    await ModelRef.destroy({
      where: { id },
      transaction
    });

    await transaction.commit();
    return success("Deleted");
  } catch (err) {
    await transaction.rollback();
    return error(500, err.message);
  }
}

export const getSurgeries = async (event) => {
  const body = await readBody(event)
  const { organisationId } = parseJsonBody(body)
  try {
    const surgeries = await OrganisationSurgery.findAll({ where: { organisationId }})
    return success(surgeries)
  } catch(err) {
    return error(500, err.message)
  }
}

export const getScripts = async (event) => {
  const loggedUser = event.context.user;
  const organisationId = loggedUser.orgId;
  try {
    // Get all default scripts from dictionary
    const defaultScripts = await DictionaryScript.findAll({
      order: [["sortOrder", "ASC"]],
    });

    if (!defaultScripts || defaultScripts.length === 0) {
      // Return empty array if no default scripts found
      return success([]);
    }

    // Get user-edited scripts for this organisation
    const orgScripts = await OrganisationScript.findAll({
      where: { organisationId },
    }).catch(() => {
      // If OrganisationScripts table doesn't exist or query fails, just use empty array
      return [];
    });

    // Create a map of user-edited scripts by scriptKey
    const orgScriptsMap = {};
    if (orgScripts && Array.isArray(orgScripts)) {
      orgScripts.forEach((script) => {
        orgScriptsMap[script.scriptKey] = script;
      });
    }

    // Merge: use org script if exists, otherwise use default
    const scripts = defaultScripts.map((defaultScript) => {
      const orgScript = orgScriptsMap[defaultScript.key];
      if (orgScript) {
        // User has edited this script, use their version
        return {
          id: orgScript.id,
          key: defaultScript.key,
          title: orgScript.title,
          content: orgScript.content,
          isCustom: true,
        };
      } else {
        // Use default script
        return {
          id: defaultScript.id,
          key: defaultScript.key,
          title: defaultScript.title,
          content: defaultScript.content,
          isCustom: false,
        };
      }
    });

    return success(scripts);
  } catch (err) {
    console.error('Error in getScripts:', err);
    return error(500, err.message);
  }
};

export const saveScript = async (event) => {
  const loggedUser = event.context.user;
  const organisationId = loggedUser.orgId;
  const body = await readBody(event);
  const parsed = typeof body === "string" ? JSON.parse(body || "{}") : (body || {});
  const { scriptKey, title, content } = parsed;

  if (!scriptKey || !title || !content) {
    return error(400, "scriptKey, title, and content are required");
  }

  try {
    // Check if default script exists
    const defaultScript = await DictionaryScript.findOne({
      where: { key: scriptKey },
    });

    if (!defaultScript) {
      return error(404, "Script not found in dictionary");
    }

    // Find or create organisation script
    const [orgScript, created] = await OrganisationScript.findOrCreate({
      where: {
        organisationId,
        scriptKey,
      },
      defaults: {
        organisationId,
        scriptKey,
        title,
        content,
      },
    });

    if (!created) {
      // Update existing script
      orgScript.title = title;
      orgScript.content = content;
      await orgScript.save();
    }

    return success({
      id: orgScript.id,
      key: scriptKey,
      title: orgScript.title,
      content: orgScript.content,
      isCustom: true,
    });
  } catch (err) {
    return error(500, err.message);
  }
};

export const seedScripts = async (event) => {
  try {
    const { seedDefaultScripts } = await import("../utils/seedScripts");
    const result = await seedDefaultScripts();
    return success(result);
  } catch (err) {
    return error(500, err.message);
  }
};

export const listClinicalNoteTemplateVersions = async (event) => {
  const loggedUser = event.context.user;
  const organisationId = Number(loggedUser?.orgId || 0);
  try {
    const query = getQuery(event) || {};
    const template = await getClinicalTemplateByIdForOrg({
      id: Number(query.id || 0),
      organisationId,
      includeArchived: true,
    });
    const versions = await ClinicalNoteTemplateVersion.findAll({
      where: { templateId: template.id },
      order: [['versionNumber', 'DESC'], ['id', 'DESC']],
    });
    return success(versions.map(serializeClinicalTemplateVersion));
  } catch (err) {
    console.error('Error listing clinical note template versions:', err);
    return error(500, err.message || 'Failed to list template versions');
  }
};

export const createClinicalNoteTemplate = async (event) => {
  const loggedUser = event.context.user;
  const organisationId = Number(loggedUser?.orgId || 0);
  try {
    const body = await readBody(event);
    const payload = typeof body === "string" ? parseJsonBody(body) : body;
    const next = sanitizeClinicalNoteTemplatePayload(payload, { defaultScope: 'organisation' });
    const created = await createClinicalTemplateWithVersion({
      scope: 'organisation',
      organisationId,
      type: next.type,
      category: next.category,
      key: next.key,
      title: next.title,
      content: next.content,
      status: next.status,
      sourceTemplateId: next.sourceTemplateId,
      sortOrder: next.sortOrder,
      isDefault: next.isDefault === true,
      actorUserId: loggedUser?.userId || null,
      changeNote: next.changeNote,
    });
    return success(serializeClinicalTemplate(created));
  } catch (err) {
    console.error('Error creating clinical note template:', err);
    return error(500, err.message || 'Failed to create template');
  }
};

export const updateClinicalNoteTemplate = async (event) => {
  const loggedUser = event.context.user;
  const organisationId = Number(loggedUser?.orgId || 0);
  try {
    const body = await readBody(event);
    const payload = typeof body === "string" ? parseJsonBody(body) : body;
    if (!payload?.id) return error(400, 'id is required');
    const sourceTemplate = await getClinicalTemplateByIdForOrg({
      id: Number(payload.id),
      organisationId,
      includeArchived: true,
    });
    let template = sourceTemplate;
    if (sourceTemplate.scope === 'system') {
      template = await ClinicalNoteTemplate.findOne({
        where: {
          scope: 'organisation',
          organisationId,
          type: sourceTemplate.type,
          [Op.or]: [
            { sourceTemplateId: sourceTemplate.id },
            { key: sourceTemplate.key },
          ],
        },
        include: [{ model: ClinicalNoteTemplateVersion, as: 'currentVersion' }],
      });
    }
    const next = sanitizeClinicalNoteTemplatePayload(payload, { existing: template || sourceTemplate, defaultScope: 'organisation' });

    if (!template && sourceTemplate.scope === 'system') {
      const created = await createClinicalTemplateWithVersion({
        scope: 'organisation',
        organisationId,
        type: sourceTemplate.type,
        category: next.category,
        key: next.key,
        title: next.title,
        content: next.content !== undefined ? next.content : sourceTemplate.currentVersion?.content || '',
        status: next.status,
        sourceTemplateId: sourceTemplate.id,
        sortOrder: next.sortOrder,
        isDefault: next.isDefault === true,
        actorUserId: loggedUser?.userId || null,
        changeNote: next.changeNote || `Customized from ${sourceTemplate.title}`,
      });
      return success(serializeClinicalTemplate(created));
    }

    if (!template) return error(404, 'Template not found');
    const updated = await updateClinicalTemplateWithVersion({
      template,
      title: next.title,
      key: next.key,
      category: next.category,
      content: next.content,
      status: next.status,
      sortOrder: next.sortOrder,
      isDefault: next.isDefault,
      actorUserId: loggedUser?.userId || null,
      changeNote: next.changeNote,
    });
    return success(serializeClinicalTemplate(updated));
  } catch (err) {
    console.error('Error updating clinical note template:', err);
    return error(500, err.message || 'Failed to update template');
  }
};

export const cloneClinicalNoteTemplate = async (event) => {
  const loggedUser = event.context.user;
  const organisationId = Number(loggedUser?.orgId || 0);
  try {
    const body = await readBody(event);
    const payload = typeof body === "string" ? parseJsonBody(body) : body;
    const sourceTemplate = await getClinicalTemplateByIdForOrg({
      id: Number(payload?.sourceTemplateId || 0),
      organisationId,
      includeArchived: true,
    });
    const created = await cloneClinicalTemplateToOrg({
      sourceTemplate,
      organisationId,
      actorUserId: loggedUser?.userId || null,
      title: payload?.title ? String(payload.title).trim() : null,
      changeNote: payload?.changeNote ? String(payload.changeNote).trim() : null,
    });
    return success(serializeClinicalTemplate(created));
  } catch (err) {
    console.error('Error cloning clinical note template:', err);
    return error(500, err.message || 'Failed to clone template');
  }
};

export const setDefaultClinicalNoteTemplate = async (event) => {
  const loggedUser = event.context.user;
  const organisationId = Number(loggedUser?.orgId || 0);
  try {
    const body = await readBody(event);
    const payload = typeof body === "string" ? parseJsonBody(body) : body;
    if (!payload?.id) return error(400, 'id is required');
    const sourceTemplate = await getClinicalTemplateByIdForOrg({
      id: Number(payload.id),
      organisationId,
      includeArchived: true,
    });
    let template = sourceTemplate;
    if (sourceTemplate.scope === 'system') {
      template = await ClinicalNoteTemplate.findOne({
        where: {
          scope: 'organisation',
          organisationId,
          type: sourceTemplate.type,
          [Op.or]: [
            { sourceTemplateId: sourceTemplate.id },
            { key: sourceTemplate.key },
          ],
        },
        include: [{ model: ClinicalNoteTemplateVersion, as: 'currentVersion' }],
      });
      if (!template) {
        template = await createClinicalTemplateWithVersion({
          scope: 'organisation',
          organisationId,
          type: sourceTemplate.type,
          category: sourceTemplate.category || 'user',
          key: sourceTemplate.key,
          title: sourceTemplate.title,
          content: sourceTemplate.currentVersion?.content || '',
          status: sourceTemplate.status || 'active',
          sourceTemplateId: sourceTemplate.id,
          sortOrder: Number(sourceTemplate.sortOrder || 0),
          isDefault: payload.isDefault !== false,
          actorUserId: loggedUser?.userId || null,
          changeNote: payload?.changeNote ? String(payload.changeNote).trim() : `Customized default from ${sourceTemplate.title}`,
        });
        return success(serializeClinicalTemplate(template));
      }
    }
    if (!template) return error(404, 'Template not found');
    const updated = await updateClinicalTemplateWithVersion({
      template,
      title: template.title,
      key: template.key,
      category: template.category,
      status: template.status,
      sortOrder: Number(template.sortOrder || 0),
      isDefault: payload.isDefault !== false,
      actorUserId: loggedUser?.userId || null,
      changeNote: payload?.changeNote ? String(payload.changeNote).trim() : 'Updated default selection',
    });
    return success(serializeClinicalTemplate(updated));
  } catch (err) {
    console.error('Error setting default clinical note template:', err);
    return error(500, err.message || 'Failed to set default template');
  }
};

export const createOrganisationReferral = async (event) => {
  try {
    const loggedUser = event.context.user;

    if (!loggedUser || !loggedUser.userId) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }

    const rawBody = await readBody(event);
    const body = typeof rawBody === "string"
      ? JSON.parse(rawBody)
      : rawBody;

    const {
      orgName,
      orgEmail,
      managerName,
      phoneNumber,
      address,
    } = body;

    if (!orgName || !orgEmail || !managerName) {
      throw createError({
        statusCode: 400,
        statusMessage: "orgName, orgEmail and managerName are required",
      });
    }

    const referral = await OrganisationReferral.create({
      orgName,
      orgEmail,
      managerName,
      phoneNumber,
      address,
      referredBy: loggedUser.userId,
    });

    // ✅ Send email notification
    await sendOrganisationReferralEmail({
      orgName,
      orgEmail,
      managerName,
      phoneNumber,
      address,
    });

    return {
      success: true,
      data: referral,
    };
  } catch (err) {
    console.error("Create Organisation Referral Error:", err);
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.message || "Internal server error",
    });
  }
};

// need enhancement currently now ui to show this
export const getAllOrganisationReferrals = async (event) => {
  try {
    const referrals = await OrganisationReferral.findAll({
      include: [
        {
          model: User,
          as: "referrer",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return {
      success: true,
      count: referrals.length,
      data: referrals,
    };
  } catch (err) {
    console.error("Get Organisation Referrals Error:", err);

    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
};

/**
 * Creates a new organisation for an existing authenticated user.
 * This is used when a user wants to add a new workspace via the "Add Practice" flow.
 * Receives full organization details from the onboarding form (name, contact, address, logo).
 *
 * RBAC: Only users with Practice Manager (roleId=1) or
 * Principal Dentist / Practice Owner (roleId=8) can create new workspaces.
 */
export const createOrganisationForUser = async (event) => {
  const loggedUser = event.context.user;

  // RBAC check
  if (!PRIVILEGED_ROLE_IDS.includes(Number(loggedUser.roleId))) {
    return error(
      403,
      "You do not have permission to create a new organisation."
    );
  }

  const form = formidable({ multiples: false, keepExtensions: true });

  // Helper: pick first value, treat empty strings as undefined
  const firstNonEmpty = (fields, key) => {
    if (!fields || !(key in fields)) return undefined;
    const raw = Array.isArray(fields[key]) ? fields[key][0] : fields[key];
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      return trimmed === '' ? undefined : trimmed;
    }
    return raw === '' ? undefined : raw;
  };

  let fields, files;
  try {
    const parsed = await new Promise((resolve, reject) => {
      form.parse(event.node.req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });
    fields = parsed.fields;
    files = parsed.files;
  } catch (parseErr) {
    console.error("Form parse error:", parseErr);
    return error(400, "Invalid form data");
  }

  const organisationName = firstNonEmpty(fields, 'name') || firstNonEmpty(fields, 'organisationName');
  const contact = firstNonEmpty(fields, 'contact');
  const address = firstNonEmpty(fields, 'address');
  const typeVal = firstNonEmpty(fields, 'type');

  if (!organisationName) {
    return error(400, "Organisation name is required");
  }

  const transaction = await DB.transaction();
  let org;
  let trialEndDate;

  try {
    const user = await User.findByPk(loggedUser.userId, { transaction });
    if (!user) {
      throw new Error("User not found");
    }

    /** -------------------------
     * 1. Create Organisation
     --------------------------*/
    const orgData = {
      name: organisationName,
      managerId: loggedUser.userId,
      hasUsedTrial: false,
    };

    // Add optional fields if provided (for full creation mode)
    if (contact) orgData.contact = contact;
    if (address) orgData.address = address;
    if (typeVal) {
      const enumValues =
        Organisation.rawAttributes &&
        Organisation.rawAttributes.type &&
        Organisation.rawAttributes.type.values;
      if (!Array.isArray(enumValues) || enumValues.includes(typeVal)) {
        orgData.type = typeVal;
      }
    }

    org = await Organisation.create(orgData, { transaction });

    // Handle logo upload if provided
    if (files && files.logo) {
      const logoFile = Array.isArray(files.logo) ? files.logo[0] : files.logo;
      const fileExt = path.extname(logoFile.originalFilename || logoFile.newFilename || "");
      const filename = `org-${org.id}-${Date.now()}${fileExt}`;
      const sourcePath = logoFile.filepath || logoFile.path;
      const link = await uploadTempFile({
        filepath: sourcePath,
        filename,
        contentType: logoFile.mimetype || logoFile.type,
        baseDir: "uploads/logos",
      });
      org.logo = link;
      await org.save({ transaction });
    }

    /** -------------------------
     * 2. Associate User → Organisation
     --------------------------*/
    await UserOrganisation.create(
      {
        userId: loggedUser.userId,
        organisationId: org.id,
        status: "Active",
      },
      { transaction }
    );

    /** -------------------------
     * 3. Trial License (ONE TIME PER ORG)
     --------------------------*/
    if (org.hasUsedTrial) {
      throw new Error("This organisation has already used its free trial.");
    }

    trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 15);

    await UserPreference.create(
      {
        userId: loggedUser.userId,
        organisationId: org.id,
        licenseType: "Trial",
        licenseRenewalDate: trialEndDate,
      },
      { transaction }
    );

    // 🔐 Permanently mark trial as used
    await org.update(
      { hasUsedTrial: true },
      { transaction }
    );
    await user.update(
      { hasUsedTrial: true },
      { transaction }
    );

    await createDummyDentistForOrganisation({
      organisationId: org.id,
      organisationName: org.name,
      createdBy: loggedUser.userId,
      transaction,
    });

    /** -------------------------
     * 4. System Task Initialization
     --------------------------*/
    const tasks = await Task.findAll({
      limit: 100,
      where: {
        categoryId: [3, 4, 5, 10, 11, 12],
        isSystemTask: true,
      },
      transaction,
    });

    const priorities = await OrganisationPriority.findAll({
      where: { organisationId: org.id },
      transaction,
    });

    const statuses = await OrganisationStatus.findAll({
      where: { organisationId: org.id },
      transaction,
    });

    const defaultStatus =
      statuses.find((s) => s.key === "upcoming") || statuses[0];
    const defaultPriority =
      priorities.find((p) => p.key === "medium") || priorities[0];

    if (defaultStatus && defaultPriority && tasks.length) {
      const userTasks = tasks.map((task) => ({
        userId: loggedUser.userId,
        taskId: task.id,
        organisationId: org.id,
        statusId: defaultStatus.id,
        priorityId: defaultPriority.id,
        title: task.title,
        documentLink: "",
        frequency: task.defaultFrequency,
        comments: "",
      }));

      const createdUserTasks = await UserTask.bulkCreate(userTasks, { 
        transaction,
        returning: true 
      });

      // Copy checklists from TaskChecklist to UserTaskChecklist
      const taskIds = tasks.map((t) => t.id);
      const templates = await TaskChecklist.findAll({
        where: { taskId: { [Op.in]: taskIds } },
        transaction,
      });

      if (templates?.length) {
        const checklistToCreate = [];
        for (const ut of createdUserTasks) {
          const tpls = templates.filter((tpl) => tpl.taskId === ut.taskId);
          if (!tpls.length) continue;
          tpls.forEach((tpl) => {
            checklistToCreate.push({
              userTaskId: ut.id,
              question: tpl.question,
              category: tpl.category,
              showRadio: tpl.showRadio,
              showDate: tpl.showDate,
              showTime: tpl.showTime,
              fieldOneTitle: tpl.fieldOneTitle,
              fieldTwoTitle: tpl.fieldTwoTitle,
              radioValue: 'N/A',
            });
          });
        }
        if (checklistToCreate.length) {
          await UserTaskChecklist.bulkCreate(checklistToCreate, { transaction });
        }
      }
    }

    /** -------------------------
     * 5. Assign Default HR Docs
     --------------------------*/
    await assignDefaultHRDocsToUser(loggedUser.userId);

    /** -------------------------
     * Commit transaction (DB DONE)
     --------------------------*/
    await transaction.commit();
  } catch (err) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    if (err.name === "SequelizeUniqueConstraintError") {
      return error(409, "Organisation already exists");
    }

    console.error("Create Organisation Error:", err);
    return error(500, err.message || "Failed to create organisation");
  }

  /** -------------------------
   * 6. Trial Activation Email (OUTSIDE TX)
   --------------------------*/
  const user = await User.findByPk(loggedUser.userId, {
    attributes: ["email", "fullName"],
  });

  if (!user?.email) {
    console.warn(
      `Trial email skipped: user ${loggedUser.userId} has no email`
    );
  } else {
    try {
      await sendTrialActivatedEmail({
        email: user.email,
        fullName: user.fullName,
        organisationName: org.name,
        trialDays: 15,
        trialEndsOn: trialEndDate,
      });
    } catch (emailErr) {
      console.error("Trial email failed:", emailErr);
    }
  }

  try {
    await sendOrganisationCreatedInternalNotification({
      organisationName: org.name,
      organisationId: org.id,
      creatorName: user?.fullName,
      creatorEmail: user?.email,
      licenseType: "Trial",
      trialEndsOn: trialEndDate,
      origin: "add_practice",
    });
  } catch (notifyErr) {
    console.error("Internal org-created notification failed", {
      organisationId: org?.id,
      error: notifyErr?.message || notifyErr,
    });
  }

  return success({
    organisationId: org.id,
    name: org.name,
    trialEndsOn: trialEndDate,
  });
};

// temperory placing this function here for testing has its not possible to import it from auth controller

const assignDefaultHRDocsToUser = async (userId) => {
  const defaultDocs = await HrDocument.findAll();

  const userDocs = defaultDocs.map((doc) => ({
    userId,
    name: doc.name,
    type: doc.type,
    status: "Pending",
  }));

  await UserHrDocument.bulkCreate(userDocs);
};
