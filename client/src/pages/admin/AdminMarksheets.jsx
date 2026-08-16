import { useState, useEffect, useMemo, useRef } from 'react';
import { FileText, X, Users, ClipboardList, Download, Upload } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import MarksheetTemplate from '../../components/pdf/MarksheetTemplate';
import MultiSelect from '../../components/ui/MultiSelect';
import api from '../../services/api';
import toast from 'react-hot-toast';
import DataTable from '../../components/ui/DataTable';
import { useListContext } from 'ra-core';

const AdminMarksheets = () => {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedSemesters, setSelectedSemesters] = useState([]);
  const [selectedExams, setSelectedExams] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [marksheetData, setMarksheetData] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const fileInputRef = useRef(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: courses, loading: coursesLoading } = useFetch('/courses');
  // List endpoints return { data: [...] } envelope; unwrap before mapping.
  const { data: examsEnvelope, loading: examsLoading } = useFetch(
    selectedCourse ? `/exams?filter[course_id]=${selectedCourse}` : null
  );
  const exams = useMemo(() => {
    if (Array.isArray(examsEnvelope)) return examsEnvelope;
    if (Array.isArray(examsEnvelope?.data)) return examsEnvelope.data;
    return [];
  }, [examsEnvelope]);

  const courseDetails = courses?.find(c => c.id === selectedCourse);
  const subjects = courseDetails?.subjects || [];

  useEffect(() => {
    setSelectedSession('');
    setSelectedSemesters([]);
    setSelectedExams([]);
  }, [selectedCourse]);

  const semesterOptions = useMemo(() => {
    const semesters = [...new Set(subjects.map(s => s.semester).filter(Boolean))].sort((a, b) => a - b);
    return semesters.map(sem => ({ value: sem, label: `Semester ${sem}` }));
  }, [subjects]);

  const examOptions = useMemo(() => {
    if (!Array.isArray(exams)) return [];
    return exams.map(exam => {
      const linkedSubject = subjects.find(s => s.id === exam.subject_id);
      return {
        value: exam.id,
        label: exam.name,
        semester: linkedSubject?.semester || null,
        subjectName: linkedSubject?.name || 'N/A',
        examDate: exam.exam_date,
      };
    });
  }, [exams, subjects]);

  const handleSemesterChange = (newSemesters) => {
    const prev = selectedSemesters;
    setSelectedSemesters(newSemesters);
    const added = newSemesters.filter(s => !prev.includes(s));
    const removed = prev.filter(s => !newSemesters.includes(s));
    let newExams = [...selectedExams];
    if (added.length > 0) {
      const toAdd = examOptions.filter(e => added.includes(e.semester) && !newExams.includes(e.value)).map(e => e.value);
      newExams = [...newExams, ...toAdd];
    }
    if (removed.length > 0) {
      const toRemove = examOptions.filter(e => removed.includes(e.semester)).map(e => e.value);
      newExams = newExams.filter(e => !toRemove.includes(e));
    }
    setSelectedExams(newExams);
  };

  const handleExamChange = (newExams) => setSelectedExams(newExams);

  const filteredExamOptions = useMemo(() => {
    if (selectedSemesters.length === 0) return examOptions;
    const matched = examOptions.filter(e => selectedSemesters.includes(e.semester));
    const unmatched = examOptions.filter(e => !selectedSemesters.includes(e.semester));
    return [...matched, ...unmatched];
  }, [examOptions, selectedSemesters]);

  const fetchResultsForStudent = async (studentId) => {
    const { data: resp } = await api.get(`/results/student/${studentId}`);
    // List endpoints return { data: [...], total, ... } envelope
    const allResults = Array.isArray(resp) ? resp : (Array.isArray(resp?.data) ? resp.data : []);
    return allResults.filter(r => selectedExams.includes(r.exam_id)).map(r => {
      const marksObtained = Number(r.marks_obtained) || 0;
      const internal = Number(r.internal_marks) || 0;
      const maxMarks = Number(r.subjects?.max_marks) || 0;
      const minMarks = maxMarks > 0 ? Math.round(maxMarks * 0.4) : 0;
      return {
        subjectName: r.subjects?.name || 'N/A',
        subjectCode: r.subjects?.code || '-',
        examName: r.exams?.name || 'N/A',
        maxMarks, minMarks, marksObtained, internal,
        totalMarks: marksObtained + internal,
        grade: r.grade, isPass: r.is_pass,
      };
    });
  };

  const fetchPhotoForStudent = async (studentId) => {
    try {
      const { data } = await api.get(`/students/${studentId}/photo`);
      return data?.photoUrl || null;
    } catch {
      return null;
    }
  };

  const fetchStudentDetails = async (studentId) => {
    try {
      const { data } = await api.get(`/students/${studentId}`);
      return data || null;
    } catch {
      return null;
    }
  };

  const buildMarksheetData = async (studentId) => {
    const studentInfo = await fetchStudentDetails(studentId);
    const [results, photoUrl] = await Promise.all([
      fetchResultsForStudent(studentId),
      fetchPhotoForStudent(studentId),
    ]);
    return {
      studentName: studentInfo?.users?.full_name || 'Unknown',
      fatherName: studentInfo?.father_name,
      motherName: studentInfo?.mother_name,
      dateOfBirth: studentInfo?.date_of_birth,
      sessionName: studentInfo?.sessions?.session_type,
      studentIdNumber: studentInfo?.student_id_number || 'N/A',
      courseName: courseDetails?.name || 'N/A',
      photoUrl,
      results,
    };
  };

  const handleGetMarksheet = async (student) => {
    if (selectedExams.length === 0) {
      toast.error('Please select at least one exam first.');
      return;
    }
    setSelectedStudent(student);
    setIsGenerating(true);
    setIsModalOpen(true);
    try {
      const data = await buildMarksheetData(student.id);
      setMarksheetData(data);
      toast.success(`Marksheet generated for ${student.users?.full_name || 'student'}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to fetch results');
      setIsModalOpen(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBulkGenerate = async (ids) => {
    if (selectedExams.length === 0) {
      toast.error('Please select at least one exam first.');
      return;
    }
    setIsGenerating(true);
    setSelectedStudent(null);
    setIsModalOpen(true);
    try {
      const sheets = [];
      for (const id of ids) {
        const data = await buildMarksheetData(id);
        sheets.push(data);
      }
      setMarksheetData(sheets);
      toast.success(`Generated marksheets for ${sheets.length} student(s)`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bulk generation failed');
      setIsModalOpen(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadTemplate = async () => {
    const { data: resp } = await api.get(`/students?courseId=${selectedCourse}${selectedSession ? `&sessionId=${selectedSession}` : ''}`);
    const students = Array.isArray(resp) ? resp : (Array.isArray(resp?.data) ? resp.data : []);
    if (!students || students.length === 0) { toast.error('No students found.'); return; }
    let csv = "Student ID,Student ID Number,Student Name\n";
    students.forEach(s => {
      if (s.id && s.student_id_number) {
        const name = s.users?.full_name ? `"${s.users.full_name.replace(/"/g, '""')}"` : 'Unknown';
        csv += `${s.id},${s.student_id_number},${name}\n`;
      }
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `marksheet_template_${courseDetails?.name?.replace(/\s+/g, '_') || 'course'}.csv`;
    link.click();
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!fileInputRef.current?.files[0]) { toast.error('Please upload a CSV file'); return; }
    if (selectedExams.length === 0) { toast.error('Please select at least one exam first.'); return; }
    const file = fileInputRef.current.files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsGenerating(true);
        setIsModalOpen(true);
        setSelectedStudent(null);
        setMarksheetData(null);
        const text = event.target.result;
        const lines = text.split('\n').filter(l => l.trim() !== '');
        if (lines.length < 2) throw new Error('CSV is empty or has no data rows');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const studentIdIdx = headers.findIndex(h => h === 'student id');
        if (studentIdIdx === -1) throw new Error('CSV must contain "Student ID" column');
        const sheets = [];
        for (let i = 1; i < lines.length; i++) {
          const values = [];
          let inQ = false, cur = '';
          for (const ch of lines[i]) {
            if (ch === '"') inQ = !inQ;
            else if (ch === ',' && !inQ) { values.push(cur.trim()); cur = ''; }
            else cur += ch;
          }
          values.push(cur.trim());
          const sid = values[studentIdIdx];
          if (!sid) continue;
          const data = await buildMarksheetData(sid);
          sheets.push(data);
        }
        setMarksheetData(sheets);
        toast.success(`Generated marksheets for ${sheets.length} student(s)`);
      } catch (err) {
        toast.error(err.message || 'Error processing CSV');
        setIsModalOpen(false);
      } finally {
        setIsGenerating(false);
      }
    };
    reader.onerror = () => { toast.error('Failed to read file'); setIsGenerating(false); };
    reader.readAsText(file);
  };

  const hasFiltersSelected = selectedSemesters.length > 0 || selectedExams.length > 0;
  const isBulk = Array.isArray(marksheetData);
  const templateProps = isBulk ? { marksheets: marksheetData } : (marksheetData || {});
  const fileName = isBulk
    ? `Bulk_Marksheets_${courseDetails?.name?.replace(/\s+/g, '_') || 'course'}.pdf`
    : `Marksheet_${selectedStudent?.student_id_number || '000'}.pdf`;

  const columns = [
    { source: 'users.full_name', label: 'Student Name' },
    { source: 'student_id_number', label: 'Student ID', sortable: true },
  ];

  const params = {};
  if (selectedCourse) params.course_id = selectedCourse;
  if (selectedSession) params.session_id = selectedSession;

  return (
    <div className="admin-marksheets">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1>Marksheet Management</h1>
        <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
          Generate and manage student marksheets by course, semester, and exam.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ margin: 0, minWidth: '300px', flex: 1 }}>
            <label className="form-label">Select Course</label>
            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="form-input" disabled={coursesLoading}>
              <option value="">-- Select Course --</option>
              {courses && courses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
          </div>
          {selectedCourse && (
            <div className="form-group" style={{ margin: 0, minWidth: '300px', flex: 1 }}>
              <label className="form-label">Select Session (Optional)</label>
              <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} className="form-input">
                <option value="">-- All Sessions --</option>
                {courses?.find(c => c.id === selectedCourse)?.sessions?.map(s => (
                  <option key={s.id} value={s.id}>{s.session_type} ({s.start_date || 'TBA'} to {s.end_date || 'TBA'})</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {selectedCourse && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <ClipboardList size={20} style={{ color: 'var(--primary-600, #2563eb)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Semester & Exam Selection</h3>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <MultiSelect label="Semesters" options={semesterOptions} selected={selectedSemesters} onChange={handleSemesterChange} placeholder="Select semesters..." disabled={semesterOptions.length === 0} />
            <MultiSelect label="Exams" options={filteredExamOptions} selected={selectedExams} onChange={handleExamChange} placeholder="Select exams..." disabled={examsLoading || examOptions.length === 0} renderOption={(opt) => (
              <div>
                <div style={{ fontWeight: 500 }}>{opt.label}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {opt.subjectName} {opt.semester ? `· Sem ${opt.semester}` : ''} {opt.examDate ? `· ${new Date(opt.examDate).toLocaleDateString()}` : ''}
                </div>
              </div>
            )} />
          </div>
          {hasFiltersSelected && (
            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--primary-50, #eff6ff)', borderRadius: '0.5rem', border: '1px solid var(--primary-100, #dbeafe)', fontSize: '0.85rem', color: 'var(--primary-700, #1d4ed8)' }}>
              <p style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>The following exams will be included in the generated marksheet:</p>
              {selectedExams.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {examOptions.filter(e => selectedExams.includes(e.value)).map(e => (
                    <span key={e.value} style={{ display: 'inline-block', padding: '0.2rem 0.6rem', background: 'var(--primary-100, #dbeafe)', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 500 }}>
                      {e.label}{e.semester ? ` (Sem ${e.semester})` : ''}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontStyle: 'italic', opacity: 0.8 }}>No exams selected.</p>
              )}
            </div>
          )}
          {hasFiltersSelected && (
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={handleDownloadTemplate} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Download size={16} /> CSV Template
              </button>
              <label className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0 }}>
                <Upload size={16} /> Upload CSV
                <input type="file" accept=".csv" ref={fileInputRef} onChange={handleBulkUpload} style={{ display: 'none' }} />
              </label>
            </div>
          )}
        </div>
      )}

      {selectedCourse && (
        <DataTable
          key={refreshKey}
          resource="students"
          columns={columns}
          params={params}
          emptyMessage="No students enrolled in this course."
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
          bulkActions={hasFiltersSelected ? <MarksheetBulkActions onGenerate={handleBulkGenerate} /> : null}
          rowActions={(student) => (
            <button onClick={() => handleGetMarksheet(student)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
              <FileText size={16} /> Get Marksheet
            </button>
          )}
        />
      )}

      {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal-content card" style={{ width: '90%', maxWidth: '1000px', height: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText /> Marksheet Preview
                </h2>
                <p style={{ margin: '0.25rem 0 0', color: '#4b5563', fontSize: '0.875rem' }}>
                  {isBulk ? `Bulk Marksheets - ${courseDetails?.name}` : `${selectedStudent?.users?.full_name} - ${courseDetails?.name}`}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {!isGenerating && marksheetData && (!isBulk || marksheetData.length > 0) && (
                  <PDFDownloadLink
                    document={<MarksheetTemplate {...templateProps} />}
                    fileName={fileName}
                    className="btn btn-primary"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {({ loading }) => loading ? 'Preparing...' : (<><Download size={18} /> Download PDF</>)}
                  </PDFDownloadLink>
                )}
                <button onClick={() => { setIsModalOpen(false); setSelectedStudent(null); setMarksheetData(null); }} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280' }}>
                  <X size={20} />
                </button>
              </div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#e5e7eb', padding: '1rem', position: 'relative' }}>
              {isGenerating ? (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 10 }}>
                  <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px', marginBottom: '1rem' }}></div>
                  <p style={{ fontWeight: 500, color: '#4b5563' }}>Generating Marksheet...</p>
                </div>
              ) : marksheetData ? (
                <PDFViewer width="100%" height="100%" style={{ border: 'none', borderRadius: '0.5rem', backgroundColor: '#fff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                  <MarksheetTemplate {...templateProps} />
                </PDFViewer>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MarksheetBulkActions = ({ onGenerate }) => {
  const { selectedIds = [] } = useListContext();
  if (!selectedIds.length) return null;
  return (
    <button className="btn btn-sm btn-primary" onClick={() => onGenerate(selectedIds)}>
      <Users size={14} /> Generate Marksheets ({selectedIds.length})
    </button>
  );
};

export default AdminMarksheets;