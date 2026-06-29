import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import migrationBg from '../../assets/Migration.jpeg';

// Page: A4 LANDSCAPE (842 x 595 pt). Background image is 1600x1098
// (landscape, same aspect ratio). All static labels, dotted lines,
// badge, signature and decorative elements live inside the
// background image (Migration.jpeg). This template only renders the
// dynamic values on top of the matching blanks.

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 0,
    fontFamily: 'Helvetica',
  },
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

  // ── Serial No. value (top-left, after the "Serial No.:" label) ──
  serialValue: {
    position: 'absolute',
    top: 16,
    left: 110,
    fontSize: 9,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Bold',
  },

  // ── Body blanks ──
  // The page is 842pt wide. Body sentences flow horizontally across
  // three rows. Each blank sits on a dotted segment from the
  // background image.

  // Row 1: "Mr./Ms. <name> ........ S/D of <fatherName> ... has passed"
  studentNameValue: {
    position: 'absolute',
    top: 312,
    left: 90,
    right: 510,
    fontSize: 13,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Oblique',
    textAlign: 'center',
  },
  fatherNameValue: {
    position: 'absolute',
    top: 312,
    left: 460,
    right: 160,
    fontSize: 13,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Oblique',
    textAlign: 'center',
  },

  // Row 2: "the <course> ... from <issuer> in the year <year> bearing"
  courseNameValue: {
    position: 'absolute',
    top: 352,
    left: 80,
    right: 510,
    fontSize: 13,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Oblique',
    textAlign: 'center',
  },
  issuerValue: {
    position: 'absolute',
    top: 394,
    left: 150,
    right: 290,
    fontSize: 13,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Oblique',
    textAlign: 'center',
  },
  yearValue: {
    position: 'absolute',
    top: 394,
    left: 570,
    right: 70,
    fontSize: 13,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Oblique',
    textAlign: 'center',
  },

  // Row 3: "Registration Number <id> ........"
  registrationValue: {
    position: 'absolute',
    top: 435,
    left: 230,
    right: 460,
    fontSize: 13,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Oblique',
    textAlign: 'center',
  },

  // ── Dated of Issue value (center-bottom, under "Dated of Issue" label) ──
  dateOfIssue: {
    position: 'absolute',
    top: 480,
    left: 280,
    right: 280,
    fontSize: 13,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
});

const formatIssueDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${d.getFullYear()}`;
};

/**
 * MigrationCertificateTemplate — values-only overlay for Migration.jpeg
 * rendered on A4 LANDSCAPE page.
 *
 * Props (per sheet):
 *   studentName, fatherName, studentIdNumber, courseName,
 *   issueDate, issuerName
 */
const MigrationCertificateTemplate = ({
  certificates = [],
  studentName,
  fatherName,
  studentIdNumber,
  courseName,
  issueDate,
  issuerName,
}) => {
  const sheetsToRender = certificates.length > 0
    ? certificates
    : [{
        studentName, fatherName, studentIdNumber, courseName,
        issueDate, issuerName,
      }];

  return (
    <Document>
      {sheetsToRender.map((cert, sheetIndex) => {
        const serialValue = sheetIndex + 1;
        const yearValue = cert.issueDate
          ? new Date(cert.issueDate).getFullYear()
          : new Date().getFullYear();

        return (
          <Page
            key={sheetIndex}
            size="A4"
            orientation="landscape"
            style={styles.page}
          >
            <View style={styles.pageWrapper}>
              <Image src={migrationBg} style={styles.backgroundImage} />

              {/* Serial */}
              <Text style={styles.serialValue}>{serialValue}</Text>

              {/* Body blanks */}
              <Text style={styles.studentNameValue}>{cert.studentName || ''}</Text>
              <Text style={styles.fatherNameValue}>
                {cert.fatherName ? `${cert.fatherName}` : ''}
              </Text>
              <Text style={styles.courseNameValue}>{cert.courseName || ''}</Text>
              <Text style={styles.issuerValue}>
                {cert.issuerName || 'Vivekananda Education & Health Training Institute'}
              </Text>
              <Text style={styles.yearValue}>{yearValue}</Text>
              <Text style={styles.registrationValue}>{cert.studentIdNumber || ''}</Text>

              {/* Date of issue */}
              <Text style={styles.dateOfIssue}>
                {/* {formatIssueDate(cert.issueDate) || formatIssueDate(new Date())} */}
              </Text>
            </View>
          </Page>
        );
      })}
    </Document>
  );
};

export default MigrationCertificateTemplate;