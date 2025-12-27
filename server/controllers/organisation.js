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
  User,
  OrganisationReferral,
} from "../models";
import formidable from "formidable";
import fs from "fs/promises";
import path from "path";
import DB from "../utils/db";
import { success, error } from "../utils/response";
import { readBody, createError } from "h3";

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

    if (managerId !== undefined) organisation.managerId = parseInt(managerId, 10) || organisation.managerId;
    if (teamCount !== undefined) organisation.teamCount = Number.isNaN(Number(teamCount)) ? organisation.teamCount : parseInt(teamCount, 10);
    if (surgeryCount !== undefined) organisation.surgeryCount = Number.isNaN(Number(surgeryCount)) ? organisation.surgeryCount : parseInt(surgeryCount, 10);
    if (cqcInspectionDate !== undefined) {
      const d = new Date(cqcInspectionDate);
      organisation.cqcInspectionDate = isNaN(d.getTime()) ? organisation.cqcInspectionDate : d;
    }

    // Handle logo upload (if provided)
    if (files && files.logo) {
      const logoFile = Array.isArray(files.logo) ? files.logo[0] : files.logo;
      const uploadDir = path.resolve("public/uploads/logos");
      await fs.mkdir(uploadDir, { recursive: true });
      const fileExt = path.extname(logoFile.originalFilename || logoFile.newFilename || "");
      const filename = `org-${orgId}-${Date.now()}${fileExt}`;
      const filepath = path.join(uploadDir, filename);
      // formidable on some setups gives .filepath or .path
      const sourcePath = logoFile.filepath || logoFile.path;
      await fs.copyFile(sourcePath, filepath);
      organisation.logo = `/uploads/logos/${filename}`;
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
    return success(organisation);
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
    } = JSON.parse(body);

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
  const { equipments } = JSON.parse(body);
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
  const { contacts } = JSON.parse(body);
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
  const { name, color, description, details } = JSON.parse(body);
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
  const { name, description, userIds } = JSON.parse(body);
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
  const { type, data, userIds } = JSON.parse(body);

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
  const { type, id } = JSON.parse(body);

  if (!type || !id) throw createError({ message: "Type and Id is required" });
  const transaction = await DB.transaction();
  try {
    switch (type) {
      case "equipment": {
        const equipment = await OrganisationEquipment.findByPk(id);
        if (!equipment) throw createError({ message: "Equipment not found" });
        await equipment.destroy({ transaction });
        break;
      }

      case "contact": {
        const contact = await OrganisationContact.findByPk(id);
        if (!contact) throw createError({ message: "Contact not found" });
        await contact.destroy({ transaction });
        break;
      }

      case "surgery": {
        const surgery = await OrganisationSurgery.findByPk(id);
        if (!surgery) throw createError({ message: "Surgery not found" });
        await surgery.destroy({ transaction });
        break;
      }

      case "group": {
        const group = await OrganisationGroup.findByPk(id);
        if (!group) throw createError({ message: "Group not found" });
        await group.destroy({ transaction });
        break;
      }
      default:
        throw createError({ message: "Invalid type provided" });
    }
    await transaction.commit();
    return success("Deleted");
  } catch (err) {
    await transaction.rollback();
    return error(500, err.message);
  }
}

export const getSurgeries = async (event) => {
  const body = await readBody(event)
  const { organisationId } = JSON.parse(body)
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