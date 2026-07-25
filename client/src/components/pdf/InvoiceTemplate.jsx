import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import logoBrand from '../../assets/logo_brand.png';

// A4 portrait: 595 x 842 pt. Clean invoice layout with brand
// header, student info block, items table, and total.

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottom: '2pt solid #1e3a8a',
    marginBottom: 24,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandLogo: {
    width: 48,
    height: 48,
    objectFit: 'contain',
  },
  brandName: {
    fontSize: 16,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  invoiceTitle: {
    fontSize: 22,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  // ── Student Info ──
  infoSection: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 10,
    color: '#6b7280',
    width: 120,
    fontFamily: 'Helvetica-Bold',
  },
  infoValue: {
    fontSize: 10,
    color: '#111827',
  },
  // ── Table ──
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e3a8a',
    padding: 6,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottom: '0.5pt solid #e5e7eb',
  },
  tableCell: {
    fontSize: 10,
    color: '#374151',
  },
  colSno: { width: '8%', textAlign: 'center' },
  colParticular: { width: '64%' },
  colAmount: { width: '28%', textAlign: 'right' },
  // ── Summary ──
  summarySection: {
    position: 'absolute',
    bottom: 100,
    left: 40,
    right: 40,
  },
  summaryDivider: {
    borderTop: '1.5pt solid #1e3a8a',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#4b5563',
    fontFamily: 'Helvetica-Bold',
  },
  summaryValue: {
    fontSize: 10,
    color: '#111827',
    fontFamily: 'Helvetica-Bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '1pt solid #1e3a8a',
    paddingTop: 6,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 12,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  totalValue: {
    fontSize: 14,
    color: '#1e3a8a',
    fontFamily: 'Helvetica-Bold',
  },
  // ── Footer ──
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTop: '0.5pt solid #d1d5db',
    paddingTop: 12,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
    lineHeight: 1.5,
  },
});

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 'N/A';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${d.getFullYear()}`;
};

const formatCurrency = (amount) => {
  const n = Number(amount) || 0;
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/**
 * InvoiceTemplate — renders a professional bill/invoice PDF.
 *
 * Props:
 *   studentName, registrationNo, courseName, sessionName, generatedDate
 *   items: Array of { particular: string, amount: number }
 */
const InvoiceTemplate = ({
  studentName,
  registrationNo,
  courseName,
  sessionName,
  generatedDate,
  items = [],
}) => {
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <Document>
      <Page size="A4" orientation="portrait" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <Image src={logoBrand} style={styles.brandLogo} />
            <View>
              <Text style={styles.brandName}>VEHTI</Text>
              <Text style={{ fontSize: 8, color: '#6b7280' }}>
                Vivekananda Education & Health Training Institute
              </Text>
            </View>
          </View>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
        </View>

        {/* Student Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Student Name:</Text>
            <Text style={styles.infoValue}>{studentName || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Registration No:</Text>
            <Text style={styles.infoValue}>{registrationNo || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Course:</Text>
            <Text style={styles.infoValue}>{courseName || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Session:</Text>
            <Text style={styles.infoValue}>{sessionName || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date:</Text>
            <Text style={styles.infoValue}>{formatDate(generatedDate) || formatDate(new Date())}</Text>
          </View>
        </View>

        {/* Table */}
        <View>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colSno]}>#</Text>
            <Text style={[styles.tableHeaderCell, styles.colParticular]}>Particular</Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount</Text>
          </View>

          {items.map((item, idx) => {
            const amount = Number(item.amount) || 0;
            return (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colSno]}>{idx + 1}.</Text>
                <Text style={[styles.tableCell, styles.colParticular]}>{item.particular}</Text>
                <Text style={[styles.tableCell, styles.colAmount]}> {formatCurrency(amount)}</Text>
              </View>
            );
          })}

          {items.length === 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '100%', textAlign: 'center', color: '#9ca3af' }]}>
                No items added
              </Text>
            </View>
          )}
        </View>

        {/* Summary — fixed at page bottom, full width */}
        <View style={styles.summarySection}>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sub Total</Text>
            <Text style={styles.summaryValue}> {formatCurrency(totalAmount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}> {formatCurrency(totalAmount)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This is a computer-generated invoice from Vivekananda Education & Health Training Institute
          </Text>
          <Text style={styles.footerText}>
            For any queries, contact us at info@vehti.in
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoiceTemplate;
