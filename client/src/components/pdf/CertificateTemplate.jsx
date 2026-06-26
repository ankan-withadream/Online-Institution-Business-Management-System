import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import certificateBg from '../../assets/certificate.jpeg';

// A4 portrait: 595 x 842 pt. Background image (1089x1600) is portrait.
// We use A4 portrait so the image fills the page naturally.

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 0,
    fontFamily: 'Helvetica',
  },
  // Single wrapper with position: relative so all absolute children
  // (the background image, the metadata footer) stay on THIS page
  // instead of flowing onto the next.
  pageWrapper: {
    flex: 1,
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 270,
    paddingHorizontal: 60,
  },
  certifyText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'Helvetica-Oblique',
  },
  studentName: {
    fontSize: 38,
    color: '#1e3a8a',
    // marginBottom: 4,
    marginTop: 8,
    fontFamily: 'Helvetica-Oblique',
    textAlign: 'center',
    letterSpacing: 1,
  },
  photo: {
    width: 90,
    height: 110,
    objectFit: 'cover',
    marginTop: -94,
    marginLeft: 431,
    border: '2pt solid #1e3a8a',
  },
  fatherName: {
    fontSize: 20,
    color: '#313740',
    marginBottom: 6,
    marginTop: 30,
    fontFamily: 'Helvetica-Oblique',
    textAlign: 'center',
  },
  studentId: {
    fontSize: 15,
    color: '#363940',
    marginTop: 32,
    marginLeft: 175,
    fontFamily: 'Helvetica',
    textAlign: 'center',
    letterSpacing: 1,
  },
  underline: {
    width: 380,
    borderBottom: '1pt solid #1e3a8a',
    marginBottom: 24,
  },
  courseText: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'Helvetica-Oblique',
  },
  courseName: {
    fontSize: 22,
    color: '#1e3a8a',
    marginBottom: 30,
    marginTop: 100,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    maxWidth: '85%',
  },
  dateRow: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 60,
    fontFamily: 'Helvetica',
  },
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 'auto',
    marginBottom: 200,
  },
  signatureBlock: {
    alignItems: 'center',
  },
  signatureLine: {
    width: 150,
    borderBottom: '1pt solid #4b5563',
    marginBottom: 6,
  },
  signatureText: {
    fontSize: 11,
    color: '#374151',
    fontFamily: 'Helvetica-Bold',
  },
  metadataSection: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 50,
  },
  metadataText: {
    fontSize: 9,
    color: '#6b7280',
  },
});

const CertificateTemplate = ({
  certificates = [],
  studentName,
  courseName,
  issueDate,
  certificateCode,
  fatherName,
  studentIdNumber,
  photoUrl,
}) => {
  const certsToRender = certificates.length > 0
    ? certificates
    : [{ studentName, courseName, issueDate, certificateCode, fatherName, studentIdNumber, photoUrl }];

  return (
    <Document>
      {certsToRender.map((cert, index) => (
        <Page key={index} size="A4" orientation="portrait" style={styles.page}>
          <View style={styles.pageWrapper}>
            <Image src={certificateBg} style={styles.backgroundImage} />

            <View style={styles.content}>
              {/* <Text style={styles.certifyText}>This is to certify that</Text> */}
              {cert.photoUrl && (
                <Image src={cert.photoUrl} style={styles.photo} />
              )}
              <Text style={styles.studentName}>{cert.studentName}</Text>
              <Text style={styles.fatherName}>
                {cert.fatherName || 'Test Father Name'}
              </Text>
              {cert.studentIdNumber && (
                <Text style={styles.studentId}>{cert.studentIdNumber}</Text>
              )}
              {/* <View style={styles.underline} /> */}

              {/* <Text style={styles.courseText}>has successfully completed the course</Text> */}
              <Text style={styles.courseName}>{cert.courseName}</Text>

              {/* <Text style={styles.dateRow}>on {cert.issueDate}</Text> */}

              {/* <View style={styles.footerSection}>
                <View style={styles.signatureBlock}>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureText}>Date Issued</Text>
                </View>
                <View style={styles.signatureBlock}>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureText}>Authorized Signature</Text>
                </View>
              </View> */}
            </View>

            {/* <View style={styles.metadataSection}>
              <Text style={styles.metadataText}>Certificate ID: {cert.certificateCode}</Text>
              <Text style={styles.metadataText}>Verify at: portal.educare.com/verify</Text>
            </View> */}
          </View>
        </Page>
      ))}
    </Document>
  );
};

export default CertificateTemplate;
