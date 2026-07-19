import { useState } from 'react';
import { format } from 'date-fns';
import { FileText, Upload, Video, X, Download } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import DataTable from '../../components/ui/DataTable';

const getExamDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;
  const datePart = dateStr.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes, seconds = 0] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, seconds);
};

const StudentExams = () => {
  const [viewingQuestion, setViewingQuestion] = useState(null);
  const [questionDoc, setQuestionDoc] = useState(null);
  const [loadingDoc, setLoadingDoc] = useState(false);

  const [submittingAnswer, setSubmittingAnswer] = useState(null);
  const [answerFile, setAnswerFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleViewQuestion = async (exam) => {
    setViewingQuestion(exam);
    setLoadingDoc(true);
    try {
      const res = await api.get(`/exams/${exam.id}/question-paper`);
      setQuestionDoc(res.data);
    } catch (err) {
      toast.error('Failed to fetch question paper');
      setQuestionDoc(null);
    } finally {
      setLoadingDoc(false);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answerFile) {
      toast.error('Please select a PDF file');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', answerFile);
      await api.post(`/exams/${submittingAnswer.id}/submit-answer`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Answer submitted successfully!');
      setSubmittingAnswer(null);
      setAnswerFile(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit answer');
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    { source: 'name', label: 'Exam', sortable: true },
    { source: 'exam_date', label: 'Date', sortable: true, render: (v) => (v ? format(new Date(v), 'PP') : '-') },
    { source: 'start_time', label: 'Time', render: (v, r) => `${v || ''} – ${r.end_time || ''}` },
    { source: 'total_marks', label: 'Total Marks' },
    {
      source: 'status',
      label: 'Status',
      render: (v) => (
        <span className={`badge badge-${v === 'completed' ? 'success' : v === 'ongoing' ? 'warning' : 'info'}`}>
          {v}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header"><h1>My Exams</h1></div>
      <DataTable
        resource="exams"
        columns={columns}
        emptyMessage="No exams scheduled"
        defaultSort={{ field: 'exam_date', order: 'ASC' }}
        rowActions={(exam) => (
          <>
            {exam.video_url && exam.status !== 'completed' && (
              <a
                href={exam.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-primary"
                title="Join Live"
              >
                <Video size={14} /> Live
              </a>
            )}
            <button
              onClick={() => handleViewQuestion(exam)}
              className="btn btn-sm btn-info"
              disabled={!['ongoing', 'completed'].includes(exam.status)}
              title="Get Questionnaire"
            >
              <FileText size={14} /> Paper
            </button>
            {exam.status === 'ongoing' && (
              <button
                onClick={() => setSubmittingAnswer(exam)}
                className="btn btn-sm btn-success"
                title="Submit Answer"
              >
                <Upload size={14} /> Submit
              </button>
            )}
          </>
        )}
      />

      {viewingQuestion && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal-content card" style={{ width: '100%', maxWidth: '800px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Question Paper: {viewingQuestion.name}</h2>
              <button onClick={() => { setViewingQuestion(null); setQuestionDoc(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>

            {loadingDoc ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Loading question paper...</div>
            ) : questionDoc ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FileText size={20} color="#6b7280" />
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{questionDoc.original_name || 'Question Paper'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'capitalize' }}>PDF Document</div>
                    </div>
                  </div>
                  <a href={questionDoc.downloadUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Download size={16} /> Download
                  </a>
                </div>
                <div style={{ border: '1px solid var(--gray-200)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                  <iframe src={questionDoc.previewUrl || questionDoc.downloadUrl} title="Question Paper Preview" style={{ width: '100%', height: '500px', border: 'none' }} />
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                No question paper available.
              </div>
            )}
          </div>
        </div>
      )}

      {submittingAnswer && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal-content card" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Submit Answer: {submittingAnswer.name}</h2>
              <button onClick={() => { setSubmittingAnswer(null); setAnswerFile(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitAnswer}>
              <div className="form-group">
                <label className="form-label">Upload Answer PDF *</label>
                <input
                  className="form-input"
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setAnswerFile(e.target.files?.[0] || null)}
                  required
                />
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>Only PDF files are allowed. Max size 5MB.</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={() => { setSubmittingAnswer(null); setAnswerFile(null); }} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Submit Answer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentExams;