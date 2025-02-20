/**
 * रिस्पांस हैंडलर कॉन्फ़िगरेशन
 * सभी API रिस्पांस के लिए एक समान फॉर्मेट प्रदान करता है
 */

// स्टैंडर्ड स्टेटस कोड
const STATUS_CODES = {
  OK: { code: 200, message: 'सफल' },
  CREATED: { code: 201, message: 'सफलतापूर्वक बनाया गया' },
  ACCEPTED: { code: 202, message: 'स्वीकार किया गया' },
  NO_CONTENT: { code: 204, message: 'कोई डेटा नहीं' },
  BAD_REQUEST: { code: 400, message: 'अमान्य अनुरोध' },
  UNAUTHORIZED: { code: 401, message: 'अनधिकृत पहुंच' },
  FORBIDDEN: { code: 403, message: 'पहुंच निषेध' },
  NOT_FOUND: { code: 404, message: 'नहीं मिला' },
  CONFLICT: { code: 409, message: 'डेटा विरोधाभास' },
  SERVER_ERROR: { code: 500, message: 'सर्वर त्रुटि' }
};

// रिस्पांस के प्रकार
const RESPONSE_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

/**
 * बेस रिस्पांस हैंडलर
 * सभी रिस्पांस के लिए बेस स्ट्रक्चर तैयार करता है
 */
const createResponseBody = ({
  statusCode,
  success,
  type,
  message,
  data = null,
  metadata = null,
  errors = null
}) => {
  return {
    apiInfo: {
      version: 'v1',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    },
    status: {
      code: statusCode,
      type: type,
      success: success,
      message: message
    },
    ...(data && { data }),
    ...(metadata && { metadata }),
    ...(errors && { error: { details: errors } })
  };
};

// सफल रिस्पांस भेजने का हैंडलर
const sendSuccess = (res, {
  message,
  data = null,
  metadata = null,
  statusCode = STATUS_CODES.OK.code
}) => {
  const responseBody = createResponseBody({
    statusCode,
    success: true,
    type: RESPONSE_TYPES.SUCCESS,
    message,
    data,
    metadata
  });
  return res.status(statusCode).json(responseBody);
};

// एरर रिस्पांस भेजने का हैंडलर
const sendError = (res, {
  message = STATUS_CODES.SERVER_ERROR.message,
  errors = null,
  statusCode = STATUS_CODES.SERVER_ERROR.code
}) => {
  const responseBody = createResponseBody({
    statusCode,
    success: false,
    type: RESPONSE_TYPES.ERROR,
    message,
    errors
  });
  return res.status(statusCode).json(responseBody);
};

// पेजिनेटेड रिस्पांस भेजने का हैंडलर
const sendPaginatedResponse = (res, {
  message,
  data,
  page,
  limit,
  total,
  additionalMetadata = {}
}) => {
  const paginationInfo = {
    वर्तमान_पेज: parseInt(page),
    प्रति_पेज: parseInt(limit),
    कुल_आइटम: total,
    कुल_पेज: Math.ceil(total / limit),
    अगला_पेज: page * limit < total,
    पिछला_पेज: page > 1
  };

  const metadata = {
    पेजिनेशन: paginationInfo,
    ...additionalMetadata
  };

  return sendSuccess(res, {
    message,
    data,
    metadata
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendPaginatedResponse,
  STATUS_CODES,
  RESPONSE_TYPES
}; 