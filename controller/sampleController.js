// /api/v1/sample
exports.getSample = (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "this is a sample message"
  });
};
