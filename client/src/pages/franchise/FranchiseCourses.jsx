import { useState, useEffect } from 'react';
import { BookOpen, Eye, X, Users } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../services/api';

const FranchiseCourses = () => {
  const [franchise, setFranchise] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingCourse, setViewingCourse] = useState(null);
  const [courseStudents, setCourseStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showStudents, setShowStudents] = useState(null); // courseId

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: myFranchise } = await api.get('/franchises/me');
        if (myFranchise) {
          setFranchise(myFranchise);
          const { data } = await api.get(`/franchises/${myFranchise.id}/courses`);
          setCourses(data);
        }
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleShowStudents = async (course) => {
    setShowStudents(course.id);
    setLoadingStudents(true);
    try {
      const { data: allStudents } = await api.get(`/franchises/${franchise.id}/students`);
      const filtered = allStudents.filter(s => s.course_id === course.id);
      setCourseStudents(filtered);
    } catch {
      setCourseStudents([]);
    }
    setLoadingStudents(false);
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Courses</h1>
        <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Courses associated with your franchise</p>
      </div>

      <div className="card table-container">
        {courses.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            <BookOpen size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>No courses associated with your franchise.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Duration (Months)</th>
                <th>Fee</th>
                <th>Enrolled Students</th>
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
                  <td>{course.duration_months}</td>
                  <td>₹{course.fee?.toLocaleString()}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{course.enrolled_students}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${course.is_active ? 'success' : 'danger'}`}>
                      {course.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setViewingCourse(course)}
                        className="btn-icon"
                        title="View course"
                        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.25rem' }}
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleShowStudents(course)}
                        className="btn-icon"
                        title="View enrolled students"
                        style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '0.25rem' }}
                      >
                        <Users size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Course Details Modal */}
      {viewingCourse && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal-content card" style={{ width: '100%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Course Details</h2>
              <button onClick={() => setViewingCourse(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Course Name</div>
                  <div style={{ fontWeight: 500 }}>{viewingCourse.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Slug</div>
                  <code>{viewingCourse.slug}</code>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Duration</div>
                  <div>{viewingCourse.duration_months} months</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Fee</div>
                  <div>₹{viewingCourse.fee?.toLocaleString()}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Status</div>
                  <span className={`badge badge-${viewingCourse.is_active ? 'success' : 'danger'}`}>{viewingCourse.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Subjects</div>
                  <div>{viewingCourse.subjects?.length || 0} subject(s)</div>
                </div>
              </div>
              {viewingCourse.description && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Description</div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{viewingCourse.description}</div>
                </div>
              )}
              {viewingCourse.subjects && viewingCourse.subjects.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Subject List</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {viewingCourse.subjects.map(s => (
                      <div key={s.id} style={{ background: 'var(--gray-50)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: 500 }}>{s.name}</span>
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>({s.code})</span>
                          {s.description && <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{s.description}</div>}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'right' }}>
                          <div>Sem {s.semester}</div>
                          <div>{s.max_marks} marks</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--gray-200)', paddingTop: '1.5rem' }}>
              <button onClick={() => setViewingCourse(null)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Enrolled Students Modal */}
      {showStudents && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal-content card" style={{ width: '100%', maxWidth: '700px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                Enrolled Students — {courses.find(c => c.id === showStudents)?.name}
              </h2>
              <button onClick={() => { setShowStudents(null); setCourseStudents([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>
            {loadingStudents ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Loading...</div>
            ) : courseStudents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>No students enrolled in this course.</div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Enrolled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseStudents.map(s => (
                      <tr key={s.id}>
                        <td><code>{s.student_id_number}</code></td>
                        <td>{s.users?.full_name}</td>
                        <td>{s.users?.email}</td>
                        <td>
                          <span className={`badge badge-${s.status === 'active' ? 'success' : s.status === 'graduated' ? 'info' : 'danger'}`}>
                            {s.status}
                          </span>
                        </td>
                        <td>{s.enrollment_date && format(new Date(s.enrollment_date), 'PP')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--gray-200)', paddingTop: '1.5rem' }}>
              <button onClick={() => { setShowStudents(null); setCourseStudents([]); }} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FranchiseCourses;
