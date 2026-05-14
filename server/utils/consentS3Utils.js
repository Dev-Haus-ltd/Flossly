import AWS from 'aws-sdk'
import fs from 'fs'
import path from 'path'

/**
 * Initialize S3 client
 * @returns {AWS.S3}
 */
const getS3Client = () => {
  return new AWS.S3({
    accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.S3_REGION || process.env.AWS_REGION || "us-east-1",
  })
}

/**
 * Upload file to S3
 * @param {Buffer|string} fileContent - File content (Buffer or file path)
 * @param {string} s3Key - S3 object key (path)
 * @param {string} contentType - MIME type
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<{key: string, url: string, etag: string}>}
 */
export const uploadToS3 = async (
  fileContent,
  s3Key,
  contentType = 'application/pdf',
  metadata = {}
) => {
  try {
    const s3 = getS3Client()
    const bucket = process.env.S3_BUCKET || 'flossly'

    // If fileContent is a path, read the file
    let buffer = fileContent
    if (typeof fileContent === 'string' && fs.existsSync(fileContent)) {
      buffer = fs.readFileSync(fileContent)
    }

    const params = {
      Bucket: bucket,
      Key: s3Key,
      Body: buffer,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
      // Add metadata for tracking
      Metadata: {
        timestamp: new Date().toISOString(),
        ...metadata,
      },
      // Make signed URLs expire in 30 days
      Expires: 30 * 24 * 60 * 60,
    }

    const uploadResult = await s3.upload(params).promise()

    return {
      key: uploadResult.Key,
      etag: uploadResult.ETag,
      location: uploadResult.Location,
      versionId: uploadResult.VersionId,
    }
  } catch (error) {
    console.error('Error uploading to S3:', error)
    throw new Error(`S3 upload failed: ${error.message}`)
  }
}

/**
 * Download file from S3
 * @param {string} s3Key - S3 object key
 * @returns {Promise<Buffer>}
 */
export const downloadFromS3 = async (s3Key) => {
  try {
    const s3 = getS3Client()
    const bucket = process.env.S3_BUCKET || 'flossly'

    const params = {
      Bucket: bucket,
      Key: s3Key,
    }

    const result = await s3.getObject(params).promise()
    return result.Body
  } catch (error) {
    console.error('Error downloading from S3:', error)
    throw new Error(`S3 download failed: ${error.message}`)
  }
}

/**
 * Generate a signed URL for secure access
 * @param {string} s3Key - S3 object key
 * @param {number} expirationSeconds - URL expiration time in seconds (default 24 hours)
 * @returns {Promise<string>}
 */
export const generateSignedUrl = async (
  s3Key,
  expirationSeconds = 24 * 60 * 60
) => {
  try {
    const s3 = getS3Client()
    const bucket = process.env.S3_BUCKET || 'flossly'

    const params = {
      Bucket: bucket,
      Key: s3Key,
      Expires: expirationSeconds,
    }

    return new Promise((resolve, reject) => {
      s3.getSignedUrl('getObject', params, (err, url) => {
        if (err) {
          console.error('Error generating signed URL:', err)
          reject(new Error(`Failed to generate signed URL: ${err.message}`))
        } else {
          resolve(url)
        }
      })
    })
  } catch (error) {
    console.error('Error generating signed URL:', error)
    throw new Error(`Signed URL generation failed: ${error.message}`)
  }
}

/**
 * Delete file from S3
 * @param {string} s3Key - S3 object key
 * @returns {Promise<void>}
 */
export const deleteFromS3 = async (s3Key) => {
  try {
    const s3 = getS3Client()
    const bucket = process.env.S3_BUCKET || 'flossly'

    const params = {
      Bucket: bucket,
      Key: s3Key,
    }

    await s3.deleteObject(params).promise()
  } catch (error) {
    console.error('Error deleting from S3:', error)
    throw new Error(`S3 deletion failed: ${error.message}`)
  }
}

/**
 * List objects in S3 with prefix
 * @param {string} prefix - S3 key prefix
 * @returns {Promise<Array>}
 */
export const listS3Objects = async (prefix) => {
  try {
    const s3 = getS3Client()
    const bucket = process.env.S3_BUCKET || 'flossly'

    const params = {
      Bucket: bucket,
      Prefix: prefix,
    }

    const result = await s3.listObjectsV2(params).promise()
    return result.Contents || []
  } catch (error) {
    console.error('Error listing S3 objects:', error)
    throw new Error(`S3 listing failed: ${error.message}`)
  }
}

/**
 * Check if file exists in S3
 * @param {string} s3Key - S3 object key
 * @returns {Promise<boolean>}
 */
export const s3ObjectExists = async (s3Key) => {
  try {
    const s3 = getS3Client()
    const bucket = process.env.S3_BUCKET || 'flossly'

    const params = {
      Bucket: bucket,
      Key: s3Key,
    }

    await s3.headObject(params).promise()
    return true
  } catch (error) {
    if (error.code === 'NotFound') {
      return false
    }
    throw error
  }
}

/**
 * Generate S3 key for consent documents
 * @param {number} organisationId - Organisation ID
 * @param {number} patientId - Patient ID
 * @param {string} type - Type (unsigned, signed, signature)
 * @param {string} filename - Original filename
 * @returns {string}
 */
export const generateS3Key = (organisationId, patientId, type, filename) => {
  const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `consent-forms/org_${organisationId}/patient_${patientId}/${type}/${Date.now()}_${safeFilename}`
}

/**
 * Upload document and get S3 key
 * @param {Buffer|string} documentBuffer - Document content
 * @param {number} organisationId - Organisation ID
 * @param {number} patientId - Patient ID
 * @param {string} documentType - pdf or signature
 * @param {string} status - unsigned or signed
 * @returns {Promise<string>} S3 key
 */
export const uploadConsentDocument = async (
  documentBuffer,
  organisationId,
  patientId,
  documentType = 'pdf',
  status = 'unsigned'
) => {
  try {
    const filename = `consent_${Date.now()}.${documentType === 'pdf' ? 'pdf' : 'png'}`
    const s3Key = generateS3Key(organisationId, patientId, status, filename)

    const contentType = documentType === 'pdf' ? 'application/pdf' : 'image/png'
    const result = await uploadToS3(
      documentBuffer,
      s3Key,
      contentType,
      {
        organisationId: organisationId.toString(),
        patientId: patientId.toString(),
        documentType,
        status,
      }
    )

    return result.key
  } catch (error) {
    console.error('Error uploading consent document:', error)
    throw error
  }
}

/**
 * Copy S3 object (for creating backup of unsigned PDFs)
 * @param {string} sourceKey - Source S3 key
 * @param {string} destinationKey - Destination S3 key
 * @returns {Promise<void>}
 */
export const copyS3Object = async (sourceKey, destinationKey) => {
  try {
    const s3 = getS3Client()
    const bucket = process.env.S3_BUCKET || 'flossly'

    const params = {
      Bucket: bucket,
      CopySource: `${bucket}/${sourceKey}`,
      Key: destinationKey,
      ServerSideEncryption: 'AES256',
    }

    await s3.copyObject(params).promise()
  } catch (error) {
    console.error('Error copying S3 object:', error)
    throw new Error(`S3 copy failed: ${error.message}`)
  }
}

/**
 * Get object metadata/info from S3
 * @param {string} s3Key - S3 object key
 * @returns {Promise<Object>}
 */
export const getS3ObjectInfo = async (s3Key) => {
  try {
    const s3 = getS3Client()
    const bucket = process.env.S3_BUCKET || 'flossly'

    const params = {
      Bucket: bucket,
      Key: s3Key,
    }

    const metadata = await s3.headObject(params).promise()
    return {
      key: s3Key,
      size: metadata.ContentLength,
      lastModified: metadata.LastModified,
      contentType: metadata.ContentType,
      etag: metadata.ETag,
      metadata: metadata.Metadata || {},
    }
  } catch (error) {
    console.error('Error getting S3 object info:', error)
    throw new Error(`Failed to get S3 object metadata: ${error.message}`)
  }
}
