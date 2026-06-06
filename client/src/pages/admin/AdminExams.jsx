import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, FileText, Eye, Download, Image as ImageIcon, ClipboardList } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { uploadDocument } from '../../services/documents';

const AdminExams = () => {
  const { data: exams, loading, error, refetch } = useFetch('/exams');
  const { data: courses } = useFetch('/courses/admin/all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [viewingExam, setViewingExam] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [questionPaperFile, setQuestionPaperFile] = useState(null);

  // Documents state — used in both edit modal (to show existing) and view modal
  const [examDocuments, setExamDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [previewDocId, setPreviewDocId] = useState(null);

  const [courseFilter, setCourseFilter] = useState('');
  const [sessionFilter, setSessionFilter] = useState('');
  const [questionPaperFile, setQuestionPaperFile] = useState(null);

  // Documents state — used in both edit modal (to show existing) and view modal
  const [examDocuments, setExamDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [previewDocId, setPreviewDocId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    courseId: '',
    sessionId: '',
    subjectId: '',
    examDate: '',
    startTime: '',
    endTime: '',
    totalMarks: '',
    passingMarks: '',
    videoUrl: ''
  });

  // Submissions modal state
  const [submissionsExam, setSubmissionsExam] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  const handleDownloadAll = () => {
    if (!submissionsExam) return;
    const token = localStorage.getItem('accessToken');
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/exams/${submissionsExam.id}/answers/download-all`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Download failed');
        const disposition = res.headers.get('Content-Disposition');
        const match = disposition?.match(/filename="?(.+?)"?$/);
        const filename = match?.[1] || `${submissionsExam.name.replace(/[^a-zA-Z0-9._-]/g, '_')}_answers.zip`;
        return res.blob().then(blob => ({ blob, filename }));
      })
      .then(({ blob, filename }) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(err => {
        console.error('Download all answers error:', err);
        toast.error('Failed to download all answers');
      });
  };

  // Fetch documents whenever the view modal opens (like AdminAdmissions)
  useEffect(() => {
    if (viewingExam) {
      const fetchDocs = async () => {
        setLoadingDocs(true);
        setPreviewDocId(null);
        try {
          const res = await api.get(`/documents/entity/exam/${viewingExam.id}`);
          setExamDocuments(res.data);
        } catch (err) {
          console.error('Failed to fetch exam documents', err);
        } finally {
          setLoadingDocs(false);
        }
      };
      fetchDocs();
    } else {
      setExamDocuments([]);
      setPreviewDocId(null);
    }
  }, [viewingExam]);

  // Also fetch documents when editing an existing exam, so we can show current question paper
  useEffect(() => {
    if (isModalOpen && editingExam) {
      const fetchDocs = async () => {
        try {
          const res = await api.get(`/documents/entity/exam/${editingExam.id}`);
          setExamDocuments(res.data);
        } catch (err) {
          console.error('Failed to fetch exam documents for editing:', err);
        }
      };
      fetchDocs();
    } else if (!isModalOpen) {
      setExamDocuments([]);
    }
  }, [isModalOpen, editingExam]);

  const handleOpenModal = (exam = null) => {
    if (exam) {
      setEditingExam(exam);
      setFormData({
        name: exam.name || '',
        courseId: exam.course_id || '',
        sessionId: exam.session_id || '',
        subjectId: exam.subject_id || '',
        examDate: exam.exam_date ? new Date(exam.exam_date).toISOString().split('T')[0] : '',
        startTime: exam.start_time || '',
        endTime: exam.end_time || '',
        totalMarks: exam.total_marks || '',
        passingMarks: exam.passing_marks || '',
        videoUrl: exam.video_url || ''
      });
    } else {
      setEditingExam(null);
      setFormData({
        name: '',
        courseId: '',
        sessionId: '',
        subjectId: '',
        examDate: '',
        startTime: '',
        endTime: '',
        totalMarks: '',
        passingMarks: '',
        videoUrl: ''
      });
    }
    setQuestionPaperFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExam(null);
    setQuestionPaperFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        courseId: formData.courseId,
        sessionId: formData.sessionId,
        subjectId: formData.subjectId || null,
        examDate: formData.examDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        totalMarks: Number(formData.totalMarks),
        passingMarks: Number(formData.passingMarks),
        videoUrl: formData.videoUrl || null,
      };

      let savedExamId;

      if (editingExam) {
        await api.put(`/exams/${editingExam.id}`, payload);
        savedExamId = editingExam.id;
        toast.success('Exam updated successfully');
      } else {
        const response = await api.post('/exams', payload);
        savedExamId = response.data.id;
        toast.success('Exam created successfully');
      }

      // Upload question paper as a document entity — same pattern as admissions
      if (questionPaperFile && savedExamId) {
        const uploadToast = toast.loading('Uploading question paper...');
        try {
          await uploadDocument({
            file: questionPaperFile,
            entityType: 'exam',
            entityId: savedExamId,
            documentType: 'question_paper',
          });
          toast.dismiss(uploadToast);
          toast.success('Question paper uploaded');
        } catch (uploadErr) {
          toast.dismiss(uploadToast);
          console.error('Failed to upload question paper:', uploadErr);
          toast.error('Exam saved, but question paper upload failed');
        }
      }

      handleCloseModal();
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save exam');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;

    try {
      await api.delete(`/exams/${id}`);
      toast.success('Exam deleted successfully');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete exam');
    }
  };

  useEffect(() => {
    if (submissionsExam) {
      const fetchSubmissions = async () => {
        setLoadingSubmissions(true);
        try {
          const res = await api.get(`/exams/${submissionsExam.id}/answers`);
          setSubmissions(res.data);
        } catch (err) {
          console.error('Failed to fetch submissions', err);
          toast.error('Failed to load submissions');
        } finally {
          setLoadingSubmissions(false);
        }
      };
      fetchSubmissions();
    } else {
      setSubmissions([]);
    }
  }, [submissionsExam]);

  const selectedCourseDetails = courses?.find(c => c.id === formData.courseId);
  const filterCourseDetails = courses?.find(c => c.id === courseFilter);

  const filteredExams = exams?.filter(e => {
    if (courseFilter && e.course_id !== courseFilter) return false;
    if (sessionFilter && e.session_id !== sessionFilter) return false;
    return true;
  });

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (error) return <div className="error-screen">{error}</div>;

  return (
    <div className="admin-exams">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Manage Examinations</h1>
          <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Create, update, and manage exams.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Add Exam
        </button>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.875rem' }}>Filter by Course</label>
            <select
              className="form-select"
              value={courseFilter}
              onChange={(e) => {
                setCourseFilter(e.target.value);
                setSessionFilter('');
              }}
            >
              <option value="">All Courses</option>
              {courses?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {courseFilter && (
            <div>
              <label className="form-label" style={{ fontSize: '0.875rem' }}>Filter by Session</label>
              <select
                className="form-select"
                value={sessionFilter}
                onChange={(e) => setSessionFilter(e.target.value)}
              >
                <option value="">All Sessions</option>
                {filterCourseDetails?.sessions?.map(s => (
                  <option key={s.id} value={s.id}>{s.session_type} ({s.start_date || 'TBA'})</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="card table-container">
        {(!filteredExams || filteredExams.length === 0) ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>No exams found. Create one to get started.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Exam Name</th>
                <th>Course</th>
                <th>Session</th>
                <th>Subject</th>
                <th>Date</th>
                <th>Time</th>
                <th>Marks (Total/Pass)</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExams.map(e => (
                <tr key={e.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{e.name}</div>
                  </td>
                  <td>{e.courses?.name || '-'}</td>
                  <td>{e.sessions?.session_type ? `${e.sessions.session_type} (${e.sessions.start_date || 'TBA'})` : '-'}</td>
                  <td>{e.subjects?.name || '-'}</td>
                  <td>{e.exam_date ? format(new Date(e.exam_date), 'PP') : '-'}</td>
                  <td>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {e.start_time && e.end_time ? `${e.start_time} - ${e.end_time}` : '-'}
                    </span>
                  </td>
                  <td>{e.total_marks} / {e.passing_marks}</td>
                  <td>
                    <span className={`badge badge-${e.status === 'completed' ? 'success' : e.status === 'scheduled' ? 'info' : 'warning'}`}>
                      {e.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setViewingExam(e)}
                        className="btn-icon"
                        title="View exam"
                        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.25rem' }}
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleOpenModal(e)}
                        className="btn-icon"
                        title="Edit exam"
                        style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '0.25rem' }}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="btn-icon"
                        title="Delete exam"
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}
                      >
                        <Trash2 size={18} />
                      </button>
                      <button
                        onClick={() => setSubmissionsExam(e)}
                        className="btn btn-sm btn-info"
                        title="View submissions"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <ClipboardList size={16} /> Submissions
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal-content card" style={{ width: '100%', maxWidth: '700px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                {editingExam ? 'Edit Exam' : 'Add New Exam'}
              </h2>
              <button
                onClick={handleCloseModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Exam Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Midterm Examination"
                />
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Target Course</label>
                  <select
                    required
                    value={formData.courseId}
                    onChange={(e) => {
                      const newCourseId = e.target.value;
                      setFormData(prev => ({ 
                        ...prev, 
                        courseId: newCourseId,
                        subjectId: ''
                      }));
                    }}
                    className="form-input"
                  >
                    <option value="">-- Select Course --</option>
                    {courses && courses.map(course => (
                      <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Target Subject (Optional)</label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="form-input"
                    disabled={!formData.courseId}
                  >
                    <option value="">-- Select Subject --</option>
                    {selectedCourseDetails?.subjects?.map(subject => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.courseId && (() => {
                return (
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Target Session</label>
                    <select
                      required
                      className="form-select"
                      value={formData.sessionId}
                      onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
                    >
                      <option value="">-- Select Session --</option>
                      {selectedCourseDetails?.sessions?.map((session) => (
                        <option key={session.id} value={session.id}>
                          {session.session_type} ({session.start_date || 'TBA'} to {session.end_date || 'TBA'})
                        </option>
                      ))}
                    </select>
                    {(!selectedCourseDetails?.sessions || selectedCourseDetails.sessions.length === 0) && (
                      <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>This course has no sessions created yet.</p>
                    )}
                  </div>
                );
              })()}

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Exam Date</label>
                  <input
                    type="date"
                    required
                    value={formData.examDate}
                    onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Total Marks</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                    className="form-input"
                    placeholder="e.g. 100"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Passing Marks</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.passingMarks}
                    onChange={(e) => setFormData({ ...formData, passingMarks: e.target.value })}
                    className="form-input"
                    placeholder="e.g. 40"
                  />
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Meeting / Video URL (Optional)</label>
                  <input
                    type="text"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    className="form-input"
                    placeholder="e.g. https://meet.google.com/..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Question Sheet PDF (Optional)</label>
                  {/* Show current uploaded question paper when editing */}
                  {editingExam && examDocuments.find(d => d.document_type === 'question_paper') && (
                    <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={14} />
                      <span>
                        Current: <strong>{examDocuments.find(d => d.document_type === 'question_paper').original_name || 'question_paper.pdf'}</strong>
                      </span>
                      <a
                        href={examDocuments.find(d => d.document_type === 'question_paper').downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#2563eb', textDecoration: 'underline', fontSize: '0.75rem' }}
                      >
                        Download
                      </a>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setQuestionPaperFile(e.target.files?.[0] || null)}
                    className="form-input"
                  />
                  {questionPaperFile && (
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      Selected: {questionPaperFile.name}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', borderTop: '1px solid var(--gray-200)', paddingTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal — documents fetched via useEffect, same as AdminAdmissions */}
      {viewingExam && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal-content card" style={{ width: '100%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Exam Details</h2>
              <button onClick={() => setViewingExam(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Exam Name</div>
                <div style={{ fontWeight: 500 }}>{viewingExam.name}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Course</div>
                  <div>{viewingExam.courses?.name || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Session</div>
                  <div>{viewingExam.sessions?.session_type ? `${viewingExam.sessions.session_type} (${viewingExam.sessions.start_date || 'TBA'})` : '-'}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Subject</div>
                  <div>{viewingExam.subjects?.name || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Date</div>
                  <div>{viewingExam.exam_date ? format(new Date(viewingExam.exam_date), 'PPP') : '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Time</div>
                  <div>{viewingExam.start_time && viewingExam.end_time ? `${viewingExam.start_time} – ${viewingExam.end_time}` : '-'}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Total Marks</div>
                  <div>{viewingExam.total_marks}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Passing Marks</div>
                  <div>{viewingExam.passing_marks}</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Status</div>
                <span className={`badge badge-${viewingExam.status === 'completed' ? 'success' : viewingExam.status === 'scheduled' ? 'info' : 'warning'}`}>
                  {viewingExam.status}
                </span>
              </div>
              {viewingExam.video_url && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Meeting / Video URL</div>
                  <a href={viewingExam.video_url} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline', wordBreak: 'break-all' }}>
                    {viewingExam.video_url}
                  </a>
                </div>
              )}

              {/* Documents section — identical approach to AdminAdmissions */}
              <div style={{ marginTop: '0.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--gray-200)' }}>
                  Documents
                </h3>
                {loadingDocs ? (
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Loading documents...</div>
                ) : examDocuments.length > 0 ? (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {examDocuments.map((doc) => {
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
                              <a
                                href={doc.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-icon"
                                style={{ padding: '0.5rem', background: 'var(--primary-color)', color: 'white', borderRadius: '0.375rem', display: 'flex', alignItems: 'center' }}
                                title="Download"
                              >
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
              <button onClick={() => setViewingExam(null)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
      {/* Submissions Modal */}
      {submissionsExam && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal-content card" style={{ width: '100%', maxWidth: '800px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Submissions: {submissionsExam.name}</h2>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={handleDownloadAll}
                  className="btn btn-sm btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Download size={16} /> Download All
                </button>
                <button onClick={() => setSubmissionsExam(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {loadingSubmissions ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Loading submissions...</div>
            ) : submissions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                <ClipboardList size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p>No submissions yet.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student Name</th>
                    <th>Student ID</th>
                    <th>Submitted At</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s, i) => (
                    <tr key={s.id}>
                      <td>{i + 1}</td>
                      <td style={{ fontWeight: 500 }}>{s.student?.user?.full_name || 'Unknown'}</td>
                      <td style={{ color: '#6b7280', fontSize: '0.875rem' }}>{s.student?.student_id_number || '-'}</td>
                      <td>{s.submitted_at ? format(new Date(s.submitted_at), 'PPpp') : '-'}</td>
                      <td style={{ textAlign: 'right' }}>
                        {s.document?.downloadUrl ? (
                          <a
                            href={s.document.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-primary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Download size={16} /> Download
                          </a>
                        ) : (
                          <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>No file</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--gray-200)', paddingTop: '1.5rem' }}>
              <button onClick={() => setSubmissionsExam(null)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExams;
