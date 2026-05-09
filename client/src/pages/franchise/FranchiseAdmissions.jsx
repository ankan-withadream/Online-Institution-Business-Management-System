import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Eye, X, FileText, Download, Image as ImageIcon } from 'lucide-react';
import api from '../../services/api';

const FranchiseAdmissions = () => {
  const [franchise, setFranchise] = useState(null);
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingAdmission, setViewingAdmission] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [previewDocId, setPreviewDocId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: myFranchise } = await api.get('/franchises/me');
        if (myFranchise) {
          setFranchise(myFranchise);
          const { data } = await api.get(`/admissions/franchise/${myFranchise.id}`);
          setAdmissions(data);
        }
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, []);

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

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h1>Admissions</h1></div>

      <div className="card table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Course</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admissions.map(a => (
              <tr key={a.id}>
                <td>{a.full_name}</td>
                <td>{a.email}</td>
                <td>{a.courses?.name}</td>
                <td>
                  <span className={`badge badge-${a.status === 'approved' ? 'success' : a.status === 'rejected' ? 'danger' : 'warning'}`}>
                    {a.status}
                  </span>
                </td>
                <td>{format(new Date(a.created_at), 'PP')}</td>
                <td>
                  <button
                    onClick={() => setViewingAdmission(a)}
                    className="btn-icon"
                    title="View details"
                    style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.25rem' }}
                  >
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {admissions.length === 0 && <div className="empty-state"><p>No admissions found</p></div>}
      </div>

      {/* View Modal */}
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

              {/* Documents */}
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

export default FranchiseAdmissions;
