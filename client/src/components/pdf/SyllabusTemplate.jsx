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
  courseName: {
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
    width: 100,
    fontFamily: 'Helvetica-Bold',
  },
  infoValue: {
    fontSize: 9,
    color: '#111827',
  },
  descriptionSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  descriptionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.5,
  },
  semesterSection: {
    marginBottom: 16,
  },
  semesterTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#1e3a8a',
    padding: 6,
    marginBottom: 8,
  },
  table: {
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0e7ff',
    padding: 6,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
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
  colCode: { width: '12%' },
  colName: { width: '22%' },
  colDescription: { width: '50%' },
  colCredits: { width: '10%', textAlign: 'center' },
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 12,
    borderTop: '1pt solid #cbd5e1',
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
});

const SyllabusTemplate = ({ course, organizationName }) => {
  const courseName = course?.name || 'Course';
  const description = course?.description || '';
  const durationMonths = course?.duration_months || 0;
  const fee = course?.fee || 0;
  const subjects = course?.subjects || [];

  const generatedDate = new Date().toLocaleDateString('en-IN');

  const semesterGroups = subjects.reduce((acc, subject) => {
    const sem = subject.semester || 1;
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(subject);
    return acc;
  }, {});

  const semesters = Object.keys(semesterGroups).sort((a, b) => Number(a) - Number(b));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.borderWrapper}>
          <View style={styles.innerBorder}>
            <View style={styles.headerSection}>
              <Text style={styles.institutionName}>{organizationName}</Text>
              <Text style={styles.courseName}>{courseName}</Text>
              <Text style={styles.subtitle}>Course Syllabus</Text>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Duration:</Text>
                <Text style={styles.infoValue}>{durationMonths} months</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Fee:</Text>
                <Text style={styles.infoValue}>{'\u20B9'}{Number(fee).toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Total Subjects:</Text>
                <Text style={styles.infoValue}>{subjects.length}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Semesters:</Text>
                <Text style={styles.infoValue}>{semesters.length}</Text>
              </View>
            </View>

            {description && (
              <View style={styles.descriptionSection}>
                <Text style={styles.descriptionTitle}>Course Description</Text>
                <Text style={styles.descriptionText}>{description}</Text>
              </View>
            )}

            {semesters.map(sem => (
              <View key={sem} style={styles.semesterSection}>
                <Text style={styles.semesterTitle}>Semester {sem}</Text>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, styles.colSno]}>S.No</Text>
                    <Text style={[styles.tableHeaderCell, styles.colCode]}>Code</Text>
                    <Text style={[styles.tableHeaderCell, styles.colName]}>Subject Name</Text>
                    <Text style={[styles.tableHeaderCell, styles.colDescription]}>Description</Text>
                    <Text style={[styles.tableHeaderCell, styles.colCredits]}>Credits</Text>
                  </View>
                  {semesterGroups[sem].map((subject, index) => (
                    <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                      <Text style={[styles.tableCell, styles.colSno]}>{index + 1}</Text>
                      <Text style={[styles.tableCell, styles.colCode]}>{subject.code || 'N/A'}</Text>
                      <Text style={[styles.tableCell, styles.colName]}>{subject.name}</Text>
                      <Text style={[styles.tableCell, styles.colDescription]}>{subject.description || '-'}</Text>
                      <Text style={[styles.tableCell, styles.colCredits]}>{subject.credits || '-'}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {subjects.length === 0 && (
              <View style={{ padding: 20 }}>
                <Text style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center' }}>
                  No syllabus information available.
                </Text>
              </View>
            )}

            <View style={styles.footerSection}>
              <View style={styles.signatureBlock}>
                {/* <View style={styles.signatureLine} /> */}
                <Text style={styles.signatureText}>Date: {generatedDate}</Text>
              </View>
              {/* <View style={styles.signatureBlock}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureText}>Head of Department</Text>
              </View>
              <View style={styles.signatureBlock}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureText}>Director</Text>
              </View> */}
            </View>

            <Text style={styles.metaText}>
              This is a computer-generated document. Verify at portal.educare.com/verify
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default SyllabusTemplate;
