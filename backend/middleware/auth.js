
const jwt = require("jsonwebtoken");
const pool = require("../utlis/db");

exports.protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token)
    return res.status(401).json({ success: false, message: "No token provided" });

  try {
    const blacklisted = await pool.query(
      "SELECT * FROM token_blacklist WHERE token = $1",
      [token]
    );

    if (blacklisted.rows.length > 0)
      return res.status(401).json({ success: false, message: "Token has been revoked" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
