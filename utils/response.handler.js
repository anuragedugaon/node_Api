const STATUS_CODES = {
  OK: { code: 200, message: 'Success' },
  CREATED: { code: 201, message: 'Created Successfully' },
  BAD_REQUEST: { code: 400, message: 'Bad Request' },
  UNAUTHORIZED: { code: 401, message: 'Unauthorized' },
  FORBIDDEN: { code: 403, message: 'Forbidden' },
  NOT_FOUND: { code: 404, message: 'Not Found' },
  CONFLICT: { code: 409, message: 'Conflict' },
  SERVER_ERROR: { code: 500, message: 'Internal Server Error' }
};

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

module.exports = {
  ResponseHandler,
  STATUS_CODES
}; 