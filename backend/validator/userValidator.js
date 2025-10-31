const {body} = require("express-validator");

exports.userRegistrationValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is Required")
    .isLength({ min: 3 })
    .withMessage("Name must be at least 3 characters long"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is Required")
    .isEmail()
    .withMessage("Invalid Email Address"),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is Required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[0-9]/)
    .withMessage("Password must contain a number")
    .matches(/[A-Z]/)
    .withMessage("Password must contain an uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain a lowercase letter")
    .matches(/[@$!%*?&]/)
    .withMessage("Password must contain a special character"),,
];

exports.userLoginValidator = [
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is Required")
        .isEmail()
        .withMessage("Invalid Email Address"),

    body("password")
        .trim()
        .notEmpty()
        .withMessage("Password is Required")
];
