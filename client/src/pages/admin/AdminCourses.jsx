import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, BookOpen } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import toast from 'react-hot-toast';
import api from '../../services/api';

const AdminCourses = () => {
  const { data: courses, loading, error, refetch } = useFetch('/courses');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    durationMonths: '',
    fee: '',
    isActive: true,
  });

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug === generateSlug(prev.name) || !prev.slug ? generateSlug(name) : prev.slug
    }));
  };

  const handleOpenModal = (course = null) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        name: course.name,
        slug: course.slug,
        description: course.description || '',
        durationMonths: course.duration_months || '',
        fee: course.fee || '',
        isActive: course.is_active,
      });
    } else {
      setEditingCourse(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        durationMonths: '',
        fee: '',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingCourse) {
        await api.put(`/courses/${editingCourse.id}`, formData);
        toast.success('Course updated successfully');
      } else {
        await api.post('/courses', formData);
        toast.success('Course created successfully');
      }
      handleCloseModal();
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save course');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;

    try {
      await api.delete(`/courses/${id}`);
      toast.success('Course deleted successfully');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete course');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (error) return <div className="error-screen">{error}</div>;

  return (
    <div className="admin-courses">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Manage Courses</h1>
          <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Create, update, and manage student courses.</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Add Course
        </button>
      </div>

      <div className="card table-container">
        {(!courses || courses.length === 0) ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            <BookOpen size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>No courses found. Create one to get started.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Duration (Months)</th>
                <th>Fee</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{course.name}</div>
                    {course.description && (
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {course.description}
                      </div>
                    )}
                  </td>
                  <td><code>{course.slug}</code></td>
                  <td>{course.duration_months}</td>
                  <td>₹{course.fee?.toLocaleString()}</td>
                  <td>
                    <span className={`badge badge-${course.is_active ? 'success' : 'danger'}`}>
                      {course.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleOpenModal(course)}
                        className="btn-icon"
                        title="Edit course"
                        style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '0.25rem' }}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(course.id)}
                        className="btn-icon"
                        title="Delete course"
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
          <div className="modal-content card" style={{ width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                {editingCourse ? 'Edit Course' : 'Add New Course'}
              </h2>
              <button 
                onClick={handleCloseModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Course Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleNameChange}
                  className="form-control"
                  placeholder="e.g. Advanced Web Development"
                />
              </div>

              <div className="form-group">
                <label>Slug</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  className="form-control"
                  placeholder="e.g. advanced-web-development"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="form-control"
                  rows="3"
                  placeholder="Course description..."
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Duration (Months)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.durationMonths}
                    onChange={(e) => setFormData({...formData, durationMonths: parseInt(e.target.value)})}
                    className="form-control"
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.fee}
                    onChange={(e) => setFormData({...formData, fee: parseFloat(e.target.value)})}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  style={{ width: '1rem', height: '1rem' }}
                />
                <label htmlFor="isActive" style={{ margin: 0, cursor: 'pointer' }}>Active Course</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCourses;
