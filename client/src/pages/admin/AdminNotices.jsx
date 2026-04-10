import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Bell } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import toast from 'react-hot-toast';
import api from '../../services/api';

const AdminNotices = () => {
  const { data: notices, loading, error, refetch } = useFetch('/notices/admin/all');
  const { data: courses } = useFetch('/courses');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    isPublished: false,
    publishDate: '',
    targetAudience: 'all',
    courseId: ''
  });

  const handleOpenModal = (notice = null) => {
    if (notice) {
      setEditingNotice(notice);
      setFormData({
        title: notice.title,
        content: notice.content,
        category: notice.category || 'general',
        isPublished: notice.is_published || false,
        publishDate: notice.publish_date ? new Date(notice.publish_date).toISOString().split('T')[0] : '',
        targetAudience: notice.target_audience || 'all',
        courseId: notice.course_id || ''
      });
    } else {
      setEditingNotice(null);
      setFormData({
        title: '',
        content: '',
        category: 'general',
        isPublished: false,
        publishDate: '',
        targetAudience: 'all',
        courseId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNotice(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        isPublished: formData.isPublished,
        targetAudience: formData.targetAudience,
      };

      if (formData.publishDate) payload.publishDate = new Date(formData.publishDate).toISOString();
      if (formData.courseId) payload.courseId = formData.courseId;

      if (editingNotice) {
        await api.put(`/notices/${editingNotice.id}`, payload);
        toast.success('Notice updated successfully');
      } else {
        await api.post('/notices', payload);
        toast.success('Notice created successfully');
      }
      handleCloseModal();
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save notice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;

    try {
      await api.delete(`/notices/${id}`);
      toast.success('Notice deleted successfully');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete notice');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (error) return <div className="error-screen">{error}</div>;

  return (
    <div className="admin-notices">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Manage Notices</h1>
          <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Create, update, and publish announcements.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Add Notice
        </button>
      </div>

      <div className="card table-container">
        {(!notices || notices.length === 0) ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            <Bell size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>No notices found. Create one to get started.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Target</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notices.map(notice => (
                <tr key={notice.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{notice.title}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {notice.content}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${notice.category === 'exam' ? 'warning' : notice.category === 'admission' ? 'success' : 'info'}`}>
                      {notice.category}
                    </span>
                  </td>
                  <td>
                    <span style={{ textTransform: 'capitalize', fontSize: '0.875rem', color: '#4b5563', fontWeight: 500 }}>
                      {notice.target_audience}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${notice.is_published ? 'success' : 'neutral'}`}>
                      {notice.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                      {notice.publish_date ? new Date(notice.publish_date).toLocaleDateString() : '-'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleOpenModal(notice)}
                        className="btn-icon"
                        title="Edit notice"
                        style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '0.25rem' }}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(notice.id)}
                        className="btn-icon"
                        title="Delete notice"
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
                {editingNotice ? 'Edit Notice' : 'Add New Notice'}
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
                <label className="form-label">Notice Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Important Exam Update"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Content</label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="form-textarea"
                  rows="4"
                  placeholder="Notice details..."
                />
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-input"
                  >
                    <option value="general">General</option>
                    <option value="exam">Exam</option>
                    <option value="admission">Admission</option>
                    <option value="result">Result</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Target Audience</label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="form-input"
                  >
                    <option value="all">All</option>
                    <option value="students">Students</option>
                    <option value="franchises">Franchises</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Target Course (Optional)</label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    className="form-input"
                  >
                    <option value="">-- All Courses --</option>
                    {courses && courses.map(course => (
                      <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Publish Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.publishDate}
                    onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--primary-600)', cursor: 'pointer' }}
                />
                <label htmlFor="isPublished" className="form-label" style={{ margin: 0, cursor: 'pointer', fontSize: '1rem' }}>Published</label>
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
                  {submitting ? 'Saving...' : 'Save Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotices;
