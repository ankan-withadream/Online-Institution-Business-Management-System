import { Link } from 'react-router-dom';
import { Clock, IndianRupee, ArrowRight } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';

const Courses = () => {
  const { data: courses, loading, error } = useFetch('/courses');

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
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6'
              }}>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#6b7280' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={14} /> {course.duration_months} months
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IndianRupee size={14} /> {Number(course.fee).toLocaleString()}
                  </span>
                </div>
                <Link to="/admission" className="btn btn-primary btn-sm">
                  Apply <ArrowRight size={14} />
                </Link>
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
    </div>
  );
};

export default Courses;
