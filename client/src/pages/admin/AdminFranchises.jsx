import { useFetch } from '../../hooks/useFetch';
import { useState, useEffect } from 'react';
import { Eye, X, FileText, Download, Image as ImageIcon } from 'lucide-react';
import api from '../../services/api';

const AdminFranchises = () => {
  const { data: franchises, loading, refetch } = useFetch('/franchises');
  const [processing, setProcessing] = useState(null);
  const [viewingFranchise, setViewingFranchise] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [previewDocId, setPreviewDocId] = useState(null);

  useEffect(() => {
    if (viewingFranchise) {
      const fetchDocs = async () => {
        setLoadingDocs(true);
        try {
          const res = await api.get(`/documents/entity/franchise/${viewingFranchise.id}`);
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
  }, [viewingFranchise]);

  const handleStatus = async (id, status) => {
    setProcessing(id);
    try {
      await api.patch(`/franchises/${id}/status`, { status });
      refetch();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
    setProcessing(null);
  };

  return (
    <div>
      <div className="page-header"><h1>Franchises</h1></div>
      {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
        <div className="card table-container">
          <table className="data-table">
            <thead><tr><th>Organization</th><th>Contact</th><th>City</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {franchises?.map(f => (
                <tr key={f.id}>
                  <td>{f.organization_name}</td>
                  <td>{f.contact_person}<br/><span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{f.email}</span></td>
                  <td>{f.city}, {f.state}</td>
                  <td><span className={`badge badge-${f.status === 'approved' ? 'success' : f.status === 'rejected' ? 'danger' : 'warning'}`}>{f.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        onClick={() => setViewingFranchise(f)}
                        className="btn-icon"
                        title="View details"
                        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.25rem' }}
                      >
                        <Eye size={18} />
                      </button>
                      {f.status === 'pending' && (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={() => handleStatus(f.id, 'approved')} disabled={processing === f.id}>Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleStatus(f.id, 'rejected')} disabled={processing === f.id}>Reject</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!franchises || franchises.length === 0) && <div className="empty-state"><p>No franchise applications</p></div>}
        </div>
      )}

      {viewingFranchise && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal-content card" style={{ width: '100%', maxWidth: '560px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Franchise Details</h2>
              <button onClick={() => setViewingFranchise(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Organization</div>
                  <div style={{ fontWeight: 500 }}>{viewingFranchise.organization_name || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Status</div>
                  <span className={`badge badge-${viewingFranchise.status === 'approved' ? 'success' : viewingFranchise.status === 'rejected' ? 'danger' : 'warning'}`}>{viewingFranchise.status}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Contact Person</div>
                  <div>{viewingFranchise.contact_person || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Email</div>
                  <div>{viewingFranchise.email || '-'}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Phone</div>
                  <div>{viewingFranchise.phone || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>City / State</div>
                  <div>{[viewingFranchise.city, viewingFranchise.state].filter(Boolean).join(', ') || '-'}</div>
                </div>
              </div>
              {viewingFranchise.address && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Address</div>
                  <div>{viewingFranchise.address}</div>
                  <div style={{ marginTop: '0.25rem', color: '#4b5563' }}>
                    {[viewingFranchise.city, viewingFranchise.state, viewingFranchise.pincode].filter(Boolean).join(', ')}
                  </div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Has Building/Rental</div>
                  <div style={{ textTransform: 'capitalize' }}>{viewingFranchise.has_building_or_rental || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Education Experience</div>
                  <div style={{ textTransform: 'capitalize' }}>{viewingFranchise.has_education_experience || '-'}</div>
                </div>
              </div>
              {viewingFranchise.course_categories && viewingFranchise.course_categories.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Course Categories</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {viewingFranchise.course_categories.map((cat, idx) => (
                      <span key={idx} style={{ background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.875rem' }}>{cat}</span>
                    ))}
                  </div>
                </div>
              )}
              {viewingFranchise.teaching_facility_details && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Teaching Facility Details</div>
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>{viewingFranchise.teaching_facility_details}</div>
                </div>
              )}
              {viewingFranchise.classroom_facility_details && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Classroom Facility Details</div>
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>{viewingFranchise.classroom_facility_details}</div>
                </div>
              )}
              {viewingFranchise.other_information && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Other Information</div>
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>{viewingFranchise.other_information}</div>
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
              <button onClick={() => setViewingFranchise(null)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminFranchises;
