import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import logoBrand from '../../assets/logo_brand.png';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  // header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderBottom: '2pt solid #1e3a8a',
    paddingBottom: 16,
  },
  logo: {
    width: 60,
    height: 60,
    objectFit: 'contain',
    marginRight: 16,
  },
  headerText: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  instituteName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    textAlign: 'center',
  },
  instituteSubtitle: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  // title
  title: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    textAlign: 'center',
    marginBottom: 24,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  // body
  body: {
    flexDirection: 'row',
    flex: 1,
    gap: 24,
  },
  photoSection: {
    width: 120,
    alignItems: 'center',
  },
  photo: {
    width: 110,
    height: 140,
    objectFit: 'cover',
    border: '2pt solid #1e3a8a',
    marginBottom: 12,
  },
  // fields grid
  fieldsGrid: {
    flex: 1,
    flexDirection: 'column',
    gap: 12,
  },
  field: {
    flexDirection: 'column',
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 8,
    color: '#6b7280',
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 12,
    color: '#111827',
    borderBottom: '1pt solid #d1d5db',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfField: {
    flex: 1,
    flexDirection: 'column',
    marginBottom: 4,
  },
  // footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1pt solid #d1d5db',
  },
  signatureBlock: {
    alignItems: 'center',
  },
  signatureLine: {
    width: 150,
    borderBottom: '1pt solid #4b5563',
    marginBottom: 6,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#6b7280',
  },
  stampBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    border: '2pt dashed #d1d5db',
    borderRadius: 8,
  },
  stampText: {
    fontSize: 9,
    color: '#9ca3af',
  },
  validityBadge: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    padding: 8,
    backgroundColor: '#f0fdf4',
    border: '1pt solid #bbf7d0',
    borderRadius: 4,
    textAlign: 'center',
  },
  validityText: {
    fontSize: 10,
    color: '#166534',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
});

const formatDate = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('en-IN');
  } catch {
    return value;
  }
};

const AdmitCardTemplate = ({
  admitCards = [],
  studentName,
  fatherName,
  studentIdNumber,
  courseName,
  sessionName,
  dateOfBirth,
  phone,
  address,
  photoUrl,
  issueDate,
}) => {
  const cardsToRender = admitCards.length > 0
    ? admitCards
    : [{ studentName, fatherName, studentIdNumber, courseName, sessionName, dateOfBirth, phone, address, photoUrl, issueDate }];

  return (
    <Document>
      {cardsToRender.map((card, index) => (
        <Page key={index} size="A4" orientation="portrait" style={styles.page}>
          {/* Header */}
          <View style={styles.header}>
            <Image src={logoBrand} style={styles.logo} />
            <View style={styles.headerText}>
              <Text style={styles.instituteName}>Vivekananda Education &amp; Health Training Institute</Text>
              <Text style={styles.instituteSubtitle}>Empowering Healthcare Professionals | Recognised by Govt. of India</Text>
            </View>
          </View>

          <Text style={styles.title}>Admit Card</Text>

          {/* Body */}
          <View style={styles.body}>
            {/* Photo */}
            <View style={styles.photoSection}>
              {card.photoUrl ? (
                <Image src={card.photoUrl} style={styles.photo} />
              ) : (
                <View style={{ ...styles.photo, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
                  <Text style={{ fontSize: 8, color: '#9ca3af' }}>No Photo</Text>
                </View>
              )}
            </View>

            {/* Fields */}
            <View style={styles.fieldsGrid}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Student Name</Text>
                <Text style={styles.fieldValue}>{card.studentName || ''}</Text>
              </View>

              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>Father's Name</Text>
                  <Text style={styles.fieldValue}>{card.fatherName || ''}</Text>
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>Date of Birth</Text>
                  <Text style={styles.fieldValue}>{formatDate(card.dateOfBirth)}</Text>
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>Student ID</Text>
                  <Text style={styles.fieldValue}>{card.studentIdNumber || ''}</Text>
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>Course</Text>
                  <Text style={styles.fieldValue}>{card.courseName || ''}</Text>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Session</Text>
                <Text style={styles.fieldValue}>{card.sessionName || ''}</Text>
              </View>

              {card.phone && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Phone</Text>
                  <Text style={styles.fieldValue}>{card.phone}</Text>
                </View>
              )}

              {card.address && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Address</Text>
                  <Text style={styles.fieldValue}>{card.address}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Validity */}
          {card.issueDate && (
            <View style={styles.validityBadge}>
              <Text style={styles.validityText}>Issued: {formatDate(card.issueDate)}</Text>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Student's Signature</Text>
            </View>
            <View style={styles.stampBlock}>
              <Text style={styles.stampText}>Institute Stamp</Text>
            </View>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Authorized Signatory</Text>
            </View>
          </View>
        </Page>
      ))}
    </Document>
  );
};

export default AdmitCardTemplate;
