import { Link } from 'react-router-dom';
import { Clock, IndianRupee, ArrowRight, X, BookOpen, Calendar, Download } from 'lucide-react';
import { useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import SyllabusTemplate from '../../components/pdf/SyllabusTemplate';
import { useConfig } from '../../context/ConfigContext';
import { useFetch } from '../../hooks/useFetch';

const Courses = () => {
  const { data: courses, loading, error } = useFetch('/courses');
  const { organizationConfig } = useConfig();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  return (
    <div className="section">
      <div className="container">
        <h1 className="section-title">Our Courses</h1>
        <p className="section-subtitle">
          Comprehensive healthcare and nursing programs designed for your career growth
        </p>

        {loading && <div className="loading-screen"><div className="spinner" /></div>}
        {error && <p style={{ color: 'var(--danger-500)' }}>Failed to load courses</p>}

        <div className="grid grid-3">
          {courses?.map((course) => (
            <div className="card" key={course.id} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{
                height: 8, borderRadius: '4px 4px 0 0',
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                margin: '-1.5rem -1.5rem 1.5rem -1.5rem'
              }} />
              <h3 style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                {course.name}
              </h3>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', flex: 1, lineHeight: 1.6 }}>
                {course.description}
              </p>
              
              {course.subjects && course.subjects.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.5rem' }}>Subjects:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {course.subjects.map(sub => (
                      <span key={sub.id} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: '#f3f4f6', borderRadius: '4px', color: '#4b5563' }}>
                        {sub.name} (Sem {sub.semester || 1})
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{
                marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6'
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: '#6b7280' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={14} style={{ marginTop: '-1px' }} /> {course.duration_months} months
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <IndianRupee size={14} style={{ marginTop: '-1px' }} /> {Number(course.fee).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => { setSelectedCourse(course); setIsModalOpen(true); }}
                    style={{
                      flex: '1',
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#3b82f6',
                      background: 'white',
                      border: '1.5px solid #3b82f6',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.target.style.background = '#eff6ff'; e.target.style.borderColor = '#2563eb'; e.target.style.color = '#2563eb'; }}
                    onMouseLeave={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = '#3b82f6'; e.target.style.color = '#3b82f6'; }}
                  >
                    Details
                  </button>
                  <Link
                    to="/admission"
                    className="btn btn-primary btn-sm"
                    style={{ flex: '1', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.25rem' }}
                  >
                    Apply <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!loading && (!courses || courses.length === 0) && (
          <div className="empty-state">
            <p>No courses available at the moment. Please check back later.</p>
          </div>
        )}
      </div>

      {isModalOpen && selectedCourse && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            background: 'white', borderRadius: '12px', maxWidth: '800px', width: '100%',
            maxHeight: '90vh', overflowY: 'auto', position: 'relative'
          }}>
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                position: 'absolute', top: '1rem', right: '1rem',
                background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem'
              }}
            >
              <X size={24} color='#6b7280' />
            </button>

            <div style={{ padding: '2rem' }}>
              <div style={{
                height: 6, borderRadius: '3px 3px 0 0',
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                margin: '-2rem -2rem 2rem -2rem'
              }} />

              <h2 style={{ fontWeight: 700, fontSize: '1.75rem', marginBottom: '1rem' }}>
                {selectedCourse.name}
              </h2>

              <p style={{ color: '#6b7280', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                {selectedCourse.description}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Duration</p>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
                    {selectedCourse.duration_months} months
                  </p>
                </div>
                <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Fee</p>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
                    ₹{Number(selectedCourse.fee).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedCourse.sessions && selectedCourse.sessions.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={20} /> Available Sessions
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selectedCourse.sessions.map((session, idx) => (
                      <div key={idx} style={{
                        background: '#f9fafb', padding: '1rem', borderRadius: '8px',
                        borderLeft: '3px solid #3b82f6'
                      }}>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Session {idx + 1}</p>
                        <p style={{ fontSize: '1rem', fontWeight: 500, color: '#111827' }}>
                          {session.name || `Batch ${idx + 1}`}
                        </p>
                        {session.start_date && (
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                            Starts: {new Date(session.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BookOpen size={20} /> Syllabus
                </h3>
                {selectedCourse.subjects && selectedCourse.subjects.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {(() => {
                      const semesters = {};
                      selectedCourse.subjects.forEach(subject => {
                        const semester = subject.semester || 1;
                        if (!semesters[semester]) semesters[semester] = [];
                        semesters[semester].push(subject);
                      });
                      return Object.entries(semesters).map(([sem, subjects]) => (
                        <div key={sem}>
                          <h4 style={{ fontWeight: 600, fontSize: '1rem', color: '#3b82f6', marginBottom: '0.75rem' }}>
                            Semester {sem}
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {subjects.map((sub, subIdx) => (
                              <div key={subIdx} style={{
                                background: '#f9fafb', padding: '1rem', borderRadius: '8px',
                                borderLeft: '3px solid #8b5cf6'
                              }}>
                                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                                  {sub.code || 'N/A'}
                                </p>
                                <p style={{ fontSize: '1rem', fontWeight: 500, color: '#111827', marginBottom: '0.5rem' }}>
                                  {sub.name}
                                </p>
                                {sub.description && (
                                  <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.5 }}>
                                    {sub.description}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                ) : (
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No syllabus details available.</p>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', marginTop: '2rem' }}>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#4b5563',
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.target.style.background = '#f9fafb'; e.target.style.borderColor = '#9ca3af'; }}
                  onMouseLeave={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = '#d1d5db'; }}
                >
                  Close
                </button>
                {selectedCourse.subjects && selectedCourse.subjects.length > 0 && (
                  <PDFDownloadLink
                    document={<SyllabusTemplate course={selectedCourse} organizationName={organizationConfig?.name} />}
                    fileName={`${selectedCourse.name.replace(/\s+/g, '_')}_Syllabus.pdf`}
                    style={{ textDecoration: 'none' }}
                  >
                    {({ loading }) => (
                      <button
                        disabled={loading}
                        style={{
                          padding: '0.75rem 1.5rem',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: '#1e3a8a',
                          background: '#eff6ff',
                          border: '1.5px solid #3b82f6',
                          borderRadius: '6px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.2s',
                          opacity: loading ? 0.7 : 1,
                        }}
                        onMouseEnter={(e) => { if (!loading) { e.target.style.background = '#dbeafe'; e.target.style.borderColor = '#2563eb'; }}}
                        onMouseLeave={(e) => { if (!loading) { e.target.style.background = '#eff6ff'; e.target.style.borderColor = '#3b82f6'; }}}
                      >
                        <Download size={16} />
                        {loading ? 'Generating...' : 'Download Syllabus'}
                      </button>
                    )}
                  </PDFDownloadLink>
                )}
                <Link
                  to="/admission"
                  className="btn btn-primary"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  onClick={() => setIsModalOpen(false)}
                >
                  Apply Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;
