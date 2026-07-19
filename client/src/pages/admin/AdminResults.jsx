import { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, X, FileText, CheckCircle2, XCircle, Upload, Download, Eye, CheckCircle } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import toast from 'react-hot-toast';
import api from '../../services/api';
import DataTable from '../../components/ui/DataTable';
import { useListContext } from 'ra-core';
import { useBulkActions } from '../../hooks/useBulkActions';

const AdminResults = () => {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedExam, setSelectedExam] = useState('');

  const { data: courses, loading: coursesLoading } = useFetch('/courses');
  const { data: exams, loading: examsLoading } = useFetch(
    selectedCourse
      ? `/exams?courseId=${selectedCourse}${selectedSession ? `&sessionId=${selectedSession}` : ''}`
      : '/exams'
  );
  const { data: allStudents } = useFetch('/students');
  const { data: allExams } = useFetch('/exams');
  const { refetch: refetchResults } = useFetch(
    selectedExam ? `/results?examId=${selectedExam}` : '/results'
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [viewingResult, setViewingResult] = useState(null);

  const fileInputRef = useRef(null);

  const [editingResult, setEditingResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    courseId: '',
    sessionId: '',
    subjectId: '',
    examId: '',
    studentId: '',
    marksObtained: '',
    grade: '',
    isPass: false,
    isPublished: false
  });

  const [bulkFormData, setBulkFormData] = useState({
    courseId: '',
    subjectId: '',
    examId: '',
    file: null
  });

  const handleOpenModal = (result = null) => {
    if (result) {
      setEditingResult(result);
      const examCourseId = allExams?.find(e => e.id === result.exam_id)?.course_id || '';
      const studentSessionId = allStudents?.find(s => s.id === result.student_id)?.session_id || '';
      setFormData({
        courseId: examCourseId,
        sessionId: studentSessionId,
        subjectId: result.subject_id || '',
        examId: result.exam_id || '',
        studentId: result.student_id || '',
        marksObtained: result.marks_obtained || '',
        grade: result.grade || '',
        isPass: result.is_pass || false,
        isPublished: result.published || false
      });
    } else {
      setEditingResult(null);
      setFormData({
        courseId: selectedCourse || '',
        sessionId: selectedSession || '',
        subjectId: '',
        examId: selectedExam || '',
        studentId: '',
        marksObtained: '',
        grade: '',
        isPass: false,
        isPublished: true
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenBulkModal = () => {
    setBulkFormData({
      courseId: selectedCourse || '',
      subjectId: '',
      examId: selectedExam || '',
      file: null
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsBulkModalOpen(true);
  };

  const handleCloseModal = () => { setIsModalOpen(false); setEditingResult(null); };
  const handleCloseBulkModal = () => {
    setIsBulkModalOpen(false);
    setBulkFormData(prev => ({ ...prev, file: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        studentId: formData.studentId,
        examId: formData.examId,
        subjectId: formData.subjectId || null,
        marksObtained: Number(formData.marksObtained),
        grade: formData.grade || null,
        isPass: formData.isPass,
        published: formData.isPublished
      };
      if (editingResult) {
        await api.put(`/results/${editingResult.id}`, payload);
        toast.success('Result updated successfully');
      } else {
        await api.post('/results', payload);
        toast.success('Result created successfully');
      }
      handleCloseModal();
      setRefreshKey((k) => k + 1);
      refetchResults();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save result');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!bulkFormData.file) {
      toast.error('Please upload a CSV file');
      return;
    }
    setSubmitting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n').filter(l => l.trim() !== '');
        if (lines.length < 2) throw new Error('File is empty or missing data rows');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const resultsToUpload = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const row = {};
          headers.forEach((h, index) => { row[h] = values[index]; });
          const studentIdNumber = row['student id number'];
          const student = allStudents?.find(s => s.student_id_number === studentIdNumber);
          if (!student) throw new Error(`Student with ID ${studentIdNumber} not found on row ${i}`);
          if (student.course_id !== bulkFormData.courseId) {
            throw new Error(`Student ${studentIdNumber} is not enrolled in the selected course on row ${i}`);
          }
          resultsToUpload.push({
            studentId: student.id,
            examId: bulkFormData.examId,
            subjectId: bulkFormData.subjectId || null,
            marksObtained: Number(row['marks obtained']),
            grade: row['grade'] || '',
            isPass: String(row['is pass']).toLowerCase() === 'true',
            published: String(row['published']).toLowerCase() === 'true'
          });
        }
        await api.post('/results/bulk', { results: resultsToUpload });
        toast.success(`Successfully uploaded ${resultsToUpload.length} results`);
        handleCloseBulkModal();
        setRefreshKey((k) => k + 1);
        refetchResults();
      } catch (err) {
        toast.error(err.response?.data?.error || err.message || 'Error processing CSV file');
      } finally {
        setSubmitting(false);
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read the file');
      setSubmitting(false);
    };
    reader.readAsText(bulkFormData.file);
  };

  const handleDownloadTemplate = () => {
    const csvContent = "Student ID Number,Marks Obtained,Grade,Is Pass,Published\nd6d4d4a-953f-4b4d-a4d5-bedbb286fc3d,85.5,A,true,false\nd1234d4a-953f-4b4d-a4d5-bedbb286fc3c,32.0,F,false,false";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'bulk_results_template.csv';
    link.click();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this result?')) return;
    try {
      await api.delete(`/results/${id}`);
      toast.success('Result deleted successfully');
      setRefreshKey((k) => k + 1);
      refetchResults();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete result');
    }
  };

  const handlePublishToggle = async (result) => {
    if (!window.confirm(`Are you sure you want to ${result.published ? 'unpublish' : 'publish'} this result?`)) return;
    try {
      const payload = {
        studentId: result.student_id,
        examId: result.exam_id,
        subjectId: result.subject_id,
        marksObtained: result.marks_obtained,
        grade: result.grade,
        isPass: result.is_pass,
        published: !result.published
      };
      await api.put(`/results/${result.id}`, payload);
      toast.success(`Result ${!result.published ? 'published' : 'unpublished'} successfully`);
      setRefreshKey((k) => k + 1);
      refetchResults();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update result status');
    }
  };

  const modalCourseDetails = courses?.find(c => c.id === formData.courseId);
  const bulkCourseDetails = courses?.find(c => c.id === bulkFormData.courseId);

  let filteredExams = allExams;
  if (formData.courseId) filteredExams = filteredExams?.filter(e => e.course_id === formData.courseId);
  if (formData.sessionId) filteredExams = filteredExams?.filter(e => e.session_id === formData.sessionId);
  if (formData.subjectId) filteredExams = filteredExams?.filter(e => e.subject_id === formData.subjectId);

  let filteredStudents = allStudents;
  if (formData.courseId) filteredStudents = filteredStudents?.filter(s => s.course_id === formData.courseId);
  if (formData.sessionId) filteredStudents = filteredStudents?.filter(s => s.session_id === formData.sessionId);

  let bulkFilteredExams = allExams;
  if (bulkFormData.courseId) bulkFilteredExams = bulkFilteredExams?.filter(e => e.course_id === bulkFormData.courseId);
  if (bulkFormData.subjectId) bulkFilteredExams = bulkFilteredExams?.filter(e => e.subject_id === bulkFormData.subjectId);

  const params = {};
  if (selectedExam) params['filter[exam_id]'] = selectedExam;

  const columns = [
    {
      source: 'students.users.full_name',
      label: 'Student',
      render: (v, r) => (
        <>
          <div style={{ fontWeight: 500 }}>{v || 'Unknown'}</div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{r.students?.student_id_number || 'N/A'}</div>
        </>
      ),
    },
    { source: 'exams.name', label: 'Exam' },
    { source: 'subjects.name', label: 'Subject' },
    { source: 'marks_obtained', label: 'Marks', sortable: true },
    { source: 'grade', label: 'Grade' },
    {
      source: 'is_pass',
      label: 'Status',
      render: (v) => v ? (
        <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'fit-content' }}>
          <CheckCircle2 size={14} /> Passed
        </span>
      ) : (
        <span className="badge badge-error" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'fit-content' }}>
          <XCircle size={14} /> Failed
        </span>
      ),
    },
    {
      source: 'published',
      label: 'Published',
      sortable: true,
      render: (v, r) => (
        <button onClick={() => handlePublishToggle(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <span className={`badge badge-${v ? 'info' : 'warning'}`}>{v ? 'Published' : 'Draft'}</span>
        </button>
      ),
    },
  ];

  return (
    <div className="admin-results">
      <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Results Management</h1>
          <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>View, upload, and manage student results for specific exams.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={handleOpenBulkModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={18} /> Bulk Create (CSV)
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Create Result
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div className="grid grid-3">
          <div className="form-group">
            <label className="form-label">Filter by Course</label>
            <select value={selectedCourse} onChange={(e) => { setSelectedCourse(e.target.value); setSelectedSession(''); setSelectedExam(''); }} className="form-input" disabled={coursesLoading}>
              <option value="">-- All Courses --</option>
              {courses && courses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Filter by Session</label>
            <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} className="form-input" disabled={!selectedCourse}>
              <option value="">-- All Sessions --</option>
              {courses?.find(c => c.id === selectedCourse)?.sessions?.map(s => (
                <option key={s.id} value={s.id}>
                  {s.session_type} ({s.start_date || 'TBA'} to {s.end_date || 'TBA'})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Filter by Exam</label>
            <select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)} className="form-input" disabled={examsLoading}>
              <option value="">-- All Exams --</option>
              {exams && exams.map(exam => (
                <option key={exam.id} value={exam.id}>{exam.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <DataTable
        key={refreshKey}
        resource="results"
        columns={columns}
        params={params}
        emptyMessage="No results found for the selected criteria."
        infinite
        filters={[
          {
            source: 'published',
            label: 'Status',
            options: [
              { value: 'true', label: 'Published' },
              { value: 'false', label: 'Draft' },
            ],
          },
        ]}
        bulkActions={
          <ResultBulkActions
            onAfterDelete={() => setRefreshKey((k) => k + 1)}
          />
        }
        rowActions={(r) => (
          <>
            <button onClick={() => setViewingResult(r)} className="btn-icon" title="View result" style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.25rem' }}>
              <Eye size={18} />
            </button>
            <button onClick={() => handleOpenModal(r)} className="btn-icon" title="Edit result" style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '0.25rem' }}>
              <Edit2 size={18} />
            </button>
            <button onClick={() => handleDelete(r.id)} className="btn-icon" title="Delete result" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}>
              <Trash2 size={18} />
            </button>
          </>
        )}
      />

      {/* Bulk Create Modal — kept as-is (CSV import, separate from row-select bulk actions) */}
      {isBulkModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal-content card" style={{ width: '100%', maxWidth: '700px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Bulk Create Results (CSV)</h2>
              <button onClick={handleCloseBulkModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleBulkSubmit}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Select Course</label>
                  <select required value={bulkFormData.courseId} onChange={(e) => setBulkFormData(prev => ({ ...prev, courseId: e.target.value, subjectId: '', examId: '' }))} className="form-input">
                    <option value="">-- Select Course --</option>
                    {courses && courses.map(course => (
                      <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Select Subject</label>
                  <select required value={bulkFormData.subjectId} onChange={(e) => setBulkFormData({ ...bulkFormData, subjectId: e.target.value, examId: '' })} className="form-input" disabled={!bulkFormData.courseId}>
                    <option value="">-- Select Subject --</option>
                    {bulkCourseDetails?.subjects?.map(subject => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Select Exam</label>
                  <select required value={bulkFormData.examId} onChange={(e) => setBulkFormData({ ...bulkFormData, examId: e.target.value })} className="form-input" disabled={!bulkFormData.subjectId && !bulkFormData.courseId}>
                    <option value="">-- Select Exam --</option>
                    {bulkFilteredExams && bulkFilteredExams.map(exam => (
                      <option key={exam.id} value={exam.id}>{exam.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="card" style={{ padding: '1.5rem', marginTop: '1rem', background: '#f9fafb', border: '1px dashed #d1d5db' }}>
                <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '1rem' }}>
                  Please format your CSV file exactly according to the template header. Then upload it below.
                </p>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <button type="button" onClick={handleDownloadTemplate} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Download size={16} /> Download CSV Template
                  </button>
                </div>
                <div className="form-group">
                  <label className="form-label">Upload CSV File</label>
                  <input type="file" accept=".csv" required ref={fileInputRef} onChange={(e) => setBulkFormData({ ...bulkFormData, file: e.target.files[0] })} className="form-input" style={{ padding: '0.5rem' }} />
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>Maximum 100 results per upload.</p>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', borderTop: '1px solid var(--gray-200)', paddingTop: '1.5rem' }}>
                <button type="button" onClick={handleCloseBulkModal} className="btn btn-secondary" disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Uploading...' : 'Upload Results'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Create/Edit Modal — kept for per-record CRUD */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal-content card" style={{ width: '100%', maxWidth: '700px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{editingResult ? 'Edit Result' : 'Create New Result'}</h2>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-3">
                <div className="form-group">
                  <label className="form-label">Select Course</label>
                  <select required value={formData.courseId} onChange={(e) => setFormData(prev => ({ ...prev, courseId: e.target.value, sessionId: '', subjectId: '', examId: '', studentId: '' }))} className="form-input">
                    <option value="">-- Select Course --</option>
                    {courses && courses.map(course => (
                      <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Select Session (Optional)</label>
                  <select value={formData.sessionId} onChange={(e) => setFormData({ ...formData, sessionId: e.target.value, studentId: '' })} className="form-input" disabled={!formData.courseId}>
                    <option value="">-- All Sessions --</option>
                    {modalCourseDetails?.sessions?.map(s => (
                      <option key={s.id} value={s.id}>{s.session_type} ({s.start_date || 'TBA'} to {s.end_date || 'TBA'})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Select Subject</label>
                  <select required value={formData.subjectId} onChange={(e) => setFormData({ ...formData, subjectId: e.target.value, examId: '' })} className="form-input" disabled={!formData.courseId}>
                    <option value="">-- Select Subject --</option>
                    {modalCourseDetails?.subjects?.map(subject => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Select Exam</label>
                  <select required value={formData.examId} onChange={(e) => setFormData({ ...formData, examId: e.target.value })} className="form-input" disabled={!formData.courseId}>
                    <option value="">-- Select Exam --</option>
                    {filteredExams && filteredExams.map(exam => (
                      <option key={exam.id} value={exam.id}>{exam.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Select Student</label>
                  <select required value={formData.studentId} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} className="form-input" disabled={!formData.courseId}>
                    <option value="">-- Select Student --</option>
                    {filteredStudents && filteredStudents.map(student => (
                      <option key={student.id} value={student.id}>{student.users?.full_name} ({student.student_id_number})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Marks Obtained</label>
                  <input type="number" step="0.01" required value={formData.marksObtained} onChange={(e) => setFormData({ ...formData, marksObtained: e.target.value })} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Grade (Optional)</label>
                  <input type="text" value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })} className="form-input" placeholder="A, B+, etc." />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.isPass} onChange={(e) => setFormData({ ...formData, isPass: e.target.checked })} />
                  Passed
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.isPublished} onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })} />
                  Published
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', borderTop: '1px solid var(--gray-200)', paddingTop: '1.5rem' }}>
                <button type="button" onClick={handleCloseModal} className="btn btn-secondary" disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Result'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingResult && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal-content card" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Result Details</h2>
              <button onClick={() => setViewingResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Student</div>
                <div>{viewingResult.students?.users?.full_name} ({viewingResult.students?.student_id_number})</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Exam</div>
                <div>{viewingResult.exams?.name}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Subject</div>
                <div>{viewingResult.subjects?.name}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Marks</div>
                  <div>{viewingResult.marks_obtained} / {viewingResult.subjects?.max_marks}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Grade</div>
                  <div>{viewingResult.grade || '-'}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Pass/Fail</div>
                  <span className={`badge badge-${viewingResult.is_pass ? 'success' : 'danger'}`}>{viewingResult.is_pass ? 'Pass' : 'Fail'}</span>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Status</div>
                  <span className={`badge badge-${viewingResult.published ? 'info' : 'warning'}`}>{viewingResult.published ? 'Published' : 'Draft'}</span>
                </div>
              </div>
              {viewingResult.verification_code && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Verification Code</div>
                  <code>{viewingResult.verification_code}</code>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--gray-200)', paddingTop: '1.5rem' }}>
              <button onClick={() => setViewingResult(null)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ResultBulkActions = ({ onAfterDelete }) => {
  const { selectedIds = [], refetch } = useListContext();
  const { remove, isPending } = useBulkActions('results');

  const handlePublish = async () => {
    if (!selectedIds.length) return;
    const ids = selectedIds;
    try {
      await Promise.all(ids.map(async (id) => {
        const { data: r } = await api.get(`/results/${id}`);
        await api.put(`/results/${id}`, { ...r, published: true });
      }));
      toast.success(`${ids.length} results published`);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Publish failed');
    }
  };

  const handleUnpublish = async () => {
    if (!selectedIds.length) return;
    const ids = selectedIds;
    try {
      await Promise.all(ids.map(async (id) => {
        const { data: r } = await api.get(`/results/${id}`);
        await api.put(`/results/${id}`, { ...r, published: false });
      }));
      toast.success(`${ids.length} results unpublished`);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Unpublish failed');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} result(s)? This cannot be undone.`)) return;
    await remove();
    onAfterDelete();
  };

  if (!selectedIds.length) return null;
  return (
    <>
      <button className="btn btn-sm btn-secondary" onClick={handlePublish}>
        <CheckCircle size={14} /> Publish
      </button>
      <button className="btn btn-sm btn-secondary" onClick={handleUnpublish}>
        <XCircle size={14} /> Unpublish
      </button>
      <button className="btn btn-sm btn-danger" onClick={handleDelete} disabled={isPending}>
        <Trash2 size={14} /> Delete
      </button>
    </>
  );
};

export default AdminResults;