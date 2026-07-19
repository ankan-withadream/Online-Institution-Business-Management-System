import { useState, useEffect } from 'react';
import { Eye, X, Edit2, IdCard, FileText, Download, Trash2 } from 'lucide-react';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import IdCardTemplate from '../../components/pdf/IdCardTemplate';
import AdmitCardTemplate from '../../components/pdf/AdmitCardTemplate';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import DataTable from '../../components/ui/DataTable';
import { useListContext } from 'ra-core';
import { useBulkActions } from '../../hooks/useBulkActions';

const AdminStudents = () => {
  const [viewingStudent, setViewingStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({ course_id: '', session_id: '', status: 'active' });
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardMode, setCardMode] = useState('id');
  const [cardPhotoUrl, setCardPhotoUrl] = useState(null);
  const [generatingCard, setGeneratingCard] = useState(false);
  const [cardStudent, setCardStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/courses/admin/all').then(({ data }) => {
      setCourses(data?.data || data || []);
    });
  }, []);

  const handleEdit = (student) => {
    setEditingStudent(student);
    setEditFormData({
      course_id: student.course_id || '',
      session_id: student.session_id || '',
      status: student.status || 'active'
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/students/${editingStudent.id}`, editFormData);
      toast.success('Student updated successfully');
      setEditingStudent(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateCard = async (student, mode) => {
    setCardStudent(student);
    setCardMode(mode);
    setGeneratingCard(true);
    setIsCardModalOpen(true);
    setCardPhotoUrl(null);
    try {
      const { data } = await api.get(`/students/${student.id}/photo`);
      setCardPhotoUrl(data.photoUrl);
    } catch {
      setCardPhotoUrl(null);
    } finally {
      setGeneratingCard(false);
    }
  };

  const handleCloseCardModal = () => {
    setIsCardModalOpen(false);
    setCardStudent(null);
    setCardPhotoUrl(null);
  };

  const buildCardProps = () => {
    if (!cardStudent) return {};
    const student = cardStudent;
    const sessionStr = student.sessions
      ? `${student.sessions.session_type || ''} (${student.sessions.start_date || 'TBA'} - ${student.sessions.end_date || 'TBA'})`
      : '';
    const addressParts = [student.address, student.city, student.state, student.pincode].filter(Boolean);
    const dobVal = student.date_of_birth ? format(new Date(student.date_of_birth), 'PP') : null;
    return {
      studentName: student.users?.full_name || '',
      fatherName: student.father_name || '',
      studentIdNumber: student.student_id_number || '',
      courseName: student.courses?.name || '',
      sessionName: sessionStr,
      dateOfBirth: dobVal,
      phone: student.phone || '',
      address: addressParts.join(', '),
      photoUrl: cardPhotoUrl,
      validity: `Valid for Academic Session ${student.sessions?.session_type || student.sessions?.start_date ? `${student.sessions?.start_date || ''} - ${student.sessions?.end_date || ''}` : (student.enrollment_date || '')}`,
      issueDate: student.enrollment_date || new Date().toISOString().split('T')[0],
    };
  };

  const columns = [
    { source: 'student_id_number', label: 'ID', sortable: true, render: (v) => <code>{v}</code> },
    { source: 'users.full_name', label: 'Name', sortable: true },
    { source: 'users.email', label: 'Email' },
    { source: 'courses.name', label: 'Course' },
    {
      source: 'sessions.session_type',
      label: 'Session',
      render: (_, r) => r.sessions ? `${r.sessions.session_type} (${r.sessions.start_date} - ${r.sessions.end_date})` : '-',
    },
    {
      source: 'status',
      label: 'Status',
      sortable: true,
      render: (v) => <span className={`badge badge-${v === 'active' ? 'success' : v === 'graduated' ? 'info' : 'danger'}`}>{v}</span>,
    },
    { source: 'enrollment_date', label: 'Enrolled', sortable: true, render: (v) => (v ? format(new Date(v), 'PP') : '-') },
  ];

  return (
    <div>
      <div className="page-header"><h1>Students</h1></div>

      <DataTable
        key={refreshKey}
        resource="students"
        columns={columns}
        emptyMessage="No students found"
        filters={[
          {
            source: 'status',
            label: 'Status',
            options: [
              { value: 'active', label: 'Active' },
              { value: 'graduated', label: 'Graduated' },
              { value: 'suspended', label: 'Suspended' },
            ],
          },
        ]}
        bulkActions={
          <AdminStudentBulkActions
            onGenerateId={(ids) => {
              if (ids.length === 1) {
                // Single-student: reuse the per-row flow so the photo modal opens
                api.get('/students').then(({ data }) => {
                  const list = data?.data || data || [];
                  const student = list.find(s => s.id === ids[0]);
                  if (student) handleGenerateCard(student, 'id');
                });
              } else {
                toast('ID card generation for multiple students opens one at a time. Selecting 1 student opens the preview.', { icon: 'ℹ️' });
              }
            }}
            onGenerateAdmit={(ids) => {
              if (ids.length === 1) {
                api.get('/students').then(({ data }) => {
                  const list = data?.data || data || [];
                  const student = list.find(s => s.id === ids[0]);
                  if (student) handleGenerateCard(student, 'admit');
                });
              } else {
                toast('Admit card generation for multiple students opens one at a time.', { icon: 'ℹ️' });
              }
            }}
            onAfterDelete={() => setRefreshKey((k) => k + 1)}
          />
        }
        rowActions={(s) => (
          <>
            <button onClick={() => setViewingStudent(s)} className="btn-icon" title="View details" style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.25rem' }}>
              <Eye size={18} />
            </button>
            <button onClick={() => handleEdit(s)} className="btn-icon" title="Edit student" style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '0.25rem' }}>
              <Edit2 size={18} />
            </button>
            <button onClick={() => handleGenerateCard(s, 'id')} className="btn-icon" title="Generate ID Card" style={{ background: 'none', border: 'none', color: '#8b5cf6', cursor: 'pointer', padding: '0.25rem' }}>
              <IdCard size={18} />
            </button>
            <button onClick={() => handleGenerateCard(s, 'admit')} className="btn-icon" title="Generate Admit Card" style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: '0.25rem' }}>
              <FileText size={18} />
            </button>
          </>
        )}
      />

      {viewingStudent && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal-content card" style={{ width: '100%', maxWidth: '560px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Student Details</h2>
              <button onClick={() => setViewingStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Student ID</div>
                  <code>{viewingStudent.student_id_number}</code>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Status</div>
                  <span className={`badge badge-${viewingStudent.status === 'active' ? 'success' : viewingStudent.status === 'graduated' ? 'info' : 'danger'}`}>{viewingStudent.status}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Full Name</div>
                  <div>{viewingStudent.users?.full_name || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Email</div>
                  <div>{viewingStudent.users?.email || '-'}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Father's Name</div>
                  <div>{viewingStudent.father_name || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Mother's Name</div>
                  <div>{viewingStudent.mother_name || '-'}</div>
                </div>
              </div>
              {viewingStudent.photo_url && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Student Photo</div>
                  <img src={viewingStudent.photo_url} alt="Student" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid var(--gray-200)' }} />
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Course</div>
                  <div>{viewingStudent.courses?.name || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Session</div>
                  <div>{viewingStudent.sessions?.session_type} - {viewingStudent.sessions?.start_date} - {viewingStudent.sessions?.end_date}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Enrollment Date</div>
                  <div>{viewingStudent.enrollment_date ? format(new Date(viewingStudent.enrollment_date), 'PP') : '-'}</div>
                </div>
                {viewingStudent.franchise_id && (
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Franchise</div>
                    <div>{viewingStudent.franchises?.organization_name || viewingStudent.franchise_id}</div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', borderTop: '1px solid var(--gray-200)', paddingTop: '1.5rem' }}>
              <button onClick={() => navigate('/admin/admissions', { state: { userId: viewingStudent.user_id } })} className="btn btn-primary">
                View Admission Details
              </button>
              <button onClick={() => setViewingStudent(null)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {editingStudent && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal-content card" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Edit Student</h2>
              <button onClick={() => setEditingStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">Assign Course</label>
                <select className="form-select" value={editFormData.course_id} onChange={(e) => setEditFormData({ ...editFormData, course_id: e.target.value, session_id: '' })}>
                  <option value="">Select Course</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {editFormData.course_id && (() => {
                const sel = courses.find(c => c.id === editFormData.course_id);
                return (
                  <div className="form-group">
                    <label className="form-label">Assign Session</label>
                    <select className="form-select" value={editFormData.session_id} onChange={(e) => setEditFormData({ ...editFormData, session_id: e.target.value })}>
                      <option value="">No Session</option>
                      {sel?.sessions?.map(s => (
                        <option key={s.id} value={s.id}>{s.session_type} ({s.start_date || 'TBA'} to {s.end_date || 'TBA'})</option>
                      ))}
                    </select>
                  </div>
                );
              })()}
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={editFormData.status} onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="graduated">Graduated</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={() => setEditingStudent(null)} className="btn btn-secondary" disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCardModalOpen && cardStudent && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal-content card" style={{ width: '90%', maxWidth: '1000px', height: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {cardMode === 'admit' ? <FileText style={{ color: '#1e3a8a' }} /> : <IdCard style={{ color: '#1e3a8a' }} />}
                  {cardMode === 'admit' ? 'Admit Card' : 'ID Card'}
                </h2>
                <p style={{ margin: '0.25rem 0 0', color: '#4b5563', fontSize: '0.875rem' }}>
                  {cardStudent.users?.full_name} — {cardStudent.student_id_number}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {!generatingCard && (
                  <PDFDownloadLink
                    document={cardMode === 'admit' ? <AdmitCardTemplate {...buildCardProps()} /> : <IdCardTemplate {...buildCardProps()} />}
                    fileName={cardMode === 'admit' ? `Admit_Card_${cardStudent.student_id_number || '000'}.pdf` : `ID_Card_${cardStudent.student_id_number || '000'}.pdf`}
                    className="btn btn-primary"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {({ loading }) => loading ? 'Preparing...' : (<><Download size={18} /> Download PDF</>)}
                  </PDFDownloadLink>
                )}
                <button onClick={handleCloseCardModal} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280' }}>
                  <X size={20} />
                </button>
              </div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#e5e7eb', padding: '1rem', position: 'relative' }}>
              {generatingCard ? (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 10 }}>
                  <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px', marginBottom: '1rem' }}></div>
                  <p style={{ fontWeight: 500, color: '#4b5563' }}>Loading student photo...</p>
                </div>
              ) : (
                <PDFViewer width="100%" height="100%" style={{ border: 'none', borderRadius: '0.5rem', backgroundColor: '#fff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                  {cardMode === 'admit' ? <AdmitCardTemplate {...buildCardProps()} /> : <IdCardTemplate {...buildCardProps()} />}
                </PDFViewer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminStudentBulkActions = ({ onGenerateId, onGenerateAdmit, onAfterDelete }) => {
  const { selectedIds = [] } = useListContext();
  const { remove, isPending } = useBulkActions('students');

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} student(s)? This cannot be undone.`)) return;
    await remove();
    onAfterDelete();
  };

  if (!selectedIds.length) return null;

  return (
    <>
      <button className="btn btn-sm btn-secondary" onClick={() => onGenerateId(selectedIds)}>
        <IdCard size={14} /> ID Card
      </button>
      <button className="btn btn-sm btn-secondary" onClick={() => onGenerateAdmit(selectedIds)}>
        <FileText size={14} /> Admit Card
      </button>
      <button className="btn btn-sm btn-danger" onClick={handleDelete} disabled={isPending}>
        <Trash2 size={14} /> {isPending ? 'Deleting…' : 'Delete'}
      </button>
    </>
  );
};

export default AdminStudents;