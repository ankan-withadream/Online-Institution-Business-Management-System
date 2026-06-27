import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import marksheetBg from '../../assets/marksheet.jpeg';

// A4 portrait: 595 x 842 pt. Background image is 1088x1600 (portrait).
// All static labels, headers, and cell borders live inside the
// background image (marksheet.jpeg). This template only renders the
// dynamic values on top of the matching cells.

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

  // ── Serial / Registration number values (top row) ──
  serialValueLeft: {
    position: 'absolute',
    top: 22,
    left: 105,
    fontSize: 9,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Bold',
  },
  serialValueRight: {
    position: 'absolute',
    top: 25,
    right: 25,
    fontSize: 10,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Bold',
  },

  // ── Photo frame (top-right) ──
  photo: {
    position: 'absolute',
    top:195,
    right:37,
    width: 80,
    height: 100,
    objectFit: 'cover',
  },

  // ── Student info grid values (no labels, just values) ──
  // Two columns. Left col x ~205, Right col x ~390. y per row ~ 305, 326, 347, 368.
  infoRowBase: {
    position: 'absolute',
    left: 195,
    right: 50,
    flexDirection: 'row',
  },
  infoValue: {
    fontSize: 11,
    color: '#111827',
    fontFamily: 'Helvetica',
  },

    // Left column values
  studentName: { position: 'absolute', top: 270, left: 137, right: 360, fontSize: 11, color: '#111827' },
  fatherName: { position: 'absolute', top: 290, left: 137, right: 360, fontSize: 11, color: '#111827' },
  motherName: { position: 'absolute', top: 311, left: 137, right: 360, fontSize: 11, color: '#111827' },
  courseName: { position: 'absolute', top: 332, left: 137, right: 80, fontSize: 11, color: '#111827' },
  // Right column values
  rollNumber: { position: 'absolute', top: 270, left: 382, right: 175, fontSize: 11, color: '#111827' },
  dateOfBirth: { position: 'absolute', top: 290, left: 382, right: 175, fontSize: 11, color: '#111827' },
  sessionName: { position: 'absolute', top: 311, left: 382, right: 175, fontSize: 11, color: '#111827' },

  // ── Marks table (only the data cells, headers come from background) ──
  // Table starts just below the orange "STATEMENT OF MARKS" bar.
  // 8 columns: Code, Subject, Marks, Internal, Total, Min, Max, Grade
  // Column x-positions and widths measured against A4 (595) with
  // margins of ~50 left/right.
  tableStartY: 432,
  rowHeight: 28,
  tableCell: {
    fontSize: 9,
    color: '#111827',
    textAlign: 'center',
  },
  colCode: { left: 25, width: 60 },
  colSubject: { left: 112, width: 130, textAlign: 'left' },
  colMarks: { left: 322, width: 50 },
  colInternal: { left: 342, width: 55 },
  colTotal: { left: 397, width: 50 },
  colMin: { left: 442, width: 50 },
  colMax: { left: 487, width: 50 },
  colGrade: { left: 523, width: 50 },

  // Percentage value (sits on the right of the table)
  percentageValue: {
    position: 'absolute',
    top: 610,
    right: 70,
    fontSize: 10,
    color: '#111827',
    fontFamily: 'Helvetica-Bold',
  },

  // ── Maximum Marks / Marks Obtained values (labels come from bg) ──
  maxMarksValue: {
    position: 'absolute',
    top: 662,
    left: 150,
    fontSize: 10,
    color: '#111827',
    fontFamily: 'Helvetica-Bold',
  },
  obtainedValue: {
    position: 'absolute',
    top: 690,
    left: 150,
    fontSize: 10,
    color: '#111827',
    fontFamily: 'Helvetica-Bold',
  },

  // ── Result value (label and box come from background) ──
  resultValue: {
    position: 'absolute',
    top: 715,
    right: 110,
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  passBadge: {
    color: '#16a34a',
  },
  failBadge: {
    color: '#dc2626',
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

const computeMinMarks = (maxMarks) => {
  const m = Number(maxMarks) || 0;
  return Math.round(m * 0.4);
};

/**
 * MarksheetTemplate — values-only overlay for marksheet.jpeg.
 *
 * Props (per sheet):
 *   studentName, fatherName, motherName, dateOfBirth, sessionName,
 *   studentIdNumber, courseName, photoUrl, results[]
 *
 * results[] shape:
 *   { subjectName, subjectCode, marksObtained, internal, totalMarks,
 *     minMarks, maxMarks, grade }
 */
const MarksheetTemplate = ({
  marksheets = [],
  studentName,
  fatherName,
  motherName,
  dateOfBirth,
  sessionName,
  studentIdNumber,
  courseName,
  photoUrl,
  results = [],
}) => {
  const sheetsToRender = marksheets.length > 0
    ? marksheets
    : [{
        studentName, fatherName, motherName, dateOfBirth, sessionName,
        studentIdNumber, courseName, photoUrl, results,
      }];

  return (
    <Document>
      {sheetsToRender.map((sheet, sheetIndex) => {
        const rows = sheet.results || [];
        const totalMax = rows.reduce((sum, r) => sum + (Number(r.maxMarks) || 0), 0);
        const totalObtained = rows.reduce((sum, r) => {
          const m = Number(r.marksObtained) || 0;
          const i = Number(r.internal) || 0;
          return sum + m + i;
        }, 0);
        const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(2) : '0.00';
        const overallPass = rows.length > 0 && rows.every(r => r.isPass);

        return (
          <Page key={sheetIndex} size="A4" orientation="portrait" style={styles.page}>
            <View style={styles.pageWrapper}>
              <Image src={marksheetBg} style={styles.backgroundImage} />

              {/* Serial / Registration values */}
              <Text style={styles.serialValueLeft}>{sheetIndex + 1}</Text>
              <Text style={styles.serialValueRight}>{sheet.studentIdNumber || ''}</Text>

              {/* Photo */}
              {sheet.photoUrl && (
                <Image src={sheet.photoUrl} style={styles.photo} />
              )}

              {/* Info values */}
              <Text style={styles.studentName}>{sheet.studentName || ''}</Text>
              <Text style={styles.fatherName}>{sheet.fatherName || ''}</Text>
              <Text style={styles.motherName}>{sheet.motherName || ''}</Text>
              <Text style={styles.courseName}>{sheet.courseName || ''}</Text>
              <Text style={styles.rollNumber}>{sheet.studentIdNumber || ''}</Text>
              <Text style={styles.dateOfBirth}>{formatDate(sheet.dateOfBirth)}</Text>
              <Text style={styles.sessionName}>{sheet.sessionName || ''}</Text>

              {/* Marks rows */}
              {rows.map((result, rIndex) => {
                const marks = Number(result.marksObtained) || 0;
                const internal = Number(result.internal) || 0;
                const total = Number(result.totalMarks) || (marks + internal);
                const maxMarks = Number(result.maxMarks) || 0;
                const minMarks = result.minMarks != null ? Number(result.minMarks) : computeMinMarks(maxMarks);
                const top = styles.tableStartY + rIndex * styles.rowHeight;
                const rowStyle = (extra) => ({ ...extra, position: 'absolute', top });
                return (
                  <View key={rIndex}>
                    <Text style={rowStyle({ ...styles.tableCell, ...styles.colCode })}>
                      {result.subjectCode || ''}
                    </Text>
                    <Text style={rowStyle({ ...styles.tableCell, ...styles.colSubject })}>
                      {result.subjectName || ''}
                    </Text>
                    <Text style={rowStyle({ ...styles.tableCell, ...styles.colMarks })}>
                      {marks}
                    </Text>
                    <Text style={rowStyle({ ...styles.tableCell, ...styles.colInternal })}>
                      {internal}
                    </Text>
                    <Text style={rowStyle({ ...styles.tableCell, ...styles.colTotal })}>
                      {total}
                    </Text>
                    <Text style={rowStyle({ ...styles.tableCell, ...styles.colMin })}>
                      {minMarks}
                    </Text>
                    <Text style={rowStyle({ ...styles.tableCell, ...styles.colMax })}>
                      {maxMarks}
                    </Text>
                    <Text style={rowStyle({ ...styles.tableCell, ...styles.colGrade })}>
                      {result.grade || ''}
                    </Text>
                  </View>
                );
              })}

              {/* Percentage */}
              <Text style={styles.percentageValue}>{percentage}%</Text>

              {/* Max / Obtained values */}
              <Text style={styles.maxMarksValue}>{totalMax}</Text>
              <Text style={styles.obtainedValue}>{totalObtained}</Text>

              {/* Result */}
              <Text style={[styles.resultValue, overallPass ? styles.passBadge : styles.failBadge]}>
                {rows.length > 0 ? (overallPass ? 'PASS' : 'FAIL') : ''}
              </Text>
            </View>
          </Page>
        );
      })}
    </Document>
  );
};

export default MarksheetTemplate;
