exports.getSupport = (req, res) => {
  const contact = {
    email: process.env.SUPPORT_EMAIL || 'support@example.com',
    phone: process.env.SUPPORT_PHONE || '+1-555-000-0000',
    hours: 'Mon-Fri 9:00-18:00'
  };
  res.json({ contact });
};
