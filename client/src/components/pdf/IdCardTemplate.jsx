import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import idCardBg from '../../assets/ID_card.png';

// Background image: 428x670 px, stretched to fill A4 portrait (595x842pt).
// Scale: x ≈ 1.39, y ≈ 1.26. Coordinates below are tuned to align with
// the printed labels on ID_card.png.
//
// Layout on the card (from screenshot):
//   - Photo box:      centered horizontally, below "Govt. of India"
//   - Guardian Name:  left column, upper middle  (we render studentName here since
//                     the card has no separate "Name" field)
//   - Address:        left column, just below Guardian Name
//   - Course:         left column, lower section
//   - Session:        left column, just below Course
//   - Blood Group:    left column, just below Session  (we render dateOfBirth here)
//   - Mobile:         left column, just below Blood Group
//   - Student ID:     bottom left, below the labeled fields
//   - Signature:      bottom right (decorative, no value rendered)

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
  // photo — sits inside the white box centered on the card
  photo: {
    position: 'absolute',
    top: 235,
    left: 217,
    width: 150,
    height: 180,
    objectFit: 'cover',
  },
  // Student Name — placed above the photo box
  studentName: {
    position: 'absolute',
    top: 422,
    left: 0,
    right: 0,
    fontSize: 27,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  // row group 1: Guardian Name / Address
  guardianName: {
    position: 'absolute',
    top: 460,
    left: 260,
    right: 40,
    fontSize: 25,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Bold',
  },
  address: {
    position: 'absolute',
    top: 495,
    left: 170,
    right: 40,
    fontSize: 22,
    color: '#1e3a8a',
    fontFamily: 'Helvetica',
  },
  // row group 2: Course / Session / Blood Group / Mobile
  courseName: {
    position: 'absolute',
    top: 597,
    left: 170,
    right: 40,
    fontSize: 20,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Bold',
  },
  session: {
    position: 'absolute',
    top: 627,
    left: 170,
    right: 40,
    fontSize: 20,
    color: '#1e3a8a',
    fontFamily: 'Helvetica',
  },
  // Blood Group slot is reserved on the card. We use date_of_birth
  // here since the student record has DOB but no blood group.
  bloodGroup: {
    position: 'absolute',
    top: 570,
    left: 170,
    right: 40,
    fontSize: 14,
    color: '#1e3a8a',
    fontFamily: 'Helvetica',
  },
  phone: {
    position: 'absolute',
    top: 695,
    left: 170,
    right: 40,
    fontSize: 20,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Bold',
  },
  // student ID — placed at the very bottom left, below the Mobile row
  studentId: {
    position: 'absolute',
    bottom: 60,
    left: 70,
    fontSize: 20,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Bold',
  },
});

const IdCardTemplate = ({
  idCards = [],
  studentName,
  fatherName,
  studentIdNumber,
  courseName,
  sessionName,
  dateOfBirth,
  phone,
  address,
  photoUrl,
}) => {
  const cardsToRender = idCards.length > 0
    ? idCards
    : [{ studentName, fatherName, studentIdNumber, courseName, sessionName, dateOfBirth, phone, address, photoUrl }];

  return (
    <Document>
      {cardsToRender.map((card, index) => (
        <Page key={index} size="A4" orientation="portrait" style={styles.page}>
          <View style={styles.pageWrapper}>
            <Image src={idCardBg} style={styles.backgroundImage} />

            {card.photoUrl && (
              <Image src={card.photoUrl} style={styles.photo} />
            )}

            <Text style={styles.studentName}>{card.studentName || ''}</Text>
            <Text style={styles.guardianName}>{card.fatherName || ''}</Text>
            <Text style={styles.address}>{card.address || ''}</Text>
            <Text style={styles.courseName}>{card.courseName || ''}</Text>
            <Text style={styles.session}>{card.sessionName || ''}</Text>

            {card.phone && (
              <Text style={styles.phone}>{card.phone}</Text>
            )}
            {card.studentIdNumber && (
              <Text style={styles.studentId}>{card.studentIdNumber}</Text>
            )}
          </View>
        </Page>
      ))}
    </Document>
  );
};

export default IdCardTemplate;
