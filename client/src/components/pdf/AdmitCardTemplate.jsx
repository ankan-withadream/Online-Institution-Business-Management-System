import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import admitCardBg from '../../assets/Admit_card.jpg';

// Background image: 2721x1840 px → A4 LANDSCAPE (842x595 pt).
// Scale: x ≈ 0.31, y ≈ 0.32. Coordinates below align with the printed
// labels on Admit_card.jpg. All static labels, decorative elements,
// QR placeholder, signature lines, and the photo frame live inside
// the background image — this template renders only the dynamic
// values on top of the matching blanks.

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
  // Top header — Roll No. and Registration No.
  rollNo: {
    position: 'absolute',
    top: 40,
    left: 105,
    fontSize: 14,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Bold',
  },
  registrationNo: {
    position: 'absolute',
    top: 40,
    right: 25,
    fontSize: 14,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Bold',
  },
  // Photo frame on the right side
  photo: {
    position: 'absolute',
    top: 210,
    right: 50,
    width: 100,
    height: 140,
    objectFit: 'cover',
  },
  // Student details block (left column, under Admit Card banner)
  studentName: {
    position: 'absolute',
    // top: 180,
    top: 282,
    left: 210,
    fontSize: 18,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Bold',
  },
  fatherName: {
    position: 'absolute',
    top: 318,
    left: 210,
    fontSize: 14,
    color: '#1e3a8a',
  },
  batch: {
    position: 'absolute',
    top: 346,
    left: 210,
    fontSize: 14,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Bold',
  },
  course: {
    position: 'absolute',
    top: 374,
    left: 210,
    fontSize: 14,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Bold',
  },
  year: {
    position: 'absolute',
    top: 407,
    left: 210,
    fontSize: 14,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Bold',
  },
  examCentre: {
    position: 'absolute',
    top: 438,
    left: 210,
    fontSize: 14,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Bold',
  },
});

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatMonthYear = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${MONTH_ABBR[d.getMonth()]} ${d.getFullYear()}`;
};

// Strips the leading session type ("Night", "Day", "Normal") and the
// parentheses around the date range, returning just "Feb 2025 - Feb 2030".
// Falls back to the original string if the expected shape isn't found.
const formatSessionDates = (value) => {
  if (!value) return '';
  const match = value.match(/^(?:Night|Day|Normal)\s*\(\s*([\d]{4}-[\d]{2}-[\d]{2})\s*-\s*([\d]{4}-[\d]{2}-[\d]{2})\s*\)/);
  if (!match) return value;
  return `${formatMonthYear(match[1])} - ${formatMonthYear(match[2])}`;
};

const AdmitCardTemplate = ({
  admitCards = [],
  studentName,
  fatherName,
  studentIdNumber,
  courseName,
  sessionName,
  photoUrl,
  examCentre,
}) => {
  const cardsToRender = admitCards.length > 0
    ? admitCards
    : [{ studentName, fatherName, studentIdNumber, courseName, sessionName, photoUrl, examCentre }];

  // Default values; overridden by props if provided.
  const YEAR = '2026';
  const DEFAULT_EXAM_CENTRE = 'Online Remote';

  return (
    <Document>
      {cardsToRender.map((card, index) => (
        <Page key={index} size="A4" orientation="landscape" style={styles.page}>
          <View style={styles.pageWrapper}>
            <Image src={admitCardBg} style={styles.backgroundImage} />

            {card.photoUrl && (
              <Image src={card.photoUrl} style={styles.photo} />
            )}

            <Text style={styles.rollNo}>{card.studentIdNumber || ''}</Text>
            <Text style={styles.registrationNo}>{card.studentIdNumber || ''}</Text>
            <Text style={styles.studentName}>{card.studentName || ''}</Text>
            <Text style={styles.fatherName}>{card.fatherName || ''}</Text>
            <Text style={styles.batch}>{formatSessionDates(card.sessionName) || ''}</Text>
            <Text style={styles.course}>{card.courseName || ''}</Text>
            <Text style={styles.year}>{YEAR}</Text>
            <Text style={styles.examCentre}>{card.examCentre || DEFAULT_EXAM_CENTRE}</Text>
          </View>
        </Page>
      ))}
    </Document>
  );
};

export default AdmitCardTemplate;
