import { supabaseAdmin } from '../config/supabase.js';

export const upload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { entityType, entityId, documentType } = req.body;
    if (!entityType || !entityId || !documentType) {
      return res.status(400).json({ error: 'entityType, entityId, and documentType are required' });
    }

    // Upload to Supabase Storage
    const fileName = `${entityType}/${entityId}/${Date.now()}_${req.file.originalname}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Save document record in DB
    const { data, error } = await supabaseAdmin.from('documents').insert({
      entity_type: entityType,
      entity_id: entityId,
      document_type: documentType,
      file_url: fileName,
      original_name: req.file.originalname,
      uploaded_by: req.user.id,
    }).select().single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Upload document error:', err);
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

    // Generate signed URL
    const { data: signedUrl } = await supabaseAdmin.storage
      .from('documents')
      .createSignedUrl(data.file_url, 300);

    res.json({ ...data, downloadUrl: signedUrl?.signedUrl });
  } catch (err) {
    console.error('Get document error:', err);
    res.status(500).json({ error: 'Failed to fetch document' });
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
      await supabaseAdmin.storage.from('documents').remove([doc.file_url]);
    }

    const { error } = await supabaseAdmin.from('documents').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Document deleted' });
  } catch (err) {
    console.error('Delete document error:', err);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};
