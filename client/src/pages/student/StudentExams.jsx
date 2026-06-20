import { useEffect, useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { format } from 'date-fns';
import { FileText, Download, Upload, Video, X } from 'lucide-react';
import api from '../../services/api';
import { uploadDocument } from '../../services/documents';

const getExamDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;
  const datePart = dateStr.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes, seconds = 0] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, seconds);
};

const StudentExams = () => {
  const { data: exams, loading, refetch } = useFetch('/exams');

  const [viewingQuestion, setViewingQuestion] = useState(null);
  const [questionDoc, setQuestionDoc] = useState(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  
  const [submittingAnswer, setSubmittingAnswer] = useState(null);
  const [answerFile, setAnswerFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleViewQuestion = async (exam) => {
    setViewingQuestion(exam);
    setLoadingDoc(true);
    try {
      const res = await api.get(`/exams/${exam.id}/question-paper`);
      setQuestionDoc(res.data);
    } catch (err) {
      console.error('Failed to fetch question paper', err);
      setQuestionDoc(null);
    } finally {
      setLoadingDoc(false);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answerFile) {
      setUploadError('Please select a PDF file');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', answerFile);
      await api.post(`/exams/${submittingAnswer.id}/submit-answer`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSubmittingAnswer(null);
      setAnswerFile(null);
      alert('Answer submitted successfully!');
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Failed to submit answer');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!exams || exams.length === 0) return;

    const intervalId = setInterval(() => {
      const now = new Date();
      let shouldRefetch = false;

      for (const exam of exams) {
        const startTime = getExamDateTime(exam.exam_date, exam.start_time);
        const endTime = getExamDateTime(exam.exam_date, exam.end_time);

        if (!startTime || !endTime) continue;

        if (exam.status === 'scheduled' && now >= startTime) {
          shouldRefetch = true;
          break;
        }
        if (exam.status === 'ongoing' && now >= endTime) {
          shouldRefetch = true;
          break;
        }
      }

      if (shouldRefetch) {
        refetch();
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [exams, refetch]);

  return (
    <div>
      <div className="page-header"><h1>My Exams</h1></div>
      {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
        <div className="card table-container">
          <table className="data-table">
            <thead><tr><th>Exam</th><th>Date</th><th>Time</th><th>Total Marks</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {exams?.map(e => (
                <tr key={e.id}>
                  <td>{e.name}</td>
                  <td>{e.exam_date && format(new Date(e.exam_date), 'PP')}</td>
                  <td>{e.start_time} – {e.end_time}</td>
                  <td>{e.total_marks}</td>
                  <td><span className={`badge badge-${e.status === 'completed' ? 'success' : e.status === 'ongoing' ? 'warning' : 'info'}`}>{e.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {e.video_url && e.status !== 'completed' && (
                        <a href={e.video_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary" title="Join Live">
                          <Video size={16} style={{ marginRight: '0.25rem' }} /> Live
                        </a>
                      )}
                      
                      <button 
                        onClick={() => handleViewQuestion(e)}
                        className="btn btn-sm btn-info" 
                        title="Get Questionier"
                        disabled={!['ongoing', 'completed'].includes(e.status)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <FileText size={16} /> Questionier
                      </button>
                      
                      {e.status === 'ongoing' && (
                        <button 
                          onClick={() => setSubmittingAnswer(e)}
                          className="btn btn-sm btn-success" 
                          title="Submit Answer"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Upload size={16} /> Submit
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!exams || exams.length === 0) && <div className="empty-state"><p>No exams scheduled</p></div>}
        </div>
      )}

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
              <button onClick={() => { setSubmittingAnswer(null); setAnswerFile(null); setUploadError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>
            
            {uploadError && <p className="form-error" style={{ marginBottom: '1rem' }}>{uploadError}</p>}
            
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
                <button type="button" onClick={() => { setSubmittingAnswer(null); setAnswerFile(null); setUploadError(''); }} className="btn btn-secondary">Cancel</button>
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
