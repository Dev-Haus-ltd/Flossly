export function success(data) {
  return {
    code: 0,
    success: true,
    data,
  };
}

export function error(statusCode, message) {
  const msg = message || (statusCode === 403 ? "Forbidden" : statusCode === 401 ? "Unauthenticated" : "Server Error");
  throw createError({
    statusCode,
    statusMessage: msg,
    data: {
      code: 1,
      success: false,
      message: msg,
    },
  });
}
