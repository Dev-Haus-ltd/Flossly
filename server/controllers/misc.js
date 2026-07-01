import { Role } from "../models";
import { HrDocument } from "../models/hrDocuments";
import { success, error } from "../utils/response";
import { uploadBufferFile } from "../utils/storage";
import { getRequestURL } from "h3";
export const addRoles = async (event) => {
  const body = await readBody(event);
  const { roles } = body;
  try {
    await Role.bulkCreate(roles);
    return success("Roles Added");
  } catch (err) {
    return error(500, err);
  }
};

export const getRoles = async (event) => {
  try {
    const roles = await Role.findAll();
    if (roles && roles.length) {
      return success(roles);
    } else {
      return success([]);
    }
  } catch (err) {
    error(500, err);
  }
};

export const getConfigs = async (event) => {
  // const loggedUser = event.context.user
  // const userPreference = await UserPreference.findOne({ where: { userId: loggedUser.id }})
  // const subscription = await UserSubscription.findOne({ where: { userId: loggedUser.id, organisationId: loggedUser.orgid }})
  // if (!userPreference) return error(404, "preference not found")
  //   const configs = {
  // subscriptionStatus: subscription.stripeSubscriptionStatus,
  // }
};

export const uploadEmailImage = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    if (!orgId) return error(401, 'Unauthenticated')

    const parts = await readMultipartFormData(event)
    const filePart = Array.isArray(parts) ? parts.find((p) => p?.filename && p?.data) : null
    if (!filePart) return error(400, 'file required')

    const mime = String(filePart.type || '').toLowerCase()
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedMimes.includes(mime)) return error(400, 'Only image files are allowed (jpeg, png, gif, webp)')

    const ext = mime.split('/')[1] || 'jpg'
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
    const link = await uploadBufferFile({ data: filePart.data, filename: uniqueName, contentType: mime, baseDir: 'email-images' })
    const reqUrl = getRequestURL(event)
    const absoluteUrl = `${reqUrl.protocol}//${reqUrl.host}${link}`
    return success({ url: absoluteUrl })
  } catch (e) {
    return error(500, e.message)
  }
}

const INTERNAL_HOST = /^(localhost|127\.|169\.254\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/i
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB

export const uploadEmailImageByUrl = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    if (!orgId) return error(401, 'Unauthenticated')

    const body = await readBody(event)
    const { url } = typeof body === 'string' ? JSON.parse(body) : body
    if (!url || !/^https?:\/\//i.test(url)) return error(400, 'Valid URL required')

    const { hostname } = new URL(url)
    if (INTERNAL_HOST.test(hostname)) return error(400, 'URL not allowed')

    const resp = await fetch(url, { method: 'GET' })
    if (!resp.ok) return error(400, 'Failed to fetch image URL')
    const reader = resp.body.getReader()
    const chunks = []
    let totalBytes = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      totalBytes += value.length
      if (totalBytes > MAX_IMAGE_BYTES) {
        await reader.cancel()
        return error(400, 'Image too large (max 5 MB)')
      }
      chunks.push(value)
    }
    const buf = Buffer.concat(chunks.map((c) => Buffer.from(c)))

    const extMatch = url.split('?')[0].match(/\.(jpe?g|png|gif|webp)$/i)
    const ext = extMatch ? extMatch[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg'
    const mimeMap = { jpg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' }
    const mime = mimeMap[ext] || 'image/jpeg'

    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
    const link = await uploadBufferFile({ data: buf, filename: uniqueName, contentType: mime, baseDir: 'email-images' })
    const reqUrl = getRequestURL(event)
    const absoluteUrl = `${reqUrl.protocol}//${reqUrl.host}${link}`
    return success({ url: absoluteUrl })
  } catch (e) {
    return error(500, e.message)
  }
}

export const addHRDocuments = async (event) => {
  try {
    const body = await readBody(event);
    const { name, type } = body;
    await HrDocument.create({
      name,
      type,
    });
    return success("Added");
  } catch (err) {
    return error(500, err.message);
  }
};
