import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  borderWrapper: {
    border: '2pt solid #1e3a8a',
    padding: 16,
    flex: 1,
  },
  innerBorder: {
    border: '0.5pt solid #1e3a8a',
    flex: 1,
    padding: 20,
  },
  // ── Header ──
  headerSection: {
    alignItems: 'center',
    marginBottom: 16,
    borderBottom: '1pt solid #cbd5e1',
    paddingBottom: 12,
  },
  institutionName: {
    fontSize: 22,
    fontWeight: 'extrabold',
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    color: '#6b7280',
    fontFamily: 'Helvetica-Oblique',
  },
  // ── Student Info ──
  infoSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
    gap: 0,
  },
  infoRow: {
    flexDirection: 'row',
    width: '50%',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 9,
    color: '#6b7280',
    width: 90,
    fontFamily: 'Helvetica-Bold',
  },
  infoValue: {
    fontSize: 9,
    color: '#111827',
  },
  // ── Table ──
  table: {
    marginTop: 6,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e3a8a',
    padding: 6,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 5,
    borderBottom: '0.5pt solid #e5e7eb',
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: 5,
    borderBottom: '0.5pt solid #e5e7eb',
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 8,
    color: '#374151',
  },
  colSno: { width: '6%' },
  colSubject: { width: '22%' },
  colCode: { width: '12%' },
  colExam: { width: '20%' },
  colMaxMarks: { width: '10%', textAlign: 'center' },
  colObtained: { width: '10%', textAlign: 'center' },
  colGrade: { width: '10%', textAlign: 'center' },
  colResult: { width: '10%', textAlign: 'center' },
  // ── Summary ──
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
    marginBottom: 14,
    paddingRight: 10,
  },
  summaryBox: {
    flexDirection: 'row',
    gap: 16,
    borderTop: '1pt solid #1e3a8a',
    paddingTop: 6,
  },
  summaryItem: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  summaryLabel: {
    fontSize: 8,
    color: '#6b7280',
    fontFamily: 'Helvetica-Bold',
  },
  summaryValue: {
    fontSize: 12,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Bold',
    marginTop: 2,
  },
  // ── Footer ──
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 12,
  },
  signatureBlock: {
    alignItems: 'center',
  },
  signatureLine: {
    width: 120,
    borderBottom: '1pt solid #4b5563',
    marginBottom: 4,
  },
  signatureText: {
    fontSize: 8,
    color: '#4b5563',
  },
  metaText: {
    fontSize: 7,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  // ── Pass / Fail Badge ──
  passBadge: {
    color: '#16a34a',
    fontFamily: 'Helvetica-Bold',
  },
  failBadge: {
    color: '#dc2626',
    fontFamily: 'Helvetica-Bold',
  },
});

/**
 * MarksheetTemplate
 *
 * Props:
 *  - marksheets: Array of marksheet data objects for bulk rendering
 *    Each object: { studentName, studentIdNumber, courseName, results: [...] }
 *
 *  OR for single:
 *  - studentName, studentIdNumber, courseName, results
 *
 *  results[] shape:
 *    { subjectName, subjectCode, examName, maxMarks, marksObtained, grade, isPass }
 */
const MarksheetTemplate = ({
  marksheets = [],
  studentName,
  studentIdNumber,
  courseName,
  results = [],
}) => {
  const sheetsToRender = marksheets.length > 0
    ? marksheets
    : [{ studentName, studentIdNumber, courseName, results }];

  return (
    <Document>
      {sheetsToRender.map((sheet, sheetIndex) => {
        const totalMax = sheet.results.reduce((sum, r) => sum + (Number(r.maxMarks) || 0), 0);
        const totalObtained = sheet.results.reduce((sum, r) => sum + (Number(r.marksObtained) || 0), 0);
        const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(2) : '0.00';
        const overallPass = sheet.results.length > 0 && sheet.results.every(r => r.isPass);
        const generatedDate = new Date().toLocaleDateString('en-IN');

        return (
          <Page key={sheetIndex} size="A4" style={styles.page}>
            <View style={styles.borderWrapper}>
              <View style={styles.innerBorder}>
                {/* Header */}
                <View style={styles.headerSection}>
                  <Text style={styles.institutionName}>EduCare Academy</Text>
                  <Text style={styles.title}>Statement of Marks</Text>
                  <Text style={styles.subtitle}>Official Academic Record</Text>
                </View>

                {/* Student Info */}
                <View style={styles.infoSection}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Student Name:</Text>
                    <Text style={styles.infoValue}>{sheet.studentName || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Student ID:</Text>
                    <Text style={styles.infoValue}>{sheet.studentIdNumber || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Course:</Text>
                    <Text style={styles.infoValue}>{sheet.courseName || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Date of Issue:</Text>
                    <Text style={styles.infoValue}>{generatedDate}</Text>
                  </View>
                </View>

                {/* Results Table */}
                <View style={styles.table}>
                  {/* Table Header */}
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, styles.colSno]}>S.No</Text>
                    <Text style={[styles.tableHeaderCell, styles.colSubject]}>Subject</Text>
                    <Text style={[styles.tableHeaderCell, styles.colCode]}>Code</Text>
                    <Text style={[styles.tableHeaderCell, styles.colExam]}>Exam</Text>
                    <Text style={[styles.tableHeaderCell, styles.colMaxMarks]}>Max</Text>
                    <Text style={[styles.tableHeaderCell, styles.colObtained]}>Obtained</Text>
                    <Text style={[styles.tableHeaderCell, styles.colGrade]}>Grade</Text>
                    <Text style={[styles.tableHeaderCell, styles.colResult]}>Result</Text>
                  </View>

                  {/* Table Rows */}
                  {sheet.results.map((result, rIndex) => (
                    <View key={rIndex} style={rIndex % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                      <Text style={[styles.tableCell, styles.colSno]}>{rIndex + 1}</Text>
                      <Text style={[styles.tableCell, styles.colSubject]}>{result.subjectName}</Text>
                      <Text style={[styles.tableCell, styles.colCode]}>{result.subjectCode}</Text>
                      <Text style={[styles.tableCell, styles.colExam]}>{result.examName}</Text>
                      <Text style={[styles.tableCell, styles.colMaxMarks]}>{result.maxMarks}</Text>
                      <Text style={[styles.tableCell, styles.colObtained]}>{result.marksObtained}</Text>
                      <Text style={[styles.tableCell, styles.colGrade]}>{result.grade || '-'}</Text>
                      <Text style={[styles.tableCell, styles.colResult, result.isPass ? styles.passBadge : styles.failBadge]}>
                        {result.isPass ? 'PASS' : 'FAIL'}
                      </Text>
                    </View>
                  ))}

                  {sheet.results.length === 0 && (
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, { width: '100%', textAlign: 'center', padding: 10, color: '#9ca3af' }]}>
                        No results found for the selected exams.
                      </Text>
                    </View>
                  )}
                </View>

                {/* Summary */}
                <View style={styles.summarySection}>
                  <View style={styles.summaryBox}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Total Marks</Text>
                      <Text style={styles.summaryValue}>{totalObtained} / {totalMax}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Percentage</Text>
                      <Text style={styles.summaryValue}>{percentage}%</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Overall</Text>
                      <Text style={[styles.summaryValue, overallPass ? styles.passBadge : styles.failBadge]}>
                        {sheet.results.length > 0 ? (overallPass ? 'PASS' : 'FAIL') : '-'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Footer */}
                <View style={styles.footerSection}>
                  <View style={styles.signatureBlock}>
                    <View style={styles.signatureLine}></View>
                    <Text style={styles.signatureText}>Date: {generatedDate}</Text>
                  </View>
                  <View style={styles.signatureBlock}>
                    <View style={styles.signatureLine}></View>
                    <Text style={styles.signatureText}>Controller of Examinations</Text>
                  </View>
                  <View style={styles.signatureBlock}>
                    <View style={styles.signatureLine}></View>
                    <Text style={styles.signatureText}>Authorized Signature</Text>
                  </View>
                </View>

                <Text style={styles.metaText}>
                  This is a computer-generated document. Verify at portal.educare.com/verify
                </Text>
              </View>
            </View>
          </Page>
        );
      })}
    </Document>
  );
};

export default MarksheetTemplate;
