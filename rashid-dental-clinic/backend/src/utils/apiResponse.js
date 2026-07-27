/**
 * Sends a response in the project-wide consistent shape:
 * { success, message, data }
 */
function sendResponse(res, statusCode, success, message, data = null) {
  return res.status(statusCode).json({ success, message, data });
}

const ok = (res, message, data = null) => sendResponse(res, 200, true, message, data);
const created = (res, message, data = null) => sendResponse(res, 201, true, message, data);
const fail = (res, statusCode, message, data = null) =>
  sendResponse(res, statusCode, false, message, data);

module.exports = { sendResponse, ok, created, fail };
