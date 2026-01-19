module.exports = {
  // Defaults to Gmail SMTP; in production provide SMTP_USER and SMTP_PASS
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465,
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || ''
};
