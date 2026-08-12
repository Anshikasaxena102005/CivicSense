/**
 * Standardised API response helpers.
 * Every controller uses these — never res.json() directly.
 * Ensures consistent shape across all endpoints.
 */

const success = (res, data = null, message = 'Success', statusCode = 200) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  return res.status(statusCode).json(body);
};

const created = (res, data = null, message = 'Created successfully') =>
  success(res, data, message, 201);

const paginated = (res, data, pagination, message = 'Success') =>
  res.status(200).json({
    success: true,
    message,
    data,
    pagination, // { total, page, limit, totalPages }
  });

const error = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

const badRequest  = (res, message = 'Bad Request', errors = null)  => error(res, message, 400, errors);
const unauthorized = (res, message = 'Unauthorized')                => error(res, message, 401);
const forbidden   = (res, message = 'Forbidden')                   => error(res, message, 403);
const notFound    = (res, message = 'Resource not found')          => error(res, message, 404);
const conflict    = (res, message = 'Conflict')                    => error(res, message, 409);

module.exports = {
  success,
  created,
  paginated,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
};
