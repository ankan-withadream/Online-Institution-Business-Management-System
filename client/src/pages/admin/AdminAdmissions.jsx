import { useState, useEffect } from 'react';
import { Eye, X, FileText, Download, Image as ImageIcon, Edit2, Trash2, Upload } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import { uploadDocument, deleteDocument } from '../../services/documents';
import { format } from 'date-fns';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminAdmissions = () => {
  const { data: admissions, loading, refetch } = useFetch('/admissions');
  const { data: courses } = useFetch('/courses');
  const [processing, setProcessing] = useState(null);
  const [viewingAdmission, setViewingAdmission] = useState(null);
  const [approvingAdmission, setApprovingAdmission] = useState(null);
  const [selectedSession, setSelectedSession] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [previewDocId, setPreviewDocId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAdmission, setEditingAdmission] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [editDocuments, setEditDocuments] = useState([]);
  const [editDocsLoading, setEditDocsLoading] = useState(false);
  const [uploadingDocType, setUploadingDocType] = useState(null);
  const [deletingDocId, setDeletingDocId] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (admissions && location.state?.userId) {
      const admission = admissions.find(a => a.user_id === location.state.userId);
      if (admission) {
        setViewingAdmission(admission);
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [admissions, location.state, location.pathname, navigate]);

  useEffect(() => {
    if (viewingAdmission) {
      const fetchDocs = async () => {
        setLoadingDocs(true);
        try {
          const res = await api.get(`/documents/entity/admission/${viewingAdmission.id}`);
          setDocuments(res.data);
        } catch (err) {
          console.error('Failed to fetch documents', err);
        } finally {
          setLoadingDocs(false);
        }
      };
      fetchDocs();
    } else {
      setDocuments([]);
    }
  }, [viewingAdmission]);

  const handleStatus = async (id, status, sessionId = null) => {
    setProcessing(id);
    try {
      await api.patch(`/admissions/${id}/status`, { status, sessionId });
      setApprovingAdmission(null);
      setSelectedSession('');
      if (status === 'approved') {
        toast.success('Admission approved — student account created and welcome SMS sent');
      } else if (status === 'rejected') {
        toast.success('Admission rejected');
      }
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${status} admission`);
    }
    setProcessing(null);
  };

  const openApproveModal = (admission) => {
    setApprovingAdmission(admission);
    setSelectedSession(admission.session_id || '');
  };

  const handleEdit = async (admission) => {
    setEditingAdmission(admission);
    setEditFormData({
      fullName: admission.full_name || '',
      fatherName: admission.father_name || '',
      motherName: admission.mother_name || '',
      email: admission.email || '',
      phone: admission.phone || '',
      dateOfBirth: admission.date_of_birth || '',
      gender: admission.gender || '',
      address: admission.address || '',
      city: admission.city || '',
      state: admission.state || '',
      pincode: admission.pincode || '',
      courseId: admission.course_id || '',
      sessionId: admission.session_id || null,
      franchiseId: admission.franchise_id || null,
    });
    // Only admin needs course & session fields; remove for other roles.

    // Fetch existing documents for the re-upload section
    setEditDocsLoading(true);
    setEditDocuments([]);
    try {
      const res = await api.get(`/documents/entity/admission/${admission.id}`);
      setEditDocuments(res.data);
    } catch {
      setEditDocuments([]);
    } finally {
      setEditDocsLoading(false);
    }

    setIsEditModalOpen(true);
  };

  const handleEditDocUpload = async (documentType, file) => {
    if (!file) return;
    setUploadingDocType(documentType);
    try {
      // If a document of this type exists, delete the old one first
      const oldDoc = editDocuments.find(d => d.document_type === documentType);
      if (oldDoc) {
        try {
          await deleteDocument(oldDoc.id);
        } catch {
          // continue even if delete fails — the upload may still succeed
        }
      }
      await uploadDocument({
        file,
        entityType: 'admission',
        entityId: editingAdmission.id,
        documentType,
      });
      toast.success(`${documentType.replace(/_/g, ' ')} ${oldDoc ? 'replaced' : 'uploaded'}`);
      // Refresh the document list for this admission
      const res = await api.get(`/documents/entity/admission/${editingAdmission.id}`);
      setEditDocuments(res.data);
    } catch (err) {
      toast.error(`Failed to upload ${documentType.replace(/_/g, ' ')}`);
    } finally {
      setUploadingDocType(null);
    }
  };

  const handleEditDocDelete = async (docId) => {
    setDeletingDocId(docId);
    try {
      await deleteDocument(docId);
      toast.success('Document deleted');
      setEditDocuments(prev => prev.filter(d => d.id !== docId));
    } catch {
      toast.error('Failed to delete document');
    } finally {
      setDeletingDocId(null);
    }
  };
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/admissions/${editingAdmission.id}`, editFormData);
      toast.success('Admission updated successfully');
      setIsEditModalOpen(false);
      setEditingAdmission(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update admission');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header"><h1>Admissions</h1></div>
      {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
        <div className="card table-container">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Course</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {admissions?.map(a => (
                <tr key={a.id}>
                  <td>{a.full_name}</td>
                  <td>{a.email}</td>
                  <td>{a.courses?.name}</td>
                  <td><span className={`badge badge-${a.status === 'approved' ? 'success' : a.status === 'rejected' ? 'danger' : 'warning'}`}>{a.status}</span></td>
                  <td>{format(new Date(a.created_at), 'PP')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        onClick={() => setViewingAdmission(a)}
                        className="btn-icon"
                        title="View details"
                        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.25rem' }}
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleEdit(a)}
                        className="btn-icon"
                        title="Edit admission"
                        style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '0.25rem' }}
                      >
                        <Edit2 size={18} />
                      </button>
                      {a.status === 'pending' && (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={() => openApproveModal(a)} disabled={processing === a.id}>Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleStatus(a.id, 'rejected')} disabled={processing === a.id}>Reject</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!admissions || admissions.length === 0) && <div className="empty-state"><p>No admissions found</p></div>}
        </div>
      )}

      {approvingAdmission && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div className="modal-content card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Approve Admission</h2>
            <p style={{ marginBottom: '1.5rem', color: '#4b5563' }}>Assign a session to <strong>{approvingAdmission.full_name}</strong> for <strong>{approvingAdmission.courses?.name}</strong>.</p>
            
            <div className="form-group">
              <label className="form-label">Select Session</label>
              <select 
                className="form-select" 
                value={selectedSession} 
                onChange={(e) => setSelectedSession(e.target.value)}
              >
                <option value="">No Session (Assign Later)</option>
                {courses?.find(c => c.id === approvingAdmission.course_id)?.sessions?.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.session_type} ({s.start_date || 'TBA'} to {s.end_date || 'TBA'})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setApprovingAdmission(null)} className="btn btn-secondary" disabled={processing === approvingAdmission.id}>Cancel</button>
              <button 
                onClick={() => handleStatus(approvingAdmission.id, 'approved', selectedSession)} 
                className="btn btn-primary" 
                disabled={processing === approvingAdmission.id}
              >
                {processing === approvingAdmission.id ? 'Processing...' : 'Approve & Create Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admission Modal */}
      {isEditModalOpen && editingAdmission && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div className="modal-content card" style={{ width: '100%', maxWidth: '620px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Edit Admission — {editingAdmission.full_name}</h2>
              <button
                onClick={() => { setIsEditModalOpen(false); setEditingAdmission(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input type="text" required className="form-input"
                    value={editFormData.fullName}
                    onChange={e => setEditFormData(d => ({ ...d, fullName: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input type="email" required className="form-input"
                    value={editFormData.email}
                    onChange={e => setEditFormData(d => ({ ...d, email: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Father's Name</label>
                  <input type="text" className="form-input"
                    value={editFormData.fatherName}
                    onChange={e => setEditFormData(d => ({ ...d, fatherName: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mother's Name</label>
                  <input type="text" className="form-input"
                    value={editFormData.motherName}
                    onChange={e => setEditFormData(d => ({ ...d, motherName: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Phone *</label>
                  <input type="text" required className="form-input"
                    value={editFormData.phone}
                    onChange={e => setEditFormData(d => ({ ...d, phone: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input type="date" className="form-input"
                    value={editFormData.dateOfBirth}
                    onChange={e => setEditFormData(d => ({ ...d, dateOfBirth: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-select"
                    value={editFormData.gender}
                    onChange={e => setEditFormData(d => ({ ...d, gender: e.target.value }))}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Course</label>
                  <select className="form-select"
                    value={editFormData.courseId}
                    onChange={e => setEditFormData(d => ({ ...d, courseId: e.target.value }))}>
                    <option value="">-- Select Course --</option>
                    {courses?.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input type="text" className="form-input"
                  value={editFormData.address}
                  onChange={e => setEditFormData(d => ({ ...d, address: e.target.value }))} />
              </div>

              <div className="grid grid-3">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input type="text" className="form-input"
                    value={editFormData.city}
                    onChange={e => setEditFormData(d => ({ ...d, city: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input type="text" className="form-input"
                    value={editFormData.state}
                    onChange={e => setEditFormData(d => ({ ...d, state: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Pincode</label>
                  <input type="text" className="form-input"
                    value={editFormData.pincode}
                    onChange={e => setEditFormData(d => ({ ...d, pincode: e.target.value }))} />
                </div>
              </div>

              {/* ── Document Re-upload Section ── */}
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--gray-200)', paddingTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Documents</h3>
                <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '1rem' }}>
                  Upload replacement documents or delete existing ones. Accepted: JPEG, PNG, WebP, PDF (max 5 MB).
                </p>

                {editDocsLoading ? (
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Loading documents...</div>
                ) : (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {/* Existing documents */}
                    {editDocuments.map((doc) => (
                      <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem', background: 'var(--gray-50)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                          {/\.(jpg|jpeg|png|webp|gif)$/i.test(doc.original_name || doc.file_url) ? <ImageIcon size={18} color="#6b7280" /> : <FileText size={18} color="#6b7280" />}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {doc.original_name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'capitalize' }}>
                              {doc.document_type.replace(/_/g, ' ')}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEditDocDelete(doc.id)}
                          disabled={deletingDocId === doc.id}
                          className="btn-icon"
                          style={{ padding: '0.5rem', background: 'none', border: 'none', color: 'var(--danger-500)', cursor: 'pointer', flexShrink: 0 }}
                          title={`Delete ${doc.document_type}`}
                        >
                          {deletingDocId === doc.id ? <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    ))}

                    {/* Upload slots for each document type */}
                    {['applicant_photo', 'aadhaar_card', 'marksheet', 'admit_card', 'certificate', 'caste_certificate'].map((docType) => {
                      const existing = editDocuments.find(d => d.document_type === docType);
                      return (
                        <div key={docType} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', border: '1px dashed var(--gray-300)', borderRadius: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', color: '#6b7280', width: '140px', textTransform: 'capitalize', flexShrink: 0 }}>
                            {docType.replace(/_/g, ' ')}
                          </span>
                          <label style={{
                            flex: 1,
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.4rem 0.75rem',
                            background: uploadingDocType === docType ? 'var(--gray-100)' : 'var(--primary-50)',
                            color: 'var(--primary-700)',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            cursor: uploadingDocType === docType ? 'default' : 'pointer',
                            textAlign: 'center', justifyContent: 'center',
                          }}>
                            {uploadingDocType === docType ? (
                              <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px', flexShrink: 0 }} />
                            ) : (
                              <><Upload size={14} /> {existing ? 'Replace file' : 'Upload file'}</>
                            )}
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.webp,.pdf"
                              disabled={uploadingDocType === docType}
                              onChange={(e) => {
                                if (e.target.files?.[0]) handleEditDocUpload(docType, e.target.files[0]);
                                e.target.value = '';
                              }}
                              style={{ display: 'none' }}
                            />
                          </label>
                          {existing && (
                            <span style={{ fontSize: '0.7rem', color: '#16a34a', flexShrink: 0 }}>✓</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--gray-200)', paddingTop: '1.5rem' }}>
                <button type="button" onClick={() => { setIsEditModalOpen(false); setEditingAdmission(null); }} className="btn btn-secondary" disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingAdmission && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal-content card" style={{ width: '100%', maxWidth: '560px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Admission Details</h2>
              <button onClick={() => setViewingAdmission(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Full Name</div>
                  <div>{viewingAdmission.full_name || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Status</div>
                  <span className={`badge badge-${viewingAdmission.status === 'approved' ? 'success' : viewingAdmission.status === 'rejected' ? 'danger' : 'warning'}`}>{viewingAdmission.status}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Email</div>
                  <div>{viewingAdmission.email || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Phone</div>
                  <div>{viewingAdmission.phone || '-'}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Course Applied</div>
                  <div>{viewingAdmission.courses?.name || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Date Applied</div>
                  <div>{format(new Date(viewingAdmission.created_at), 'PPP')}</div>
                </div>
              </div>
              {viewingAdmission.session_id && viewingAdmission.sessions && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Session</div>
                    <div>
                      <span className="badge badge-info" style={{ display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}>
                        {viewingAdmission.sessions.session_type}
                        <span style={{ opacity: 0.8, fontSize: '0.7rem' }}>
                          ({viewingAdmission.sessions.start_date || 'TBA'} - {viewingAdmission.sessions.end_date || 'TBA'})
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {viewingAdmission.date_of_birth && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Date of Birth</div>
                    <div>{format(new Date(viewingAdmission.date_of_birth), 'PP')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Gender</div>
                    <div style={{ textTransform: 'capitalize' }}>{viewingAdmission.gender || '-'}</div>
                  </div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Father's Name</div>
                  <div>{viewingAdmission.father_name || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Mother's Name</div>
                  <div>{viewingAdmission.mother_name || '-'}</div>
                </div>
              </div>
              {viewingAdmission.address && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Address</div>
                  <div>{viewingAdmission.address}</div>
                  <div style={{ marginTop: '0.25rem', color: '#4b5563' }}>
                    {[viewingAdmission.city, viewingAdmission.state, viewingAdmission.pincode].filter(Boolean).join(', ')}
                  </div>
                </div>
              )}
              {viewingAdmission.message && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Message</div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{viewingAdmission.message}</div>
                </div>
              )}
              
              <div style={{ marginTop: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--gray-200)' }}>Documents & Images</h3>
                {loadingDocs ? (
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Loading documents...</div>
                ) : documents.length > 0 ? (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {documents.map((doc) => {
                      const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.original_name || doc.file_url);
                      const isPdf = /\.pdf$/i.test(doc.original_name || doc.file_url);
                      const isPreviewing = previewDocId === doc.id;

                      return (
                        <div key={doc.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              {isImage ? <ImageIcon size={20} color="#6b7280" /> : <FileText size={20} color="#6b7280" />}
                              <div>
                                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{doc.original_name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'capitalize' }}>{doc.document_type.replace(/_/g, ' ')}</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              {(isImage || isPdf) && (
                                <button 
                                  onClick={() => setPreviewDocId(isPreviewing ? null : doc.id)}
                                  className="btn-icon" 
                                  style={{ padding: '0.5rem', background: 'var(--gray-100)', color: 'var(--gray-700)', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', border: 'none', cursor: 'pointer' }}
                                  title="Preview"
                                >
                                  <Eye size={16} />
                                </button>
                              )}
                              <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer" className="btn-icon" style={{ padding: '0.5rem', background: 'var(--primary-color)', color: 'white', borderRadius: '0.375rem', display: 'flex', alignItems: 'center' }} title="Download">
                                <Download size={16} />
                              </a>
                            </div>
                          </div>
                          {isPreviewing && (
                            <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--gray-200)', paddingTop: '0.75rem' }}>
                              {isImage ? (
                                <img src={doc.previewUrl || doc.downloadUrl} alt={doc.original_name} style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '0.375rem' }} />
                              ) : isPdf ? (
                                <iframe src={doc.previewUrl || doc.downloadUrl} title={doc.original_name} style={{ width: '100%', height: '400px', border: 'none', borderRadius: '0.375rem' }} />
                              ) : null}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>No documents uploaded.</div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--gray-200)', paddingTop: '1.5rem' }}>
              <button onClick={() => setViewingAdmission(null)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminAdmissions;
