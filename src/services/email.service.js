const nodemailer = require('nodemailer');
const mailConfig = require('../config/mail');

let transporter;
function getTransporter() {
  if (transporter) return transporter;
  // If SMTP credentials missing, use JSON transport for development/testing
  if (!mailConfig.user || !mailConfig.pass) {
    transporter = nodemailer.createTransport({ jsonTransport: true });
  } else {
    transporter = nodemailer.createTransport({
      host: mailConfig.host,
      port: mailConfig.port,
      secure: mailConfig.port === 465,
      auth: { user: mailConfig.user, pass: mailConfig.pass }
    });
  }
  return transporter;
}

async function sendMail(options) {
  const t = getTransporter();
  return t.sendMail(options);
}

async function sendOrderConfirmation(user, order, pdfPath) {
  const subject = `Confirmación de pedido ${order._id}`;
  const text = `Hola ${user.name},\n\nTu pedido ${order._id} fue procesado correctamente.\n\nMonto: ${order.amount}\n\nGracias.`;

  const mailOptions = {
    from: mailConfig.user || 'no-reply@example.com',
    to: user.email,
    subject,
    text
  };

  if (pdfPath) {
    mailOptions.attachments = [{ filename: `order-${order._id}.pdf`, path: pdfPath }];
  }

  return sendMail(mailOptions);
}

module.exports = { sendOrderConfirmation, sendMail };
