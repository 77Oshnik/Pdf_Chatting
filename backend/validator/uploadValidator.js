const { body, validationResult } = require("express-validator");

exports.uploadPDFValidator = [
  body("file").custom((value, { req }) => {
    if (!req.file) {
      throw new Error("No file uploaded");
    }
    const allowedTypes = ["application/pdf"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new Error("Invalid file type");
    }
    if (req.file.size > 10 * 1024 * 1024)
      throw new Error("File size exceeds 10MB limit");

    return true;
  }),
];
