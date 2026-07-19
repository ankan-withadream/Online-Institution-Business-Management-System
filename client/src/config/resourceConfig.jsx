/**
 * Per-resource defaults for the DataTable component.
 *
 * Each entry describes:
 *  - columns: ordered list of { source, label, sortable, render, width }
 *  - defaultSort: { field, order }
 *  - searchable: list of dotted paths the server should match against `q`
 *  - filterable: list of columns the server will accept as `filter[col]=…`
 *  - perPage: default page size
 *  - rowActions: function(record) returning JSX for the actions cell
 *
 * The actual data fetch goes through the dataProvider; this file only
 * describes how to render the result.
 */
import { Code, StatusBadge, DateCell, CurrencyCell, Truthy } from './cellRenderers.jsx';

export const resolvePath = (record, path) => {
  if (!path) return undefined;
  if (!path.includes('.')) return record?.[path];
  return path.split('.').reduce((acc, k) => acc?.[k], record);
};

export const resourceConfig = {
  students: {
    defaultSort: { field: 'created_at', order: 'DESC' },
    perPage: 25,
    columns: [
      { source: 'student_id_number', label: 'ID', sortable: true, render: Code },
      { source: 'users.full_name', label: 'Name', sortable: true },
      { source: 'users.email', label: 'Email' },
      { source: 'courses.name', label: 'Course' },
      { source: 'sessions.session_type', label: 'Session' },
      { source: 'status', label: 'Status', sortable: true, render: StatusBadge },
      { source: 'enrollment_date', label: 'Enrolled', sortable: true, render: DateCell },
    ],
  },

  courses: {
    defaultSort: { field: 'created_at', order: 'DESC' },
    perPage: 25,
    columns: [
      { source: 'name', label: 'Name', sortable: true },
      { source: 'slug', label: 'Slug', sortable: true, render: (v) => <code>{v}</code> },
      { source: 'duration_months', label: 'Duration (months)', sortable: true },
      { source: 'fee', label: 'Fee', sortable: true, render: CurrencyCell },
      { source: 'is_active', label: 'Status', sortable: true, render: (v) => <span className={`badge badge-${v ? 'success' : 'danger'}`}>{v ? 'Active' : 'Inactive'}</span> },
    ],
  },

  admissions: {
    defaultSort: { field: 'created_at', order: 'DESC' },
    perPage: 25,
    columns: [
      { source: 'full_name', label: 'Name', sortable: true },
      { source: 'email', label: 'Email', sortable: true },
      { source: 'phone', label: 'Phone' },
      { source: 'courses.name', label: 'Course' },
      { source: 'status', label: 'Status', sortable: true, render: StatusBadge },
      { source: 'created_at', label: 'Date', sortable: true, render: DateCell },
    ],
  },

  exams: {
    defaultSort: { field: 'exam_date', order: 'ASC' },
    perPage: 25,
    columns: [
      { source: 'name', label: 'Exam', sortable: true },
      { source: 'courses.name', label: 'Course' },
      { source: 'sessions.session_type', label: 'Session' },
      { source: 'subjects.name', label: 'Subject' },
      { source: 'exam_date', label: 'Date', sortable: true, render: DateCell },
      { source: 'start_time', label: 'Time' },
      { source: 'total_marks', label: 'Total / Pass', sortable: true, render: (v, r) => `${v} / ${r.passing_marks ?? '-'}` },
      { source: 'status', label: 'Status', sortable: true, render: StatusBadge },
    ],
  },

  results: {
    defaultSort: { field: 'created_at', order: 'DESC' },
    perPage: 25,
    columns: [
      { source: 'students.student_id_number', label: 'Student', sortable: false, render: (v, r) => `${r.students?.users?.full_name || '-'} (${v || '-'})` },
      { source: 'exams.name', label: 'Exam' },
      { source: 'subjects.name', label: 'Subject' },
      { source: 'marks_obtained', label: 'Marks', sortable: true, render: (v, r) => `${v} / ${r.subjects?.max_marks ?? '-'}` },
      { source: 'grade', label: 'Grade' },
      { source: 'is_pass', label: 'Status', render: (v) => <span className={`badge badge-${v ? 'success' : 'danger'}`}>{v ? 'Pass' : 'Fail'}</span> },
      { source: 'published', label: 'Published', sortable: true, render: Truthy },
    ],
  },

  notices: {
    defaultSort: { field: 'created_at', order: 'DESC' },
    perPage: 25,
    columns: [
      { source: 'title', label: 'Title', sortable: true },
      { source: 'category', label: 'Category', sortable: true },
      { source: 'target_audience', label: 'Target' },
      { source: 'is_published', label: 'Status', sortable: true, render: (v) => <span className={`badge badge-${v ? 'success' : 'warning'}`}>{v ? 'Published' : 'Draft'}</span> },
      { source: 'created_at', label: 'Date', sortable: true, render: DateCell },
    ],
  },

  certificates: {
    defaultSort: { field: 'created_at', order: 'DESC' },
    perPage: 25,
    columns: [
      { source: 'students.users.full_name', label: 'Student', render: (v, r) => `${v || '-'} (${r.students?.student_id_number || '-'})` },
      { source: 'certificate_number', label: 'Cert #', render: Code },
      { source: 'courses.name', label: 'Course' },
      { source: 'issue_date', label: 'Issue Date', sortable: true, render: DateCell },
    ],
  },

  franchises: {
    defaultSort: { field: 'created_at', order: 'DESC' },
    perPage: 25,
    columns: [
      { source: 'organization_name', label: 'Organization', sortable: true },
      { source: 'contact_person', label: 'Contact' },
      { source: 'email', label: 'Email', sortable: true },
      { source: 'city', label: 'City' },
      { source: 'status', label: 'Status', sortable: true, render: StatusBadge },
      { source: 'created_at', label: 'Date', sortable: true, render: DateCell },
    ],
  },

  fees: {
    defaultSort: { field: 'created_at', order: 'DESC' },
    perPage: 25,
    columns: [
      { source: 'created_at', label: 'Date', sortable: true, render: DateCell },
      { source: 'students.users.full_name', label: 'Student', render: (v, r) => `${v || '-'} (${r.students?.student_id_number || '-'})` },
      { source: 'courses.name', label: 'Course' },
      { source: 'franchises.organization_name', label: 'Franchise' },
      { source: 'paid_amount', label: 'Amount', sortable: true, render: CurrencyCell },
      { source: 'payment_type', label: 'Type' },
      { source: 'payment_method', label: 'Method' },
      { source: 'transaction_id', label: 'Txn ID', render: Code },
      { source: 'status', label: 'Status', sortable: true, render: StatusBadge },
    ],
  },
};