import { useState } from 'react';
import { Plus, Edit2, Trash2, X, FileText } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../services/api';

const AdminExams = () => {
  const { data: exams, loading, error, refetch } = useFetch('/exams');
  const { data: courses } = useFetch('/courses');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    courseId: '',
    subjectId: '',
    examDate: '',
    startTime: '',
    endTime: '',
    totalMarks: '',
    passingMarks: ''
  });

  const handleOpenModal = (exam = null) => {
    if (exam) {
      setEditingExam(exam);
      setFormData({
        name: exam.name || '',
        courseId: exam.course_id || '',
        subjectId: exam.subject_id || '',
        examDate: exam.exam_date ? new Date(exam.exam_date).toISOString().split('T')[0] : '',
        startTime: exam.start_time || '',
        endTime: exam.end_time || '',
        totalMarks: exam.total_marks || '',
        passingMarks: exam.passing_marks || ''
      });
    } else {
      setEditingExam(null);
      setFormData({
        name: '',
        courseId: '',
        subjectId: '',
        examDate: '',
        startTime: '',
        endTime: '',
        totalMarks: '',
        passingMarks: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExam(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        courseId: formData.courseId,
        subjectId: formData.subjectId || null,
        examDate: formData.examDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        totalMarks: Number(formData.totalMarks),
        passingMarks: Number(formData.passingMarks)
      };

      if (editingExam) {
        await api.put(`/exams/${editingExam.id}`, payload);
        toast.success('Exam updated successfully');
      } else {
        await api.post('/exams', payload);
        toast.success('Exam created successfully');
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

  const selectedCourseDetails = courses?.find(c => c.id === formData.courseId);

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

      <div className="card table-container">
        {(!exams || exams.length === 0) ? (
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
                <th>Subject</th>
                <th>Date</th>
                <th>Time</th>
                <th>Marks (Total/Pass)</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map(e => (
                <tr key={e.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{e.name}</div>
                  </td>
                  <td>{e.courses?.name || '-'}</td>
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
                        subjectId: '' // reset subject when course changes
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
    </div>
  );
};

export default AdminExams;
