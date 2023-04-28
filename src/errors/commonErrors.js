class ApiError extends Error {
  constructor(statusCode, errorType, message) {
    super(message);
    this.statusCode = statusCode;
    this.errorType = errorType;
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

class UnprocessableEntityError extends ApiError {
  constructor(message) {
    super(422, "unprocessable_entity_error", message);
  }
}

class TooManyRequestsError extends ApiError {
  constructor() {
    super(429, "too_many_requests_error", "Too many requests, try again later");
  }
}

class InternalServerError extends ApiError {
  constructor(message) {
    super(500, "internal_server_error", message || "Something went wrong");
  }
}

class BadGatewayError extends ApiError {
  constructor(message) {
    super(502, "bad_gateway_error", message);
  }
}

class ServiceUnavailableError extends ApiError {
  constructor() {
    super(
      503,
      "service_unavailable_error",
      "Error requesting third party service"
    );
  }
}

class GatewayTimeoutError extends ApiError {
  constructor() {
    super(
      504,
      "gateway_timeout_error",
      "Timeout requesting third party service"
    );
  }
}

module.exports = {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
  TooManyRequestsError,
  InternalServerError,
  BadGatewayError,
  ServiceUnavailableError,
  GatewayTimeoutError,
};
