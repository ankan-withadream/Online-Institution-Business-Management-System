import crypto from 'crypto';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import env from '../config/env.js';

const r2Client = new S3Client({
  region: env.R2_REGION,
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

console.log('R2 client initialized:', {
  endpoint: env.R2_ENDPOINT,
  bucket: env.R2_BUCKET,
  region: env.R2_REGION,
  hasAccessKey: Boolean(env.R2_ACCESS_KEY_ID),
});


const checkR2Connection = async () => {
  try {
    await r2Client.send(new HeadBucketCommand({ Bucket: env.R2_BUCKET }));
    console.log('R2 health check: success');
  } catch (err) {
    // console.log(err);
    console.error('R2 health check: failed', err?.message);
  }
};

checkR2Connection();

const sanitizeFileName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

export const buildR2Key = (prefix, originalName) => {
  const safeName = sanitizeFileName(originalName || 'file');
  const random = crypto.randomBytes(6).toString('hex');
  return `${prefix}/${Date.now()}_${random}_${safeName}`;
};

export const uploadBuffer = async ({ key, buffer, contentType, cacheControl }) => {
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: cacheControl,
  });

  await r2Client.send(command);
  return { key };
};

export const createUploadUrl = async ({ key, contentType, expiresIn = 300 }) => {
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
};

export const getDownloadUrl = async ({ key, expiresIn = 300, downloadName }) => {
  const responseDisposition = downloadName
    ? `attachment; filename="${sanitizeFileName(downloadName)}"`
    : undefined;

  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
    ResponseContentDisposition: responseDisposition,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
};

export const deleteObject = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
  });

  await r2Client.send(command);
};
