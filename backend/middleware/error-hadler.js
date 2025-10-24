const { errorResponse } = require("../utlis/api-response");

const errorHandler = (err, req, res, next) => {
  console.error("Global Error:", err && err.message ? err.message : err);
  return errorResponse(res, err?.status || 500, err?.message || "Internal Server Error");
};

module.exports = { errorHandler };
