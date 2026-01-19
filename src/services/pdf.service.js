const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const FILES_PATH = process.env.FILES_STORAGE_PATH || path.join(__dirname, '../../files');

function ensureFilesPath() {
  if (!fs.existsSync(FILES_PATH)) fs.mkdirSync(FILES_PATH, { recursive: true });
}

function generatePdf(order, user) {
  return new Promise((resolve, reject) => {
    try {
      ensureFilesPath();
      const fileName = `order-${order._id}.pdf`;
      const filePath = path.join(FILES_PATH, fileName);
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);
      doc.fontSize(20).text('Factura / Order Invoice', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Order ID: ${order._id}`);
      doc.text(`Date: ${order.createdAt.toISOString()}`);
      doc.text(`Customer: ${user.name} <${user.email}>`);
      doc.moveDown();
      doc.text('Items:', { underline: true });
      order.products.forEach((p, i) => {
        const pid = p.productId && p.productId.title ? p.productId.title : p.productId?.toString();
        doc.text(`${i + 1}. ${pid} — qty: ${p.qty} — price: ${p.price}`);
      });
      doc.moveDown();
      doc.text(`Total: ${order.amount}`);
      doc.text(`Payment status: ${order.paymentStatus}`);
      doc.end();

      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generatePdf };
