class ApiError extends Error {
  constructor(statusCode, errorType, message) {
    super(message);
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.name = "ApiError";
  }

  serializeError() {
    return {
      statusCode: this.statusCode,
      errorType: this.errorType,
      message: this.message,
    };
  }
}

class BadRequestError extends ApiError {
  constructor(message) {
    super(400, "bad_request_error", message);
  }
}

class UnauthorizedError extends ApiError {
  constructor(message) {
    super(401, "unauthorized_error", message || "Unauthorized");
  }
}

class ForbiddenError extends ApiError {
  constructor(message) {
    super(403, "forbidden_error", message || "Forbidden");
  }
}

class NotFoundError extends ApiError {
  constructor(message) {
    super(404, "not_found_error", message || "Resource not found");
  }
}

class InternalServerError extends ApiError {
  constructor(message) {
    super(500, "internal_server_error", message || "Something went wrong");
  }
}

module.exports = {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  InternalServerError,
  ApiError,
};
