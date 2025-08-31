import {
  Organisation,
  OrganisationContact,
  OrganisationEquipment,
  OrganisationGroup,
  OrganisationGroupUser,
  OrganisationPriority,
  OrganisationStatus,
  OrganisationSurgery,
  User,
} from "../models";
import formidable from "formidable";
import fs from "fs/promises";
import path from "path";
import DB from "../utils/db";

export const updateOrganisationDetails = async (event) => {
  const loggedUser = event.context.user;
  const orgId = loggedUser.orgId;
  const form = formidable({ multiples: false, keepExtensions: true });
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
    // Update organisation fields
    organisation.name = fields.name[0] || organisation.name;
    organisation.address = fields.address[0] || organisation.address;
    organisation.contact = fields.contact[0] || organisation.contact;
    organisation.type = fields.type[0] || organisation.type;


    organisation.managerId = fields.managerId ? fields.managerId[0] : organisation.managerId;
    organisation.teamCount = fields.teamCount ? fields.teamCount[0] : organisation.teamCount;
    organisation.surgeryCount = fields.surgeryCount ? fields.surgeryCount[0] : organisation.surgeryCount;
    organisation.cqcInspectionDate = fields.cqcInspectionDate ? fields.cqcInspectionDate[0] : organisation.cqcInspectionDate;

    // Handle logo upload (if provided)
    if (files.logo) {
      const logoFile = files.logo[0] || files.logo;
      const uploadDir = path.resolve("public/uploads/logos");
      await fs.mkdir(uploadDir, { recursive: true });
      const fileExt = path.extname(logoFile.originalFilename);
      const filename = `org-${orgId}-${Date.now()}${fileExt}`;
      const filepath = path.join(uploadDir, filename);
      await fs.copyFile(logoFile.filepath, filepath);
      organisation.logo = `/uploads/logos/${filename}`;
    }
    if (fields.origin && fields.origin[0] === "onboarding") {
      const user = await User.findByPk(loggedUser.userId);
      user.profileCompletion = 50;
      await user.save();
    }
    await organisation.save();
    return success(organisation.toJSON);
  } catch (err) {
    console.log(err.message);
    return error(500, err.message);
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
