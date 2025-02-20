const { STATUS_CODES } = require('../config/constants');

class ResponseHandler {
  static sendSuccess(res, { message, data = null, metadata = null, statusCode = STATUS_CODES.OK.code }) {
    const response = {
      status: {
        code: statusCode,
        success: true,
        message
      },
      ...(data && { data }),
      ...(metadata && { metadata })
    };
    return res.status(statusCode).json(response);
  }

  static sendError(res, { message, errors = null, statusCode = STATUS_CODES.SERVER_ERROR.code }) {
    const response = {
      status: {
        code: statusCode,
        success: false,
        message
      },
      ...(errors && { errors })
    };
    return res.status(statusCode).json(response);
  }
}

module.exports = ResponseHandler; 