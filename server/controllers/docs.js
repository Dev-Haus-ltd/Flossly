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
import os from "os";
import { sendS3Object } from "../utils/s3";
import { uploadTempFile, deleteLink } from "../utils/storage";
import { parseJsonBody } from "../utils/body";

export const createFolder = async (event) => {
  const body = await readBody(event);
  const loggedUser = event.context.user;
  const { name, color, description, parentId } = parseJsonBody(body);
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
  const { name, color, description } = parseJsonBody(body);
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
  const { id, name, color, description } = parseJsonBody(body);
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
  const { id } = parseJsonBody(body);
  const transaction = await DB.transaction();
  try {
    const folder = await UserDocumentFolder.findByPk(id);
    if (!folder) {
      await transaction.rollback();
      throw createError({ message: "Folder not found" });
    }

    // Collect all folder IDs to delete (including nested folders at all levels)
    const allFolderIds = [id];
    const collectNestedFolderIds = async (parentIds) => {
      if (parentIds.length === 0) return;
      const childFolders = await UserDocumentFolder.findAll({
        where: { parentId: parentIds },
        attributes: ["id"],
        transaction,
      });
      const childIds = childFolders.map((f) => f.id);
      if (childIds.length > 0) {
        allFolderIds.push(...childIds);
        // Recursively collect deeper nested folders
        await collectNestedFolderIds(childIds);
      }
    };
    await collectNestedFolderIds([id]);

    // Delete all documents in all collected folders (deepest first doesn't matter for docs)
    const documentsToDelete = await UserDocument.findAll({
      where: { folderId: allFolderIds },
      attributes: ["link"],
      transaction,
    });
    for (const doc of documentsToDelete) {
      await deleteLink(doc?.link);
    }

    await UserDocument.destroy({
      where: { folderId: allFolderIds },
      transaction,
    });

    // Delete folders from deepest to shallowest (reverse order of collection)
    // The allFolderIds array is already in order: parent first, then children
    // So we reverse it to delete children first
    const reversedFolderIds = [...allFolderIds].reverse();
    for (const folderId of reversedFolderIds) {
      await UserDocumentFolder.destroy({
        where: { id: folderId },
        transaction,
      });
    }

    await transaction.commit();
    return success("Folder deleted successfully");
  } catch (err) {
    await transaction.rollback();
    return error(500, err.message);
  }
};

// Get all folders (flat list for folder picker)
export const listAllFolders = async (event) => {
  const loggedUser = event.context.user;
  try {
    const folders = await UserDocumentFolder.findAll({
      where: {
        userId: loggedUser.userId,
        organisationId: loggedUser.orgId,
      },
      attributes: {
        include: [
          [fn("COUNT", col("documents.id")), "documentCount"],
        ],
      },
      include: [
        {
          model: UserDocument,
          as: "documents",
          attributes: [],
          required: false,
        },
        {
          model: UserDocumentFolder,
          as: "parent",
          attributes: ["id", "name", "color", "parentId"],
          required: false,
        },
        {
          model: UserDocumentFolder,
          as: "subfolders",
          attributes: ["id", "name", "color", "parentId"],
          required: false,
        },
      ],
      group: ["UserDocumentFolders.id", "parent.id", "subfolders.id"],
      order: [["createdAt", "DESC"]],
    });
    return success(folders);
  } catch (err) {
    return error(500, err.message);
  }
};

// Move document to a different folder
export const moveDocument = async (event) => {
  const body = await readBody(event);
  const loggedUser = event.context.user;
  const { documentId, targetFolderId } = parseJsonBody(body);

  if (!documentId) {
    throw createError({ message: "Document ID is required" });
  }

  try {
    const document = await UserDocument.findOne({
      where: {
        id: documentId,
        userId: loggedUser.userId,
        organisationId: loggedUser.orgId,
      },
    });

    if (!document) {
      throw createError({ message: "Document not found" });
    }

    // Validate target folder if provided
    if (targetFolderId) {
      const targetFolder = await UserDocumentFolder.findOne({
        where: {
          id: targetFolderId,
          userId: loggedUser.userId,
          organisationId: loggedUser.orgId,
        },
      });

      if (!targetFolder) {
        throw createError({ message: "Target folder not found" });
      }
    }

    await document.update({ folderId: targetFolderId || null });
    return success(document);
  } catch (err) {
    return error(500, err.message);
  }
};

// Move folder to a different parent folder
export const moveFolder = async (event) => {
  const body = await readBody(event);
  const loggedUser = event.context.user;
  const { folderId, targetParentId } = parseJsonBody(body);

  if (!folderId) {
    throw createError({ message: "Folder ID is required" });
  }

  try {
    const folder = await UserDocumentFolder.findOne({
      where: {
        id: folderId,
        userId: loggedUser.userId,
        organisationId: loggedUser.orgId,
      },
    });

    if (!folder) {
      throw createError({ message: "Folder not found" });
    }

    // Prevent moving folder into itself
    if (targetParentId === folderId) {
      throw createError({ message: "Cannot move folder into itself" });
    }

    // Validate target parent folder if provided
    if (targetParentId) {
      const targetFolder = await UserDocumentFolder.findOne({
        where: {
          id: targetParentId,
          userId: loggedUser.userId,
          organisationId: loggedUser.orgId,
        },
      });

      if (!targetFolder) {
        throw createError({ message: "Target folder not found" });
      }

      // Prevent moving folder into its own subfolder (circular reference)
      if (targetFolder.parentId === folderId) {
        throw createError({ message: "Cannot move folder into its own subfolder" });
      }

      // Check depth constraint (max 2 levels)
      // If target has a parent, it's at level 2, so we can't add more children
      if (targetFolder.parentId) {
        throw createError({ message: "Maximum folder nesting depth reached (2 levels)" });
      }

      // If the folder being moved has subfolders, it can only go to root
      const hasSubfolders = await UserDocumentFolder.count({ where: { parentId: folderId } });
      if (hasSubfolders > 0) {
        throw createError({ message: "Folder with subfolders can only be moved to root level" });
      }
    }

    await folder.update({ parentId: targetParentId || null });
    return success(folder);
  } catch (err) {
    return error(500, err.message);
  }
};

export const listFolders = async (event) => {
  const loggedUser = event.context.user;
  const body = await readBody(event);
  const { parentId } = body ? parseJsonBody(body) : {};
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
      uploadDir: os.tmpdir(),
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
      const filePath = await uploadTempFile({
        filepath: file.filepath,
        filename: path.basename(file.filepath),
        contentType: file.mimetype || file.type,
        baseDir: "documents",
      });
      const document = await UserDocument.create({
        userId: loggedUser.userId,
        organisationId: loggedUser.orgId,
        name: file.originalFilename,
        type: type && type.includes("doc") ? "editable" : "readonly",
        tags: fields.tags ? fields.tags[0] : null,
        link: filePath,
        folderId: fields.folderId ? fields.folderId[0] : null,
        lastViewedOn: new Date(),
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
      uploadDir: os.tmpdir(),
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
      const filePath = await uploadTempFile({
        filepath: file.filepath,
        filename: path.basename(file.filepath),
        contentType: file.mimetype || file.type,
        baseDir: "systemDocs",
      });
      const document = await SystemDocument.create({
        name: file.originalFilename,
        type,
        tags: fields.tags ? fields.tags[0] : null,
        link: filePath,
        folderId: fields.folderId ? fields.folderId[0] : null,
        lastViewedOn: new Date(),
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
  const { id } = parseJsonBody(body);
  try {
    const doc = await UserDocument.findByPk(id);
    if (!doc) throw createError({ message: "Document not found" });
    await deleteLink(doc.link);
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
    if (!userDoc) {
      return error(404, "Document not found");
    }
    

    try {
      await deleteLink(userDoc.link);
    } catch (_) {}

    const newLink = await uploadTempFile({
      filepath: newFile.filepath,
      filename: path.basename(newFile.filepath),
      contentType: newFile.mimetype || newFile.type,
      baseDir: "documents",
    });

    // Update document link and touch updatedAt
    await userDoc.update({ link: newLink, updatedAt: new Date() });

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
          [Op.and]: {
            [Op.ne]: null,
            [Op.gte]: sevenDaysAgo,
          },
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
  const { id } = parseJsonBody(body);
  try {
    const doc = await UserDocument.findByPk(id);
    if (!doc) throw createError({ message: "Document not found" });
    await doc.update({ lastViewedOn: new Date() });
    return await sendS3Object(event, doc.link);
  } catch (err) {
    return error(500, err.message);
  }
};

export const viewSystemDocument = async (event) => {
  const body = await readBody(event);
  const { id } = parseJsonBody(body);
  try {
    const doc = await SystemDocument.findByPk(id);
    if (!doc) throw createError({ message: "Document not found" });
    await doc.update({ lastViewedOn: new Date() });
    return await sendS3Object(event, doc.link);
  } catch (err) {
    return error(500, err.message);
  }
};

export const listDocuments = async (event) => {
  const loggedUser = event.context.user;
  const body = await readBody(event);
  const { folderId } = parseJsonBody(body);
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
  const { folderId } = parseJsonBody(body);
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
