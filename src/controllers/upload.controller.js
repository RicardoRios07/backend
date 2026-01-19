exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    // file accessible at /files/<filename>
    const fileUrl = `/files/${req.file.filename}`;
    res.json({ fileUrl, path: req.file.path });
  } catch (err) {
    next(err);
  }
};
