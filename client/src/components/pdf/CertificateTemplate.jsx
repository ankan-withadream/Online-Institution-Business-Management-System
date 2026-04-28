import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  borderWrapper: {
    border: '4pt solid #1e3a8a',
    padding: 20,
    flex: 1,
    position: 'relative',
  },
  innerBorder: {
    border: '1pt solid #1e3a8a',
    flex: 1,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  headerText: {
    fontSize: 42,
    fontWeight: 'extrabold',
    color: '#1e3a8a',
    marginBottom: 10,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  subHeader: {
    fontSize: 18,
    color: '#4b5563',
    marginBottom: 40,
    fontFamily: 'Helvetica-Oblique',
    letterSpacing: 2,
  },
  certifyText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 10,
  },
  studentName: {
    fontSize: 36,
    color: '#111827',
    marginBottom: 10,
    fontFamily: 'Helvetica-Bold',
    borderBottom: '1pt solid #cbd5e1',
    paddingBottom: 5,
    minWidth: 400,
    textAlign: 'center',
  },
  courseText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 20,
    marginBottom: 10,
  },
  courseName: {
    fontSize: 24,
    color: '#1e3a8a',
    marginBottom: 40,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    maxWidth: '80%',
  },
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 50,
    paddingHorizontal: 40,
  },
  signatureBlock: {
    alignItems: 'center',
  },
  signatureLine: {
    width: 150,
    borderBottom: '1pt solid #4b5563',
    marginBottom: 5,
  },
  signatureText: {
    fontSize: 12,
    color: '#4b5563',
  },
  metadataSection: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingRight: 60,
  },
  metadataText: {
    fontSize: 10,
    color: '#9ca3af',
  }
});

const CertificateTemplate = ({ 
  certificates = [],
  studentName, 
  courseName, 
  issueDate, 
  certificateCode 
}) => {
  const certsToRender = certificates.length > 0 
    ? certificates 
    : [{ studentName, courseName, issueDate, certificateCode }];

  return (
    <Document>
      {certsToRender.map((cert, index) => (
        <Page key={index} size="A4" orientation="landscape" style={styles.page}>
          <View style={styles.borderWrapper}>
            <View style={styles.innerBorder}>
              <Text style={styles.headerText}>Certificate of Completion</Text>
              <Text style={styles.subHeader}>EDUCARE ACADEMY</Text>
              
              <Text style={styles.certifyText}>This is to proudly certify that</Text>
              <Text style={styles.studentName}>{cert.studentName}</Text>
              
              <Text style={styles.courseText}>has successfully completed the course requirements for</Text>
              <Text style={styles.courseName}>{cert.courseName}</Text>
              
              <View style={styles.footerSection}>
                <View style={styles.signatureBlock}>
                  <View style={styles.signatureLine}></View>
                  <Text style={styles.signatureText}>Date: {cert.issueDate}</Text>
                </View>
                <View style={styles.signatureBlock}>
                  <View style={styles.signatureLine}></View>
                  <Text style={styles.signatureText}>Authorized Signature</Text>
                </View>
              </View>
              
              <View style={styles.metadataSection}>
                <Text style={styles.metadataText}>Certificate ID: {cert.certificateCode}</Text>
                <Text style={styles.metadataText}>Verify at: portal.educare.com/verify</Text>
              </View>
            </View>
          </View>
        </Page>
      ))}
    </Document>
  );
};

export default CertificateTemplate;
