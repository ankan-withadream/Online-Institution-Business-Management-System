import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import authBg from '../../assets/franchise_authorization_certificate.jpg';

// Background image: 1754x1241 px → A4 LANDSCAPE (842x595 pt).
// Scale: x ≈ 0.48, y ≈ 0.48. All static labels and design elements
// live inside the background image. This template renders only the
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
  orgName: {
    position: 'absolute',
    top: 190,
    left: 230,
    right: 80,
    fontSize: 28,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  contactPerson: {
    position: 'absolute',
    top: 260,
    left: 230,
    right: 80,
    fontSize: 18,
    color: '#374151',
    textAlign: 'center',
  },
  address: {
    position: 'absolute',
    top: 300,
    left: 120,
    right: 120,
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  phone: {
    position: 'absolute',
    top: 330,
    left: 230,
    right: 80,
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  issueDate: {
    position: 'absolute',
    bottom: 120,
    left: 300,
    right: 300,
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  certNumber: {
    position: 'absolute',
    top: 60,
    right: 80,
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Helvetica-Bold',
  },
});

const formatDate = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return value;
  }
};

const FranchiseAuthorizationCertificateTemplate = ({
  certificates = [],
  organizationName,
  contactPerson,
  address,
  phone,
  issueDate,
  certificateNumber,
}) => {
  const sheetsToRender = certificates.length > 0
    ? certificates
    : [{ organizationName, contactPerson, address, phone, issueDate, certificateNumber }];

  return (
    <Document>
      {sheetsToRender.map((cert, index) => (
        <Page key={index} size="A4" orientation="landscape" style={styles.page}>
          <View style={styles.pageWrapper}>
            <Image src={authBg} style={styles.backgroundImage} />

            {cert.certificateNumber && (
              <Text style={styles.certNumber}>{cert.certificateNumber}</Text>
            )}
            <Text style={styles.orgName}>{cert.organizationName || ''}</Text>
            <Text style={styles.contactPerson}>{cert.contactPerson || ''}</Text>
            <Text style={styles.address}>{cert.address || ''}</Text>
            {cert.phone && (
              <Text style={styles.phone}>{cert.phone}</Text>
            )}
            <Text style={styles.issueDate}>
              {formatDate(cert.issueDate) || formatDate(new Date().toISOString().split('T')[0])}
            </Text>
          </View>
        </Page>
      ))}
    </Document>
  );
};

export default FranchiseAuthorizationCertificateTemplate;
