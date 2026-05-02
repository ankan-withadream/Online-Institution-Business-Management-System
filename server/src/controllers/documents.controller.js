import { supabaseAdmin } from '../config/supabase.js';
import { buildR2Key, uploadBuffer, getDownloadUrl, getPreviewUrl, deleteObject } from '../utils/r2.js';

const ensureDocumentFields = (req) => {
  const { entityType, entityId, documentType } = req.body;
  if (!entityType || !entityId || !documentType) {
    return { error: 'entityType, entityId, and documentType are required' };
  }
  return { entityType, entityId, documentType };
};

const createDocumentRecord = async ({ entityType, entityId, documentType, fileKey, originalName, uploadedBy }) => {
  const { data, error } = await supabaseAdmin
    .from('documents')
    .insert({
      entity_type: entityType,
      entity_id: entityId,
      document_type: documentType,
      file_url: fileKey,
      original_name: originalName,
      uploaded_by: uploadedBy,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const upload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const fields = ensureDocumentFields(req);
    if (fields.error) {
      return res.status(400).json({ error: fields.error });
    }

    const fileKey = buildR2Key(`${fields.entityType}/${fields.entityId}`, req.file.originalname);
    await uploadBuffer({
      key: fileKey,
      buffer: req.file.buffer,
      contentType: req.file.mimetype,
    });

    const data = await createDocumentRecord({
      entityType: fields.entityType,
      entityId: fields.entityId,
      documentType: fields.documentType,
      fileKey,
      originalName: req.file.originalname,
      uploadedBy: req.user.id,
    });

    res.status(201).json(data);
  } catch (err) {
    console.error('Upload document error:', err);
    res.status(500).json({ error: 'Failed to upload document' });
  }
};

export const uploadPublic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const fields = ensureDocumentFields(req);
    if (fields.error) {
      return res.status(400).json({ error: fields.error });
    }

    const fileKey = buildR2Key(`${fields.entityType}/${fields.entityId}`, req.file.originalname);
    await uploadBuffer({
      key: fileKey,
      buffer: req.file.buffer,
      contentType: req.file.mimetype,
    });

    const data = await createDocumentRecord({
      entityType: fields.entityType,
      entityId: fields.entityId,
      documentType: fields.documentType,
      fileKey,
      originalName: req.file.originalname,
      uploadedBy: null,
    });

    res.status(201).json(data);
  } catch (err) {
    console.error('Public upload document error:', err);
    res.status(500).json({ error: 'Failed to upload document' });
  }
};

export const getById = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Document not found' });

    const downloadUrl = await getDownloadUrl({
      key: data.file_url,
      expiresIn: 300,
      downloadName: data.original_name || 'document',
    });

    const previewUrl = await getPreviewUrl({
      key: data.file_url,
      expiresIn: 300,
    });

    res.json({ ...data, downloadUrl, previewUrl });
  } catch (err) {
    console.error('Get document error:', err);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
};

export const getByEntity = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const documentsWithUrls = await Promise.all(
      data.map(async (doc) => {
        try {
          const downloadUrl = await getDownloadUrl({
            key: doc.file_url,
            expiresIn: 300,
            downloadName: doc.original_name || 'document',
          });
          const previewUrl = await getPreviewUrl({
            key: doc.file_url,
            expiresIn: 300,
          });
          return { ...doc, downloadUrl, previewUrl };
        } catch (e) {
          console.error(`Failed to get URL for document ${doc.id}:`, e);
          return doc;
        }
      })
    );

    res.json(documentsWithUrls);
  } catch (err) {
    console.error('Get entity documents error:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

export const remove = async (req, res) => {
  try {
    const { data: doc } = await supabaseAdmin
      .from('documents')
      .select('file_url')
      .eq('id', req.params.id)
      .single();

    if (doc) {
      await deleteObject(doc.file_url);
    }

    const { error } = await supabaseAdmin.from('documents').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Document deleted' });
  } catch (err) {
    console.error('Delete document error:', err);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};
