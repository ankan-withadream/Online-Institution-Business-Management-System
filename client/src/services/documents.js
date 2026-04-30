import api from './api';
import { compressImage } from '../utils/imageCompression';

const processFile = async (file) => {
  // Only compress if the file is an image and larger than 500KB (500 * 1024 bytes)
  console.log('Processing file:', file);
  if (file && file.type.startsWith('image/') && file.size > 500 * 1024) {
    try {
      const compressed = await compressImage(file, {});
      console.log("compressed: ", compressed);
      return compressed;
    } catch (err) {
      console.warn('Image compression failed, falling back to original file:', err);
      // Fallback to original file if compression fails
      return file;
    }
  }
  console.log('File is not an image or is small enough, skipping compression');
  return file;
};

const buildDocumentPayload = ({ file, entityType, entityId, documentType }) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('entityType', entityType);
  formData.append('entityId', entityId);
  formData.append('documentType', documentType);
  return formData;
};

export const uploadDocument = async ({ file, entityType, entityId, documentType }) => {
  const processedFile = await processFile(file);
  const formData = buildDocumentPayload({ file: processedFile, entityType, entityId, documentType });
  const { data } = await api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const uploadDocumentPublic = async ({ file, entityType, entityId, documentType }) => {
  const processedFile = await processFile(file);
  const formData = buildDocumentPayload({ file: processedFile, entityType, entityId, documentType });
  const { data } = await api.post('/documents/public-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const getDocument = async (id) => {
  const { data } = await api.get(`/documents/${id}`);
  return data;
};

export const deleteDocument = async (id) => {
  const { data } = await api.delete(`/documents/${id}`);
  return data;
};
