const AdminResults = () => (
  <div>
    <div className="page-header"><h1>Results Management</h1></div>
    <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
      <p>Upload and manage exam results here. Select an exam and upload results in bulk or individually.</p>
      <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>Use the API endpoint <code>POST /api/results/bulk</code> for bulk upload.</p>
    </div>
  </div>
);
export default AdminResults;
