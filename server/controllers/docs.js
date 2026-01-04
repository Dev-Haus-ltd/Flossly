import {
  SystemDocument,
  SystemDocumentFolder,
  UserDocument,
  UserDocumentFolder,
} from "../models";
import DB from "../utils/db";
import { fn, col, Op } from "sequelize";
import formidable from "formidable";
import path from "path";
import fs from "fs";

export const createFolder = async (event) => {
  const body = await readBody(event);
  const loggedUser = event.context.user;
  const { name, color, description, parentId } = JSON.parse(body);
  if (!name) throw createError({ message: "Folder name required" });
  try {
    // If parentId is provided, validate depth (max 2 levels: root -> level 1 -> level 2)
    if (parentId) {
      const parentFolder = await UserDocumentFolder.findByPk(parentId);
      if (!parentFolder) {
        throw createError({ message: "Parent folder not found" });
      }
      // Check if parent folder already has a parent (meaning it's level 2, can't go deeper)
      if (parentFolder.parentId) {
        throw createError({ message: "Maximum folder nesting depth reached (2 levels)" });
      }
    }
    const folder = await UserDocumentFolder.create({
      userId: loggedUser.userId,
      organisationId: loggedUser.orgId,
      name,
      color,
      description,
      parentId: parentId || null,
    });
    return success(folder);
  } catch (err) {
    return error(500, err.message);
  }
};
export const createSystemFolder = async (event) => {
  const body = await readBody(event);
  const { name, color, description } = JSON.parse(body);
  if (!name) throw createError({ message: "Folder name required" });
  try {
    const folder = await SystemDocumentFolder.create({
      name,
      color,
      description,
    });
    return success(folder);
  } catch (err) {
    return error(500, err.message);
  }
};
export const updateFolder = async (event) => {
  const body = await readBody(event);
  const { id, name, color, description } = JSON.parse(body);
  if (!id) throw createError({ message: "Folder id required" });
  try {
    const folder = await UserDocumentFolder.findByPk(id);
    if (!folder) throw createError({ message: "Folder not found" });
    await folder.update({ name, color, description });
    return success(folder);
  } catch (err) {
    return error(500, err.message);
  }
};
export const deleteFolder = async (event) => {
  const body = await readBody(event);
  const { id } = JSON.parse(body);
  const transaction = await DB.transaction();
  try {
    const folder = await UserDocumentFolder.findByPk(id);
    if (!folder) {
      await transaction.rollback();
      throw createError({ message: "Folder not found" });
    }
    await folder.destroy({ transaction });
    await transaction.commit();
    return success("Folder deleted successfully");
  } catch (err) {
    await transaction.rollback();
    return error(500, err.message);
  }
};

export const listFolders = async (event) => {
  const loggedUser = event.context.user;
  const body = await readBody(event);
  const { parentId } = body ? JSON.parse(body) : {};
  try {
    const where = {
      userId: loggedUser.userId,
      organisationId: loggedUser.orgId,
      parentId: parentId || null, // Filter by parent (null = root level folders)
    };
    const folders = await UserDocumentFolder.findAll({
      where,
      attributes: {
        include: [
          [
            fn("COUNT", col("documents.id")), // count documents linked to this folder
            "documentCount",
          ],
        ],
      },
      include: [
        {
          model: UserDocument,
          as: "documents", // must match association alias
          attributes: [],
          required: false,
        },
        {
          model: UserDocumentFolder,
          as: "parent",
          attributes: ["id", "name", "color", "parentId"],
          required: false,
        },
      ],
      group: ["UserDocumentFolders.id", "parent.id"], // group by folder ID and parent
      order: [["createdAt", "DESC"]],
    });
    return success(folders);
  } catch (err) {
    return error(500, err.message);
  }
};

export const listSystemFolders = async (event) => {
  const loggedUser = event.context.user;
  try {
    const folders = await SystemDocumentFolder.findAll({
      attributes: {
        include: [[fn("COUNT", col("documents.id")), "documentCount"]],
      },
      include: [
        {
          model: SystemDocument,
          as: "documents",
          attributes: [],
          required: false,
        },
      ],
      group: ["SystemDocumentFolders.id"],
      order: [["createdAt", "DESC"]],
    });
    return success(folders);
  } catch (err) {
    return error(500, err.message);
  }
};

export const addDocument = async (event) => {
  const loggedUser = event.context.user;
  try {
    const form = formidable({
      multiples: true,
      uploadDir: path.join(process.cwd(), "public/documents"),
      keepExtensions: true,
    });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(event.node.req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const uploadedFiles = Array.isArray(files.file) ? files.file : [files.file];
    const createdDocuments = [];
    for (const file of uploadedFiles) {
      const type = getFileType(file.originalFilename);
      const filePath = `documents/${path.basename(file.filepath)}`;
      const document = await UserDocument.create({
        userId: loggedUser.userId,
        organisationId: loggedUser.orgId,
        name: file.originalFilename,
        type: type && type.includes("doc") ? "editable" : "readonly",
        tags: fields.tags ? fields.tags[0] : null,
        link: filePath,
        folderId: fields.folderId ? fields.folderId[0] : null,
        lastViewedOn: null,
      });
      createdDocuments.push(document);
    }
    return success(createdDocuments);
  } catch (err) {
    return error(500, err.message);
  }
};

export const addSystemDocument = async (event) => {
  try {
    const form = formidable({
      multiples: true,
      uploadDir: path.join(process.cwd(), "public/systemDocs"),
      keepExtensions: true,
    });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(event.node.req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const uploadedFiles = Array.isArray(files.file) ? files.file : [files.file];
    const createdDocuments = [];
    for (const file of uploadedFiles) {
      const type = getFileType(file.originalFilename);
      const filePath = `/systemDocs/${path.basename(file.filepath)}`;
      const document = await SystemDocument.create({
        name: file.originalFilename,
        type,
        tags: fields.tags ? fields.tags[0] : null,
        link: filePath,
        folderId: fields.folderId ? fields.folderId[0] : null,
        lastViewedOn: null,
      });
      createdDocuments.push(document);
    }
    return success(createdDocuments);
  } catch (err) {
    return error(500, err.message);
  }
};

function getFileType(filename) {
  if (!filename || typeof filename !== "string") return null;
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : null;
}

export const deleteDocument = async (event) => {
  const body = await readBody(event);
  const { id } = JSON.parse(body);
  try {
    const doc = await UserDocument.findByPk(id);
    if (!doc) throw createError({ message: "Document not found" });
    await doc.destroy();
    return success("Document deleted successfully");
  } catch (err) {
    return error(500, err.message);
  }
};

export const updateDocument = async (event) => {
  try {
    const form = formidable({
      multiples: false,
      uploadDir: path.join(process.cwd(), "public/documents"),
      keepExtensions: true,
    });
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(event.node.req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });
    const newFile = files.file[0];
    const userDoc = await UserDocument.findOne({ where: { id: fields.id[0] } });
    const prevLink = path.join(process.cwd(), "public", userDoc.link);
    if (prevLink && fs.existsSync(prevLink)) {
      fs.unlinkSync(prevLink);
    }
    userDoc.link = `documents/${newFile.newFilename}`;
    userDoc.save();
    return success(userDoc);
  } catch (err) {
    return error(500, err.message);
  }
};

export const recentDocuments = async (event) => {
  const loggedUser = event.context.user;
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const documents = await UserDocument.findAll({
      where: {
        organisationId: loggedUser.orgId,
        userId: loggedUser.userId,
        lastViewedOn: {
          [Op.ne]: null,
          [Op.gte]: sevenDaysAgo,
        },
      },
      include: [
        {
          model: UserDocumentFolder,
          as: "folder",
          attributes: ["id", "name", "color", "description"],
          required: false,
        },
      ],
      order: [["lastViewedOn", "DESC"]],
    });
    return success(documents);
  } catch (err) {
    return error(500, err.message);
  }
};

export const viewDocument = async (event) => {
  const body = await readBody(event);
  const { id } = JSON.parse(body);
  try {
    const doc = await UserDocument.findByPk(id);
    if (!doc) throw createError({ message: "Document not found" });
    const filePath = path.join(process.cwd(), "public", `${doc.link}`);
    if (!fs.existsSync(filePath)) {
      throw createError({ statusCode: 404, statusMessage: "File not found" });
    }
    await doc.update({ lastViewedOn: new Date() });
    const fileBuffer = fs.readFileSync(filePath);
    event.node.res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    return fileBuffer;
  } catch (err) {
    return error(500, err.message);
  }
};

export const viewSystemDocument = async (event) => {
  const body = await readBody(event);
  const { id } = JSON.parse(body);
  try {
    const doc = await SystemDocument.findByPk(id);
    if (!doc) throw createError({ message: "Document not found" });
    const filePath = path.join(process.cwd(), "public", `${doc.link}`);
    if (!fs.existsSync(filePath)) {
      throw createError({ statusCode: 404, statusMessage: "File not found" });
    }
    await doc.update({ lastViewedOn: new Date() });
    const fileBuffer = fs.readFileSync(filePath);
    event.node.res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    return fileBuffer;
  } catch (err) {
    return error(500, err.message);
  }
};

export const listDocuments = async (event) => {
  const loggedUser = event.context.user;
  const body = await readBody(event);
  const { folderId } = JSON.parse(body);
  const where = {
    organisationId: loggedUser.orgId,
    userId: loggedUser.userId,
  };
  if (folderId) {
    where["folderId"] = folderId;
  }
  try {
    const documents = await UserDocument.findAll({
      where,
      include: [
        {
          model: UserDocumentFolder,
          as: "folder",
          attributes: ["id", "name", "color", "description"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    return success(documents);
  } catch (err) {
    return error(500, err.message);
  }
};

export const listSystemDocuments = async (event) => {
  const body = await readBody(event);
  const { folderId } = JSON.parse(body);
  const where = {};
  if (folderId) {
    where["folderId"] = folderId;
  }
  try {
    const documents = await SystemDocument.findAll({
      where,
      include: [
        {
          model: SystemDocumentFolder,
          as: "folder",
          attributes: ["id", "name", "color", "description"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    return success(documents);
  } catch (err) {
    return error(500, err.message);
  }
};
